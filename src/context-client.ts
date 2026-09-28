import { error, image, object, text } from "mcp-use/server";
import type { Endpoint } from "../context-endpoints";
import { contextApiError, contextRequestId } from "./feedback";

type ToolArguments = Record<string, unknown>;
const DEFAULT_MAX_RESPONSE_CHARS = 40_000;
const OMITTED_RESPONSE_FIELDS = new Set([
  "key_metadata",
  "trace_id",
  "debug",
]);
const RATE_LIMIT_HEADERS = ["X-RateLimit-Remaining", "X-RateLimit-Limit"];

export type ContextCredential = {
  apiKey: string;
  scopes?: string[];
};

function appendDeepQueryValue(
  searchParams: URLSearchParams,
  name: string,
  value: unknown
): void {
  if (value === undefined || value === null) {
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((entry) => appendDeepQueryValue(searchParams, name, entry));
    return;
  }
  if (typeof value === "object") {
    Object.entries(value).forEach(([key, entry]) =>
      appendDeepQueryValue(searchParams, `${name}[${key}]`, entry)
    );
    return;
  }
  searchParams.append(name, String(value));
}

function buildRequestBody(
  endpoint: Endpoint,
  args: ToolArguments
): unknown {
  if ("body" in args) {
    return args.body;
  }

  const parameterNames = new Set(
    endpoint.parameters.map((parameter) => parameter.name)
  );
  return Object.fromEntries(
    Object.entries(args).filter(
      ([name, value]) =>
        value !== undefined &&
        name !== "fileBase64" &&
        !parameterNames.has(name)
    )
  );
}

function isReadOnlyRequest(endpoint: Endpoint, args: ToolArguments): boolean {
  if (endpoint.name !== "web-scrape") {
    return endpoint.annotations.readOnlyHint;
  }
  const body = buildRequestBody(endpoint, args) as {
    sharedParams?: { actions?: Array<{ type: string }> };
  } | undefined;
  return !body?.sharedParams?.actions?.some(
    (action) => !["scroll", "wait", "waitFor"].includes(action.type),
  );
}

export function contextErrorMessage(
  status: number,
  parsed: unknown,
  headers: Headers,
): string {
  const payload =
    parsed && typeof parsed === "object"
      ? (parsed as Record<string, unknown>)
      : {};
  const message =
    formatErrorDetail(payload.message) ??
    formatErrorDetail(payload.error) ??
    (typeof payload.error_description === "string"
      ? payload.error_description
      : "Request failed");
  const errorCode = contextErrorCode(parsed);
  const code = errorCode ? ` [${errorCode}]` : "";
  // The API sends X-RateLimit-* on every response; they only matter once a request is rejected.
  const rateLimitHeaders = status === 429 ? RATE_LIMIT_HEADERS : [];
  const details: Array<[string, unknown]> = [
    ["request_id", contextRequestId(parsed, headers)],
    ["Retry-After", headers.get("Retry-After")],
    ...rateLimitHeaders.map((name): [string, unknown] => [name, headers.get(name)]),
    [
      "credits_remaining",
      (payload.key_metadata as Record<string, unknown> | null | undefined)
        ?.credits_remaining,
    ],
  ];
  const detailText = details
    .filter(
      ([, value]) =>
        typeof value === "number" || (typeof value === "string" && value !== ""),
    )
    .map(([name, value]) => `${name}: ${value}`)
    .join("; ");
  const suffix = detailText ? ` (${detailText})` : "";
  return `Context API ${status}${code}: ${message || "Request failed"}${suffix}`;
}

export function contextErrorCode(parsed: unknown): string | undefined {
  const errorCode =
    parsed && typeof parsed === "object"
      ? (parsed as Record<string, unknown>).error_code
      : undefined;
  return typeof errorCode === "string" ? errorCode : undefined;
}

function formatErrorDetail(detail: unknown): string | undefined {
  if (typeof detail === "string") return detail;
  if (!Array.isArray(detail)) return undefined;
  const issues = detail.map(formatValidationIssue).filter(Boolean);
  return issues.length > 0 ? issues.join("; ") : undefined;
}

