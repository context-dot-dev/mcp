import type { JsonSchema } from "../context-endpoints";

// Output schemas for tools whose successful results are always JSON objects.
// Clients validate structuredContent against them, including account-limit
// errors, and responses over the MCP size limit lose fields, so no field is
// required and unlisted fields, such as request_id, are allowed. Counts are
// numbers so fractional credits validate, and fields that can be null are
// untyped because their descriptions say when they are null. web-search,
// web-scrape, and web-crawl have none: in compact mode they return only text.
export const OUTPUT_SCHEMAS: Readonly<Record<string, JsonSchema>> = {
  "web-map": output({
    domain: text("Domain that was mapped."),
    urls: list("Pages, each with url and, when known, title, description, keywords, and language."),
    partial: flag("True when the deadline ended mapping early."),
  }),
  "web-answers": output({
    json_content: record("The answer, in the shape of json_format."),
    sources: list("URLs read for the answer, then URLs cited in json_content."),
    partial: flag("True when the deadline ended research early."),
  }),
  "brand-retrieve-unified": output({
    brand: record("Brand profile: domain, title, description, slogan, colors, logos, backdrops, socials, address, stock, employees, industries, links, email, phone, and primary_language, when known."),
    partial: flag("True when the deadline ended processing; unfinished fields are omitted."),
  }),
  "brand-search": output({
    results: list("Up to 10 brands, each with domain, name, description, country, language, and logo."),
  }),
  "web-styleguide": output({
    domain: text("Normalized domain."),
    styleguide: record("mode, colors, typography, elementSpacing, shadows, fontLinks, and components."),
    finalDOMState: text("`loaded`, or `still-loading` when capture ended before the page loaded."),
  }),
  "company-search": output({
    results: list("Up to 10 companies, most relevant first, each with name, domain, description, organization_type, operating_status, stock_symbols, revenue, industries, founded_year, headquarters, employees, and funding."),
    next_cursor: nullable("Cursor for the next page with the same query, mode, and filters, or null."),
  }),
  "people-search": output({
    results: list("Up to 10 people, most relevant first, each with name, description, profiles, location, role, years_of_experience, is_founder, skills, and schools, plus match (confidence from 0 to 1) in ultra mode."),
    next_cursor: nullable("Cursor for the next page with the same query, mode, and filters, or null."),
  }),
  "people-enrich": output({
    match: record("status `candidate` with an identity score and the person's profile, or `not_found`."),
    partial: flag("True when the deadline ended processing; unfinished fields are omitted."),
  }),
  "get-news-search": output({
    data: list("Articles, each with id, url, title, description, language, authors, image_url, published_at, type, and source."),
    ...cursorPage(),
  }),
  "parse-document": output({
    markdown: text("File content as GitHub Flavored Markdown."),
    type: text("Detected content type."),
  }),
  "submit-batch": output({
    id: text("Batch ID for get-batch."),
    status: text("`queued`."),
    credits: record("Credits reserved."),
    invalid_urls: list("Rejected URLs with reasons (first 100)."),
    webhook_secret: text("Secret for verifying `X-Context-Signature`; only submit returns it."),
  }),
  "list-batches": output({
    data: list("Batches, newest first, each with the fields get-batch returns."),
    ...cursorPage(),
  }),
  "get-batch": output({
    ...batchFields(),
    failure: nullable("Why the batch failed; null unless status is `failed`."),
    results: nullable("Download links: one page of files (url, items, bytes) with expires_at, files_total, files_offset, and files_next_offset (null on the last page); null until the batch finishes."),
  }),
  "get-batch-results": output({
    data: list("Result records for successful and failed pages."),
    ...cursorPage(),
  }),
  "cancel-batch": output(batchFields()),
  "delete-batch": output(deletion()),
  "create-monitor": output({
    ...monitorFields(),
    initial_run_id: nullable("Queued baseline run ID; null when it starts on the next scheduled tick."),
  }),
  "list-monitors": output({
    data: list("Monitors, each with the fields get-monitor returns."),
    ...cursorPage(),
  }),
  "get-monitor": output({
    ...monitorFields(),
    baseline: nullable("Comparison baseline; null until captured or after a target change."),
  }),
  "update-monitor": output(monitorFields()),
  "delete-monitor": output(deletion()),
  "get-monitor-limits": output({
    monitors_used: numeric("Monitors the account has."),
    monitors_limit: numeric("Most monitors the account can have."),
    plan: text("`starter`, `pro`, or `scale`."),
  }),
  "list-monitor-credit-usage": output({
    data: list("Monitors, highest credits first, each with monitor_id, name, credits, and runs."),
    total_credits: numeric("Credits charged in the window."),
  }),
  "run-monitor-now": output({
    run_id: text("Queued run ID for get-monitor-run."),
    queued: flag("True when the run was queued."),
  }),
  "list-monitor-runs": output({ data: runList(), ...cursorPage() }),
  "get-monitor-run": output({
    status: text("`queued`, `running`, `completed`, `failed`, or `skipped`."),
    run_type: text("`baseline` or `scheduled`."),
    change_detected: flag("True when the run detected a change."),
    change_id: nullable("Detected change ID for get-change, or null."),
    credits_charged: numeric("Credits charged."),
    skip_reason: nullable("Why the run was skipped, or null."),
    error: nullable("Error from a failed run, or null."),
  }),
  "list-account-runs": output({ data: runList(), ...cursorPage() }),
  "list-monitor-changes": output({ data: changeList(), ...cursorPage() }),
  "get-change": output({
    title: text("Change title."),
    summary: text("What changed."),
    url: text("Where the change was detected; for search targets, the first new result."),
    detected_at: text("Detection time."),
    importance: text("`low`, `medium`, or `high`."),
    confidence: numeric("Confidence from 0 to 1."),
    diff: text("Text diff (page targets)."),
    added_urls: list("Added URLs (at most 500)."),
    removed_urls: list("Removed URLs (at most 500)."),
    matched_urls: list("New search results (search targets, at most 500)."),
    evidence: list("Evidence, each with url, before, and after."),
  }),
  "list-changes": output({ data: changeList(), ...cursorPage() }),
  "rotate-monitor-webhook-secret": output(monitorFields()),
  "list-webhook-deliveries": output({
    data: list("Deliveries, newest first, each with the fields get-webhook-delivery returns except event_id, retry, and last_attempt."),
    ...cursorPage(),
  }),
  "get-webhook-delivery": output({
    event: text("Event type."),
    event_id: text("Stable event ID for deduplicating received webhooks."),
    source: record("Batch or monitor run that produced the event."),
    url: text("Destination URL."),
    status: text("`pending`, `delivering`, `retrying`, `delivered`, `failed`, or `cancelled`."),
    delivered_at: nullable("Last successful delivery, or null."),
    next_attempt_at: nullable("Next scheduled attempt, or null."),
    retry_expires_at: text("Last time a manual retry is allowed."),
    last_error: nullable("Latest error (code, message), or null."),
    last_attempt: nullable("Latest attempt, or null."),
  }),
  "list-webhook-delivery-attempts": output({
    data: list("Attempts, newest first, each with attempt, trigger, url, started_at, completed_at, http_status, and error."),
    ...cursorPage(),
  }),
  "retry-webhook-delivery": output({
    id: text("Delivery ID whose retry was accepted."),
  }),
  "list-access-policies": output({
    data: list("Policies, newest first, each with the fields get-access-policy returns."),
    ...cursorPage(),
  }),
  "create-access-policy": output(accessPolicyFields()),
  "get-access-policy": output(accessPolicyFields()),
  "update-access-policy": output(accessPolicyFields()),
  "delete-access-policy": output(deletion()),
  "list-logs": output({
    data: list("Entries, newest first, each with request_id, timestamp, method, path, status_code, error_code, latency_ms, credits_used, key_id, tags, and zdr."),
    has_more: flag("True when a next page exists."),
  }),
  "get-log": output({
    data: record("list-logs fields plus user_agent and the redacted input and response, unless zero data retention applied."),
  }),
  "list-browser-profiles": output({
    data: list("Profiles, newest first, each with id, description, and created_at."),
    ...cursorPage(),
  }),
  "get-usage": output({
    credits_remaining: numeric("Credits available now."),
    period: nullable("Monthly period (start, credits_used), or null without monthly credits or while billing is paused."),
    next_refill: nullable("Next refill (at, credits), or null."),
    auto_topup: record("enabled, credits_used_this_period, and monthly_budget_credits."),
  }),
  "get-usage-history": output({
    data: list("Buckets, oldest first, each with start, credits_used, request_count, and groups when group_by is set."),
    total_credits_used: numeric("Credits charged in the range."),
    total_request_count: numeric("Requests in the range."),
  }),
  "submit-feedback": output({
    feedback_id: text("Stored feedback ID."),
    already_submitted: flag("True when this request_id was already reported; feedback_id is the original."),
  }),
};

