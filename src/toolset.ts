import type { Endpoint } from "../context-endpoints";

const PUBLIC_API_TOOLS = new Set([
  "parse-document",
  "web-scrape-html",
  "web-scrape-markdown",
  "web-scrape-images",
  "web-scrape-sitemap",
  "web-crawl",
  "web-extract",
  "web-search",
  "brand-retrieve-unified",
  "web-styleguide",
  "web-fonts",
  "web-screenshot",
  "web-naics",
  "web-sic",
  "brand-ai-product",
  "brand-ai-products",
  "utility-prefetch",
  "list-monitors",
  "create-monitor",
  "get-monitor",
  "update-monitor",
  "delete-monitor",
  "list-monitor-runs",
  "get-monitor-run",
  "list-monitor-changes",
  "list-account-runs",
  "list-monitor-credit-usage",
  "list-changes",
  "get-change",
  "run-monitor-now",
  "rotate-monitor-webhook-secret",
]);

const PUBLIC_ENDPOINTS_MISSING_FROM_OPENAPI: Endpoint[] = [
  {
    name: "get-monitor-run",
    title: "Retrieve a monitor run",
    method: "GET",
    path: "/monitors/{monitor_id}/runs/{run_id}",
    description:
      "Retrieve a monitor run — Fetch a single run by id, including its lifecycle status, timing, credits charged, and any change detected.",
    parameters: [
      {
        name: "monitor_id",
        in: "path",
        required: true,
        description: "The monitor ID.",
        schema: { type: "string" },
      },
      {
        name: "run_id",
        in: "path",
        required: true,
        description: "The monitor run ID.",
        schema: { type: "string" },
      },
    ],
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: true,
    },
  },
];

export function selectEndpoints(endpoints: Endpoint[]): Endpoint[] {
  const selectedEndpoints = endpoints.filter((endpoint) =>
    PUBLIC_API_TOOLS.has(endpoint.name)
  );
  const selectedNames = new Set(
    selectedEndpoints.map((endpoint) => endpoint.name)
  );
  return [
    ...selectedEndpoints,
    ...PUBLIC_ENDPOINTS_MISSING_FROM_OPENAPI.filter(
      (endpoint) => !selectedNames.has(endpoint.name)
    ),
  ];
}
