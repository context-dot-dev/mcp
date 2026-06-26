// Auto-generated from Context's OpenAPI spec (https://api.context.dev/v1). Do not edit by hand.
export type EndpointParam = { name: string; required: boolean; type: string; items?: string | null; desc?: string };
export type Endpoint = { name: string; method: string; path: string; summary: string; description: string; query: EndpointParam[]; body: EndpointParam[] };
export const ENDPOINTS: Endpoint[] = [
  {
    "name": "web-scrape-html",
    "method": "GET",
    "path": "/web/scrape/html",
    "summary": "Scrape HTML",
    "description": "Scrape HTML \u2014 Scrapes the given URL and returns the raw HTML content of the page.",
    "query": [
      {
        "name": "url",
        "required": true,
        "type": "string",
        "items": null,
        "desc": "Full URL to scrape (must include http:// or https:// protocol)"
      },
      {
        "name": "pdf",
        "required": false,
        "type": "object",
        "items": null,
        "desc": "PDF parsing controls. Use start/end to limit text extraction and OCR to an inclusive 1-based page range."
      },
      {
        "name": "includeFrames",
        "required": false,
        "type": "boolean",
        "items": null,
        "desc": "When true, iframes are rendered inline into the returned HTML."
      },
      {
        "name": "useMainContentOnly",
        "required": false,
        "type": "boolean",
        "items": null,
        "desc": "When true, return only the page's main content in the HTML response, excluding headers, footers, sidebars, and navigation when detectable."
      },
      {
        "name": "includeSelectors",
        "required": false,
        "type": "array",
        "items": "string",
        "desc": "CSS selectors. When provided, only matching subtrees (and their descendants) are kept and everything else is dropped. When omitted, the entire document is kept."
      },
      {
        "name": "excludeSelectors",
        "required": false,
        "type": "array",
        "items": "string",
        "desc": "CSS selectors to remove from the result. Applied after includeSelectors. Exclusion takes precedence: an element matching both is removed. Examples: \"nav\", \"foot"
      },
      {
        "name": "maxAgeMs",
        "required": false,
        "type": "integer",
        "items": null,
        "desc": "Return a cached result if a prior scrape for the same parameters exists and is younger than this many milliseconds. Defaults to 1 day (86400000 ms) when omitted"
      },
      {
        "name": "waitForMs",
        "required": false,
        "type": "integer",
        "items": null,
        "desc": "Optional browser wait time in milliseconds after initial page load. Min: 0. Max: 30000 (30 seconds)."
      },
      {
        "name": "headers",
        "required": false,
        "type": "object",
        "items": null,
        "desc": "Optional outbound HTTP headers forwarded only to the target URL, sent as deep-object query params such as headers[X-Custom]=value. When provided, caching is byp"
      },
      {
        "name": "country",
        "required": false,
        "type": "string",
        "items": null,
        "desc": "Two-letter ISO 3166-1 alpha-2 country code for the website request location. When provided, Context.dev fetches the target page from that country."
      },
      {
        "name": "timeoutMS",
        "required": false,
        "type": "integer",
        "items": null,
        "desc": "Optional timeout in milliseconds for the request. If the request takes longer than this value, it will be aborted with a 408 status code. Maximum allowed value "
      }
    ],
    "body": []
  },
  {
    "name": "web-scrape-markdown",
    "method": "GET",
    "path": "/web/scrape/markdown",
    "summary": "Scrape Markdown",
    "description": "Scrape Markdown \u2014 Scrapes the given URL into LLM usable Markdown.",
    "query": [
      {
        "name": "url",
        "required": true,
        "type": "string",
        "items": null,
        "desc": "Full URL to scrape into LLM usable Markdown (must include http:// or https:// protocol)"
      },
      {
        "name": "includeLinks",
        "required": false,
        "type": "boolean",
        "items": null,
        "desc": "Preserve hyperlinks in Markdown output"
      },
      {
        "name": "includeImages",
        "required": false,
        "type": "boolean",
        "items": null,
        "desc": "Include image references in Markdown output"
      },
      {
        "name": "shortenBase64Images",
        "required": false,
        "type": "boolean",
        "items": null,
        "desc": "Shorten base64-encoded image data in the Markdown output"
      },
      {
        "name": "useMainContentOnly",
        "required": false,
        "type": "boolean",
        "items": null,
        "desc": "Extract only the main content of the page, excluding headers, footers, sidebars, and navigation"
      },
      {
        "name": "pdf",
        "required": false,
        "type": "object",
        "items": null,
        "desc": "PDF parsing controls. Use start/end to limit text extraction and OCR to an inclusive 1-based page range."
      },
      {
        "name": "includeFrames",
        "required": false,
        "type": "boolean",
        "items": null,
        "desc": "When true, the contents of iframes are rendered to Markdown."
      },
      {
        "name": "includeSelectors",
        "required": false,
        "type": "array",
        "items": "string",
        "desc": "CSS selectors. When provided, only matching HTML subtrees (and their descendants) are kept before conversion to Markdown. When omitted, the entire document is k"
      },
      {
        "name": "excludeSelectors",
        "required": false,
        "type": "array",
        "items": "string",
        "desc": "CSS selectors to remove before conversion to Markdown. Applied after includeSelectors. Exclusion takes precedence: an element matching both is removed. Examples"
      },
      {
        "name": "maxAgeMs",
        "required": false,
        "type": "integer",
        "items": null,
        "desc": "Return a cached result if a prior scrape for the same parameters exists and is younger than this many milliseconds. Defaults to 1 day (86400000 ms) when omitted"
      },
      {
        "name": "waitForMs",
        "required": false,
        "type": "integer",
        "items": null,
        "desc": "Optional browser wait time in milliseconds after initial page load before converting the page to Markdown. Min: 0. Max: 30000 (30 seconds)."
      },
      {
        "name": "headers",
        "required": false,
        "type": "object",
        "items": null,
        "desc": "Optional outbound HTTP headers forwarded only to the target URL, sent as deep-object query params such as headers[X-Custom]=value. When provided, caching is byp"
      },
      {
        "name": "country",
        "required": false,
        "type": "string",
        "items": null,
        "desc": "Two-letter ISO 3166-1 alpha-2 country code for the website request location. When provided, Context.dev fetches the target page from that country."
      },
      {
        "name": "timeoutMS",
        "required": false,
        "type": "integer",
        "items": null,
        "desc": "Optional timeout in milliseconds for the request. If the request takes longer than this value, it will be aborted with a 408 status code. Maximum allowed value "
      }
    ],
    "body": []
  },
  {
    "name": "web-scrape-images",
    "method": "GET",
    "path": "/web/scrape/images",
    "summary": "Scrape Images",
    "description": "Scrape Images \u2014 Extract image assets from a web page, including standard URLs, inline SVGs, data URIs, responsive image sources, metadata, CSS backgrounds, video posters, and embeds. The base request costs 1 credit. When enrichment is enabled, the entire call costs 5 credits.",
    "query": [
      {
        "name": "url",
        "required": true,
        "type": "string",
        "items": null,
        "desc": "Page URL to inspect. Must include http:// or https://."
      },
      {
        "name": "maxAgeMs",
        "required": false,
        "type": "integer",
        "items": null,
        "desc": "Reuse a cached result this many milliseconds old or newer. Default: 86400000 (1 day). Set to 0 to bypass cache. Maximum: 2592000000 (30 days)."
      },
      {
        "name": "enrichment",
        "required": false,
        "type": "object",
        "items": null,
        "desc": "Optional per-image processing, sent as deep-object query params such as enrichment[resolution]=true."
      },
      {
        "name": "waitForMs",
        "required": false,
        "type": "integer",
        "items": null,
        "desc": "Optional browser wait time in milliseconds after initial page load before collecting images. Min: 0. Max: 30000 (30 seconds)."
      },
      {
        "name": "headers",
        "required": false,
        "type": "object",
        "items": null,
        "desc": "Optional outbound HTTP headers forwarded only to the target URL, sent as deep-object query params such as headers[X-Custom]=value. When provided, caching is byp"
      },
      {
        "name": "timeoutMS",
        "required": false,
        "type": "integer",
        "items": null,
        "desc": "Optional timeout in milliseconds for the request. If the request takes longer than this value, it will be aborted with a 408 status code. Maximum allowed value "
      }
    ],
    "body": []
  },
  {
    "name": "web-scrape-sitemap",
    "method": "GET",
    "path": "/web/scrape/sitemap",
    "summary": "Crawl Sitemap",
    "description": "Crawl Sitemap \u2014 Crawl an entire website's sitemap and return all discovered page URLs.",
    "query": [
      {
        "name": "domain",
        "required": true,
        "type": "string",
        "items": null,
        "desc": "Domain to build a sitemap for"
      },
      {
        "name": "maxLinks",
        "required": false,
        "type": "integer",
        "items": null,
        "desc": "Maximum number of links to return from the sitemap crawl. Defaults to 10,000. Minimum is 1, maximum is 100,000."
      },
      {
        "name": "urlRegex",
        "required": false,
        "type": "string",
        "items": null,
        "desc": "Optional RE2-compatible regex pattern. Only URLs matching this pattern are returned and counted against maxLinks."
      },
      {
        "name": "headers",
        "required": false,
        "type": "object",
        "items": null,
        "desc": "Optional outbound HTTP headers forwarded only to the target URL, sent as deep-object query params such as headers[X-Custom]=value. When provided, caching is byp"
      },
      {
        "name": "timeoutMS",
        "required": false,
        "type": "integer",
        "items": null,
        "desc": "Optional timeout in milliseconds for the request. If the request takes longer than this value, it will be aborted with a 408 status code. Maximum allowed value "
      }
    ],
    "body": []
  },
  {
    "name": "web-crawl",
    "method": "POST",
    "path": "/web/crawl",
    "summary": "Crawl Website & Scrape Markdown",
    "description": "Crawl Website & Scrape Markdown \u2014 Performs a crawl starting from a given URL, extracts page content as Markdown, and returns results for all crawled pages.",
    "query": [],
    "body": [
      {
        "name": "url",
        "required": true,
        "type": "string",
        "items": null,
        "desc": "The starting URL for the crawl (must include http:// or https:// protocol)"
      },
      {
        "name": "maxPages",
        "required": false,
        "type": "integer",
        "items": null,
        "desc": "Maximum number of pages to crawl. Hard cap: 500."
      },
      {
        "name": "maxDepth",
        "required": false,
        "type": "integer",
        "items": null,
        "desc": "Maximum link depth from the starting URL (0 = only the starting page)"
      },
      {
        "name": "urlRegex",
        "required": false,
        "type": "string",
        "items": null,
        "desc": "Regex pattern. Only URLs matching this pattern will be followed and scraped."
      },
      {
        "name": "includeLinks",
        "required": false,
        "type": "boolean",
        "items": null,
        "desc": "Preserve hyperlinks in the Markdown output"
      },
      {
        "name": "includeImages",
        "required": false,
        "type": "boolean",
        "items": null,
        "desc": "Include image references in the Markdown output"
      },
      {
        "name": "shortenBase64Images",
        "required": false,
        "type": "boolean",
        "items": null,
        "desc": "Truncate base64-encoded image data in the Markdown output"
      },
      {
        "name": "useMainContentOnly",
        "required": false,
        "type": "boolean",
        "items": null,
        "desc": "Extract only the main content, stripping headers, footers, sidebars, and navigation"
      },
      {
        "name": "followSubdomains",
        "required": false,
        "type": "boolean",
        "items": null,
        "desc": "When true, follow links on subdomains of the starting URL's domain (e.g. docs.example.com when starting from example.com). www and apex are always treated as eq"
      },
      {
        "name": "pdf",
        "required": false,
        "type": "object",
        "items": null,
        "desc": "PDF parsing controls. Use start/end to limit text extraction and OCR to an inclusive 1-based page range."
      },
      {
        "name": "includeFrames",
        "required": false,
        "type": "boolean",
        "items": null,
        "desc": "When true, the contents of iframes are rendered to Markdown for each crawled page."
      },
      {
        "name": "includeSelectors",
        "required": false,
        "type": "array",
        "items": "string",
        "desc": "CSS selectors. When provided, only matching HTML subtrees (and their descendants) are kept before each crawled page is converted to Markdown. When omitted, the "
      },
      {
        "name": "excludeSelectors",
        "required": false,
        "type": "array",
        "items": "string",
        "desc": "CSS selectors to remove before each crawled page is converted to Markdown. Applied after includeSelectors. Exclusion takes precedence: an element matching both "
      },
      {
        "name": "maxAgeMs",
        "required": false,
        "type": "integer",
        "items": null,
        "desc": "Return a cached result if a prior scrape for the same parameters exists and is younger than this many milliseconds. Defaults to 1 day (86400000 ms) when omitted"
      },
      {
        "name": "waitForMs",
        "required": false,
        "type": "integer",
        "items": null,
        "desc": "Optional browser wait time in milliseconds after initial page load for each crawled page. Min: 0. Max: 30000 (30 seconds)."
      },
      {
        "name": "stopAfterMs",
        "required": false,
        "type": "integer",
        "items": null,
        "desc": "Soft time budget for the crawl in milliseconds. After each scrape, the crawler checks the elapsed time and, if exceeded, returns the pages collected so far inst"
      },
      {
        "name": "country",
        "required": false,
        "type": "string",
        "items": null,
        "desc": "Two-letter ISO 3166-1 alpha-2 country code identifying a supported Context.dev residential proxy exit location. Must be one of Context.dev's supported countries"
      },
      {
        "name": "timeoutMS",
        "required": false,
        "type": "integer",
        "items": null,
        "desc": "Optional timeout in milliseconds for the request. If the request takes longer than this value, it will be aborted with a 408 status code. Maximum allowed value "
      }
    ]
  },
  {
    "name": "web-extract",
    "method": "POST",
    "path": "/web/extract",
    "summary": "Extract Structured Website Data",
    "description": "Extract Structured Website Data \u2014 Crawl a website, use the provided JSON Schema and instructions to prioritize relevant internal links, and extract structured data from the selected pages.",
    "query": [],
    "body": [
      {
        "name": "url",
        "required": true,
        "type": "string",
        "items": null,
        "desc": "The starting website URL to crawl and extract from. Must include http:// or https://."
      },
      {
        "name": "schema",
        "required": true,
        "type": "object",
        "items": null,
        "desc": "JSON Schema for the returned data object. TypeScript Zod users can pass a JSON Schema generated from a Zod object; Python users can pass the equivalent JSON Sch"
      },
      {
        "name": "instructions",
        "required": false,
        "type": "string",
        "items": null,
        "desc": "Optional extraction guidance, such as which facts to prioritize or how to interpret fields in the schema."
      },
      {
        "name": "factCheck",
        "required": false,
        "type": "boolean",
        "items": null,
        "desc": "When true, every returned value must be grounded in facts stated on the page; fields that cannot be supported by the page are returned as null/empty. When false"
      },
      {
        "name": "followSubdomains",
        "required": false,
        "type": "boolean",
        "items": null,
        "desc": "When true, follow links on subdomains of the starting URL's domain."
      },
      {
        "name": "maxPages",
        "required": false,
        "type": "integer",
        "items": null,
        "desc": "Maximum number of pages to analyze for extraction. Hard cap: 50. Defaults to 5."
      },
      {
        "name": "maxDepth",
        "required": false,
        "type": "integer",
        "items": null,
        "desc": "Optional maximum link depth from the starting URL (0 = only the starting page). If omitted, there is no crawl depth limit."
      },
      {
        "name": "pdf",
        "required": false,
        "type": "object",
        "items": null,
        "desc": ""
      },
      {
        "name": "includeFrames",
        "required": false,
        "type": "boolean",
        "items": null,
        "desc": "When true, iframe contents are included in Markdown before extraction."
      },
      {
        "name": "maxAgeMs",
        "required": false,
        "type": "integer",
        "items": null,
        "desc": "Return cached scrape results if a prior scrape for the same parameters is younger than this many milliseconds. Defaults to 7 days (604800000 ms)."
      },
      {
        "name": "waitForMs",
        "required": false,
        "type": "integer",
        "items": null,
        "desc": "Optional browser wait time in milliseconds after initial page load for each crawled page."
      },
      {
        "name": "stopAfterMs",
        "required": false,
        "type": "integer",
        "items": null,
        "desc": "Soft time budget for the crawl in milliseconds. Min: 10000 (10s). Max: 110000 (110s). Default: 80000 (80s)."
      },
      {
        "name": "timeoutMS",
        "required": false,
        "type": "integer",
        "items": null,
        "desc": "Optional timeout in milliseconds for the request. If the request takes longer than this value, it will be aborted with a 408 status code. Maximum allowed value "
      }
    ]
  },
  {
    "name": "web-search",
    "method": "POST",
    "path": "/web/search",
    "summary": "Web Search",
    "description": "Web Search \u2014 Search the web and optionally scrape each result to Markdown in one round-trip.",
    "query": [],
    "body": [
      {
        "name": "query",
        "required": true,
        "type": "string",
        "items": null,
        "desc": "Natural-language search query."
      },
      {
        "name": "includeDomains",
        "required": false,
        "type": "array",
        "items": "string",
        "desc": "Allowlist \u2014 only return results from these domains. Example: [\"arxiv.org\", \"github.com\"]."
      },
      {
        "name": "excludeDomains",
        "required": false,
        "type": "array",
        "items": "string",
        "desc": "Blocklist \u2014 drop results from these domains. Example: [\"pinterest.com\", \"reddit.com\"]."
      },
      {
        "name": "freshness",
        "required": false,
        "type": "string",
        "items": null,
        "desc": "Restrict results to content published within this window."
      },
      {
        "name": "queryFanout",
        "required": false,
        "type": "boolean",
        "items": null,
        "desc": "Expand the query into multiple parallel variants for broader recall."
      },
      {
        "name": "markdownOptions",
        "required": false,
        "type": "object",
        "items": null,
        "desc": "Inline Markdown scraping for each result. Set `enabled: true` to activate."
      },
      {
        "name": "timeoutMS",
        "required": false,
        "type": "integer",
        "items": null,
        "desc": "Optional timeout in milliseconds for the request. If the request takes longer than this value, it will be aborted with a 408 status code. Maximum allowed value "
      }
    ]
  },
  {
    "name": "web-competitors",
    "method": "GET",
    "path": "/web/competitors",
    "summary": "Find website competitors",
    "description": "Find website competitors \u2014 Analyze a company's landing page and web search evidence to return direct competitors for the same product or market.",
    "query": [
      {
        "name": "domain",
        "required": true,
        "type": "string",
        "items": null,
        "desc": "Company domain to analyze, such as `stripe.com`. Full http(s) URLs are accepted and normalized to their domain."
      },
      {
        "name": "numCompetitors",
        "required": false,
        "type": "integer",
        "items": null,
        "desc": "Exact number of direct competitors to return. Defaults to 5."
      },
      {
        "name": "timeoutMS",
        "required": false,
        "type": "integer",
        "items": null,
        "desc": "Optional timeout in milliseconds for the request. If the request takes longer than this value, it will be aborted with a 408 status code. Maximum allowed value "
      }
    ],
    "body": []
  },
  {
    "name": "people-retrieve",
    "method": "POST",
    "path": "/people/retrieve",
    "summary": "Retrieve Person",
    "description": "Retrieve Person \u2014 Retrieve and normalize a person profile from identifiers.",
    "query": [],
    "body": [
      {
        "name": "identifiers",
        "required": true,
        "type": "object",
        "items": null,
        "desc": "Known identifiers for the person. At least one identifier is required."
      },
      {
        "name": "timeoutMS",
        "required": false,
        "type": "integer",
        "items": null,
        "desc": "Optional timeout in milliseconds for the request. If the request takes longer than this value, it will be aborted with a 408 status code. Maximum allowed value "
      }
    ]
  },
  {
    "name": "brand-retrieve",
    "method": "GET",
    "path": "/brand/retrieve",
    "summary": "Retrieve brand data by domain",
    "description": "Retrieve brand data by domain \u2014 Retrieve logos, backdrops, colors, industry, description, and more from any domain",
    "query": [
      {
        "name": "domain",
        "required": true,
        "type": "string",
        "items": null,
        "desc": "Domain name to retrieve brand data for (e.g., 'example.com', 'google.com'). Cannot be used with name or ticker parameters."
      },
      {
        "name": "force_language",
        "required": false,
        "type": "string",
        "items": null,
        "desc": "Optional parameter to force the language of the retrieved brand data."
      },
      {
        "name": "maxSpeed",
        "required": false,
        "type": "boolean",
        "items": null,
        "desc": "Optional parameter to optimize the API call for maximum speed. When set to true, the API will skip time-consuming operations for faster response at the cost of "
      },
      {
        "name": "maxAgeMs",
        "required": false,
        "type": "integer",
        "items": null,
        "desc": "Maximum age in milliseconds for cached brand data before the API performs a hard refresh. Defaults to 3 months (7776000000 ms). Values below 1 day (86400000 ms)"
      },
      {
        "name": "timeoutMS",
        "required": false,
        "type": "integer",
        "items": null,
        "desc": "Optional timeout in milliseconds for the request. If the request takes longer than this value, it will be aborted with a 408 status code. Maximum allowed value "
      }
    ],
    "body": []
  },
  {
    "name": "brand-retrieve-by-name",
    "method": "GET",
    "path": "/brand/retrieve-by-name",
    "summary": "Retrieve brand data by company name",
    "description": "Retrieve brand data by company name \u2014 Retrieve brand information using a company name.",
    "query": [
      {
        "name": "name",
        "required": true,
        "type": "string",
        "items": null,
        "desc": "Company name to retrieve brand data for (e.g., 'Apple Inc', 'Microsoft Corporation'). Must be 3-30 characters."
      },
      {
        "name": "country_gl",
        "required": false,
        "type": "string",
        "items": null,
        "desc": "Optional country code hint (GL parameter) to specify the country for the company name."
      },
      {
        "name": "force_language",
        "required": false,
        "type": "string",
        "items": null,
        "desc": "Optional parameter to force the language of the retrieved brand data."
      },
      {
        "name": "maxSpeed",
        "required": false,
        "type": "boolean",
        "items": null,
        "desc": "Optional parameter to optimize the API call for maximum speed. When set to true, the API will skip time-consuming operations for faster response at the cost of "
      },
      {
        "name": "maxAgeMs",
        "required": false,
        "type": "integer",
        "items": null,
        "desc": "Maximum age in milliseconds for cached brand data before the API performs a hard refresh. Defaults to 3 months (7776000000 ms). Values below 1 day (86400000 ms)"
      },
      {
        "name": "timeoutMS",
        "required": false,
        "type": "integer",
        "items": null,
        "desc": "Optional timeout in milliseconds for the request. If the request takes longer than this value, it will be aborted with a 408 status code. Maximum allowed value "
      }
    ],
    "body": []
  },
  {
    "name": "brand-retrieve-by-email",
    "method": "GET",
    "path": "/brand/retrieve-by-email",
    "summary": "Retrieve brand data by email address",
    "description": "Retrieve brand data by email address \u2014 Retrieve brand information using an email address while detecting disposable and free email addresses. Disposable and free email addresses (like gmail.com, yahoo.com) will throw a 422 error.",
    "query": [
      {
        "name": "email",
        "required": true,
        "type": "string",
        "items": null,
        "desc": "Email address to retrieve brand data for (e.g., 'contact@example.com'). The domain will be extracted from the email. Free email providers (gmail.com, yahoo.com,"
      },
      {
        "name": "force_language",
        "required": false,
        "type": "string",
        "items": null,
        "desc": "Optional parameter to force the language of the retrieved brand data."
      },
      {
        "name": "maxSpeed",
        "required": false,
        "type": "boolean",
        "items": null,
        "desc": "Optional parameter to optimize the API call for maximum speed. When set to true, the API will skip time-consuming operations for faster response at the cost of "
      },
      {
        "name": "maxAgeMs",
        "required": false,
        "type": "integer",
        "items": null,
        "desc": "Maximum age in milliseconds for cached brand data before the API performs a hard refresh. Defaults to 3 months (7776000000 ms). Values below 1 day (86400000 ms)"
      },
      {
        "name": "timeoutMS",
        "required": false,
        "type": "integer",
        "items": null,
        "desc": "Optional timeout in milliseconds for the request. If the request takes longer than this value, it will be aborted with a 408 status code. Maximum allowed value "
      }
    ],
    "body": []
  },
  {
    "name": "brand-retrieve-by-ticker",
    "method": "GET",
    "path": "/brand/retrieve-by-ticker",
    "summary": "Retrieve brand data by stock ticker",
    "description": "Retrieve brand data by stock ticker \u2014 Retrieve brand information using a stock ticker symbol.",
    "query": [
      {
        "name": "ticker",
        "required": true,
        "type": "string",
        "items": null,
        "desc": "Stock ticker symbol to retrieve brand data for (e.g., 'AAPL', 'GOOGL', 'BRK.A'). Must be 1-15 characters, letters/numbers/dots only."
      },
      {
        "name": "ticker_exchange",
        "required": false,
        "type": "string",
        "items": null,
        "desc": "Optional stock exchange for the ticker. Defaults to NASDAQ if not specified."
      },
      {
        "name": "force_language",
        "required": false,
        "type": "string",
        "items": null,
        "desc": "Optional parameter to force the language of the retrieved brand data."
      },
      {
        "name": "maxSpeed",
        "required": false,
        "type": "boolean",
        "items": null,
        "desc": "Optional parameter to optimize the API call for maximum speed. When set to true, the API will skip time-consuming operations for faster response at the cost of "
      },
      {
        "name": "maxAgeMs",
        "required": false,
        "type": "integer",
        "items": null,
        "desc": "Maximum age in milliseconds for cached brand data before the API performs a hard refresh. Defaults to 3 months (7776000000 ms). Values below 1 day (86400000 ms)"
      },
      {
        "name": "timeoutMS",
        "required": false,
        "type": "integer",
        "items": null,
        "desc": "Optional timeout in milliseconds for the request. If the request takes longer than this value, it will be aborted with a 408 status code. Maximum allowed value "
      }
    ],
    "body": []
  },
  {
    "name": "brand-retrieve-by-isin",
    "method": "GET",
    "path": "/brand/retrieve-by-isin",
    "summary": "Retrieve brand data by ISIN",
    "description": "Retrieve brand data by ISIN \u2014 Retrieve brand information using an ISIN (International Securities Identification Number).",
    "query": [
      {
        "name": "isin",
        "required": true,
        "type": "string",
        "items": null,
        "desc": "ISIN (International Securities Identification Number) to retrieve brand data for (e.g., 'AU000000IMD5', 'US0378331005'). Must be exactly 12 characters: 2 letter"
      },
      {
        "name": "force_language",
        "required": false,
        "type": "string",
        "items": null,
        "desc": "Optional parameter to force the language of the retrieved brand data."
      },
      {
        "name": "maxSpeed",
        "required": false,
        "type": "boolean",
        "items": null,
        "desc": "Optional parameter to optimize the API call for maximum speed. When set to true, the API will skip time-consuming operations for faster response at the cost of "
      },
      {
        "name": "maxAgeMs",
        "required": false,
        "type": "integer",
        "items": null,
        "desc": "Maximum age in milliseconds for cached brand data before the API performs a hard refresh. Defaults to 3 months (7776000000 ms). Values below 1 day (86400000 ms)"
      },
      {
        "name": "timeoutMS",
        "required": false,
        "type": "integer",
        "items": null,
        "desc": "Optional timeout in milliseconds for the request. If the request takes longer than this value, it will be aborted with a 408 status code. Maximum allowed value "
      }
    ],
    "body": []
  },
  {
    "name": "brand-transaction-identifier",
    "method": "GET",
    "path": "/brand/transaction_identifier",
    "summary": "Identify brand from transaction data",
    "description": "Identify brand from transaction data \u2014 Endpoint specially designed for platforms that want to identify transaction data by the transaction title.",
    "query": [
      {
        "name": "transaction_info",
        "required": true,
        "type": "string",
        "items": null,
        "desc": "Transaction information to identify the brand"
      },
      {
        "name": "country_gl",
        "required": false,
        "type": "string",
        "items": null,
        "desc": "Optional country code (GL parameter) to specify the country. This affects the geographic location used for search queries."
      },
      {
        "name": "city",
        "required": false,
        "type": "string",
        "items": null,
        "desc": "Optional city name to prioritize when searching for the brand."
      },
      {
        "name": "mcc",
        "required": false,
        "type": "string",
        "items": null,
        "desc": "Optional Merchant Category Code (MCC) to help identify the business category/industry."
      },
      {
        "name": "phone",
        "required": false,
        "type": "number",
        "items": null,
        "desc": "Optional phone number from the transaction to help verify brand match."
      },
      {
        "name": "high_confidence_only",
        "required": false,
        "type": "boolean",
        "items": null,
        "desc": "When set to true, the API will perform an additional verification steps to ensure the identified brand matches the transaction with high confidence."
      },
      {
        "name": "force_language",
        "required": false,
        "type": "string",
        "items": null,
        "desc": "Optional parameter to force the language of the retrieved brand data."
      },
      {
        "name": "maxSpeed",
        "required": false,
        "type": "boolean",
        "items": null,
        "desc": "Optional parameter to optimize the API call for maximum speed. When set to true, the API will skip time-consuming operations for faster response at the cost of "
      },
      {
        "name": "timeoutMS",
        "required": false,
        "type": "integer",
        "items": null,
        "desc": "Optional timeout in milliseconds for the request. If the request takes longer than this value, it will be aborted with a 408 status code. Maximum allowed value "
      }
    ],
    "body": []
  },
  {
    "name": "brand-retrieve-simplified",
    "method": "GET",
    "path": "/brand/retrieve-simplified",
    "summary": "Retrieve simplified brand data by domain",
    "description": "Retrieve simplified brand data by domain \u2014 Returns a simplified version of brand data containing only essential information: domain, title, colors, logos, and backdrops. Optimized for faster responses and reduced data transfer.",
    "query": [
      {
        "name": "domain",
        "required": true,
        "type": "string",
        "items": null,
        "desc": "Domain name to retrieve simplified brand data for"
      },
      {
        "name": "maxAgeMs",
        "required": false,
        "type": "integer",
        "items": null,
        "desc": "Maximum age in milliseconds for cached brand data before the API performs a hard refresh. Defaults to 3 months (7776000000 ms). Values below 1 day (86400000 ms)"
      },
      {
        "name": "timeoutMS",
        "required": false,
        "type": "integer",
        "items": null,
        "desc": "Optional timeout in milliseconds for the request. If the request takes longer than this value, it will be aborted with a 408 status code. Maximum allowed value "
      }
    ],
    "body": []
  },
  {
    "name": "web-styleguide",
    "method": "GET",
    "path": "/web/styleguide",
    "summary": "Scrape Styleguide",
    "description": "Scrape Styleguide \u2014 Extract a comprehensive design system from a website including colors, typography, spacing, shadows, and UI components.",
    "query": [
      {
        "name": "domain",
        "required": false,
        "type": "string",
        "items": null,
        "desc": "Domain name to extract styleguide from (e.g., 'example.com', 'google.com'). The domain will be automatically normalized and validated. You must provide either '"
      },
      {
        "name": "directUrl",
        "required": false,
        "type": "string",
        "items": null,
        "desc": "A specific URL to fetch the styleguide from directly, bypassing domain resolution (e.g., 'https://example.com/design-system'). When provided, the styleguide is "
      },
      {
        "name": "maxAgeMs",
        "required": false,
        "type": "integer",
        "items": null,
        "desc": "Maximum age in milliseconds for cached data before the API performs a hard refresh. Defaults to 3 months (7776000000 ms). Values below 1 day (86400000 ms) are c"
      },
      {
        "name": "timeoutMS",
        "required": false,
        "type": "integer",
        "items": null,
        "desc": "Optional timeout in milliseconds for the request. If the request takes longer than this value, it will be aborted with a 408 status code. Maximum allowed value "
      }
    ],
    "body": []
  },
  {
    "name": "web-fonts",
    "method": "GET",
    "path": "/web/fonts",
    "summary": "Scrape Fonts",
    "description": "Scrape Fonts \u2014 Scrape font information from a website including font families, usage statistics, fallbacks, and element/word counts.",
    "query": [
      {
        "name": "domain",
        "required": false,
        "type": "string",
        "items": null,
        "desc": "Domain name to extract fonts from (e.g., 'example.com', 'google.com'). The domain will be automatically normalized and validated. You must provide either 'domai"
      },
      {
        "name": "directUrl",
        "required": false,
        "type": "string",
        "items": null,
        "desc": "A specific URL to fetch fonts from directly, bypassing domain resolution (e.g., 'https://example.com/design-system'). When provided, fonts are extracted from th"
      },
      {
        "name": "maxAgeMs",
        "required": false,
        "type": "integer",
        "items": null,
        "desc": "Maximum age in milliseconds for cached data before the API performs a hard refresh. Defaults to 3 months (7776000000 ms). Values below 1 day (86400000 ms) are c"
      },
      {
        "name": "timeoutMS",
        "required": false,
        "type": "integer",
        "items": null,
        "desc": "Optional timeout in milliseconds for the request. If the request takes longer than this value, it will be aborted with a 408 status code. Maximum allowed value "
      }
    ],
    "body": []
  },
  {
    "name": "web-screenshot",
    "method": "GET",
    "path": "/web/screenshot",
    "summary": "Scrape Screenshot",
    "description": "Scrape Screenshot \u2014 Capture a screenshot of a website.",
    "query": [
      {
        "name": "domain",
        "required": false,
        "type": "string",
        "items": null,
        "desc": "Domain name to take screenshot of (e.g., 'example.com', 'google.com'). The domain will be automatically normalized and validated. You must provide either 'domai"
      },
      {
        "name": "directUrl",
        "required": false,
        "type": "string",
        "items": null,
        "desc": "A specific URL to screenshot directly, bypassing domain resolution (e.g., 'https://example.com/pricing'). When provided, the screenshot is taken of this exact U"
      },
      {
        "name": "fullScreenshot",
        "required": false,
        "type": "string",
        "items": null,
        "desc": "Optional parameter to determine screenshot type. If 'true', takes a full page screenshot capturing all content. If 'false' or not provided, takes a viewport scr"
      },
      {
        "name": "handleCookiePopup",
        "required": false,
        "type": "string",
        "items": null,
        "desc": "Optional parameter to control cookie/consent popup handling. If 'true', we dismiss cookie banner before capture. If 'false' or not provided, captures the page w"
      },
      {
        "name": "viewport",
        "required": false,
        "type": "object",
        "items": null,
        "desc": "Optional browser viewport dimensions for the screenshot. Defaults to 1920x1080."
      },
      {
        "name": "maxAgeMs",
        "required": false,
        "type": "integer",
        "items": null,
        "desc": "Return a cached screenshot if a prior screenshot for the same parameters exists and is younger than this many milliseconds. Defaults to 1 day (86400000 ms) when"
      },
      {
        "name": "page",
        "required": false,
        "type": "string",
        "items": null,
        "desc": "Optional parameter to specify which page type to screenshot. If provided, the system will scrape the domain's links and use heuristics to find the most appropri"
      },
      {
        "name": "waitForMs",
        "required": false,
        "type": "integer",
        "items": null,
        "desc": "Optional browser wait time in milliseconds after initial page load before taking the screenshot. Min: 0. Max: 30000 (30 seconds).  Defaults to 3000 ms when omit"
      },
      {
        "name": "scrollOffset",
        "required": false,
        "type": "integer",
        "items": null,
        "desc": "Optional vertical scroll offset in pixels for capturing a long page in viewport-sized chunks. When provided, the full page is captured once and the returned ima"
      },
      {
        "name": "country",
        "required": false,
        "type": "string",
        "items": null,
        "desc": "Two-letter ISO 3166-1 alpha-2 country code for the website request location. When provided, Context.dev fetches the target page from that country."
      },
      {
        "name": "timeoutMS",
        "required": false,
        "type": "integer",
        "items": null,
        "desc": "Optional timeout in milliseconds for the request. If the request takes longer than this value, it will be aborted with a 408 status code. Maximum allowed value "
      }
    ],
    "body": []
  },
  {
    "name": "web-naics",
    "method": "GET",
    "path": "/web/naics",
    "summary": "Classify NAICS industries",
    "description": "Classify NAICS industries \u2014 Classify any brand into 2022 NAICS industry codes from its domain or name.",
    "query": [
      {
        "name": "input",
        "required": true,
        "type": "string",
        "items": null,
        "desc": "Brand domain or title to retrieve NAICS code for. If a valid domain is provided, it will be used for classification, otherwise, we will search for the brand usi"
      },
      {
        "name": "minResults",
        "required": false,
        "type": "integer",
        "items": null,
        "desc": "Minimum number of NAICS codes to return. Must be at least 1. Defaults to 1."
      },
      {
        "name": "maxResults",
        "required": false,
        "type": "integer",
        "items": null,
        "desc": "Maximum number of NAICS codes to return. Must be between 1 and 10. Defaults to 5."
      },
      {
        "name": "timeoutMS",
        "required": false,
        "type": "integer",
        "items": null,
        "desc": "Optional timeout in milliseconds for the request. If the request takes longer than this value, it will be aborted with a 408 status code. Maximum allowed value "
      }
    ],
    "body": []
  },
  {
    "name": "web-sic",
    "method": "GET",
    "path": "/web/sic",
    "summary": "Classify SIC industries",
    "description": "Classify SIC industries \u2014 Classify any brand into Standard Industrial Classification (SIC) codes from its domain or name. Choose between the original SIC system (`original_sic`) or the latest SIC list maintained by the SEC (`latest_sec`).",
    "query": [
      {
        "name": "input",
        "required": true,
        "type": "string",
        "items": null,
        "desc": "Brand domain or title to retrieve SIC code for. If a valid domain is provided, it will be used for classification, otherwise, we will search for the brand using"
      },
      {
        "name": "type",
        "required": false,
        "type": "string",
        "items": null,
        "desc": "Which SIC dataset to classify against. `original_sic` uses the 1987 Standard Industrial Classification system; `latest_sec` uses the current SIC list as publish"
      },
      {
        "name": "minResults",
        "required": false,
        "type": "integer",
        "items": null,
        "desc": "Minimum number of SIC codes to return. Must be at least 1. Defaults to 1."
      },
      {
        "name": "maxResults",
        "required": false,
        "type": "integer",
        "items": null,
        "desc": "Maximum number of SIC codes to return. Must be between 1 and 10. Defaults to 5."
      },
      {
        "name": "timeoutMS",
        "required": false,
        "type": "integer",
        "items": null,
        "desc": "Optional timeout in milliseconds for the request. If the request takes longer than this value, it will be aborted with a 408 status code. Maximum allowed value "
      }
    ],
    "body": []
  },
  {
    "name": "brand-ai-query",
    "method": "POST",
    "path": "/brand/ai/query",
    "summary": "Query website data using AI",
    "description": "Query website data using AI \u2014 Use AI to extract specific data points from a brand's website. The AI will crawl the website and extract the requested information based on the provided data points.",
    "query": [],
    "body": [
      {
        "name": "domain",
        "required": true,
        "type": "string",
        "items": null,
        "desc": "The domain name to analyze"
      },
      {
        "name": "specific_pages",
        "required": false,
        "type": "object",
        "items": null,
        "desc": "Optional object specifying which pages to analyze"
      },
      {
        "name": "data_to_extract",
        "required": true,
        "type": "array",
        "items": "object",
        "desc": "Array of data points to extract from the website"
      },
      {
        "name": "timeoutMS",
        "required": false,
        "type": "integer",
        "items": null,
        "desc": "Optional timeout in milliseconds for the request. If the request takes longer than this value, it will be aborted with a 408 status code. Maximum allowed value "
      }
    ]
  },
  {
    "name": "brand-ai-product",
    "method": "POST",
    "path": "/brand/ai/product",
    "summary": "Extract a single product from a URL",
    "description": "Extract a single product from a URL \u2014 Given a single URL, determines if it is a product page and extracts the product information.",
    "query": [],
    "body": [
      {
        "name": "url",
        "required": true,
        "type": "string",
        "items": null,
        "desc": "The product page URL to extract product data from."
      },
      {
        "name": "maxAgeMs",
        "required": false,
        "type": "integer",
        "items": null,
        "desc": "Return a cached result if a prior scrape for the same parameters exists and is younger than this many milliseconds. Defaults to 7 days (604800000 ms) when omitt"
      },
      {
        "name": "timeoutMS",
        "required": false,
        "type": "integer",
        "items": null,
        "desc": "Optional timeout in milliseconds for the request. If the request takes longer than this value, it will be aborted with a 408 status code. Maximum allowed value "
      }
    ]
  },
  {
    "name": "brand-ai-products",
    "method": "POST",
    "path": "/brand/ai/products",
    "summary": "Extract products from a brand's website",
    "description": "Extract products from a brand's website \u2014 Extract product information from a brand's website. We will analyze the website and return a list of products with details such as name, description, image, pricing, features, and more.",
    "query": [],
    "body": []
  },
  {
    "name": "brand-prefetch",
    "method": "POST",
    "path": "/brand/prefetch",
    "summary": "Prefetch brand data for a domain",
    "description": "Prefetch brand data for a domain \u2014 Signal that you may fetch brand data for a particular domain soon to improve latency.",
    "query": [],
    "body": [
      {
        "name": "domain",
        "required": true,
        "type": "string",
        "items": null,
        "desc": "Domain name to prefetch brand data for"
      },
      {
        "name": "timeoutMS",
        "required": false,
        "type": "integer",
        "items": null,
        "desc": "Optional timeout in milliseconds for the request. If the request takes longer than this value, it will be aborted with a 408 status code. Maximum allowed value "
      }
    ]
  },
  {
    "name": "brand-prefetch-by-email",
    "method": "POST",
    "path": "/brand/prefetch-by-email",
    "summary": "Prefetch brand data by email",
    "description": "Prefetch brand data by email \u2014 Signal that you may fetch brand data for a particular domain soon to improve latency. This endpoint accepts an email address, extracts the domain from it, validates that it's not a disposable or free email provider, and queues the domain for prefetching.",
    "query": [],
    "body": [
      {
        "name": "email",
        "required": true,
        "type": "string",
        "items": null,
        "desc": "Email address to prefetch brand data for. The domain will be extracted from the email. Free email providers (gmail.com, yahoo.com, etc.) and disposable email ad"
      },
      {
        "name": "timeoutMS",
        "required": false,
        "type": "integer",
        "items": null,
        "desc": "Optional timeout in milliseconds for the request. If the request takes longer than this value, it will be aborted with a 408 status code. Maximum allowed value "
      }
    ]
  }
];
