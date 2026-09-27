import type { Endpoint } from "../context-endpoints";

const API_REFERENCE_TOOL_ORDER = [
  "web-scrape",
  "web-map",
  "web-crawl",
  "web-search",
  "web-answers",
  "brand-retrieve-unified",
  "brand-search",
  "web-styleguide",
  "people-enrich",
  "get-news-search",
  "parse-document",
  "submit-batch",
  "list-batches",
  "get-batch",
  "get-batch-results",
  "cancel-batch",
  "delete-batch",
  "create-monitor",
  "list-monitors",
  "get-monitor",
  "update-monitor",
  "delete-monitor",
  "get-monitor-limits",
  "list-monitor-credit-usage",
  "run-monitor-now",
  "list-monitor-runs",
  "get-monitor-run",
  "list-account-runs",
  "list-monitor-changes",
  "get-change",
  "list-changes",
  "rotate-monitor-webhook-secret",
  "list-webhook-deliveries",
  "get-webhook-delivery",
  "list-webhook-delivery-attempts",
  "retry-webhook-delivery",
  "list-logs",
  "get-log",
] as const;

type ToolOverride = Partial<
  Pick<Endpoint, "title" | "description" | "annotations">
>;

const TOOL_OVERRIDES: Record<string, ToolOverride> = {
  "web-scrape": {
    title: "Scrape a URL",
    description:
      "Scrape one known URL and return any combination of HTML, Markdown, a screenshot, page images, original bytes, CSS-selected fields, relevant highlights, schema-shaped JSON, or product data. Supports browser actions, custom target headers, PDF parsing, deadlines, and zero data retention. Browser clicks can change the target site's state. Use web-search when the URL is unknown, web-map for URLs only, web-crawl for linked pages, or submit-batch for large asynchronous jobs.",
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      openWorldHint: true,
    },
  },
  "parse-document": {
    title: "Parse a file to Markdown",
    description:
      "Send PDF, Office, spreadsheet, presentation, image, code, data, or text file bytes to Context and convert them into clean Markdown for agents, analysis, and RAG. Use this when the source is a file rather than a URL. This transformation consumes Context credits but does not alter the original file.",
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      openWorldHint: false,
    },
  },
  "web-map": {
    title: "Map URLs",
    description:
      "Map a website's URLs using Context's index, with available page titles, descriptions, keywords, and languages. Filter by URL pattern or search phrase without retrieving every page body. Use web-scrape for one page, web-crawl for content from several pages, or submit-batch for large asynchronous collection.",
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: true,
    },
  },
  "web-crawl": {
    title: "Crawl a website",
    description:
      "Start from a URL, follow relevant internal links, and return clean Markdown for multiple pages in one synchronous request. Use this for focused multi-page research when results are needed immediately. Use web-map for URLs only or submit-batch for large jobs that should run asynchronously.",
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: true,
    },
  },
  "web-search": {
    title: "Search the live web",
    description:
      "Search the live web and optionally scrape ranked results to Markdown in the same call. Use this to discover sources, answer current questions, or research a topic when the exact page URL is unknown. When a URL is already known, use web-scrape instead. Use web-answers when the user wants a sourced JSON answer rather than ranked links.",
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: true,
    },
  },
  "web-answers": {
    title: "Answer a web research question",
    description:
      "Research the live web and return a sourced answer in the exact JSON shape requested. Use fast for focused questions that should finish quickly or ultra for deeper research. Use web-search when ranked links or snippets are enough, or web-scrape with jsonParams when the source URL and extraction schema are already known.",
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: true,
    },
  },
  "get-news-search": {
    title: "Search company news",
    description:
      "Search live and historical news for one company, identified by exactly one name, domain, ticker with an optional exchange, or ISIN. Choose at most one filter category: publisher domain, publisher country, article language, or article type; optionally add a publication date range. Paginate results with stable story IDs and verified entity relevance. Use web-search for broader topics or news that is not tied to one company.",
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: true,
    },
  },
  "brand-retrieve-unified": {
    title: "Get brand intelligence",
    description:
      "Retrieve machine-readable company and brand intelligence—logos, colors, descriptions, socials, links, industry, location, and more—from one domain, company name, work email, stock ticker, ISIN, transaction descriptor, or direct URL. Use get-brand for a visual card from a domain; use this tool for raw structured data or non-domain lookups.",
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: true,
    },
  },
  "web-styleguide": {
    title: "Extract a website style guide",
    description:
      "Extract a website's design system, including colors, typography, spacing, shadows, and interface cues. Use this to reproduce a brand accurately in generated UI, design audits, or creative workflows.",
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: true,
    },
  },
  "brand-search": {
    title: "Search brands",
    description:
      "Search indexed brands by company name or domain and return up to 10 lightweight matches. Supports prefix autocomplete, field selection, and typo tolerance. Use brand-retrieve-unified for a full profile or get-brand for a visual domain card.",
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: true,
    },
  },
  "people-enrich": {
    title: "Enrich a person",
    description:
      "Enrich one person from combined identity clues and return a profile with an identity match score. Provide a person email, a person-profile social URL, or both first and last name with company, education, or location. Use brand-retrieve-unified for company data.",
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: true,
    },
  },
  "list-logs": {
    title: "List API request logs",
    description:
      "List recent API requests from the authenticated Context account, newest first. Filter by time, endpoint path, API key ID, HTTP status, error code, tags, or request content. Use errors_only to investigate failures, then pass the request_id from a data entry to get-log for the retained request and response. Defaults to the last 24 hours and does not create another usage-log entry.",
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: false,
    },
  },
  "get-log": {
    title: "Get an API request log",
    description:
      "Retrieve one API request from the authenticated Context account by the request_id in a list-logs data entry, including its redacted retained input, response, timing, credits, status, and user agent. Zero-data-retention requests contain metadata but no retained input or response.",
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: false,
    },
  },
  "list-monitors": {
    title: "List monitors",
    description:
      "List recurring monitors in the authenticated Context account, with search, status, target-type, tag, and cursor filters. Use this to find a monitor ID before reading, updating, running, or deleting it; this does not return run history or detected changes.",
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: false,
    },
  },
  "create-monitor": {
    title: "Create a recurring monitor",
    description:
      "Create a recurring monitor for a page, sitemap, or structured extraction target. Use this when the user wants ongoing change detection, not a one-time scrape. Configure the target, schedule, change detection, and optional webhook; Context immediately runs an initial baseline and returns the monitor.",
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      openWorldHint: true,
    },
  },
  "get-monitor": {
    title: "Get monitor configuration",
    description:
      "Retrieve one monitor's configuration, status, schedule, target, change-detection rules, webhook settings, and current baseline by ID. This reads the monitor definition; use list-monitor-runs for execution history or list-monitor-changes for detected changes.",
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: false,
    },
  },
  "update-monitor": {
    title: "Update a monitor",
    description:
      "Update an existing monitor's configuration, including its optional external webhook. Changes affect future runs, and changing the target or change-detection definition creates a new baseline. Use get-monitor first when the current configuration must be preserved.",
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      openWorldHint: true,
    },
  },
  "delete-monitor": {
    title: "Delete a monitor",
    description:
      "Permanently delete a monitor and stop all future scheduled runs. This cannot be undone; use only when the user explicitly wants the monitor removed.",
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      openWorldHint: false,
    },
  },
  "list-monitor-runs": {
    title: "List runs for a monitor",
    description:
      "List the execution history of one monitor, including run status, timing, credits, and whether each run detected a change. Use get-monitor-run for the full details of one run.",
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: false,
    },
  },
  "get-monitor-run": {
    title: "Get a monitor run",
    description:
      "Retrieve one run for a monitor, including lifecycle status, timing, credits charged, and the detected change when present. Use after list-monitor-runs or run-monitor-now when the full outcome of one check is needed.",
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: false,
    },
  },
  "list-monitor-changes": {
    title: "List changes for a monitor",
    description:
      "List changes detected by one monitor, with time and tag filters. Use this for a monitor-specific change history, then call get-change when full diffs, evidence, confidence, and importance are needed.",
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: false,
    },
  },
  "list-account-runs": {
    title: "List all monitor runs",
    description:
      "List monitor runs across the authenticated account. Use this for an organization-wide activity feed or operational overview; use list-monitor-runs when only one monitor matters.",
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: false,
    },
  },
  "list-monitor-credit-usage": {
    title: "Get monitor credit usage",
    description:
      "Report credits charged by monitor over a time window, ordered by the monitors using the most credits. Use this for spend analysis and optimization, not for run or change details.",
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: false,
    },
  },
  "get-monitor-limits": {
    title: "Get monitor limits",
    description:
      "Retrieve the authenticated account's current monitor count and maximum allowed monitors. Use before create-monitor when checking available capacity.",
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: false,
    },
  },
  "rotate-monitor-webhook-secret": {
    title: "Rotate a monitor webhook secret",
    description:
      "Replace a monitor's webhook signing secret and return its updated configuration. The previous secret stops signing deliveries immediately; update the webhook receiver to use the returned secret. Requires a monitor with a configured webhook URL.",
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      openWorldHint: false,
    },
  },
  "list-webhook-deliveries": {
    title: "List webhook deliveries",
    description:
      "List the authenticated account's batch or monitor webhook deliveries, newest first. Select the source type and filter by batch, monitor, run, status, or creation time. Use get-webhook-delivery or list-webhook-delivery-attempts for delivery details.",
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: false,
    },
  },
  "get-webhook-delivery": {
    title: "Get a webhook delivery",
    description:
      "Retrieve one webhook delivery from the authenticated account, including its status and latest attempt. Use list-webhook-deliveries to find its delivery_id.",
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: false,
    },
  },
  "list-webhook-delivery-attempts": {
    title: "List webhook delivery attempts",
    description:
      "List attempts for one webhook delivery, newest first, with delivery outcomes for troubleshooting. Use retry-webhook-delivery when another delivery attempt is needed.",
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: false,
    },
  },
  "retry-webhook-delivery": {
    title: "Retry a webhook delivery",
    description:
      "Queue another attempt for a webhook delivery created within the last seven days. This can send the event to its configured external receiver again. Use get-webhook-delivery or list-webhook-delivery-attempts to inspect the outcome.",
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      openWorldHint: true,
    },
  },
  "list-changes": {
    title: "List all detected changes",
    description:
      "List detected changes across all monitors in the authenticated account, with monitor, type, time, and tag filters. Use this for an account-wide change feed; use list-monitor-changes for one monitor.",
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: false,
    },
  },
  "get-change": {
    title: "Get a detected change",
    description:
      "Retrieve one detected change with full text diffs, added or removed URLs, semantic evidence, confidence, importance, and the current snapshot when available. Use after either change-listing tool when the complete evidence is needed.",
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: false,
    },
  },
  "run-monitor-now": {
    title: "Run a monitor now",
    description:
      "Queue an immediate check for a monitor outside its regular schedule. This starts an asynchronous network run, may advance the monitor's stored comparison baseline, and can notify its configured external webhook when a change is detected. Use get-monitor-run or list-monitor-runs to follow its outcome.",
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      openWorldHint: true,
    },
  },
  "submit-batch": {
    title: "Submit a large scraping batch",
    description:
      "Start an asynchronous job to scrape up to 25,000 supplied URLs or crawl a large website as Markdown or HTML. Use this when a synchronous scrape or crawl would be too large. When webhookUrl is supplied, Context sends a completion request to that external endpoint. The call returns a batch ID, not page results; use get-batch until it settles, then get-batch-results. Supply an Idempotency-Key when a submission may be retried.",
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      openWorldHint: true,
    },
  },
  "list-batches": {
    title: "List scraping batches",
    description:
      "List asynchronous scraping batches from newest to oldest, with status, search, tag, and cursor filters. Use this to find a batch ID or review account activity; it does not return page-level results.",
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: false,
    },
  },
  "get-batch": {
    title: "Get batch status",
    description:
      "Retrieve one batch's status, progress, timing, credit accounting, errors, and download links when complete. Poll this after submit-batch; use get-batch-results only after the batch has completed.",
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: false,
    },
  },
  "get-batch-results": {
    title: "Get batch results",
    description:
      "Page through the successful and failed URL results of a completed batch as JSON. Use the returned cursor to continue when more results exist. For progress before completion, use get-batch instead.",
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: false,
    },
  },
  "cancel-batch": {
    title: "Cancel a batch",
    description:
      "Stop a queued or running batch from starting additional pages. Work already in progress finishes and unused reserved credits are refunded after settlement. This does not delete stored results; use only when the user explicitly wants processing stopped.",
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      openWorldHint: false,
    },
  },
  "delete-batch": {
    title: "Delete a batch",
    description:
      "Permanently delete a completed, cancelled, or failed batch and its stored results. Active batches must be cancelled and allowed to settle first. This cannot be undone; use only when the user explicitly requests deletion.",
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      openWorldHint: false,
    },
  },
};

function applyToolOverride(endpoint: Endpoint): Endpoint {
  const override = TOOL_OVERRIDES[endpoint.name];
  return {
    ...endpoint,
    ...override,
  };
}

export function selectEndpoints(endpoints: Endpoint[]): Endpoint[] {
  const endpointsByName = new Map(
    endpoints.map((endpoint) => [endpoint.name, endpoint]),
  );
  return API_REFERENCE_TOOL_ORDER.flatMap((name) => {
    const endpoint = endpointsByName.get(name);
    return endpoint ? [applyToolOverride(endpoint)] : [];
  });
}
