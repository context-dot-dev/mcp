// API descriptions are written for the REST reference and SDK docstrings, which
// do not show schema constraints and send arrays as comma-separated query
// strings. MCP clients see every constraint and send arrays as arrays, so these
// replace API descriptions in published tool schemas. Keyed by the exact API
// text: when a spec sync changes that text, the API version is used again.
export const MCP_DESCRIPTION_REPLACEMENTS: Readonly<Record<string, string>> = {
  "Public HTTP or HTTPS URL to scrape.": "URL of the public page to scrape.",
  "Maximum age of a cached output, in milliseconds. `0` fetches fresh. Defaults to 3 days (259200000 ms). Maximum: 1 year (31536000000 ms).":
    "Maximum age of a cached output, in milliseconds. `0` fetches fresh. Defaults to 3 days (259200000 ms).",
  "google-maps-reviews and reddit parsers only. Maximum number of reviews (google-maps-reviews, default 100), comments (reddit-post, default 100), or results (reddit-search, reddit-subreddit, and reddit-user, default 100) to return; maximum 1000.":
    "google-maps-reviews and reddit parsers only. Maximum reviews, comments, or results to return. Defaults to 100.",
  "Proxy country as a two-letter code, such as `US`. Case-insensitive.":
    "Country of the proxy that fetches the page, as a country code such as `US`.",
  "Browser wait time in milliseconds after initial page load for each crawled page. Defaults to 3500 (3.5 seconds). Min: 0. Max: 30000 (30 seconds).":
    "Browser wait after initial page load for each crawled page, in milliseconds. Defaults to 3500.",
  "Number of results to request and return (1–100). Defaults to 10.":
    "Number of results to request and return. Defaults to 10.",
  'Allowlist — only return results from these domains. Up to 100 domains. Example: ["arxiv.org", "github.com"].':
    'Allowlist — only return results from these domains. Example: ["arxiv.org", "github.com"].',
  'Blocklist — drop results from these domains. Up to 100 domains. Example: ["pinterest.com", "reddit.com"].':
    'Blocklist — drop results from these domains. Example: ["pinterest.com", "reddit.com"].',
  "Maximum cache age in milliseconds for result page content. Defaults to 180 days (15552000000 ms) when Markdown is requested, or 365 days (31536000000 ms) when only highlights are requested. Explicit values override either default. Maximum: 365 days. Set to 0 to force a fresh scrape.":
    "Maximum cache age in milliseconds for result page content. Defaults to 180 days (15552000000 ms) when Markdown is requested, or 365 days (31536000000 ms) when only highlights are requested. Set to 0 to force a fresh scrape.",
  "Extra wait after page load before rendering, in ms (0–30000). Useful for JS-heavy pages.":
    "Extra wait after page load before rendering, in milliseconds. Useful for JS-heavy pages.",
  "Maximum cache age in milliseconds. Defaults to 3 days (259200000 ms). Maximum: 1 year (31536000000 ms). `0` fetches fresh.":
    "Maximum cache age in milliseconds. Defaults to 3 days (259200000 ms). `0` fetches fresh.",
  "Pages to scrape. Maximum 100000.": "Pages to scrape.",
  "Maximum pages to fetch. Unused reserved credits are refunded. Maximum 100000.":
    "Maximum pages to fetch. Unused reserved credits are refunded.",
  "Discriminator for domain-based brand retrieval.": "Use `by_domain` with `domain`.",
  "Discriminator for name-based brand retrieval.": "Use `by_name` with `name`.",
  "Discriminator for email-based brand retrieval.": "Use `by_email` with `email`.",
  "Discriminator for ticker-based brand retrieval.": "Use `by_ticker` with `ticker`.",
  "Discriminator for direct-URL-based brand retrieval.":
    "Use `by_direct_url` with `direct_url`.",
  "Discriminator for transaction-based brand retrieval.":
    "Use `by_transaction` with `transaction_info`.",
  "Stock exchange code.":
    "Exchange that lists the ticker, as an exchange code such as `NYSE`, `LSE`, or `TSX`. Defaults to `NASDAQ`.",
  "Transaction information to identify the brand.":
    "Transaction descriptor, as it appears on a card or bank statement, used to identify the merchant.",
  "Optional Merchant Category Code (MCC) to help identify the business category or industry.":
    "Four-digit Merchant Category Code (MCC) from the card transaction, such as `5812`, used to help identify the merchant's industry.",
  "Maximum number of typos tolerated when matching, from 0 to 2. Defaults to 0 (no typo tolerance).":
    "Maximum number of typos tolerated when matching. Defaults to 0 (no typo tolerance).",
  "Fields to match the search term against, as a comma-separated list or repeated parameter: 'name', 'domain', or both. Defaults to both.":
    "Fields to match the search term against. Defaults to both.",
  "Four-digit graduation year.": "Year of graduation.",
  "Publisher domains to include. Up to 3.": "Publisher domains to include.",
  "Publisher countries to include, as lowercase ISO 3166-1 alpha-2 codes. Up to 3.":
    "Publisher countries to include, as lowercase ISO 3166-1 alpha-2 codes.",
  "Article languages to include. Up to 3.":
    "Article languages to include, as lowercase ISO 639 codes such as `en`.",
  "Article types to include. Up to 3.": "Article types to include.",
  "Comma-separated labels for filtering usage, e.g. `production,team-alpha`.":
    "Labels for filtering usage in the dashboard.",
  "Tags to filter by (matches batches having any of them). Pass repeated `tags` params or one comma-separated list, e.g. `tags=docs,competitor`.":
    "Tags to filter by; matches batches with any of them. Pass an array or one comma-separated string.",
  "Include batches submitted with Scrape Anything formats. Defaults to false.":
    "Include batches submitted with Scrape Anything (unified) formats. Defaults to true; set false to list only legacy Markdown and HTML batches.",
  "Comma-separated list of tags to filter by (matches monitors having any of them).":
    "Tags to filter by; matches monitors with any of them.",
  "Maximum number of items to return per page (1-100). Defaults to 25.":
    "Maximum number of items to return per page. Defaults to 25.",
  "Optional browser actions executed in array order after the page loads, before content is captured, on every run. Requires a paid plan. Maximum: 5 actions. Changes create a new baseline.":
    "Optional browser actions executed in array order after the page loads, before content is captured, on every run. Requires a paid plan. Changes create a new baseline.",
  "URL path patterns to include (max 50).":
    "Glob patterns for the sitemap URL paths to track, such as `/blog/*`. When set, only matching URLs are tracked.",
  "URL path patterns to exclude (max 50).":
    "Glob patterns for sitemap URL paths to ignore, such as `/legal/*`. Applied after `include`.",
  "Maximum number of sitemap URLs to track (capped at 10,000).":
    "Maximum number of sitemap URLs to track.",
  "Minimum confidence required to report a meaningful change, from 0 to 1.":
    "Minimum confidence required to report a meaningful change.",
  "Filter by target type.":
    "Filter by monitor target type: `page` watches one web page, `sitemap` watches a site for added or removed URLs, and `extract` watches structured data across selected pages.",
  "Filter by change detection type.":
    "Filter by change detection type: `exact` compares visible text or sitemap URLs, and `semantic` judges changes against the target instructions.",
  "Unique key to prevent duplicate retry requests.":
    "Unique key for this retry request. Repeating the call with the same key, delivery, and `force` returns the original result without queuing another attempt; without a key, a repeated call can queue another attempt.",
  "Kind of issue.":
    "Issue type: `bug` (wrong behavior or an unexpected error), `docs_mismatch` (behavior differs from the documentation), `friction` (works but is hard to use), `feature_gap` (a needed capability is missing), `quality_degradation` (lower-quality or incomplete results), or `other`.",
};

export function replaceDescription(
  description: string | undefined,
): string | undefined {
  return description === undefined
    ? undefined
    : (MCP_DESCRIPTION_REPLACEMENTS[description] ?? description);
}
