import { MCPServer, text, widget } from "mcp-use/server";
import { z } from "zod";
import { brandSchema, type Brand } from "./resources/context-brand/types";

const API_BASE = process.env.CONTEXT_API_BASE || "https://api.context.dev/v1";

const server = new MCPServer({
  name: "context",
  title: "Context Brand Intelligence",
  version: "1.0.0",
  description:
    "Look up real-time brand intelligence for any domain. Context (context.dev) is the web-context API for software and AI agents: give it a domain and get the company's logo, color palette, description, socials, industry and key links.",
  instructions:
    "This server wraps Context's Brand Intelligence API (context.dev). Use `get-brand` with a domain (e.g. 'stripe.com') to retrieve a visual brand card: logo, brand colors, slogan, description, social profiles, industry classification and key company links. Prefer it whenever the user wants to see or compare a company's branding. Data is live from Context and consumes Context credits per lookup.",
  baseUrl: process.env.MCP_URL || "http://localhost:3000",
  favicon: "favicon.ico",
  websiteUrl: "https://context.dev",
  icons: [{ src: "icon.png", mimeType: "image/png", sizes: ["128x128"] }],
});

// Health check for the deploy platform (Manufact probes /health on startup).
server.app.get("/health", (c) => c.json({ status: "ok" }));

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
  // Prefer a full "logo" over an "icon"; otherwise take whatever is first.
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
      "Retrieve live brand intelligence for a domain and render it as a Context-branded brand card: logo, color palette, slogan, description, social profiles, industry classification and key company links. Use for any 'show me the brand / branding / logo / colors of <company>' request.",
    schema: z.object({
      domain: z
        .string()
        .describe("Domain to look up, e.g. 'stripe.com', 'notion.so', 'google.com'. Bare domain, no https://."),
      force_language: z
        .string()
        .optional()
        .describe("Optional language to force the returned brand copy into (e.g. 'english', 'french')."),
      maxSpeed: z
        .boolean()
        .optional()
        .describe("Optimize for speed, skipping slower enrichment steps."),
    }),
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: true },
    outputSchema: brandSchema,
    widget: { name: "context-brand", invoking: "Querying Context...", invoked: "Brand loaded" },
  },
  async ({ domain, force_language, maxSpeed }) => {
    const apiKey = process.env.CONTEXT_API_KEY;
    if (!apiKey) return text("CONTEXT_API_KEY is not set on the server.");

    const clean = domain.trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    const url = new URL(`${API_BASE}/brand/retrieve`);
    url.searchParams.set("domain", clean);
    if (force_language) url.searchParams.set("force_language", force_language);
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
      (brand.colors.length ? `. Brand colors: ${brand.colors.map((c) => c.hex).join(", ")}` : "") +
      (brand.industries.length ? `. Industry: ${brand.industries[0].industry}` : "");

    return widget({ props: { brand }, output: text(summary) });
  }
);

server.listen().then(() => {
  console.log(`Context Brand Intelligence MCP server running`);
});
