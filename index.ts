import {
  error,
  MCPServer,
  text,
  widget,
  type EnhancedToolContext,
} from "mcp-use/server";
import { z } from "zod";
import { brandSchema, type Brand } from "./resources/context-brand/types";
import {
  COMPONENT_SCHEMAS,
  ENDPOINTS,
  type Endpoint,
  type JsonSchema,
} from "./context-endpoints";
import {
  createOAuthProvider,
  getOAuthTokenEncryptionKey,
  MISSING_CREDENTIAL_MESSAGE,
  resolveContextCredential,
} from "./src/auth";
import {
  callContextApi,
  contextErrorCode,
  contextErrorMessage,
  contextFetchFailure,
  fetchContextApi,
} from "./src/context-client";
import {
  contextApiError,
  contextRequestId,
  FEEDBACK_INSTRUCTIONS,
} from "./src/feedback";
import {
  decodeDcrClientId,
  deriveDcrClientSigningKey,
  isDcrClientId,
  redirectUriMatchesRegistration,
  registerDcrClient,
} from "./src/dcr";
import { resolveObjectSchema, schemaToZod } from "./src/openapi-schema";
import { repairToolArguments } from "./src/argument-repair";
import {
  completeValidArguments,
  reroutedToolName,
  VALIDATION_HINTS,
} from "./src/tool-argument-repairs";
import {
  createNativeAuthorizationRedirect,
  createNativeCallbackRedirect,
} from "./src/native-oauth-redirect";
import { withAuthorizationServerIssuer } from "./src/oauth-issuer";
import { LEGACY_TOOL_ANNOTATIONS, selectEndpoints } from "./src/toolset";

const API_BASE = process.env.CONTEXT_API_BASE || "https://api.context.dev/v1";
const NEWS_SEARCH_IDENTIFIERS = ["companyName", "domain", "ticker", "isin"] as const;
const MCP_SCHEMA_PROPERTY_DESCRIPTIONS: Readonly<Record<string, string>> = {
  action: "Browser action.",
  confidence_threshold: "Minimum confidence, 0 to 1.",
  force_language:
    "Language for brand data, as a lowercase English name such as `english`, `spanish`, or `haitian-creole`.",
  follow_subdomains: "Include target subdomains.",
  timeMs: "Wait in milliseconds.",
  url: "Target URL.",
  width: "Width in CSS pixels.",
  height: "Height in CSS pixels.",
  x: "Left coordinate in CSS pixels.",
  y: "Top coordinate in CSS pixels.",
  direction: "Scroll direction.",
  amount: "Scroll distance in pixels, one viewport, or the maximum distance.",
  maxScrolls: "Maximum number of scroll steps.",
  milliseconds: "Duration in milliseconds.",
  selector: "CSS selector for the target element.",
  "ScrapeMarkdownParams.includeLinks": "Preserve hyperlinks in Markdown.",
  "ScrapeMarkdownParams.includeImages": "Include image references in Markdown.",
  "ScrapeScreenshotParams.format": "Screenshot image format.",
  "ScrapeParseRules.type": "Return one matching item or all matches as a list.",
  "ScrapeParseRules.output":
    "Return text, HTML, an attribute prefixed by @, or nested field rules.",
  "PersonEnrichmentRequest.social_urls": "Public person-profile URLs.",
  "PersonEnrichmentRequest.name": "The person's given and family names.",
  "PersonEnrichmentRequest.name.first": "Given name.",
  "PersonEnrichmentRequest.name.last": "Family name.",
  "PersonEnrichmentRequest.email": "Email address identifying the person.",
  "PersonEnrichmentRequest.company": "Company identity clues.",
  "PersonEnrichmentRequest.company.name": "Company name.",
  "PersonEnrichmentRequest.company.domain": "Company domain.",
  "PersonEnrichmentRequest.education": "Education history used to match the person.",
  "PersonEnrichmentRequest.education.institution": "Educational institution.",
  "PersonEnrichmentRequest.education.institution.name": "Institution name.",
  "PersonEnrichmentRequest.education.institution.domain": "Institution domain.",
  "PersonEnrichmentRequest.education.degree": "Degree earned or pursued.",
  "PersonEnrichmentRequest.education.field_of_study": "Field of study.",
  "PersonEnrichmentRequest.education.graduation_year": "Graduation year.",
  "PersonEnrichmentRequest.location": "Location clues used to match the person.",
  "PersonEnrichmentRequest.location.city": "City name.",
  "PersonEnrichmentRequest.location.region": "State, province, or region.",
  "PersonEnrichmentRequest.location.country": "Country name or code.",
};

function mcpSchemaPropertyDescription(
  name: string,
  schema: JsonSchema,
  path: string,
): string | undefined {
  const discriminatorValue =
    schema.const ?? (schema.enum?.length === 1 ? schema.enum[0] : undefined);
  if (
    (name === "type" || name === "do") &&
    discriminatorValue !== undefined
  ) {
    return `Use \`${String(discriminatorValue)}\`.`;
  }
  return MCP_SCHEMA_PROPERTY_DESCRIPTIONS[`${path}.${name}`] ??
    MCP_SCHEMA_PROPERTY_DESCRIPTIONS[name];
}

