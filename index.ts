import { MCPServer, object, text, widget, getRequestContext } from "mcp-use/server";
import { z } from "zod";
import { brandSchema, type Brand } from "./resources/context-brand/types";
import { ENDPOINTS, type Endpoint, type EndpointParam } from "./context-endpoints";

const API_BASE = process.env.CONTEXT_API_BASE || "https://api.context.dev/v1";

const server = new MCPServer({
  name: "context",
  title: "Context",
  version: "1.0.0",
  description:
    "The full Context (context.dev) web-context API for software and AI agents: brand intelligence (logos, colors, descriptions, socials), web scraping (markdown, HTML, images, screenshots, sitemaps, crawl), structured extraction, product extraction, web search, competitor discovery and NAICS/SIC industry classification — for any domain.",
  instructions:
    "This server exposes the complete Context API (context.dev).\n\n" +
    "AUTH: each call needs a Context API key. Provide it in one of three ways (checked in this order): " +
    "(1) an `api_key` query param on the MCP URL — e.g. https://context.run.mcp-use.com/mcp?api_key=YOUR_KEY, " +
    "(2) an `Authorization: Bearer YOUR_KEY` header, or (3) the server's own configured key.\n\n" +
    "For a polished, visual brand card use `get-brand` (renders a Context-branded UI widget). " +
    "For everything else use the matching tool: `web-scrape-markdown` / `web-scrape-html` / `web-scrape-images` / " +
    "`web-screenshot` / `web-scrape-sitemap` / `web-crawl` (site -> markdown), `web-extract` (structured data via JSON schema), " +
    "`web-search`, `web-competitors`, `web-styleguide`, `web-fonts`, `web-naics` / `web-sic` (industry codes), " +
    "`brand-retrieve*` (by domain/name/email/ticker/isin/simplified), `brand-transaction-identifier`, " +
    "`brand-ai-product` / `brand-ai-products` / `brand-ai-query`, and `people-retrieve`. " +
    "Each call consumes Context credits.",
  baseUrl: process.env.MCP_URL || "http://localhost:3000",
  favicon: "favicon.ico",
  websiteUrl: "https://context.dev",
  icons: [{ src: "icon.png", mimeType: "image/png", sizes: ["128x128"] }],
});

// Health check for the deploy platform (Manufact probes /health on startup).
server.app.get("/health", (c) => c.json({ status: "ok" }));

/**
 * Resolve the Context API key for the current request, in priority order:
 *   1. `?api_key=` query param on the MCP connection URL
 *   2. `Authorization: Bearer <key>` (or `x-api-key`) header
 *   3. the server's own CONTEXT_API_KEY env var (fallback / demo key)
 * This lets each user bring their own key by appending `?api_key=...` to the MCP URL.
 */
function resolveApiKey(): string | undefined {
  const c = getRequestContext();
  const fromQuery = c?.req?.query?.("api_key");
  const auth = c?.req?.header?.("authorization");
  const bearer = auth && /^bearer\s+/i.test(auth) ? auth.replace(/^bearer\s+/i, "").trim() : undefined;
  const xKey = c?.req?.header?.("x-api-key");
  return fromQuery || bearer || xKey || process.env.CONTEXT_API_KEY;
}

const NO_KEY_MSG =
  "No Context API key found. Append `?api_key=YOUR_KEY` to the MCP server URL, send an " +
  "`Authorization: Bearer YOUR_KEY` header, or set CONTEXT_API_KEY on the server.";

// ---------------------------------------------------------------------------
// 1) Branded UI: get-brand renders a Context brand card (logo, colors, ...)
// ---------------------------------------------------------------------------

const LINK_LABELS: Record<string, string> = {
  careers: "Careers", privacy: "Privacy", terms: "Terms",
  contact: "Contact", blog: "Blog", pricing: "Pricing",
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
    .map(([key, url]) => ({ label: LINK_LABELS[key] ?? key, url: url as string }));
  const addr = b.address ?? {};
  const location =
    [addr.city, addr.state_code || addr.state_province, addr.country_code || addr.country]
      .filter(Boolean).join(", ") || undefined;
  const stockTicker = b.stock?.ticker
    ? [b.stock.exchange, b.stock.ticker].filter(Boolean).join(": ")
    : undefined;
  return {
    domain: b.domain ?? "", title: b.title ?? b.domain ?? "Unknown",
    slogan: b.slogan || undefined, description: b.description || undefined,
    logo: bestLogo, colors, socials, industries, links,
    email: b.email || undefined, phone: b.phone || undefined,
    location, stockTicker, creditsRemaining: payload?.key_metadata?.credits_remaining,
  };
}

