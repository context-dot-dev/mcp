import { getAccountToolError } from "./account-error";
import {
  error, image, text, type TypedCallToolResult,
} from "mcp-use/server";
import type { Endpoint } from "../context-endpoints";
import {
  acquireApiKeySlot, getApiKeyId, rememberConcurrencyLimit,
} from "./api-key-concurrency";
import { contextApiError, contextRequestId } from "./feedback";
import { compactWebResponse } from "./compact-response";

type ToolArguments = Record<string, unknown>;
const DEFAULT_MAX_RESPONSE_CHARS = 80_000;
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
  if (endpoint.name === "get-news-search") {
    const {
      query,
      companyName,
      domain,
      ticker,
      exchange,
      isin,
      sortBy,
      ...rest
    } = args;
    const entity =
      typeof companyName === "string"
        ? { type: "name", name: companyName }
        : typeof domain === "string"
          ? { type: "domain", domain }
          : typeof ticker === "string"
            ? {
                type: "ticker",
                ticker,
                ...(typeof exchange === "string" ? { exchange } : {}),
              }
            : { type: "isin", isin };
    const searchBy =
      typeof query === "string"
        ? { type: "natural_language", query }
        : { type: "entity", entity };
    return {
      ...rest,
      searchBy,
      ...(typeof sortBy === "string" ? { sortBy: { type: sortBy } } : {}),
    };
  }
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
        !(name === "responseMode" &&
          (endpoint.name === "web-search" ||
            endpoint.name === "web-scrape" ||
            endpoint.name === "web-crawl")) &&
        name !== "fileBase64" &&
        !parameterNames.has(name)
    )
  );
}

const READ_ONLY_BROWSER_STEPS = new Set(["scroll", "wait", "waitFor"]);

// Request fields arrive flat or, when a body can't be flattened, under `body`.
function requestContainers(args: ToolArguments): Record<string, unknown>[] {
  return [args, args.body].filter(
    (value): value is Record<string, unknown> =>
      typeof value === "object" && value !== null,
  );
}

// Browser actions other than scrolling or waiting can change third-party state
// and need api.write. web-scrape nests them under sharedParams with `type`;
// older scraping tools take a top-level `actions` list with `do`.
function requestsBrowserActions(args: ToolArguments): boolean {
  const lists = requestContainers(args).flatMap((container) => [
    container.actions,
    (container.sharedParams as Record<string, unknown> | undefined)?.actions,
  ]);
  return lists.some(
    (list) =>
      Array.isArray(list) &&
      list.some((action) => {
        const step =
          action && typeof action === "object"
            ? (action as Record<string, unknown>).type ??
              (action as Record<string, unknown>).do
            : undefined;
        return !READ_ONLY_BROWSER_STEPS.has(String(step));
      }),
  );
}

// A new browser profile signs in to the target site with the supplied
// credentials and saves the session to the account.
function createsBrowserProfile(args: ToolArguments): boolean {
  return requestContainers(args).some((container) => {
    const sharedParams = container.sharedParams as Record<string, unknown> | undefined;
    const profile = sharedParams?.profile as Record<string, unknown> | undefined;
    return profile?.type === "new";
  });
}