function withMcpSchemaDescriptions(
  schema: JsonSchema,
  path = "",
): JsonSchema {
  const properties = schema.properties
    ? Object.fromEntries(
        Object.entries(schema.properties).map(([name, property]) => {
          const describedProperty = withMcpSchemaDescriptions(
            property,
            path ? `${path}.${name}` : name,
          );
          return [
            name,
            describedProperty.description
              ? describedProperty
              : {
                  ...describedProperty,
                  description: mcpSchemaPropertyDescription(
                    name,
                    describedProperty,
                    path,
                  ),
                },
          ];
        }),
      )
    : undefined;
  const items = schema.items
    ? withMcpSchemaDescriptions(schema.items, path)
    : undefined;
  const oneOf = schema.oneOf?.map((part) => withMcpSchemaDescriptions(part, path));
  const anyOf = schema.anyOf?.map((part) => withMcpSchemaDescriptions(part, path));
  const allOf = schema.allOf?.map((part) => withMcpSchemaDescriptions(part, path));
  const additionalProperties =
    schema.additionalProperties &&
    typeof schema.additionalProperties === "object"
      ? withMcpSchemaDescriptions(schema.additionalProperties, path)
      : schema.additionalProperties;
  return {
    ...schema,
    ...(properties ? { properties } : {}),
    ...(items ? { items } : {}),
    ...(oneOf ? { oneOf } : {}),
    ...(anyOf ? { anyOf } : {}),
    ...(allOf ? { allOf } : {}),
    ...(additionalProperties !== undefined ? { additionalProperties } : {}),
  };
}

const describedComponentSchemas = Object.fromEntries(
  Object.entries(COMPONENT_SCHEMAS).map(([name, schema]) => [
    name,
    withMcpSchemaDescriptions(schema, name),
  ]),
);
const monitorIntervalSchedule =
  describedComponentSchemas.MonitorsIntervalSchedule!;
const monitorIntervalProperties = monitorIntervalSchedule.properties!;
const MCP_COMPONENT_SCHEMAS = {
  ...describedComponentSchemas,
  MonitorsIntervalSchedule: {
    ...monitorIntervalSchedule,
    properties: {
      ...monitorIntervalProperties,
      type: {
        ...monitorIntervalProperties.type!,
        description: "Use `interval`.",
      },
      unit: {
        ...monitorIntervalProperties.unit!,
        description: "Unit: minutes, hours, or days.",
      },
    },
  },
};
const oauthProvider = createOAuthProvider();
const registeredEndpoints = selectEndpoints(ENDPOINTS);

const server = new MCPServer({
  name: "context",
  title: "Context",
  version: "1.0.0",
  description:
    "Turn the live web, company news, and files into reliable, agent-ready context. Connect with OAuth or a Context API key through the Authorization header, X-API-Key header, or api_key URL parameter.",
  instructions:
    "Use Context for live web or news, URLs, files, brands, people, batches, and monitoring. Route: `get-news-search` for one company's news; `web-search` for broad research; `web-answers` for researched JSON; `web-scrape` for one page; `web-map` for site URLs; `web-crawl` for linked pages; `submit-batch` for large jobs; `parse-document` for file bytes. Prefer compact search and scrape results. Browser actions affect sites; use only requested actions.\n\n" +
    "Use `get-brand` for visual domain data, `brand-retrieve-unified` for raw or non-domain data, `brand-search` for matches, `people-enrich` for people, and `web-styleguide` for design systems. Monitors are recurring only; check `get-monitor-limits`. For batches call `get-batch`, then `get-batch-results`. Webhook list/get tools inspect; retry resends and secret rotation replaces the receiver secret.\n\n" +
    "Only when needed for account failures, use `list-logs`, then `get-log` with its request ID.\n\n" +
    FEEDBACK_INSTRUCTIONS + "\n\n" +
    "Auth: OAuth or an API key via `Authorization: Bearer <key>`, `X-API-Key: <key>`, or URL `api_key`. Prefer OAuth or headers; URLs may be logged. Avoid duplicate calls. On `USAGE_EXCEEDED`, do not retry; call `get-usage` once, tell the user the balance and refill, and continue independent work. Use idempotency keys for batch retries.",
  baseUrl: process.env.MCP_URL || "http://localhost:3000",
  favicon: "favicon.ico",
  websiteUrl: "https://context.dev",
  icons: [{ src: "icon.png", mimeType: "image/png", sizes: ["128x128"] }],
  publicLandingPage: true,
  stateless: true,
  ...(oauthProvider ? { oauth: oauthProvider } : {}),
});

server.app.get("/health", (c) => c.json({ status: "ok" }));

server.app.get("/.well-known/openai-apps-challenge", (context) =>
  context.text("-oywG7IJEF_oq8McQYi47HY0QDTdYn36eA_yi5bPysc"),
);

const LOOPBACK_HOSTNAMES = new Set(["localhost", "127.0.0.1", "[::1]"]);
const BUILT_IN_MCP_CLIENT_ORIGINS = [
  "https://chatgpt.com",
  "https://platform.openai.com",
  "https://claude.ai",
  "https://claude.com",
  "https://cursor.com",
  "https://inspector.manufact.com",
  "https://manufact.com",
  "https://mcpjam.com",
  "https://inspector.modelcontextprotocol.io",
];

function configuredMcpOrigins(): Set<string> {
  const origins = new Set(BUILT_IN_MCP_CLIENT_ORIGINS);
  for (const origin of (process.env.MCP_ALLOWED_ORIGINS ?? "").split(",")) {
    const trimmed = origin.trim();
    if (!trimmed) continue;
    try {
      origins.add(new URL(trimmed).origin);
    } catch {
      continue;
    }
  }
  try {
    origins.add(new URL(process.env.MCP_URL || "http://localhost:3000").origin);
  } catch {
    origins.add("http://localhost:3000");
  }
  return origins;
}

const allowedMcpOrigins = configuredMcpOrigins();

function isAllowedMcpOrigin(origin: string): boolean {
  try {
    const url = new URL(origin);
    if (
      (url.protocol === "http:" || url.protocol === "https:") &&
      LOOPBACK_HOSTNAMES.has(url.hostname)
    ) {
      return true;
    }
    return allowedMcpOrigins.has(url.origin);
  } catch {
    return false;
  }
}

