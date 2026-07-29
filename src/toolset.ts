import type { Endpoint } from "../context-endpoints";

const RECOMMENDED_CORE_TOOLS = new Set([
  "parse-document",
  "web-scrape-markdown",
  "web-scrape-images",
  "web-crawl",
  "web-extract",
  "web-search",
  "web-competitors",
  "people-retrieve",
  "brand-retrieve",
  "web-styleguide",
  "web-screenshot",
  "brand-ai-query",
  "brand-ai-product",
  "brand-ai-products",
]);

export function selectEndpoints(
  endpoints: Endpoint[],
  toolset = process.env.CONTEXT_MCP_TOOLSET
): Endpoint[] {
  if (toolset === "full") {
    return endpoints;
  }

  return endpoints.filter(
    (endpoint) =>
      RECOMMENDED_CORE_TOOLS.has(endpoint.name) ||
      endpoint.path.startsWith("/monitors")
  );
}