function output(properties: Record<string, JsonSchema>): JsonSchema {
  return { type: "object", properties };
}

function cursorPage(): Record<string, JsonSchema> {
  return {
    has_more: flag("True when more results exist."),
    next_cursor: nullable("Cursor for the next page, or null."),
  };
}

function batchFields(): Record<string, JsonSchema> {
  return {
    id: text("Batch ID."),
    status: text("`queued`, `running`, `cancelling`, `completed`, `cancelled`, or `failed`."),
    progress: record("Pages succeeded, failed, and pending."),
    credits: record("Credits reserved and, once settled, refunded and net."),
    page_errors: list("Page failures by error code."),
  };
}

function monitorFields(): Record<string, JsonSchema> {
  return {
    id: text("Monitor ID."),
    status: text("`active`, `paused`, or `failed`."),
    target: record("Watched page, sitemap, extraction, or web search target."),
    change_detection: record("`exact` or `semantic` detection settings."),
    webhook: nullable("Webhook url, events, retry, and secret (with monitors:write), or null."),
    next_run_at: nullable("Next scheduled run, or null while paused."),
    last_error: nullable("Latest run error, or null."),
  };
}

function accessPolicyFields(): Record<string, JsonSchema> {
  return {
    id: text("Policy ID; pass it in `policies` on a request."),
    name: text("Policy name."),
    allowed_domains: nullable("Domains (and subdomains) requests may reach, or null for a blocklist."),
    blocked_domains: nullable("Domains (and subdomains) requests may not reach, or null for an allowlist."),
    applies_to: text("`request`, `api_keys`, or `organization`."),
    api_key_ids: nullable("API keys the policy applies to; null unless applies_to is `api_keys`."),
    created_at: text("Creation time."),
    updated_at: text("Last change time."),
  };
}

function deletion(): Record<string, JsonSchema> {
  return {
    id: text("Deleted ID."),
    deleted: flag("True when deleted."),
  };
}

function runList(): JsonSchema {
  return list("Runs, each with the fields get-monitor-run returns.");
}

function changeList(): JsonSchema {
  return list("Changes, each with the fields get-change returns when available.");
}

function text(description: string): JsonSchema {
  return { type: "string", description };
}

function numeric(description: string): JsonSchema {
  return { type: "number", description };
}

function flag(description: string): JsonSchema {
  return { type: "boolean", description };
}

function list(description: string): JsonSchema {
  return { type: "array", description };
}

function record(description: string): JsonSchema {
  return { type: "object", description };
}

function nullable(description: string): JsonSchema {
  return { description };
}