const validateMcpOrigin = async (
  context: {
    req: { header: (name: string) => string | undefined };
    header: (name: string, value: string) => void;
  },
  next: () => Promise<void>,
) => {
  const origin = context.req.header("origin")?.trim();
  if (origin && !isAllowedMcpOrigin(origin)) {
    return new Response(
      JSON.stringify({
        jsonrpc: "2.0",
        error: { code: -32000, message: "Forbidden: invalid Origin header" },
      }),
      {
        status: 403,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
  await next();
  if (origin) {
    context.header("Access-Control-Allow-Origin", new URL(origin).origin);
    context.header("Vary", "Origin");
  }
};

const promoteApiKeyCredential = async (
  context: { req: { header: (name: string) => string | undefined; raw: Request } },
  next: () => Promise<void>,
) => {
  if (!context.req.header("authorization")) {
    const headerKey = context.req.header("x-api-key")?.trim();
    const queryKey = new URL(context.req.raw.url).searchParams
      .get("api_key")
      ?.trim();
    const apiKey = headerKey || queryKey;
    if (apiKey) {
      context.req.raw.headers.set("Authorization", `Bearer ${apiKey}`);
    }
  }
  await next();
};
// Each tool's validator and published input schema, filled in as tools are
// registered.
const toolInputs = new Map<string, { schema: JsonSchema; validator: z.ZodTypeAny }>();

function registerToolInput(name: string, validator: z.ZodTypeAny): void {
  toolInputs.set(name, {
    validator,
    schema: z.toJSONSchema(validator, { io: "input" }) as JsonSchema,
  });
}

type RepairedToolCall = {
  message: unknown;
  changed: boolean;
  // Tool whose arguments still fail validation after repair.
  stillInvalid?: string;
};

// Calls that already validate are sent as they are, apart from completions
// the API would otherwise reject; only calls that would fail are repaired.
function repairToolCall(message: unknown): RepairedToolCall {
  const unchanged = { message, changed: false };
  if (!message || typeof message !== "object" || Array.isArray(message)) {
    return unchanged;
  }
  const { method, params } = message as {
    method?: unknown;
    params?: { name?: unknown; arguments?: unknown };
  };
  if (method !== "tools/call" || typeof params?.name !== "string") {
    return unchanged;
  }
  const input = toolInputs.get(params.name);
  if (!input) return unchanged;
  if (input.validator.safeParse(params.arguments).success) {
    const completed = completeValidArguments(params.name, params.arguments);
    return completed === params.arguments
      ? unchanged
      : {
          message: { ...message, params: { ...params, arguments: completed } },
          changed: true,
        };
  }
  let name = params.name;
  let target = input;
  let repaired = repairToolArguments(params.arguments, target.schema, name);
  // Decide the route from every key the caller sent, not only the keys the
  // first tool's schema kept: the other tool's input is what signals it.
  const sent =
    params.arguments && typeof params.arguments === "object" && !Array.isArray(params.arguments)
      ? { ...(params.arguments as Record<string, unknown>), ...(repaired as Record<string, unknown>) }
      : repaired;
  const rerouted = reroutedToolName(name, sent);
  const reroutedInput = rerouted ? toolInputs.get(rerouted) : undefined;
  if (rerouted && reroutedInput) {
    name = rerouted;
    target = reroutedInput;
    repaired = repairToolArguments(params.arguments, target.schema, name);
  }
  return {
    message: { ...message, params: { ...params, name, arguments: repaired } },
    changed: true,
    stillInvalid: target.validator.safeParse(repaired).success ? undefined : name,
  };
}

async function withValidationHint(
  response: Response,
  toolName: string,
): Promise<Response> {
  const hint = VALIDATION_HINTS[toolName];
  const contentType = response.headers.get("content-type") ?? "";
  if (!hint || !contentType.includes("application/json")) return response;
  const payload = await response.clone().json().catch(() => undefined);
  const content = payload?.result?.isError ? payload.result.content : undefined;
  const first = Array.isArray(content) ? content[0] : undefined;
  if (
    first?.type !== "text" ||
    typeof first.text !== "string" ||
    !first.text.includes("Input validation error")
  ) {
    return response;
  }
  first.text = `${first.text}\n\n${hint}`;
  const headers = new Headers(response.headers);
  headers.delete("content-length");
  return new Response(JSON.stringify(payload), { status: response.status, headers });
}

// Large bodies are file uploads (parse-document), which repair does not need.
const MAX_REPAIRED_BODY_BYTES = 1_000_000;

// Repairs run before the SDK validates arguments; mcp-use's tools/call
// middleware only sees arguments after validation has already rejected them.
const repairToolCallArguments = async (
  context: {
    req: {
      method: string;
      raw: Request;
      header: (name: string) => string | undefined;
    };
    res: Response;
  },
  next: () => Promise<void>,
) => {
  let hintTool: string | undefined;
  const length = Number(context.req.header("content-length") ?? 0);
  // With OAuth on, a request without credentials is rejected anyway.
  const authenticated = !oauthProvider || Boolean(context.req.header("authorization"));
  if (
    context.req.method === "POST" &&
    authenticated &&
    !(length > MAX_REPAIRED_BODY_BYTES)
  ) {
    try {
      const body: unknown = await context.req.raw.clone().json();
      const calls = (Array.isArray(body) ? body : [body]).map(repairToolCall);
      if (calls.some((call) => call.changed)) {
        const repaired = Array.isArray(body)
          ? calls.map((call) => call.message)
          : calls[0]!.message;
        const { url, method } = context.req.raw;
        const headers = new Headers(context.req.raw.headers);
        headers.delete("content-length");
        context.req.raw = new Request(url, {
          method,
          headers,
          body: JSON.stringify(repaired),
        });
      }
      if (!Array.isArray(body)) hintTool = calls[0]!.stillInvalid;
    } catch (cause) {
      // Repair is best effort; validation still reports the original arguments.
      if (!(cause instanceof SyntaxError)) {
        console.warn("[MCP] Argument repair skipped:", cause);
      }
    }
  }
  await next();
  if (hintTool) context.res = await withValidationHint(context.res, hintTool);
};

const LEGACY_TOOL_NAMES = new Set(Object.keys(LEGACY_TOOL_ANNOTATIONS));

// Gemini's function-calling schema subset rejects `$schema`, and the root
// dialect is already the MCP default.
server.use("mcp:tools/list", async (_context, next) => {
  const tools = (await next()) as Array<{
    name: string;
    inputSchema?: Record<string, unknown>;
  }>;
  return tools
    .filter((tool) => !LEGACY_TOOL_NAMES.has(tool.name))
    .map(({ inputSchema, ...tool }) => {
      if (!inputSchema) return tool;
      const { $schema: _dialect, ...schema } = inputSchema;
      return {
        ...tool,
        inputSchema: tool.name === "get-news-search"
          ? {
              ...schema,
              oneOf: NEWS_SEARCH_IDENTIFIERS.map((name) => ({ required: [name] })),
            }
          : schema,
      };
    });
});

// The server is stateless and never sends unsolicited messages, so a GET event
// stream would sit idle until a proxy cut it (and some clients mark a server
// failed while it hangs). 405 tells clients there is no stream to open.
const rejectIdleEventStream = async (
  context: { req: { method: string; header: (name: string) => string | undefined } },
  next: () => Promise<void>,
) => {
  const accept = context.req.header("accept") ?? "";
  if (
    context.req.method === "GET" &&
    accept.includes("text/event-stream") &&
    !accept.includes("text/html")
  ) {
    return new Response(null, { status: 405, headers: { Allow: "POST, DELETE" } });
  }
  await next();
};

// mcp-use answers every 401 with error="unauthorized", which RFC 6750 does not
// define. Clients refresh an expired access token after error="invalid_token";
// without it, expired sessions stall until the user signs in again by hand.
const describeBearerChallenge = async (
  context: {
    req: { header: (name: string) => string | undefined };
    res: Response;
  },
  next: () => Promise<void>,
) => {
  await next();
  const challenge = context.res.headers.get("www-authenticate");
  if (context.res.status !== 401 || !challenge?.startsWith("Bearer")) return;
  const resourceMetadata = /resource_metadata="([^"]+)"/.exec(challenge)?.[1];
  const sentToken = /^bearer\s+\S/i.test(context.req.header("authorization") ?? "");
  const parameters = [
    ...(sentToken
      ? [
          'error="invalid_token"',
          'error_description="The access token is invalid or expired"',
        ]
      : []),
    ...(resourceMetadata ? [`resource_metadata="${resourceMetadata}"`] : []),
    'scope="api.read api.write"',
  ];
  context.res.headers.set("WWW-Authenticate", `Bearer ${parameters.join(", ")}`);
};

// "/mcp/*" and "/sse/*" also match "/mcp" and "/sse".
for (const path of ["/mcp/*", "/sse/*"]) {
  server.app.use(path, validateMcpOrigin);
  server.app.use(path, rejectIdleEventStream);
  server.app.use(path, describeBearerChallenge);
  server.app.use(path, promoteApiKeyCredential);
  server.app.use(path, repairToolCallArguments);
}

// Clients that take the MCP URL as the issuer (Codex among them) try these
// paths before the root document, one round trip per 404. The issuer is the
// server root, so answer each with the root document they end up using.
const ROOT_METADATA_BY_ISSUER_PATH_ALIAS: Readonly<Record<string, string>> = {
  "/.well-known/oauth-authorization-server/mcp":
    "/.well-known/oauth-authorization-server",
  "/.well-known/openid-configuration/mcp": "/.well-known/openid-configuration",
  "/mcp/.well-known/oauth-authorization-server":
    "/.well-known/oauth-authorization-server",
  "/mcp/.well-known/openid-configuration": "/.well-known/openid-configuration",
};
for (const [alias, rootPath] of Object.entries(ROOT_METADATA_BY_ISSUER_PATH_ALIAS)) {
  server.app.get(alias, (context) => {
    const target = new URL(context.req.url);
    target.pathname = rootPath;
    return server.app.fetch(new Request(target, context.req.raw), context.env);
  });
}

// Other discovery documents under /mcp do not exist. Answer 404 instead of
// the bearer challenge that would otherwise apply.
server.app.get("/mcp/.well-known/*", (context) => context.notFound());

// Users often configure the bare server URL; serve MCP there too.
server.app.post("/", (context) => {
  const target = new URL(context.req.url);
  target.pathname = "/mcp";
  const { method, headers, body } = context.req.raw;
  return server.app.fetch(
    new Request(target, { method, headers, body, duplex: "half" } as RequestInit),
    context.env,
  );
});

// Registration-bound (DCR) clients carry their redirect URI set inside a
// signed client_id, so any client may connect; the upstream consent screen
// labels destinations it does not recognize as unverified. This list is no
// longer a gate for those clients — it serves the legacy shared-client path
// (clients that registered before signed client_ids and still hold the fixed
// client id validate their redirects against it) and derives the trusted
// branding slug for the upstream consent screen. Trusted clients move their
// callback paths and spin up new subdomains without warning, so match on the
// registrable domain over HTTPS instead of pinning exact URIs. Each entry
// covers the domain itself, any subdomain, and any path. Multi-tenant
// platforms are scoped to the vendor-operated OAuth host rather than the
// apex — Google to cloud.google.com, n8n to oauth.n8n.cloud (customers
// control endpoints under *.app.n8n.cloud), Azure API Management to
// consent.azure-apim.net (every APIM instance gets a name under the apex;
// Power Platform consent always lands on {region}.consent.azure-apim.net):
// a customer-controlled or open redirect on a trusted subdomain is a route
// for leaking an authorization code on the legacy path.
// The client key names the connecting app on the upstream consent screen; it
// is derived from this list rather than client-supplied registration
// metadata, which any caller could spoof.
const TRUSTED_OAUTH_REDIRECT_DOMAINS: ReadonlyArray<{
  domain: string;
  client: string;
}> = [
  // Claude web, desktop, mobile, and Cowork
  { domain: "claude.ai", client: "claude" },
  { domain: "claude.com", client: "claude" },
  { domain: "anthropic.com", client: "claude" },
  // ChatGPT connectors and Codex
  { domain: "chatgpt.com", client: "chatgpt" },
  { domain: "openai.com", client: "chatgpt" },
  { domain: "cursor.com", client: "cursor" },
  // VS Code and VS Code Insiders web redirects
  { domain: "vscode.dev", client: "vscode" },
  // Le Chat, Copilot Studio, Gemini, n8n, MCPJam
  { domain: "mistral.ai", client: "le-chat" },
  { domain: "consent.azure-apim.net", client: "copilot-studio" },
  { domain: "cloud.google.com", client: "gemini" },
  { domain: "oauth.n8n.cloud", client: "n8n" },
  { domain: "mcpjam.com", client: "mcpjam" },
  // The Manufact platform (dashboard, hosted inspector)
  { domain: "manufact.com", client: "manufact" },
];

// Desktop clients finish the flow through a private URL scheme rather than
// HTTPS, so the scheme registration itself is the trust boundary.
const TRUSTED_OAUTH_REDIRECT_SCHEMES = new Map([
  ["cursor:", "cursor"],
  ["vscode:", "vscode"],
  ["warp:", "warp"],
]);

// CLI and editor clients bind an ephemeral loopback port per RFC 8252, so the
// port and path vary per session and cannot be pinned.
function trustedOAuthClientForHost(hostname: string): string | undefined {
  const host = hostname.toLowerCase();
  return TRUSTED_OAUTH_REDIRECT_DOMAINS.find(
    ({ domain }) => host === domain || host.endsWith(`.${domain}`),
  )?.client;
}

// Slug consumed by the upstream consent screen, which maps it to display copy
// and falls back to generic wording for values it does not recognize.
function resolveOAuthClientKey(redirectUri: string): string {
  try {
    const url = new URL(redirectUri);
    const schemeClient = TRUSTED_OAUTH_REDIRECT_SCHEMES.get(url.protocol);
    if (schemeClient) return schemeClient;
    const hostClient = trustedOAuthClientForHost(url.hostname);
    if (hostClient) return hostClient;
    if (LOOPBACK_HOSTNAMES.has(url.hostname)) return "local";
  } catch {
    // fall through to the generic slug
  }
  return "mcp-client";
}

function isAllowedOAuthRedirect(value: string): boolean {
  try {
    const url = new URL(value);
    if (TRUSTED_OAUTH_REDIRECT_SCHEMES.has(url.protocol)) {
      return true;
    }
    if (
      url.protocol === "https:" &&
      trustedOAuthClientForHost(url.hostname) !== undefined
    ) {
      return true;
    }
    const allowedOrigins = (
      process.env.MCP_OAUTH_ALLOWED_REDIRECT_ORIGINS ?? ""
    )
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean);
    if (allowedOrigins.includes(url.origin)) {
      return true;
    }
    return (
      (url.protocol === "http:" || url.protocol === "https:") &&
      LOOPBACK_HOSTNAMES.has(url.hostname)
    );
  } catch {
    return false;
  }
}

