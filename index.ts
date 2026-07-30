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
const oauthProvider = createOAuthProvider();
const registeredEndpoints = selectEndpoints(ENDPOINTS);

const server = new MCPServer({
  name: "context",
  title: "Context",
  version: "1.0.0",
  description:
    "Context's public web-context API for software and AI agents: document parsing, monitoring, brand intelligence, web scraping, crawling, structured extraction, product extraction, and search.",
  instructions:
    "This server exposes Context's public web-context and monitoring APIs.\n\n" +
    "Connect your Context account with OAuth. Direct API-key authentication is available for local and private integrations through the Authorization header; never put API keys in URLs.\n\n" +
    "For a polished, visual brand card use `get-brand` (renders a Context-branded UI widget). " +
    "Use the matching tool for parsing, scraping, crawling, structured extraction, search, brand/product intelligence, or monitoring. " +
    "Each call consumes Context credits.",
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
const TRUSTED_OAUTH_REDIRECT_DOMAINS = [
  // Claude web, desktop, mobile, and Cowork
  "claude.ai",
  "claude.com",
  "anthropic.com",
  // ChatGPT connectors and Codex
  "chatgpt.com",
  "openai.com",
  "cursor.com",
  // VS Code and VS Code Insiders web redirects
  "vscode.dev",
  // Le Chat, Copilot Studio, Gemini, n8n, MCPJam
  "mistral.ai",
  "azure-apim.net",
  "cloud.google.com",
  "n8n.cloud",
  "mcpjam.com",
  // The Manufact platform (dashboard, hosted inspector)
  "manufact.com",
];

// Desktop clients finish the flow through a private URL scheme rather than
// HTTPS, so the scheme registration itself is the trust boundary.
const TRUSTED_OAUTH_REDIRECT_SCHEMES = new Set(["cursor:", "vscode:", "warp:"]);

// CLI and editor clients bind an ephemeral loopback port per RFC 8252, so the
// port and path vary per session and cannot be pinned.
const LOOPBACK_REDIRECT_HOSTNAMES = ["localhost", "127.0.0.1", "[::1]"];

function isTrustedOAuthRedirectHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return TRUSTED_OAUTH_REDIRECT_DOMAINS.some(
    (domain) => host === domain || host.endsWith(`.${domain}`),
  );
}

function isAllowedOAuthRedirect(value: string): boolean {
  try {
    const url = new URL(value);
    if (TRUSTED_OAUTH_REDIRECT_SCHEMES.has(url.protocol)) {
      return true;
    }
    if (url.protocol === "https:" && isTrustedOAuthRedirectHost(url.hostname)) {
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
    const upstreamState = new URL(location).searchParams.get("state");
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

server.tool(
  {
    name: "get-brand",
    description:
      "Retrieve live brand intelligence for a domain and render it as a Context-branded brand card: logo, color palette, slogan, description, social profiles, industry and key company links. Use for any 'show me the brand / branding / logo / colors of <company>' request.",
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
    let parameterSchema = schemaToZod(parameter.schema, COMPONENT_SCHEMAS);
    if (parameter.description) {
      parameterSchema = parameterSchema.describe(parameter.description);
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
      COMPONENT_SCHEMAS,
    );
    const bodyProperties = Object.keys(bodyObject?.properties ?? {});
    const canFlattenBody =
      bodyObject && bodyProperties.every((name) => shape[name] === undefined);

    if (canFlattenBody) {
      const required = new Set(bodyObject.required ?? []);
      for (const [name, property] of Object.entries(
        bodyObject.properties ?? {},
      )) {
        const propertySchema = schemaToZod(property, COMPONENT_SCHEMAS);
        shape[name] = required.has(name)
          ? propertySchema
          : propertySchema.optional();
      }
    } else {
      let bodySchema = schemaToZod(
        endpoint.requestBody.schema,
        COMPONENT_SCHEMAS,
      );
      if (endpoint.requestBody.description) {
        bodySchema = bodySchema.describe(endpoint.requestBody.description);
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
