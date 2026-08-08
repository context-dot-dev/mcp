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
import { callContextApi } from "./src/context-client";
import {
  decodeDcrClientId,
  deriveDcrClientSigningKey,
  isDcrClientId,
  redirectUriMatchesRegistration,
  registerDcrClient,
} from "./src/dcr";
import { resolveObjectSchema, schemaToZod } from "./src/openapi-schema";
import {
  clearOAuthBrowserCookie,
  createOAuthBrowserCookie,
  hasValidOAuthBrowserCookie,
} from "./src/oauth-browser-transaction";
import { selectEndpoints } from "./src/toolset";

const API_BASE = process.env.CONTEXT_API_BASE || "https://api.context.dev/v1";
const MCP_SCHEMA_PROPERTY_DESCRIPTIONS: Readonly<Record<string, string>> = {
  action: "Browser action.",
  confidence_threshold: "Minimum confidence, 0 to 1.",
  force_language: "Brand-data language code.",
  follow_subdomains: "Include target subdomains.",
  timeMs: "Wait in milliseconds.",
  url: "Target URL.",
};

function mcpSchemaPropertyDescription(
  name: string,
  schema: JsonSchema,
): string | undefined {
  const discriminatorValue =
    schema.const ?? (schema.enum?.length === 1 ? schema.enum[0] : undefined);
  if (
    (name === "type" || name === "do") &&
    discriminatorValue !== undefined
  ) {
    return `Use \`${String(discriminatorValue)}\`.`;
  }
  return MCP_SCHEMA_PROPERTY_DESCRIPTIONS[name];
}

function withMcpSchemaDescriptions(schema: JsonSchema): JsonSchema {
  const properties = schema.properties
    ? Object.fromEntries(
        Object.entries(schema.properties).map(([name, property]) => {
          const describedProperty = withMcpSchemaDescriptions(property);
          return [
            name,
            describedProperty.description
              ? describedProperty
              : {
                  ...describedProperty,
                  description: mcpSchemaPropertyDescription(
                    name,
                    describedProperty,
                  ),
                },
          ];
        }),
      )
    : undefined;
  const items = schema.items
    ? withMcpSchemaDescriptions(schema.items)
    : undefined;
  const oneOf = schema.oneOf?.map(withMcpSchemaDescriptions);
  const anyOf = schema.anyOf?.map(withMcpSchemaDescriptions);
  const allOf = schema.allOf?.map(withMcpSchemaDescriptions);
  const additionalProperties =
    schema.additionalProperties &&
    typeof schema.additionalProperties === "object"
      ? withMcpSchemaDescriptions(schema.additionalProperties)
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
    withMcpSchemaDescriptions(schema),
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
    "Turn the live web and files into reliable, agent-ready context. Search, scrape, crawl, extract structured data, parse documents, enrich brands, run large batches, and monitor meaningful changes.",
  instructions:
    "Use Context when a task needs current web data, clean content from a URL, structured facts from a site, document parsing, brand intelligence, large-scale collection, or recurring change detection.\n\n" +
    "Choose the smallest suitable tool: `web-search` discovers sources; `web-scrape-markdown` reads one known page; `web-scrape-sitemap` discovers a site's URLs; `web-crawl` reads several linked pages synchronously; `submit-batch` handles large asynchronous jobs; and `web-extract` returns schema-shaped JSON. Use `parse-document` for file bytes.\n\n" +
    "Use `get-brand` for a visual domain profile and `brand-retrieve-unified` for raw brand data or non-domain identifiers. Monitors are for recurring checks, not one-time scraping. Batch submissions return an ID: check `get-batch`, then read `get-batch-results` after completion.\n\n" +
    "Connect with Context OAuth. API-key authentication is available for private integrations through the Authorization header; never put API keys in URLs. Some operations consume Context credits, so avoid unnecessary duplicate calls and use idempotency keys for retried batch submissions.",
  baseUrl: process.env.MCP_URL || "http://localhost:3000",
  favicon: "favicon.ico",
  websiteUrl: "https://context.dev",
  icons: [{ src: "icon.png", mimeType: "image/png", sizes: ["128x128"] }],
  publicLandingPage: true,
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
server.app.use("/mcp/*", validateMcpOrigin);
server.app.use("/mcp/*", promoteApiKeyCredential);
server.app.use("/sse", validateMcpOrigin);
server.app.use("/sse/*", validateMcpOrigin);
server.app.use("/sse", promoteApiKeyCredential);
server.app.use("/sse/*", promoteApiKeyCredential);

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
  const oauthClientSecret = process.env.CONTEXT_OAUTH_CLIENT_SECRET!;
  const dcrClientSigningKey = deriveDcrClientSigningKey(
    getOAuthTokenEncryptionKey(),
  );
  const secureOAuthCookies =
    new URL(process.env.MCP_URL || "http://localhost:3000").protocol ===
    "https:";

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
    const upstreamState = upstreamUrl.searchParams.get("state");
    if (!upstreamState) return;
    context.header(
      "Set-Cookie",
      createOAuthBrowserCookie(
        upstreamState,
        oauthClientSecret,
        secureOAuthCookies,
      ),
    );
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
    const state = context.req.query("state");
    if (
      !state ||
      !hasValidOAuthBrowserCookie(
        state,
        oauthClientSecret,
        context.req.header("cookie"),
      )
    ) {
      return context.json(
        {
          error: "invalid_request",
          error_description:
            "OAuth callback did not originate from this browser",
        },
        400,
      );
    }
    context.header(
      "Set-Cookie",
      clearOAuthBrowserCookie(state, secureOAuthCookies),
    );
    await next();
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
  "web-extract.pdf":
    "PDF handling for discovered documents. Control whether PDFs are parsed and optionally restrict extraction to an inclusive page range.",
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
  return undefined;
}