if (oauthProvider) {
  const dcrClientSigningKey = deriveDcrClientSigningKey(
    getOAuthTokenEncryptionKey(),
  );

  server.app.use("/register", async (context, next) => {
    context.header("Access-Control-Allow-Origin", "*");
    await next();
  });
  // Open dynamic registration: any client may register, receiving a signed
  // client_id that embeds its redirect URI set. Authorization then only
  // proceeds toward a redirect target bound into that registration, and the
  // upstream consent screen labels unrecognized destinations as unverified.
  server.app.post("/register", async (context) => {
    const body = (await context.req.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    const result = registerDcrClient(body, dcrClientSigningKey);
    if (!result.ok) {
      console.warn(
        `[OAuth] Rejected registration, redirect_uris: ${JSON.stringify(body.redirect_uris)}`,
      );
      return context.json(
        { error: result.error, error_description: result.errorDescription },
        400,
      );
    }
    return context.json(
      {
        client_id: result.clientId,
        client_name: result.registration.clientName ?? "MCP Client",
        redirect_uris: result.registration.redirectUris,
        grant_types: ["authorization_code", "refresh_token"],
        response_types: ["code"],
        token_endpoint_auth_method: "none",
      },
      201,
    );
  });
  server.app.use("/authorize", async (context, next) => {
    const params =
      context.req.method === "POST"
        ? await context.req.parseBody()
        : context.req.query();
    const clientId = params.client_id;
    const redirectUri = params.redirect_uri;
    // Signed (DCR) client_ids bind the redirect target to the registration;
    // anything else is a legacy client holding the fixed shared client id and
    // stays gated by the trusted-domain list.
    const registration = isDcrClientId(clientId)
      ? decodeDcrClientId(clientId, dcrClientSigningKey)
      : undefined;
    const redirectAllowed =
      typeof redirectUri === "string" &&
      (registration !== undefined
        ? registration !== null &&
          redirectUriMatchesRegistration(redirectUri, registration)
        : isAllowedOAuthRedirect(redirectUri));
    if (!redirectAllowed) {
      console.warn(
        `[OAuth] Rejected authorization, redirect_uri: ${JSON.stringify(redirectUri)}`,
      );
      return context.json(
        {
          error: "invalid_request",
          error_description: "redirect_uri is not allowed for this client",
        },
        400,
      );
    }
    await next();
    const location = context.res.headers.get("location");
    if (!location) return;
    const upstreamUrl = new URL(location);
    upstreamUrl.searchParams.set(
      "mcp_client",
      resolveOAuthClientKey(redirectUri),
    );
    context.res.headers.set("location", upstreamUrl.toString());
  });
  const mcpBaseUrl = (process.env.MCP_URL || "http://localhost:3000").replace(
    /\/+$/,
    "",
  );
  server.app.on(["GET", "POST"], "/authorize", async (context, next) => {
    const params =
      context.req.method === "POST"
        ? await context.req.parseBody()
        : context.req.query();
    const result = createNativeAuthorizationRedirect(params, {
      authEndpoint: oauthProvider.getAuthEndpoint(),
      callbackUri: `${mcpBaseUrl}/oauth/callback`,
      clientId: process.env.CONTEXT_OAUTH_CLIENT_ID!,
      audience: `${mcpBaseUrl}/mcp`,
    });
    if (!result.handled) {
      await next();
      return;
    }
    if ("error" in result) {
      return context.json(
        { error: "invalid_request", error_description: result.error },
        400,
      );
    }
    return context.redirect(result.location, 302);
  });
  // The proxy overwrites client credentials before the upstream exchange, so
  // enforce the registration binding for DCR clients here: a bad signature is
  // invalid_client per RFC 6749 §5.2 (prompting well-behaved clients to
  // re-register) and a redirect outside the registered set is invalid_grant.
  // Requests without a signed client_id pass through as before; the upstream
  // PKCE check remains the binding for the authorization code itself.
  server.app.use("/token", async (context, next) => {
    if (context.req.method !== "POST") {
      await next();
      return;
    }
    const body = await context.req.parseBody();
    const clientId = body.client_id;
    if (isDcrClientId(clientId)) {
      const registration = decodeDcrClientId(clientId, dcrClientSigningKey);
      if (!registration) {
        return context.json(
          {
            error: "invalid_client",
            error_description:
              "The client_id signature is invalid; register again",
          },
          401,
        );
      }
      const redirectUri = body.redirect_uri;
      if (
        typeof redirectUri === "string" &&
        !redirectUriMatchesRegistration(redirectUri, registration)
      ) {
        return context.json(
          {
            error: "invalid_grant",
            error_description:
              "redirect_uri does not match the client registration",
          },
          400,
        );
      }
    }
    await next();
  });
  server.app.use("/oauth/callback", async (context, next) => {
    await next();
    const location = context.res.headers.get("location");
    if (location) {
      context.res.headers.set(
        "location",
        withAuthorizationServerIssuer(location, mcpBaseUrl),
      );
    }
  });
  server.app.get("/oauth/callback", async (context, next) => {
    const result = createNativeCallbackRedirect(context.req.query());
    if (!result.handled) {
      await next();
      return;
    }
    if ("error" in result) {
      return context.json(
        { error: "invalid_request", error_description: result.error },
        400,
      );
    }
    return context.redirect(result.location, 302);
  });
}

// ---------------------------------------------------------------------------
// 1) Branded UI: get-brand renders a Context brand card (logo, colors, ...)
// ---------------------------------------------------------------------------

const LINK_LABELS: Record<string, string> = {
  careers: "Careers",
  privacy: "Privacy",
  terms: "Terms",
  contact: "Contact",
  blog: "Blog",
  pricing: "Pricing",
};

function safeHttpUrl(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.toString()
      : undefined;
  } catch {
    return undefined;
  }
}