function formatValidationIssue(issue: unknown): string | undefined {
  if (typeof issue === "string") return issue;
  if (!issue || typeof issue !== "object") return undefined;
  const { path, message } = issue as Record<string, unknown>;
  if (typeof message !== "string") return undefined;
  const hasPath = Array.isArray(path) && path.length > 0;
  return hasPath ? `${path.join(".")}: ${message}` : message;
}

function minimizeContextResponse(
  value: Record<string, unknown>,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(value).filter(
      ([name]) => !OMITTED_RESPONSE_FIELDS.has(name),
    ),
  );
}

function maxResponseChars(): number {
  const configured = Number(process.env.CONTEXT_MCP_MAX_RESPONSE_CHARS);
  if (Number.isFinite(configured) && configured >= 0) {
    return Math.floor(configured);
  }
  return DEFAULT_MAX_RESPONSE_CHARS;
}

function truncateJsonValue(
  value: unknown,
  budget: { remaining: number; truncated: boolean }
): unknown {
  if (budget.remaining <= 0) {
    budget.truncated = true;
    return undefined;
  }
  if (typeof value === "string") {
    if (value.length <= budget.remaining) {
      budget.remaining -= value.length;
      return value;
    }
    const marker = "\n\n[truncated by Context MCP]";
    const available = Math.max(0, budget.remaining - marker.length);
    budget.remaining = 0;
    budget.truncated = true;
    return `${value.slice(0, available)}${marker}`;
  }
  if (
    value === null ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    budget.remaining -= String(value).length;
    return value;
  }
  if (Array.isArray(value)) {
    const result: unknown[] = [];
    for (const entry of value) {
      const truncatedEntry = truncateJsonValue(entry, budget);
      if (truncatedEntry === undefined) break;
      result.push(truncatedEntry);
    }
    if (result.length < value.length) budget.truncated = true;
    return result;
  }
  if (typeof value === "object") {
    const result: Record<string, unknown> = {};
    const entries = Object.entries(value).sort(([, first], [, second]) => {
      const size = (entry: unknown): number =>
        typeof entry === "string"
          ? entry.length
          : Array.isArray(entry)
            ? entry.length * 100
            : entry && typeof entry === "object"
              ? Object.keys(entry).length * 100
              : 0;
      return size(first) - size(second);
    });
    for (const [name, entry] of entries) {
      budget.remaining -= name.length + 4;
      const truncatedEntry = truncateJsonValue(entry, budget);
      if (truncatedEntry === undefined) break;
      result[name] = truncatedEntry;
    }
    if (Object.keys(result).length < Object.keys(value).length) {
      budget.truncated = true;
    }
    return result;
  }
  return String(value);
}

function boundedObject(value: Record<string, unknown>, originalChars: number) {
  const limit = maxResponseChars();
  if (limit === 0 || originalChars <= limit) {
    return object(value);
  }
  const budget = { remaining: Math.max(1_000, limit - 500), truncated: false };
  const truncated = truncateJsonValue(value, budget) as Record<string, unknown>;
  return object({
    ...truncated,
    _context_mcp: {
      truncated: true,
      original_chars: originalChars,
      message:
        "Response was shortened for MCP client limits. Narrow the request or set CONTEXT_MCP_MAX_RESPONSE_CHARS=0 on a private deployment.",
    },
  });
}

function contextObject(endpoint: Endpoint, value: Record<string, unknown>) {
  const screenshot = getScreenshot(value);
  if (endpoint.name !== "web-scrape" || !screenshot) {
    return boundedObject(value, JSON.stringify(value).length);
  }

  const withoutInlineScreenshot = {
    ...value,
    screenshot: {
      ...(value.screenshot as Record<string, unknown>),
      data: null,
      delivery: "Returned as MCP image content.",
    },
  };
  const result = boundedObject(
    withoutInlineScreenshot,
    JSON.stringify(withoutInlineScreenshot).length,
  );
  const imageResult = image(screenshot.data, screenshot.mimeType);
  return {
    ...result,
    content: [...result.content, ...imageResult.content],
  };
}

