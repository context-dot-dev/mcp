import { McpUseProvider, useWidget, type WidgetMetadata } from "mcp-use/react";
import React from "react";
import { propSchema, type ContextBrandProps } from "./types";
import { LOGO } from "./logo";

export const widgetMetadata: WidgetMetadata = {
  description:
    "Context brand card: a company's logo, brand color palette, slogan, description, social profiles, industry and key links, pulled live from Context's Brand Intelligence API.",
  props: propSchema,
  exposeAsTool: false,
  metadata: {
    prefersBorder: false,
    invoking: "Querying Context...",
    invoked: "Brand loaded",
    // Brand logos are served from Context's media CDN.
    csp: { resourceDomains: ["https://media.brand.dev"] },
  },
};

const CONTEXT_BLUE = "#2564ea";

const FONT =
  'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, system-ui, sans-serif';
const MONO = 'ui-monospace, SFMono-Regular, Menlo, "Roboto Mono", monospace';

const C = {
  bg: "#FFFFFF",
  surface: "#F7F8FA",
  border: "#ECEEF2",
  text: "#0B1020",
  muted: "#5B6472",
  faint: "#9AA1AD",
} as const;

const SOCIAL_LABEL: Record<string, string> = {
  x: "X", twitter: "X", linkedin: "LinkedIn", facebook: "Facebook",
  instagram: "Instagram", youtube: "YouTube", github: "GitHub", tiktok: "TikTok",
};

function readableOn(hex: string): string {
  const h = hex.replace("#", "");
  if (h.length < 6) return "#fff";
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.6 ? "#0B1020" : "#FFFFFF";
}

function Pill({ children, href }: { children: React.ReactNode; href?: string }) {
  const inner = (
    <span
      style={{
        fontSize: 12, color: C.muted, background: C.surface,
        border: `1px solid ${C.border}`, borderRadius: 999, padding: "4px 10px",
        whiteSpace: "nowrap", display: "inline-block",
      }}
    >
      {children}
    </span>
  );
  return href ? (
    <a href={href} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
      {inner}
    </a>
  ) : inner;
}

const ContextBrand: React.FC = () => {
  const { props, isPending } = useWidget<ContextBrandProps>();

  if (isPending) {
    return (
      <McpUseProvider autoSize>
        <div style={{ fontFamily: FONT, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20, color: C.muted }}>
          Querying Context…
        </div>
      </McpUseProvider>
    );
  }

  const { brand } = props;
  const primary = brand.colors[0]?.hex || CONTEXT_BLUE;

  return (
    <McpUseProvider autoSize>
      <div style={{ fontFamily: FONT, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden", color: C.text, WebkitFontSmoothing: "antialiased" }}>
        {/* Accent bar in the brand's primary color */}
        <div style={{ height: 6, background: `linear-gradient(90deg, ${primary}, ${brand.colors[1]?.hex || primary})` }} />

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "18px 20px 14px" }}>
          <div style={{ width: 56, height: 56, borderRadius: 12, background: "#fff", border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
            {brand.logo ? (
              <img src={brand.logo} alt={brand.title} width={56} height={56} style={{ objectFit: "contain", width: "100%", height: "100%" }} />
            ) : (
              <span style={{ fontSize: 22, fontWeight: 800, color: primary }}>{brand.title.charAt(0)}</span>
            )}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 19, fontWeight: 750, lineHeight: 1.15 }}>{brand.title}</div>
            <a href={`https://${brand.domain}`} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: primary, textDecoration: "none", fontFamily: MONO }}>
              {brand.domain}
            </a>
            {brand.slogan && <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>{brand.slogan}</div>}
          </div>
        </div>

        {/* Description */}
        {brand.description && (
          <div style={{ padding: "0 20px 14px", fontSize: 13.5, lineHeight: 1.5, color: C.muted }}>
            {brand.description.length > 320 ? brand.description.slice(0, 317) + "…" : brand.description}
          </div>
        )}

        {/* Color palette */}
        {brand.colors.length > 0 && (
          <div style={{ padding: "0 20px 16px" }}>
            <div style={{ fontSize: 11, letterSpacing: 0.5, color: C.faint, fontWeight: 700, marginBottom: 8 }}>BRAND COLORS</div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {brand.colors.map((col) => (
                <div key={col.hex} style={{ borderRadius: 10, overflow: "hidden", border: `1px solid ${C.border}`, width: 104 }}>
                  <div style={{ height: 44, background: col.hex, display: "flex", alignItems: "flex-end", justifyContent: "flex-end", padding: 6 }}>
                    <span style={{ fontSize: 10.5, fontFamily: MONO, color: readableOn(col.hex), opacity: 0.9 }}>{col.hex}</span>
                  </div>
                  {col.name && <div style={{ fontSize: 11, color: C.muted, padding: "5px 8px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{col.name}</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Meta rows */}
        <div style={{ padding: "0 20px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
          {brand.industries.length > 0 && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
              {brand.industries.map((i, idx) => (
                <Pill key={idx}>{i.subindustry ? `${i.industry} · ${i.subindustry}` : i.industry}</Pill>
              ))}
            </div>
          )}
          {(brand.socials.length > 0 || brand.links.length > 0) && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
              {brand.socials.map((s, idx) => (
                <Pill key={`s${idx}`} href={s.url}>{SOCIAL_LABEL[s.type.toLowerCase()] || s.type}</Pill>
              ))}
              {brand.links.map((l, idx) => (
                <Pill key={`l${idx}`} href={l.url}>{l.label}</Pill>
              ))}
            </div>
          )}
          {(brand.location || brand.email || brand.stockTicker) && (
            <div style={{ fontSize: 12.5, color: C.muted, display: "flex", gap: 14, flexWrap: "wrap" }}>
              {brand.location && <span>📍 {brand.location}</span>}
              {brand.email && <span>✉ {brand.email}</span>}
              {brand.stockTicker && <span style={{ fontFamily: MONO }}>📈 {brand.stockTicker}</span>}
            </div>
          )}
        </div>

        {/* Footer: powered by Context */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", borderTop: `1px solid ${C.border}`, background: C.surface }}>
          <img src={LOGO} alt="Context" width={16} height={16} style={{ borderRadius: 4 }} />
          <span style={{ fontSize: 11.5, color: C.faint }}>Powered by Context</span>
          {typeof brand.creditsRemaining === "number" && (
            <span style={{ marginLeft: "auto", fontSize: 11, color: C.faint, fontFamily: MONO }}>{brand.creditsRemaining} credits left</span>
          )}
        </div>
      </div>
    </McpUseProvider>
  );
};

export default ContextBrand;