function safeBrandDomain(value: unknown): string {
  if (typeof value !== "string") return "";
  try {
    const url = new URL(
      value.includes("://") ? value : `https://${value}`,
    );
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.hostname
      : "";
  } catch {
    return "";
  }
}

function safeBrandLogo(value: unknown): string | undefined {
  const url = safeHttpUrl(value);
  if (!url) return undefined;
  return new URL(url).origin === "https://media.brand.dev" ? url : undefined;
}

function normalizeBrand(payload: any): Brand {
  const b = payload?.brand ?? {};
  const domain = safeBrandDomain(b.domain);
  const logos: any[] = Array.isArray(b.logos) ? b.logos : [];
  const bestLogo =
    safeBrandLogo(logos.find((l) => l?.type === "logo")?.url) ||
    safeBrandLogo(logos.find((l) => l?.type === "icon")?.url) ||
    safeBrandLogo(logos[0]?.url) ||
    undefined;
  const colors = (Array.isArray(b.colors) ? b.colors : [])
    .filter(
      (c: any) =>
        typeof c?.hex === "string" && /^#[0-9a-f]{6}$/i.test(c.hex),
    )
    .map((c: any) => ({ hex: c.hex, name: c.name }));
  const socials = (Array.isArray(b.socials) ? b.socials : [])
    .map((s: any) => ({
      type: String(s?.type ?? "link"),
      url: safeHttpUrl(s?.url),
    }))
    .filter(
      (s: { type: string; url: string | undefined }): s is {
        type: string;
        url: string;
      } => !!s.url,
    );
  const industries = (b.industries?.eic ?? [])
    .filter((i: any) => i?.industry)
    .map((i: any) => ({ industry: i.industry, subindustry: i.subindustry }));
  const links = Object.entries(b.links ?? {})
    .map(([key, url]) => ({
      label: LINK_LABELS[key] ?? key,
      url: safeHttpUrl(url),
    }))
    .filter((link): link is { label: string; url: string } => !!link.url);
  const addr = b.address ?? {};
  const location =
    [
      addr.city,
      addr.state_code || addr.state_province,
      addr.country_code || addr.country,
    ]
      .filter(Boolean)
      .join(", ") || undefined;
  const stockTicker = b.stock?.ticker
    ? [b.stock.exchange, b.stock.ticker].filter(Boolean).join(": ")
    : undefined;
  return {
    domain,
    title: b.title || domain || "Unknown",
    slogan: b.slogan || undefined,
    description: b.description || undefined,
    logo: bestLogo,
    colors,
    socials,
    industries,
    links,
    email: b.email || undefined,
    phone: b.phone || undefined,
    location,
    stockTicker,
  };
}