function isReadOnlyRequest(endpoint: Endpoint, args: ToolArguments): boolean {
  // web-scrape is annotated for its browser actions and sign-ins but only
  // needs write access when a request uses them.
  const readOnly =
    endpoint.name === "web-scrape" || endpoint.annotations.readOnlyHint;
  return (
    readOnly && !requestsBrowserActions(args) && !createsBrowserProfile(args)
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
    budget.truncated = true;
    if (isOversizedToken(value, budget.remaining)) return undefined;
    const marker = "\n\n[truncated by Context MCP]";
    const available = Math.max(0, budget.remaining - marker.length);
    budget.remaining = 0;
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
    const available = budget.remaining;
    for (const entry of value) {
      const isUndeliverable =
        budget.remaining > 0 &&
        typeof entry === "string" &&
        isOversizedToken(entry, available);
      if (isUndeliverable) {
        result.push(null);
        budget.remaining -= "null".length;
        budget.truncated = true;
        continue;
      }
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
      if (typeof entry === "string" && isOversizedToken(entry, budget.remaining)) {
        const reason = `exceeds MCP response budget (${entry.length} characters); request a byte Range, a smaller file, or use the REST API`;
        result[name] = null;
        result.omitted_reason = reason;
        budget.remaining -= "null".length + "omitted_reason".length + 4 + reason.length;
        budget.truncated = true;
        continue;
      }
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

// A string without whitespace is one token (base64, data URL, signed URL,
// ID), and a cut token cannot be decoded or followed, so it is omitted whole.
function isOversizedToken(value: string, available: number): boolean {
  return available > 0 && value.length > available && !/\s/.test(value);
}

function boundedObject(
  value: Record<string, unknown>,
  originalChars: number,
  isCompact = false,
) {
  const render = (data: Record<string, unknown>) =>
    isCompact ? text(JSON.stringify(data)) : compactObject(data);
  const limit = maxResponseChars();
  if (limit === 0 || originalChars <= limit) {
    return render(value);
  }
  const budget = { remaining: Math.max(1_000, limit - 500), truncated: false };
  const truncated = truncateJsonValue(value, budget) as Record<string, unknown>;
  return render({
    ...truncated,
    _context_mcp: {
      truncated: true,
      original_chars: originalChars,
      message:
        "Response was shortened for MCP client limits. Narrow the request or set CONTEXT_MCP_MAX_RESPONSE_CHARS=0 on a private deployment.",
    },
  });
}

function compactObject(data: Record<string, unknown>): TypedCallToolResult {
  return {
    content: text(JSON.stringify(data)).content,
    structuredContent: data,
    _meta: { mimeType: "application/json" },
  };
}

function contextObject(
  endpoint: Endpoint,
  value: Record<string, unknown>,
  isCompact = false,
) {
  const screenshot = getScreenshot(value);
  if (endpoint.name !== "web-scrape" || !screenshot) {
    return boundedObject(value, JSON.stringify(value).length, isCompact);
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
    isCompact,
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

// Hosting proxies end MCP requests after about 125 seconds; stop waiting on the
// API first so the client gets an actionable error instead of a gateway 524.
const UPSTREAM_TIMEOUT_MS = 115_000;
// A pooled keep-alive socket can close just as a call reuses it. fetch rejects
// only before response headers, so retrying never repeats an answered call.
const DROPPED_CONNECTION_CODES = new Set([
  "ECONNRESET",
  "EPIPE",
  "UND_ERR_CLOSED",
  "UND_ERR_SOCKET",
]);
// Plans with a concurrency limit of 1 reject parallel tool calls with 429.
// Those requests did no work, so waiting briefly and retrying is safe and
// turns most of them into successes instead of agent retry loops.
const RATE_LIMIT_RETRY_BUDGET_MS = 30_000;

const RATE_LIMIT_MAX_RETRIES = 5;
// Leaves the call at least 55 seconds of the upstream timeout to do its work.
const QUEUE_WAIT_LIMIT_MS = 60_000;
// The server runs several instances, so their per-key queues cannot see each
// other's calls; the API's concurrency counter is the shared source of truth.
// Its 429s did no work, so polling it every couple of seconds until the queue
// deadline picks up a freed slot soon after another instance's call finishes.
const CONCURRENCY_RETRY_MAX_WAIT_MS = 2_000;
// After a shorter wait the API still had most of the budget, so the timeout is its own.
const MEANINGFUL_SLOT_WAIT_MS = UPSTREAM_TIMEOUT_MS / 4;

// Waits at least 0.5s, 1s, 2s, 4s, 8s, so a `Retry-After: 0` from the
// concurrency limit cannot turn one call into a burst of requests.
function retryAfterMs(headers: Headers, attempt: number): number {
  const backoff = 500 * 2 ** attempt;
  if (headers.get("X-RateLimit-Mode") === "concurrency") {
    return Math.min(Math.max(backoff, 1_000), CONCURRENCY_RETRY_MAX_WAIT_MS);
  }
  const header = headers.get("Retry-After")?.trim();
  if (!header) return backoff;
  const seconds = /^\d+(\.\d+)?$/.test(header) ? Number(header) : NaN;
  const date = Number.isNaN(seconds) ? Date.parse(header) : NaN;
  const requested = Number.isFinite(seconds)
    ? seconds * 1000
    : Number.isFinite(date)
      ? date - Date.now()
      : 0;
  return Math.max(backoff, requested);
}

export function contextFetchError(toolName: string, cause: unknown) {
  if (cause instanceof Error && cause.name === "TimeoutError") {
    const slotWaitMs = (cause as { slotWaitMs?: unknown }).slotWaitMs;
    const hasWaitedForSlot =
      typeof slotWaitMs === "number" && slotWaitMs >= MEANINGFUL_SLOT_WAIT_MS;
    if (hasWaitedForSlot) {
      const waitedSeconds = Math.round(slotWaitMs / 1000);
      const remainingSeconds = UPSTREAM_TIMEOUT_MS / 1000 - waitedSeconds;
      return contextApiError(
        toolName,
        `Waited ${waitedSeconds} seconds for one of this account's concurrent request slots, then Context API did not respond within the remaining ${remainingSeconds} seconds, so the request was stopped before the MCP client timed out.`,
        "CONCURRENCY_LIMITED",
      );
    }
    return contextApiError(
      toolName,
      `Context API did not respond within ${UPSTREAM_TIMEOUT_MS / 1000} seconds, so the request was stopped before the MCP client timed out. Retry with a smaller request (fewer pages, results, or formats), or use submit-batch for long jobs.`,
    );
  }
  const message = cause instanceof Error ? cause.message : String(cause);
  const code = fetchFailureCode(cause);
  const detail = code ? `${message} (${code})` : message;
  return contextApiError(
    toolName,
    `Failed to reach Context API: ${detail}`,
    "CONNECTION_FAILED",
  );
}

export async function fetchContextApi(
  url: URL | string,
  init: RequestInit,
): Promise<Response> {
  const started = Date.now();
  const keyId = getApiKeyId(init.headers);
  let slotWaitMs = 0;
  for (let attempt = 0; ; attempt += 1) {
    const attemptStarted = Date.now();
    const response = await fetchInApiKeySlot(url, init, started, keyId, slotWaitMs);
    if (response.status !== 429) return response;
    const isConcurrencyLimit = response.headers.get("X-RateLimit-Mode") === "concurrency";
    const retryBudgetMs = isConcurrencyLimit ? QUEUE_WAIT_LIMIT_MS : RATE_LIMIT_RETRY_BUDGET_MS;
    const isOutOfRetries = !isConcurrencyLimit && attempt >= RATE_LIMIT_MAX_RETRIES;
    const wait = retryAfterMs(response.headers, attempt) + Math.random() * 250;
    if (isOutOfRetries || Date.now() - started + wait > retryBudgetMs) return response;
    await new Promise((resolve) => setTimeout(resolve, wait));
    if (isConcurrencyLimit) slotWaitMs += Date.now() - attemptStarted;
  }
}

// The API frees a concurrency slot only once its response closes, so the body
// is read before the next queued call for the same key is let through.
async function fetchInApiKeySlot(
  url: URL | string,
  init: RequestInit,
  started: number,
  keyId: string | undefined,
  earlierSlotWaitMs: number,
): Promise<Response> {
  const queued = Date.now();
  const release = keyId
    ? await acquireApiKeySlot(keyId, started + QUEUE_WAIT_LIMIT_MS)
    : undefined;
  const slotWaitMs = earlierSlotWaitMs + Date.now() - queued;
  try {
    const response = await fetchWithinTimeout(url, init, started).catch(
      (cause: unknown) => {
        const isDroppedConnection = DROPPED_CONNECTION_CODES.has(
          fetchFailureCode(cause) ?? "",
        );
        if (!isDroppedConnection) throw cause;
        return fetchWithinTimeout(url, init, started);
      },
    );
    if (keyId) rememberConcurrencyLimit(keyId, response.headers);
    const body = await response.arrayBuffer();
    return new Response(body.byteLength > 0 ? body : null, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  } catch (cause) {
    const isTimeout = cause instanceof Error && cause.name === "TimeoutError";
    if (!isTimeout) throw cause;
    throw Object.assign(new DOMException(cause.message, "TimeoutError"), { slotWaitMs });
  } finally {
    release?.();
  }
}

function fetchWithinTimeout(
  url: URL | string,
  init: RequestInit,
  started: number,
): Promise<Response> {
  const elapsed = Date.now() - started;
  return fetch(url, {
    ...init,
    signal: AbortSignal.timeout(Math.max(1, UPSTREAM_TIMEOUT_MS - elapsed)),
  });
}

function fetchFailureCode(cause: unknown): string | undefined {
  const code = cause instanceof Error
    ? (cause.cause as { code?: unknown } | null | undefined)?.code
    : undefined;
  return typeof code === "string" ? code : undefined;
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
}): Promise<TypedCallToolResult> {
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
    response = await fetchContextApi(url, request);
  } catch (cause) {
    return contextFetchError(endpoint.name, cause);
  }

  let raw: string;
  try {
    raw = await response.text();
  } catch (cause) {
    return contextFetchError(endpoint.name, cause);
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = undefined;
  }

  if (!response.ok) {
    const accountError = getAccountToolError(parsed, response.headers);
    if (accountError) return accountError;
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
    const isCompact =
      args.responseMode === "compact" &&
      (endpoint.name === "web-search" ||
        endpoint.name === "web-scrape" ||
        endpoint.name === "web-crawl");
    const value = isCompact
      ? compactWebResponse(endpoint.name, minimized)
      : minimized;
    const responseLimit = maxResponseChars();
    const responseChars = JSON.stringify(value).length;
    const isOversizedPage =
      responseLimit > 0 && responseChars > responseLimit &&
      "next_cursor" in value;
    // Other list cursors can encode page numbers, so changing their limit can skip records.
    if (isOversizedPage && endpoint.name !== "get-batch-results") {
      return contextApiError(
        endpoint.name,
        "This page exceeds MCP client limits. Restart pagination with a smaller limit, or set CONTEXT_MCP_MAX_RESPONSE_CHARS=0 on a private deployment.",
        "CONTENT_TOO_LARGE",
      );
    }
    const recordCount = Array.isArray(value.data) ? value.data.length : 0;
    const shouldReduceBatchPage =
      endpoint.name === "get-batch-results" &&
      isOversizedPage && recordCount > 1;
    if (shouldReduceBatchPage) {
      const requestedLimit = Number(args.limit ?? recordCount);
      if (requestedLimit <= 1) {
        return contextApiError(
          endpoint.name,
          "The batch API ignored the requested page size, so this response cannot be paginated safely. Retry the request.",
        );
      }
      const estimatedLimit = Math.floor(recordCount * responseLimit / responseChars);
      const nextLimit = Math.max(1, Math.min(requestedLimit - 1, estimatedLimit));
      return callContextApi({
        apiBase,
        endpoint,
        args: { ...args, limit: nextLimit },
        credential,
        clientUserAgent,
      });
    }
    return contextObject(endpoint, value, isCompact);
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