server.tool(
  {
    name: "get-brand",
    title: "Show a brand profile",
    description:
      "Retrieve live brand intelligence for a domain and render a visual Context card with its logo, colors, slogan, description, social profiles, industry, location, and key links. Use this when a user wants to see or inspect a company's brand. Use brand-retrieve-unified instead for raw structured data or lookup by name, email, ticker, ISIN, transaction descriptor, or direct URL.",
    schema: z.object({
      domain: z
        .string()
        .describe(
          "Domain to look up, e.g. 'stripe.com'. Bare domain, no https://.",
        ),
      maxSpeed: z
        .boolean()
        .optional()
        .describe("Optimize for speed, skipping slower enrichment steps."),
    }),
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: false,
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
      res = await fetch(`${API_BASE}/brand/retrieve`, {
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
    } catch (e: any) {
      return error(`Failed to reach Context API: ${e?.message ?? e}`);
    }
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg =
        (payload as any)?.message || `Context API returned ${res.status}`;
      return error(`${msg} (domain: ${clean})`);
    }
    const brand = normalizeBrand(payload);
    const summary =
      `${brand.title} (${brand.domain})` +
      (brand.slogan ? ` — ${brand.slogan}` : "") +
      (brand.colors.length
        ? `. Colors: ${brand.colors.map((c) => c.hex).join(", ")}`
        : "");
    return widget({ props: { brand }, output: text(summary) });
  },
);

function createEndpointSchema(endpoint: Endpoint): z.ZodObject {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const parameter of endpoint.parameters) {
    if (parameter.in === "cookie") {
      continue;
    }
    let parameterSchema = schemaToZod(
      withMcpSchemaDescriptions(parameter.schema),
      MCP_COMPONENT_SCHEMAS,
    );
    const parameterDescription =
      parameter.description ?? mcpParameterDescription(endpoint.name, parameter.name);
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
  return z.object(shape);
}

for (const ep of registeredEndpoints as Endpoint[]) {
  server.tool(
    {
      name: ep.name,
      title: ep.title,
      description: ep.description,
      schema: createEndpointSchema(ep),
      annotations: ep.annotations,
    },
    async (args, context: EnhancedToolContext) => {
      const credential = resolveContextCredential(context);
      if (!credential) return error(MISSING_CREDENTIAL_MESSAGE);
      return callContextApi({
        apiBase: API_BASE,
        endpoint: ep,
        args: args as Record<string, unknown>,
        credential,
      });
    },
  );
}

server.listen().then(() => {
  console.log(
    `Context MCP server running — ${registeredEndpoints.length + 1} tools`,
  );
});