const MCP_PARAMETER_DESCRIPTIONS: Readonly<Record<string, string>> = {
  "brand-retrieve-unified.body":
    "Brand lookup request. Provide exactly one lookup type: domain, company name, email, stock ticker, direct URL, or transaction descriptor.",
  "create-monitor.name":
    "Human-readable monitor name used to identify it in lists, runs, changes, and notifications.",
  "create-monitor.webhook":
    "Optional webhook configuration for delivering monitor change notifications.",
  "submit-batch.input":
    "Batch job definition. Choose a scrape or crawl mode and provide the URLs, output format, and processing options for that mode.",
  "update-monitor.name": "New human-readable name for the monitor.",
  "update-monitor.status":
    "New monitor lifecycle status: active continues scheduled runs; paused stops them until reactivated.",
  "list-webhook-deliveries.body":
    "Webhook delivery filters. Choose batch or monitor as the source type, then optionally filter by source ID, status, creation time, and pagination cursor.",
  "web-answers.json_format":
    "Example object whose keys and value types define the answer shape. Unknown values may be null.",
};

function mcpParameterDescription(
  toolName: string,
  parameterName: string,
): string | undefined {
  const exactDescription =
    MCP_PARAMETER_DESCRIPTIONS[`${toolName}.${parameterName}`];
  if (exactDescription) return exactDescription;
  if (parameterName === "monitor_id") {
    return "Unique monitor ID returned by create-monitor or list-monitors, for example `mon_123`.";
  }
  if (parameterName === "change_id") {
    return "Unique change ID returned by a monitor changes endpoint, for example `chg_123`.";
  }
  if (parameterName === "run_id") {
    return "Unique monitor run ID returned by run-monitor-now or list-monitor-runs, for example `run_123`.";
  }
  return undefined;
}

