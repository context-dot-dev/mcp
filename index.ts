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
} from "./context-endpoints";
import {
  createOAuthProvider,
  MISSING_CREDENTIAL_MESSAGE,
  resolveContextCredential,
} from "./src/auth";
import { callContextApi } from "./src/context-client";
import { resolveObjectSchema, schemaToZod } from "./src/openapi-schema";
import {
  clearOAuthBrowserCookie,
  createOAuthBrowserCookie,
  hasValidOAuthBrowserCookie,
} from "./src/oauth-browser-transaction";
import { selectEndpoints } from "./src/toolset";

const API_BASE = process.env.CONTEXT_API_BASE || "https://api.context.dev/v1";
const monitorIntervalSchedule = COMPONENT_SCHEMAS.MonitorsIntervalSchedule!;
const monitorIntervalProperties = monitorIntervalSchedule.properties!;
const MCP_COMPONENT_SCHEMAS = {
  ...COMPONENT_SCHEMAS,
  MonitorsIntervalSchedule: {
    ...monitorIntervalSchedule,
    properties: {
      ...monitorIntervalProperties,
      type: {
        ...monitorIntervalProperties.type!,
        description: "Schedule strategy. Must be `interval`.",
      },
      unit: {
        ...monitorIntervalProperties.unit!,
        description:
          "Time unit used with `frequency`: `minutes`, `hours`, or `days`.",
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

// Trusted clients move their callback paths and spin up new subdomains without
// warning, so match on the registrable domain over HTTPS instead of pinning
// exact URIs. Each entry covers the domain itself, any subdomain, and any path.
// Google is scoped to cloud.google.com rather than the apex: an open redirect
// on any trusted subdomain is a route for leaking an authorization code.
// The client key names the connecting app on the upstream consent screen; it
// is derived from this allowlist rather than client-supplied registration
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
  { domain: "azure-apim.net", client: "copilot-studio" },
  { domain: "cloud.google.com", client: "gemini" },
  { domain: "n8n.cloud", client: "n8n" },
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
const LOOPBACK_REDIRECT_HOSTNAMES = ["localhost", "127.0.0.1", "[::1]"];

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
    if (LOOPBACK_REDIRECT_HOSTNAMES.includes(url.hostname)) return "local";
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
      LOOPBACK_REDIRECT_HOSTNAMES.includes(url.hostname)
    );
  } catch {
    return false;
  }
}

if (oauthProvider) {
  const oauthClientSecret = process.env.CONTEXT_OAUTH_CLIENT_SECRET!;
  const secureOAuthCookies =
    new URL(process.env.MCP_URL || "http://localhost:3000").protocol ===
    "https:";

  // The bearer middleware mcp-use mounts at listen() only reads the
  // Authorization header; promote the documented x-api-key header so API-key
  // clients that cannot customize Authorization still pass the transport gate.
  const promoteApiKeyHeader = async (
    context: { req: { header: (name: string) => string | undefined; raw: Request } },
    next: () => Promise<void>,
  ) => {
    const headerKey = context.req.header("x-api-key");
    if (headerKey && !context.req.header("authorization")) {
      context.req.raw.headers.set("Authorization", `Bearer ${headerKey}`);
    }
    await next();
  };
  server.app.use("/mcp/*", promoteApiKeyHeader);
  server.app.use("/sse", promoteApiKeyHeader);
  server.app.use("/sse/*", promoteApiKeyHeader);

  server.app.use("/register", async (context, next) => {
    context.header("Access-Control-Allow-Origin", "*");
    if (context.req.method === "OPTIONS") {
      await next();
      return;
    }
    const body = await context.req.json().catch(() => undefined);
    const redirectUris: unknown[] =
      body &&
      typeof body === "object" &&
      Array.isArray((body as Record<string, unknown>).redirect_uris)
        ? ((body as Record<string, unknown>).redirect_uris as unknown[])
        : [];
    if (
      redirectUris.length === 0 ||
      redirectUris.some(
        (redirectUri) =>
          typeof redirectUri !== "string" ||
          !isAllowedOAuthRedirect(redirectUri),
      )
    ) {
      console.warn(
        `[OAuth] Rejected registration, redirect_uris: ${JSON.stringify(redirectUris)}`,
      );
      return context.json(
        {
          error: "invalid_redirect_uri",
          error_description: "One or more redirect_uris are not allowed",
        },
        400,
      );
    }
    await next();
  });
  server.app.post("/register", async (context) => {
    const body = (await context.req.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    return context.json(
      {
        client_id: process.env.CONTEXT_OAUTH_CLIENT_ID,
        client_name:
          typeof body.client_name === "string"
            ? body.client_name
            : "MCP Client",
        redirect_uris: body.redirect_uris,
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
    const redirectUri = params.redirect_uri;
    if (
      typeof redirectUri !== "string" ||
      !isAllowedOAuthRedirect(redirectUri)
    ) {
      console.warn(
        `[OAuth] Rejected authorization, redirect_uri: ${JSON.stringify(redirectUri)}`,
      );
      return context.json(
        {
          error: "invalid_request",
          error_description: "redirect_uri is not allowed",
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

function normalizeBrand(payload: any): Brand {
  const b = payload?.brand ?? {};
  const logos: any[] = Array.isArray(b.logos) ? b.logos : [];
  const bestLogo =
    logos.find((l) => l?.type === "logo")?.url ||
    logos.find((l) => l?.type === "icon")?.url ||
    logos[0]?.url ||
    undefined;
  const colors = (Array.isArray(b.colors) ? b.colors : [])
    .filter((c: any) => c?.hex)
    .map((c: any) => ({ hex: c.hex, name: c.name }));
  const socials = (Array.isArray(b.socials) ? b.socials : [])
    .filter((s: any) => s?.url)
    .map((s: any) => ({ type: String(s.type ?? "link"), url: s.url }));
  const industries = (b.industries?.eic ?? [])
    .filter((i: any) => i?.industry)
    .map((i: any) => ({ industry: i.industry, subindustry: i.subindustry }));
  const links = Object.entries(b.links ?? {})
    .filter(([, url]) => typeof url === "string" && url)
    .map(([key, url]) => ({
      label: LINK_LABELS[key] ?? key,
      url: url as string,
    }));
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
    domain: b.domain ?? "",
    title: b.title ?? b.domain ?? "Unknown",
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
    creditsRemaining: payload?.key_metadata?.credits_remaining,
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
    let parameterSchema = schemaToZod(parameter.schema, MCP_COMPONENT_SCHEMAS);
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
      endpoint.requestBody.schema,
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
        endpoint.requestBody.schema,
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
