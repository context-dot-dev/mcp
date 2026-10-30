import type { Endpoint } from "../context-endpoints";
import { FEEDBACK_TOOL_DESCRIPTION } from "./feedback";

const API_REFERENCE_TOOL_ORDER = [
  "web-scrape",
  "web-map",
  "web-crawl",
  "web-search",
  "web-answers",
  "brand-retrieve-unified",
  "brand-search",
  "web-styleguide",
  "company-search",
  "people-search",
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
  "list-browser-profiles",
  "get-usage",
  "get-usage-history",
  "submit-feedback",
] as const;

export const CORE_TOOL_NAMES: ReadonlySet<string> = new Set([
  "web-scrape",
  "web-map",
  "web-crawl",
  "web-search",
  "web-answers",
  "get-brand",
  "get-news-search",
  "parse-document",
  "get-usage",
  "submit-feedback",
]);

type ToolOverride = Partial<
  Pick<Endpoint, "title" | "description" | "annotations">
>;

const TOOL_OVERRIDES: Record<string, ToolOverride> = {
  "web-scrape": {
    title: "Scrape a URL",
    description:
      "Scrape one known URL and return any combination of HTML, Markdown, a screenshot, page images, original bytes, CSS-selected fields, relevant highlights, schema-shaped JSON, or product data. Supports browser actions, custom target headers, PDF parsing with optional page markers, deadlines, and zero data retention. Browser clicks can change the target site's state. Prefer responseMode=\"compact\" with formats.highlights and highlightsParams.query for focused research; use full for complete content or metadata. Use web-search when the URL is unknown, web-map for URLs only, web-crawl for linked pages, or submit-batch for large asynchronous jobs.",
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: false,
      openWorldHint: true,
    },
  },
  "parse-document": {
    title: "Parse a file to Markdown",
    description:
      "Send PDF, Office, spreadsheet, presentation, image, code, data, or text file bytes to Context and convert them into clean Markdown for agents, analysis, and RAG. For PDFs, includeNumberedPages starts each page with a `<!-- page N -->` line. Use this when the source is a file rather than a URL. This transformation consumes Context credits but does not alter the original file.",
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
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
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  "web-crawl": {
    title: "Crawl a website",
    description:
      "Start from a URL, follow relevant internal links, and return clean Markdown for multiple pages in one synchronous request. Prefer responseMode=\"compact\" for focused research; use full for complete page content or metadata. Use web-map for URLs only or submit-batch for large jobs that should run asynchronously.",
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  "web-search": {
    title: "Search the live web",
    description:
      "Search the live web and optionally return Markdown or query-relevant highlights for ranked results in the same call. Prefer responseMode=\"compact\" with highlightsOptions.enabled=true for focused research; use full for complete content or metadata. Use this to discover sources, answer current questions, or research a topic when the exact page URL is unknown. When a URL is already known, use web-scrape instead. Use web-answers when the user wants a sourced JSON answer rather than ranked links.",
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
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
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  "get-news-search": {
    title: "Search news",
    description:
      "Search live and historical news. Provide exactly one of: query, a plain-language description of the news you want (ordered by relevance, up to 100 matches); or one company identifier: companyName, domain, ticker with an optional exchange, or isin (set sortBy to newest or relevance). Choose at most one filter category: publisher domain, publisher country, article language, or article type; optionally add a publication date range. Pages hold up to 30 articles; follow next_cursor for more. Use web-search for general web pages rather than news.",
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
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
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  "web-styleguide": {
    title: "Extract a website style guide",
    description:
      "Extract a website's design system. Returns the normalized domain and a styleguide with the color mode, colors, typography, element spacing, shadows, font links, and component styles. Use this to reproduce a brand accurately in generated UI, design audits, or creative workflows.",
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  "brand-search": {
    title: "Search brands",
    description:
      "Search indexed brands by company name or domain and return up to 10 lightweight matches, optionally filtered by country and language. Supports prefix autocomplete, field selection, and typo tolerance. Use this to resolve a company you can already name; use company-search to discover companies from a description. Use brand-retrieve-unified for a full profile or get-brand for a visual domain card.",
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  "company-search": {
    title: "Search companies",
    description:
      "Find companies that match a plain-language description of their industry, location, headcount, founding year, technology, web traffic, or funding, such as {\"query\":\"solar startups in California that raised a Series B\"}, or lookalikes such as {\"query\":\"companies like stripe.com\"}. Optional filters every result must match: filters.countries (headquarters, two-letter codes such as US), filters.employees_min, and filters.employees_max. Returns up to 10 companies, most relevant first, with domain, description, industries, headquarters, headcount, revenue range, funding, and stock symbols. For more, pass next_cursor as cursor with the same query and filters; stop when it is null. Costs 2 credits; searches with no matches are free. Use brand-search to resolve a company you can already name, brand-retrieve-unified for one company's full brand profile, or people-search for people at matching companies.",
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  "people-search": {
    title: "Search people",
    description:
      "Find people who match a plain-language description of their role, employer, industry, location, skills, or experience, such as {\"query\":\"VPs of sales at solar companies in California\"}. Optional filters every result must match: filters.countries (where they live, two-letter codes such as US), filters.years_of_experience_min, and filters.years_of_experience_max. Returns up to count people (default 10; fast mode supports up to 50, ultra up to 10), most relevant first, with name, current title, seniority, employer name and domain, location, profile URLs, skills, and schools. mode defaults to fast, which matches basic criteria such as role, location, or background. Set mode to ultra for complex searches with several criteria: it judges each candidate against every criterion, accepts queries up to 5000 characters instead of 500, adds match.confidence (0 to 1) to each person, and can take up to 30 seconds. For more, pass next_cursor as cursor with the same query, mode, and filters; keep count unchanged and stop when it is null. Request count: 50 when building a larger list. Pages requested with count above 10 must fit 40,000 JSON characters; otherwise the API returns an uncharged size error. Costs 10 credits per nonempty page in fast mode and 50 in ultra mode; searches with no matches are free. Use people-enrich to look up one specific person from an email, profile URL, or name, or company-search to find companies.",
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  "people-enrich": {
    title: "Enrich a person",
    description:
      "Enrich one person from combined identity clues. Returns the best match with an identity score and the person's profile (name, email, location, bio, current role, experience, education, skills, and social and website URLs), or status not_found when no usable candidate exists. Provide a person email, a person-profile social URL, or both first and last name with company, education, or location. Use people-search to find people from a description, or brand-retrieve-unified for company data.",
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  "list-logs": {
    title: "List API request logs",
    description:
      "List recent API requests from the authenticated Context account, newest first. Each entry has the request_id, time, method, path, HTTP status, error code, latency, credits used, API key ID, tags, and whether zero data retention applied. Filter by time, endpoint path, API key ID, HTTP status, error code, tags, or request content. Use errors_only to investigate failures, then pass the request_id from a data entry to get-log for the retained request and response. Defaults to the last 24 hours and does not create another usage-log entry.",
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
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
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  "list-browser-profiles": {
    title: "List browser profiles",
    description:
      "List the authenticated Context account's saved browser profiles, newest first, with each profile ID, optional description, and creation time. Reuse a profile in web-scrape with sharedParams.profile {\"type\":\"existing\",\"profileId\":\"prof_...\"} to scrape behind the same sign-in. Costs no credits.",
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  "get-usage": {
    title: "Get credit usage",
    description:
      "Get the authenticated Context account's credit balance, credits used in the current monthly period, the next refill time and amount, and Auto-Topup status. Use this before large jobs or after a 402 USAGE_EXCEEDED (or legacy 401) to see how many credits are left and when they refill. Use get-usage-history for usage over time. Costs no credits.",
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  "get-usage-history": {
    title: "Get credit usage history",
    description:
      "Get the authenticated Context account's credits and requests over time, bucketed by hour, day, or month (UTC, oldest first, empty buckets as zeros). Set group_by to path, key_id, or status_code to see which endpoints, API keys, or outcomes used credits. Defaults to the last 30 days by day. Use get-usage for the current balance and next refill. Costs no credits.",
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  "submit-feedback": {
    title: "Submit agent feedback",
    description: FEEDBACK_TOOL_DESCRIPTION,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
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
      idempotentHint: true,
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
      idempotentHint: false,
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
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  "update-monitor": {
    title: "Update a monitor",
    description:
      "Update an existing monitor's configuration, including its optional external webhook. Changes affect future runs, changing the target or change-detection definition creates a new baseline, and resuming a paused monitor (status=active) runs it promptly. Use get-monitor first when the current configuration must be preserved.",
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: true,
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
      idempotentHint: true,
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
      idempotentHint: true,
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
      idempotentHint: true,
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
      idempotentHint: true,
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
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  "list-monitor-credit-usage": {
    title: "Get monitor credit usage",
    description:
      "Report credits charged per monitor over a time window, highest first: each entry has the monitor ID, name, credits, and run count, plus the window's total credits. Counts up to the 10,000 most recent runs in the window. Use this for spend analysis and optimization, not for run or change details.",
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  "get-monitor-limits": {
    title: "Get monitor limits",
    description:
      "Retrieve how many monitors the authenticated account has (monitors_used), the most it can have (monitors_limit), and its plan. Use before create-monitor when checking available capacity.",
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
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
      idempotentHint: false,
      openWorldHint: false,
    },
  },
  "list-webhook-deliveries": {
    title: "List webhook deliveries",
    description:
      "List the authenticated account's batch or monitor webhook deliveries, newest first. Each delivery has its ID, event, source, destination URL, status, creation, delivery, next-attempt, and retry-deadline times, and last error. Select the source type and filter by batch, monitor, run, status, or creation time. Use get-webhook-delivery or list-webhook-delivery-attempts for delivery details.",
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  "get-webhook-delivery": {
    title: "Get a webhook delivery",
    description:
      "Retrieve one webhook delivery from the authenticated account: its event and event_id, source batch or monitor run, destination URL, status, creation, delivery, next-attempt, and retry-deadline times, last error, and latest attempt. Use list-webhook-deliveries to find its delivery_id.",
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  "list-webhook-delivery-attempts": {
    title: "List webhook delivery attempts",
    description:
      "List attempts for one webhook delivery, newest first, for troubleshooting. Each attempt has its number, trigger, destination URL, start and completion times, HTTP status, and error. Use retry-webhook-delivery when another delivery attempt is needed.",
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
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
      idempotentHint: false,
      openWorldHint: true,
    },
  },
  "list-changes": {
    title: "List all detected changes",
    description:
      "List detected changes across all monitors in the authenticated account, with monitor, type, time, and tag filters. Each change has its ID, monitor and run IDs, target and detection types, title, summary, URL, detection time, importance, confidence, and the diff, evidence, or URL lists when available. Use this for an account-wide change feed; use list-monitor-changes for one monitor.",
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
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
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  "run-monitor-now": {
    title: "Run a monitor now",
    description:
      "Queue an immediate check for a monitor outside its regular schedule. This starts an asynchronous network run, may advance the monitor's stored comparison baseline, and can notify its configured external webhook when a change is detected. Use get-monitor-run or list-monitor-runs to follow its outcome. Paused monitors return 409 MONITOR_PAUSED. Setting status=active with update-monitor already runs the monitor promptly; don't call run-monitor-now right after resuming or its run may be skipped as superseded.",
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: false,
      openWorldHint: true,
    },
  },
  "submit-batch": {
    title: "Submit a scraping batch",
    description:
      "Start an asynchronous job for up to 100,000 pages. Set input.mode to scrape with data.urls, or crawl with data.source. Use data.formats and the same format parameters as web-scrape for Scrape Anything outputs; legacy data.format markdown/html also works. Browser actions can change the target site's state. When webhook.url is supplied, Context sends batch completion, failure, or cancellation events there. The call returns a batch ID and credit reservation, not page results; use get-batch until it settles, then get-batch-results. Supply an Idempotency-Key when a submission may be retried.",
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: false,
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
      idempotentHint: true,
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
      idempotentHint: true,
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
      idempotentHint: true,
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
      idempotentHint: true,
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
      idempotentHint: true,
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

// Scraping tools merged into web-scrape, web-map, and web-crawl on 2026-09-26.
// Clients cache tool lists and keep calling these names, so they stay callable
// but are left out of tools/list. Annotations are the ones they were published
// with: the scrapers that accept browser actions require the api.write scope.
export const LEGACY_TOOL_ANNOTATIONS: Readonly<
  Record<string, Endpoint["annotations"]>
> = {
  "web-scrape-html": { readOnlyHint: false, destructiveHint: true, openWorldHint: true },
  "web-scrape-markdown": { readOnlyHint: false, destructiveHint: true, openWorldHint: true },
  "web-scrape-images": { readOnlyHint: false, destructiveHint: true, openWorldHint: true },
  "web-scrape-sitemap": { readOnlyHint: true, destructiveHint: false, openWorldHint: true },
  "web-extract": { readOnlyHint: true, destructiveHint: false, openWorldHint: true },
  "web-screenshot": { readOnlyHint: true, destructiveHint: false, openWorldHint: true },
};

export function selectEndpoints(endpoints: Endpoint[]): Endpoint[] {
  const endpointsByName = new Map(
    endpoints.map((endpoint) => [endpoint.name, endpoint]),
  );
  return API_REFERENCE_TOOL_ORDER.flatMap((name) => {
    const endpoint = endpointsByName.get(name);
    return endpoint ? [applyToolOverride(endpoint)] : [];
  });
}