function withoutRedundantQueryNull(schema: JsonSchema): JsonSchema {
  // The request serializer already omits null query values; optional parameters
  // express the same unset state without widening every published tool schema.
  if (!Array.isArray(schema.type) || !schema.type.includes("null")) {
    return schema;
  }
  const types = schema.type.filter((type) => type !== "null");
  return {
    ...schema,
    type: types.length === 1 ? types[0] : types,
  };
}

function registerBrandTool(): void {
  const schema = z.object({
    domain: z
      .string()
      .describe(
        "Domain to look up, e.g. 'stripe.com'. Bare domain, no https://.",
      ),
    maxSpeed: z
      .boolean()
      .optional()
      .describe("Optimize for speed, skipping slower enrichment steps."),
  });
  registerToolInput("get-brand", schema);
  server.tool(
    {
      name: "get-brand",
      title: "Show a brand profile",
      description:
        "Retrieve live brand intelligence for a domain and render a visual Context card with its logo, colors, slogan, description, social profiles, industry, location, and key links. Use this when a user wants to see or inspect a company's brand. Use brand-retrieve-unified instead for raw structured data or lookup by name, email, ticker, ISIN, transaction descriptor, or direct URL.",
      schema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: true,
      },
      outputSchema: z.object({ brand: brandSchema }),
      widget: {
        name: "context-brand",
        invoking: "Querying Context...",
        invoked: "Brand loaded",
      },
    },
    async ({ domain, maxSpeed }, context) => {
      const credential = resolveContextCredential(context);
      if (!credential) return error(MISSING_CREDENTIAL_MESSAGE);
      const clean = domain
        .trim()
        .replace(/^https?:\/\//, "")
        .replace(/\/.*$/, "");
      let res: Response;
      try {
        res = await fetchContextApi(`${API_BASE}/brand/retrieve`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${credential.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: "by_domain",
            domain: clean,
            ...(maxSpeed ? { maxSpeed: true } : {}),
          }),
        });
      } catch (cause) {
        return contextApiError("get-brand", contextFetchFailure(cause));
      }
      let payload: any;
      try {
        payload = await res.json();
      } catch (cause) {
        if (cause instanceof Error && cause.name === "TimeoutError") {
          return contextApiError("get-brand", contextFetchFailure(cause));
        }
        payload = {};
      }
      if (!res.ok) {
        return contextApiError(
          "get-brand",
          contextErrorMessage(res.status, payload, res.headers),
          contextErrorCode(payload),
        );
      }
      const brand = normalizeBrand(payload);
      const summary =
        `${brand.title} (${brand.domain})` +
        (brand.slogan ? ` — ${brand.slogan}` : "") +
        (brand.colors.length
          ? `. Colors: ${brand.colors.map((c) => c.hex).join(", ")}`
          : "");
      const requestId = contextRequestId(payload, res.headers);
      // Clients that ignore structuredContent and don't render the widget
      // (e.g. Cursor, Codex) only see this text, so it must carry the brand.
      const brandJson = JSON.stringify({ brand });
      return widget({
        props: { brand },
        output: text(
          `${summary}\n\n${brandJson}` +
            (requestId ? `\nrequest_id: ${requestId}` : ""),
        ),
      });
    },
  );
}

function createNewsSearchSchema(endpoint: Endpoint): z.ZodTypeAny {
  const components: Record<string, JsonSchema> = MCP_COMPONENT_SCHEMAS;
  const body = resolveObjectSchema(
    withMcpSchemaDescriptions(endpoint.requestBody!.schema),
    components,
  )!;
  const properties = body.properties!;
  const name = components.NewsSearchEntityByName!.properties!.name!;
  const domain = components.NewsSearchEntityByDomain!.properties!.domain!;
  const ticker = components.NewsSearchEntityByTicker!.properties!.ticker!;
  const exchange = components.NewsSearchEntityByTicker!.properties!.exchange!;
  const isin = components.NewsSearchEntityByIsin!.properties!.isin!;

  return z.object({
    companyName: schemaToZod(name, components).optional().describe(
      "Company name. Provide exactly one of companyName, domain, ticker, or isin.",
    ),
    domain: schemaToZod(domain, components).optional().describe(
      "Company website domain. Provide exactly one of companyName, domain, ticker, or isin.",
    ),
    ticker: schemaToZod(ticker, components).optional().describe(
      "Public-company ticker. Provide exactly one of companyName, domain, ticker, or isin.",
    ),
    exchange: schemaToZod(exchange, components).optional().describe(
      "Optional stock exchange when ticker is used, such as NASDAQ or NYSE.",
    ),
    isin: schemaToZod(isin, components).optional().describe(
      "International Securities Identification Number. Provide exactly one of companyName, domain, ticker, or isin.",
    ),
    filterBy: schemaToZod(properties.filterBy!, components).optional(),
    sortBy: z.enum(["newest", "relevance"]).optional().describe(
      "Result ordering. Defaults to newest.",
    ),
    limit: schemaToZod(properties.limit!, components).optional(),
    cursor: schemaToZod(properties.cursor!, components).optional(),
    tags: schemaToZod(properties.tags!, components).optional(),
  }).refine(
    ({ companyName, domain, ticker, isin }) =>
      [companyName, domain, ticker, isin].filter((value) => value !== undefined).length === 1,
    { message: "Provide exactly one of companyName, domain, ticker, or isin." },
  ).refine(
    ({ exchange, ticker }) => exchange === undefined || ticker !== undefined,
    { message: "exchange can only be used with ticker." },
  );
}