function getScreenshot(value: Record<string, unknown>) {
  const screenshot = value.screenshot;
  if (!screenshot || typeof screenshot !== "object") return undefined;
  const dataUrl = (screenshot as Record<string, unknown>).data;
  if (typeof dataUrl !== "string") return undefined;
  const match = /^data:(image\/(?:png|jpeg|webp));base64,(.+)$/.exec(dataUrl);
  if (!match) return undefined;
  return { mimeType: match[1]!, data: match[2]! };
}

export async function callContextApi({
  apiBase,
  endpoint,
  args,
  credential,
  clientUserAgent,
}: {
  apiBase: string;
  endpoint: Endpoint;
  args: ToolArguments;
  credential: ContextCredential;
  clientUserAgent?: string;
}) {
  const requiredScope = isReadOnlyRequest(endpoint, args)
    ? "api.read"
    : "api.write";
  if (credential.scopes && !credential.scopes.includes(requiredScope)) {
    return error(`Missing required OAuth scope: ${requiredScope}`);
  }

  let path = endpoint.path;
  for (const parameter of endpoint.parameters) {
    if (parameter.in !== "path") {
      continue;
    }
    const value = args[parameter.name];
    path = path.replace(
      `{${parameter.name}}`,
      encodeURIComponent(String(value ?? ""))
    );
  }

  const url = new URL(`${apiBase.replace(/\/$/, "")}${path}`);
  for (const parameter of endpoint.parameters) {
    if (parameter.in !== "query") {
      continue;
    }
    appendDeepQueryValue(
      url.searchParams,
      parameter.name,
      args[parameter.name]
    );
  }

  // fetch rejects header values outside printable ASCII.
  const contextAgent = clientUserAgent?.replace(/[^\x20-\x7E]/g, "").trim();
  const headers: Record<string, string> = {
    Authorization: `Bearer ${credential.apiKey}`,
    "User-Agent": "ContextDev-MCP/1.0",
    ...(contextAgent && { "X-Context-Agent": contextAgent }),
  };
  for (const parameter of endpoint.parameters) {
    if (parameter.in === "header" && args[parameter.name] !== undefined) {
      headers[parameter.name] = String(args[parameter.name]);
    }
  }

  const request: RequestInit = { method: endpoint.method, headers };
  if (endpoint.requestBody) {
    if (endpoint.requestBody.binary) {
      const fileBase64 = args.fileBase64;
      if (typeof fileBase64 !== "string") {
        return error("fileBase64 is required for this binary request");
      }
      headers["Content-Type"] =
        endpoint.requestBody.contentType === "*/*"
          ? "application/octet-stream"
          : endpoint.requestBody.contentType;
      request.body = Buffer.from(fileBase64, "base64");
    } else {
      headers["Content-Type"] = endpoint.requestBody.contentType;
      request.body = JSON.stringify(
        buildRequestBody(endpoint, args)
      );
    }
  }

  let response: Response;
  try {
    response = await fetch(url, request);
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : String(cause);
    return contextApiError(endpoint.name, `Failed to reach Context API: ${message}`);
  }

  const raw = await response.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = undefined;
  }

  if (!response.ok) {
    return contextApiError(
      endpoint.name,
      contextErrorMessage(response.status, parsed, response.headers),
      contextErrorCode(parsed),
    );
  }
  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    const minimized = minimizeContextResponse(
      parsed as Record<string, unknown>,
    );
    const requestId = contextRequestId(parsed, response.headers);
    if (requestId) minimized.request_id = requestId;
    return contextObject(endpoint, minimized);
  }
  const resultText = parsed === undefined ? raw : JSON.stringify(parsed);
  const limit = maxResponseChars();
  if (limit > 0 && resultText.length > limit) {
    return text(
      `${resultText.slice(0, Math.max(0, limit - 34))}\n\n[truncated by Context MCP]`
    );
  }
  return text(resultText);
}