server.tool(
  {
    name: "get-brand",
    description:
      "Retrieve live brand intelligence for a domain and render it as a Context-branded brand card: logo, color palette, slogan, description, social profiles, industry and key company links. Use for any 'show me the brand / branding / logo / colors of <company>' request.",
    schema: z.object({
      domain: z.string().describe("Domain to look up, e.g. 'stripe.com'. Bare domain, no https://."),
      maxSpeed: z.boolean().optional().describe("Optimize for speed, skipping slower enrichment steps."),
    }),
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: true },
    outputSchema: brandSchema,
    widget: { name: "context-brand", invoking: "Querying Context...", invoked: "Brand loaded" },
  },
  async ({ domain, maxSpeed }) => {
    const apiKey = resolveApiKey();
    if (!apiKey) return text(NO_KEY_MSG);
    const clean = domain.trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    const url = new URL(`${API_BASE}/brand/retrieve`);
    url.searchParams.set("domain", clean);
    if (maxSpeed) url.searchParams.set("maxSpeed", "true");
    let res: Response;
    try {
      res = await fetch(url, { headers: { Authorization: `Bearer ${apiKey}` } });
    } catch (e: any) {
      return text(`Failed to reach Context API: ${e?.message ?? e}`);
    }
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = (payload as any)?.message || `Context API returned ${res.status}`;
      return text(`${msg} (domain: ${clean})`);
    }
    const brand = normalizeBrand(payload);
    const summary =
      `${brand.title} (${brand.domain})` +
      (brand.slogan ? ` — ${brand.slogan}` : "") +
      (brand.colors.length ? `. Colors: ${brand.colors.map((c) => c.hex).join(", ")}` : "");
    return widget({ props: { brand }, output: text(summary) });
  }
);

// ---------------------------------------------------------------------------
// 2) Full API: register every Context endpoint as a tool (generic).
// ---------------------------------------------------------------------------

function zForParam(p: EndpointParam): z.ZodTypeAny {
  let s: z.ZodTypeAny;
  switch (p.type) {
    case "integer":
    case "number":
      s = z.number();
      break;
    case "boolean":
      s = z.boolean();
      break;
    case "array":
      s = z.array(p.items === "number" || p.items === "integer" ? z.number() : z.string());
      break;
    case "object":
      s = z.record(z.string(), z.any());
      break;
    default:
      s = z.string();
  }
  if (p.desc) s = s.describe(p.desc);
  return p.required ? s : s.optional();
}

async function callContext(ep: Endpoint, args: Record<string, any>) {
  const apiKey = resolveApiKey();
  if (!apiKey) return text(NO_KEY_MSG);

  const url = new URL(API_BASE + ep.path);
  for (const p of ep.query) {
    const v = args[p.name];
    if (v === undefined || v === null) continue;
    if (Array.isArray(v)) v.forEach((x) => url.searchParams.append(p.name, String(x)));
    else if (typeof v === "object") url.searchParams.set(p.name, JSON.stringify(v));
    else url.searchParams.set(p.name, String(v));
  }

  const init: RequestInit = { method: ep.method, headers: { Authorization: `Bearer ${apiKey}` } };
  if (ep.method !== "GET") {
    const body: Record<string, any> = {};
    for (const p of ep.body) if (args[p.name] !== undefined) body[p.name] = args[p.name];
    (init.headers as Record<string, string>)["Content-Type"] = "application/json";
    init.body = JSON.stringify(body);
  }

  let res: Response;
  try {
    res = await fetch(url, init);
  } catch (e: any) {
    return text(`Request to Context failed: ${e?.message ?? e}`);
  }
  const raw = await res.text();
  let data: any;
  try {
    data = JSON.parse(raw);
  } catch {
    data = { raw };
  }
  if (!res.ok) {
    return text(`Context API ${res.status}: ${data?.message || raw.slice(0, 400)}`);
  }
  return object(data);
}

for (const ep of ENDPOINTS as Endpoint[]) {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const p of [...ep.query, ...ep.body]) shape[p.name] = zForParam(p);
  server.tool(
    {
      name: ep.name,
      description: ep.description,
      schema: z.object(shape),
      annotations: { readOnlyHint: ep.method === "GET", destructiveHint: false, openWorldHint: true },
    },
    async (args) => callContext(ep, args as Record<string, any>)
  );
}

server.listen().then(() => {
  console.log(`Context MCP server running — ${ENDPOINTS.length + 1} tools`);
});