function createEndpointSchema(endpoint: Endpoint): z.ZodTypeAny {
  if (endpoint.name === "get-news-search") {
    return createNewsSearchSchema(endpoint);
  }
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const parameter of endpoint.parameters) {
    if (parameter.in === "cookie") {
      continue;
    }
    const parameterJsonSchema =
      parameter.in === "query" && !parameter.required
        ? withoutRedundantQueryNull(parameter.schema)
        : parameter.schema;
    let parameterSchema = schemaToZod(
      withMcpSchemaDescriptions(parameterJsonSchema),
      MCP_COMPONENT_SCHEMAS,
    );
    const parameterDescription =
      mcpParameterDescription(endpoint.name, parameter.name) ??
      parameter.description;
    if (parameterDescription) {
      parameterSchema = parameterSchema.describe(parameterDescription);
    }
    shape[parameter.name] = parameter.required
      ? parameterSchema
      : parameterSchema.optional();
  }
  if (endpoint.requestBody?.binary) {
    shape.fileBase64 = z
      .string()
      .min(1)
      .describe("Base64-encoded file bytes. Maximum decoded size: 25 MiB.");
  } else if (endpoint.requestBody) {
    const bodyObject = resolveObjectSchema(
      withMcpSchemaDescriptions(endpoint.requestBody.schema),
      MCP_COMPONENT_SCHEMAS,
    );
    const bodyProperties = Object.keys(bodyObject?.properties ?? {});
    const canFlattenBody =
      bodyObject && bodyProperties.every((name) => shape[name] === undefined);

    if (canFlattenBody) {
      const required = new Set(bodyObject.required ?? []);
      for (const [name, property] of Object.entries(
        bodyObject.properties ?? {},
      )) {
        let propertySchema = schemaToZod(property, MCP_COMPONENT_SCHEMAS);
        const propertyDescription = mcpParameterDescription(endpoint.name, name);
        if (propertyDescription) {
          propertySchema = propertySchema.describe(propertyDescription);
        }
        shape[name] = required.has(name)
          ? propertySchema
          : propertySchema.optional();
      }
    } else {
      let bodySchema = schemaToZod(
        withMcpSchemaDescriptions(endpoint.requestBody.schema),
        MCP_COMPONENT_SCHEMAS,
      );
      if (endpoint.requestBody.description) {
        bodySchema = bodySchema.describe(endpoint.requestBody.description);
      } else {
        const bodyDescription = mcpParameterDescription(endpoint.name, "body");
        if (bodyDescription) bodySchema = bodySchema.describe(bodyDescription);
      }
      shape.body = endpoint.requestBody.required
        ? bodySchema
        : bodySchema.optional();
    }
  }
  if (
    endpoint.name === "web-search" ||
    endpoint.name === "web-scrape" ||
    endpoint.name === "web-crawl"
  ) {
    shape.responseMode = z.enum(["full", "compact"]).optional().describe(
      "Prefer compact for research: one JSON text response, no unused formats or verbose page metadata; HTML/Markdown/Highlights capped at 1,200 characters per field per search result or 4,000 per scrape or crawl field. Clipping is marked. JSON, parsed data and images are retained. Full (default) keeps the existing response shape and server limit. Use Highlights for query-relevant excerpts instead of clipped page prefixes.",
    );
  }
  return z.object(shape);
}

function registerEndpointTool(ep: Endpoint): void {
  const schema = createEndpointSchema(ep);
  registerToolInput(ep.name, schema);
  server.tool(
    {
      name: ep.name,
      title: ep.title,
      description: ep.description,
      schema,
      annotations: ep.annotations,
    },
    async (args, context: EnhancedToolContext) => {
      let endpointArgs = args;
      if (ep.name === "get-news-search") {
        const parsed = schema.safeParse(args);
        if (!parsed.success) {
          return error(`Input validation error: ${z.prettifyError(parsed.error)}`);
        }
        endpointArgs = parsed.data;
      }
      const credential = resolveContextCredential(context);
      if (!credential) return error(MISSING_CREDENTIAL_MESSAGE);
      return callContextApi({
        apiBase: API_BASE,
        endpoint: ep,
        args: endpointArgs as Record<string, unknown>,
        credential,
        clientUserAgent: context.req?.header("user-agent"),
      });
    },
  );
}

for (const ep of registeredEndpoints as Endpoint[]) {
  registerEndpointTool(ep);
  if (ep.name === "brand-retrieve-unified") {
    registerBrandTool();
  }
}

for (const ep of ENDPOINTS as Endpoint[]) {
  const annotations = LEGACY_TOOL_ANNOTATIONS[ep.name];
  if (annotations) registerEndpointTool({ ...ep, annotations });
}

server.listen().then(() => {
  console.log(
    `Context MCP server running — ${registeredEndpoints.length + 1} tools`,
  );
});
