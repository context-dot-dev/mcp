// Generated from Context's OpenAPI specification by scripts/generate-context-endpoints.ts.
export type JsonSchema = {
  [key: string]: unknown;
  $ref?: string;
  type?: string | string[];
  const?: unknown;
  enum?: unknown[];
  format?: string;
  description?: string;
  default?: unknown;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  minItems?: number;
  maxItems?: number;
  pattern?: string;
  nullable?: boolean;
  properties?: Record<string, JsonSchema>;
  required?: string[];
  items?: JsonSchema;
  additionalProperties?: boolean | JsonSchema;
  oneOf?: JsonSchema[];
  anyOf?: JsonSchema[];
  allOf?: JsonSchema[];
};

export type EndpointParameter = {
  name: string;
  in: string;
  required: boolean;
  description?: string;
  schema: JsonSchema;
};

export type Endpoint = {
  name: string;
  title: string;
  method: string;
  path: string;
  description?: string;
  parameters: EndpointParameter[];
  requestBody?: {
    required: boolean;
    description?: string;
    schema: JsonSchema;
    contentType: string;
    binary: boolean;
  };
  annotations: {
    readOnlyHint: boolean;
    destructiveHint: boolean;
    openWorldHint: boolean;
  };
};

export const ENDPOINTS: Endpoint[] = [
  {
    name: "parse-document",
    title: "Parse Bytes",
    method: "POST",
    path: "/parse",
    description:
      "Parse Bytes — Converts raw text, source code, web/data, PDF, Microsoft Office, and image bytes into LLM-usable Markdown.",
    parameters: [
      {
        name: "extension",
        in: "query",
        required: false,
        description:
          "Optional file extension hint, such as pdf, docx, xlsx, pptx, html, json, csv, md, py, rtf, jpg, png, or txt.",
        schema: {
          type: "string",
          enum: [
            "txt",
            "text",
            "md",
            "markdown",
            "html",
            "htm",
            "xhtml",
            "xml",
            "rss",
            "atom",
            "csv",
            "tsv",
            "yaml",
            "yml",
            "py",
            "java",
            "js",
            "jsx",
            "mjs",
            "cjs",
            "json",
            "jsonl",
            "ndjson",
            "php",
            "sh",
            "bash",
            "zsh",
            "fish",
            "rb",
            "ts",
            "tsx",
            "rtf",
            "srt",
            "css",
            "scss",
            "less",
            "styl",
            "sass",
            "svg",
            "pdf",
            "docx",
            "doc",
            "xlsx",
            "xlsm",
            "xlsb",
            "xltx",
            "xltm",
            "xls",
            "pptx",
            "pptm",
            "ppsx",
            "ppsm",
            "potx",
            "potm",
            "ppt",
            "pps",
            "pot",
            "jpg",
            "jpeg",
            "jpe",
            "png",
            "gif",
            "bmp",
            "tiff",
            "tif",
            "webp",
            "ppm",
            "pbm",
            "pgm",
            "pnm",
          ],
          description:
            "Optional file extension hint, such as pdf, docx, xlsx, pptx, html, json, csv, md, py, rtf, jpg, png, or txt.",
        },
      },
      {
        name: "includeLinks",
        in: "query",
        required: false,
        description: "Preserve hyperlinks in Markdown output",
        schema: {
          anyOf: [
            {
              type: "boolean",
            },
            {
              type: "string",
              enum: ["true", "false"],
            },
          ],
          default: true,
          description: "Preserve hyperlinks in Markdown output",
        },
      },
      {
        name: "includeImages",
        in: "query",
        required: false,
        description: "Include image references in Markdown output",
        schema: {
          anyOf: [
            {
              type: "boolean",
            },
            {
              type: "string",
              enum: ["true", "false"],
            },
          ],
          default: false,
          description: "Include image references in Markdown output",
        },
      },
      {
        name: "shortenBase64Images",
        in: "query",
        required: false,
        description: "Shorten base64-encoded image data in the Markdown output",
        schema: {
          anyOf: [
            {
              type: "boolean",
            },
            {
              type: "string",
              enum: ["true", "false"],
            },
          ],
          default: true,
          description:
            "Shorten base64-encoded image data in the Markdown output",
        },
      },
      {
        name: "useMainContentOnly",
        in: "query",
        required: false,
        description: "Extract only the main content from HTML-like inputs",
        schema: {
          anyOf: [
            {
              type: "boolean",
            },
            {
              type: "string",
              enum: ["true", "false"],
            },
          ],
          default: false,
          description: "Extract only the main content from HTML-like inputs",
        },
      },
      {
        name: "ocr",
        in: "query",
        required: false,
        description:
          "When true for PDF inputs, detect and OCR images embedded in the selected pages, inserting recognized text at each image's position in page reading order while preserving the PDF text layer. pdf.start/pdf.end limit the inclusive page range. When false, all OCR is disabled, including the automatic scanned-PDF fallback.",
        schema: {
          anyOf: [
            {
              type: "boolean",
            },
            {
              type: "string",
              enum: ["true", "false"],
            },
          ],
          default: false,
          description:
            "When true for PDF inputs, detect and OCR images embedded in the selected pages, inserting recognized text at each image's position in page reading order while preserving the PDF text layer. pdf.start/pdf.end limit the inclusive page range. When false, all OCR is disabled, including the automatic scanned-PDF fallback.",
        },
      },
      {
        name: "pdf",
        in: "query",
        required: false,
        description:
          'PDF page-range options as a JSON object, e.g. {"start": 2, "end": 5}.',
        schema: {
          type: "object",
          properties: {
            start: {
              type: "integer",
              minimum: 1,
              description:
                "First 1-based PDF page to parse. When omitted, parsing starts at the first page.",
            },
            end: {
              type: "integer",
              minimum: 1,
              description:
                "Last 1-based PDF page to parse. When omitted, parsing ends at the last page. Must be greater than or equal to start when both are provided.",
            },
          },
          default: {},
          additionalProperties: false,
          description:
            'PDF page-range options as a JSON object, e.g. {"start": 2, "end": 5}.',
        },
      },
      {
        name: "client",
        in: "query",
        required: false,
        description: "Optional client identifier used for usage attribution.",
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 100,
          description: "Optional client identifier used for usage attribution.",
        },
      },
      {
        name: "zdr",
        in: "query",
        required: false,
        description:
          "Set to enabled to bypass shared caches and omit request and response content from retained usage logs. Requires zero data retention to be enabled for your organization (contact support@context.dev), otherwise the request fails with ZDR_NOT_ENABLED. Successful ZDR responses include X-Context-ZDR: true.",
        schema: {
          type: "string",
          enum: ["enabled", "disabled"],
          default: "disabled",
          description:
            "Set to enabled to bypass shared caches and omit request and response content from retained usage logs. Requires zero data retention to be enabled for your organization (contact support@context.dev), otherwise the request fails with ZDR_NOT_ENABLED. Successful ZDR responses include X-Context-ZDR: true.",
        },
      },
      {
        name: "tags",
        in: "query",
        required: false,
        description:
          "Optional comma-separated caller-defined tags for tracking this request. Tags are recorded on the request's usage log and can be used to filter usage on the dashboard usage page. Up to 20 tags, each 1-50 characters.",
        schema: {
          $ref: "#/components/schemas/RequestTags",
        },
      },
    ],
    requestBody: {
      required: true,
      description: "Raw file bytes. The request body must not exceed 25 MiB.",
      schema: {
        type: "string",
        format: "binary",
      },
      contentType: "application/octet-stream",
      binary: true,
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: true,
    },
  },
  {
    name: "web-scrape-html",
    title: "Scrape HTML",
    method: "GET",
    path: "/web/scrape/html",
    description:
      "Scrape HTML — Scrapes the given URL and returns the raw HTML content of the page. The base request costs 1 credit; requests with browser actions cost 2 credits.",
    parameters: [
      {
        name: "url",
        in: "query",
        required: true,
        description:
          "Full URL to scrape (must include http:// or https:// protocol)",
        schema: {
          type: "string",
          minLength: 1,
          format: "uri",
          description:
            "Full URL to scrape (must include http:// or https:// protocol)",
        },
      },
      {
        name: "pdf",
        in: "query",
        required: false,
        description:
          "PDF parsing controls. Use start/end to limit text extraction and embedded-image detection/OCR to an inclusive 1-based page range.",
        schema: {
          type: "object",
          properties: {
            shouldParse: {
              anyOf: [
                {
                  type: "boolean",
                },
                {
                  type: "string",
                  enum: ["true", "false"],
                },
              ],
              default: true,
              description:
                "When true, PDF URLs are fetched and parsed. When false, PDF URLs are skipped and a 400 WEBSITE_ACCESS_ERROR is returned.",
            },
            start: {
              type: "integer",
              minimum: 1,
              description:
                "First 1-based PDF page to parse. When omitted, parsing starts at the first page.",
            },
            end: {
              type: "integer",
              minimum: 1,
              description:
                "Last 1-based PDF page to parse. When omitted, parsing ends at the last page. Must be greater than or equal to start when both are provided.",
            },
            ocr: {
              anyOf: [
                {
                  type: "boolean",
                },
                {
                  type: "string",
                  enum: ["true", "false"],
                },
              ],
              default: false,
              description:
                "When true, detect and OCR images embedded in the selected PDF pages, inserting recognized text at each image's position in page reading order while preserving the PDF text layer. This is separate from automatic scanned-PDF OCR fallback.",
            },
          },
          default: {
            shouldParse: true,
            ocr: false,
          },
          description:
            "PDF parsing controls. Use start/end to limit text extraction and embedded-image detection/OCR to an inclusive 1-based page range.",
        },
      },
      {
        name: "includeFrames",
        in: "query",
        required: false,
        description:
          "When true, iframes are rendered inline into the returned HTML.",
        schema: {
          anyOf: [
            {
              type: "boolean",
            },
            {
              type: "string",
              enum: ["true", "false"],
            },
          ],
          default: false,
          description:
            "When true, iframes are rendered inline into the returned HTML.",
        },
      },
      {
        name: "useMainContentOnly",
        in: "query",
        required: false,
        description:
          "When true, return only the page's main content in the HTML response, excluding headers, footers, sidebars, and navigation when detectable.",
        schema: {
          anyOf: [
            {
              type: "boolean",
            },
            {
              type: "string",
              enum: ["true", "false"],
            },
          ],
          default: false,
          description:
            "When true, return only the page's main content in the HTML response, excluding headers, footers, sidebars, and navigation when detectable.",
        },
      },
      {
        name: "includeSelectors",
        in: "query",
        required: false,
        description:
          'CSS selectors. When provided, only matching subtrees (and their descendants) are kept and everything else is dropped. When omitted, the entire document is kept. Examples: "article.main", "#content", "[role=main]".',
        schema: {
          type: ["array", "null"],
          items: {
            type: "string",
            minLength: 1,
            maxLength: 2048,
          },
          maxItems: 50,
          description:
            'CSS selectors. When provided, only matching subtrees (and their descendants) are kept and everything else is dropped. When omitted, the entire document is kept. Examples: "article.main", "#content", "[role=main]".',
        },
      },
      {
        name: "excludeSelectors",
        in: "query",
        required: false,
        description:
          'CSS selectors to remove from the result. Applied after includeSelectors. Exclusion takes precedence: an element matching both is removed. Examples: "nav", "footer", ".ad-banner", "[aria-hidden=true]".',
        schema: {
          type: ["array", "null"],
          items: {
            type: "string",
            minLength: 1,
            maxLength: 2048,
          },
          maxItems: 50,
          description:
            'CSS selectors to remove from the result. Applied after includeSelectors. Exclusion takes precedence: an element matching both is removed. Examples: "nav", "footer", ".ad-banner", "[aria-hidden=true]".',
        },
      },
      {
        name: "maxAgeMs",
        in: "query",
        required: false,
        description:
          "Return a cached result if a prior scrape for the same parameters exists and is younger than this many milliseconds. Defaults to 1 day (86400000 ms) when omitted. Max is 30 days (2592000000 ms). Set to 0 to always scrape fresh.",
        schema: {
          type: ["integer", "null"],
          minimum: 0,
          maximum: 2592000000,
          default: 86400000,
          description:
            "Return a cached result if a prior scrape for the same parameters exists and is younger than this many milliseconds. Defaults to 1 day (86400000 ms) when omitted. Max is 30 days (2592000000 ms). Set to 0 to always scrape fresh.",
        },
      },
      {
        name: "waitForMs",
        in: "query",
        required: false,
        description:
          "Optional browser wait time in milliseconds after initial page load. Min: 0. Max: 30000 (30 seconds).",
        schema: {
          type: ["integer", "null"],
          minimum: 0,
          maximum: 30000,
          description:
            "Optional browser wait time in milliseconds after initial page load. Min: 0. Max: 30000 (30 seconds).",
        },
      },
      {
        name: "settleAnimations",
        in: "query",
        required: false,
        description:
          "When true, waits briefly for CSS and transition animations to settle before extracting HTML. Defaults to false. This adds a bit of latency in exchange for more stable output on animated pages.",
        schema: {
          anyOf: [
            {
              type: "boolean",
            },
            {
              type: "string",
              enum: ["true", "false"],
            },
          ],
          default: false,
          description:
            "When true, waits briefly for CSS and transition animations to settle before extracting HTML. Defaults to false. This adds a bit of latency in exchange for more stable output on animated pages.",
        },
      },
      {
        name: "actions",
        in: "query",
        required: false,
        description:
          "Optional browser actions executed in array order after the page loads and before content is captured. Requires a paid plan. Send a JSON array in the query parameter. Maximum: 5 actions.",
        schema: {
          type: ["array", "null"],
          items: {
            $ref: "#/components/schemas/WebScrapeAction",
          },
          maxItems: 5,
          description:
            "Optional browser actions executed in array order after the page loads and before content is captured. Requires a paid plan. Send a JSON array in the query parameter. Maximum: 5 actions.",
        },
      },
      {
        name: "headers",
        in: "query",
        required: false,
        description:
          "Optional outbound HTTP headers forwarded only to the target URL, sent as deep-object query params such as headers[X-Custom]=value. When provided, caching is bypassed: the result is neither read from nor written to cache.",
        schema: {
          type: "object",
          additionalProperties: {
            type: "string",
            maxLength: 8192,
            pattern: "^[^\\r\\n]*$",
          },
          description:
            "Optional outbound HTTP headers forwarded only to the target URL, sent as deep-object query params such as headers[X-Custom]=value. When provided, caching is bypassed: the result is neither read from nor written to cache.",
        },
      },
      {
        name: "country",
        in: "query",
        required: false,
        description:
          "Two-letter ISO 3166-1 alpha-2 country code identifying a supported Context.dev residential proxy exit location. Must be one of Context.dev's supported countries. When provided, Context.dev fetches the target page from that country.",
        schema: {
          $ref: "#/components/schemas/BrowserCountryCode",
        },
      },
      {
        name: "timeoutMS",
        in: "query",
        required: false,
        description:
          "Optional timeout in milliseconds for the request. If the request takes longer than this value, it will be aborted with a 408 status code. Maximum allowed value is 300000ms (5 minutes).",
        schema: {
          $ref: "#/components/schemas/LenientTimeoutMS",
        },
      },
      {
        name: "zdr",
        in: "query",
        required: false,
        description:
          "Set to enabled to bypass shared caches and omit request and response content from retained usage logs. Requires zero data retention to be enabled for your organization (contact support@context.dev), otherwise the request fails with ZDR_NOT_ENABLED. Successful ZDR responses include X-Context-ZDR: true.",
        schema: {
          type: "string",
          enum: ["enabled", "disabled"],
          default: "disabled",
          description:
            "Set to enabled to bypass shared caches and omit request and response content from retained usage logs. Requires zero data retention to be enabled for your organization (contact support@context.dev), otherwise the request fails with ZDR_NOT_ENABLED. Successful ZDR responses include X-Context-ZDR: true.",
        },
      },
      {
        name: "tags",
        in: "query",
        required: false,
        description:
          "Optional comma-separated caller-defined tags for tracking this request. Tags are recorded on the request's usage log and can be used to filter usage on the dashboard usage page. Up to 20 tags, each 1-50 characters.",
        schema: {
          $ref: "#/components/schemas/RequestTags",
        },
      },
    ],
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: true,
    },
  },
  {
    name: "web-scrape-markdown",
    title: "Scrape Markdown",
    method: "GET",
    path: "/web/scrape/markdown",
    description:
      "Scrape Markdown — Scrapes the given URL into LLM usable Markdown. Inspect key_metadata on JSON responses from a recognized API key; use error_code to distinguish stable failure categories. ### Billing & errors | HTTP status | Billed? | Meaning | | --- | --- | --- | | 200 | Yes — 1 credit, or 2 credits with actions | Successful scrape, including a zero-length result when includeSelectors matched nothing | | 400 | No | Invalid input, skipped PDF, or the page could not be scraped | | 401 / 403 | No | Invalid/disabled key, insufficient permissions, or credits exhausted; inspect error_code | | 404 | No | Target page returned or fingerprinted as not found | | 408 | No | Request timed out | | 415 | No | Unsupported content type | | 429 | No | Per-minute rate limit exceeded; honor Retry-After | | 500 | No | Internal error |",
    parameters: [
      {
        name: "url",
        in: "query",
        required: true,
        description:
          "Full URL to scrape into LLM usable Markdown (must include http:// or https:// protocol)",
        schema: {
          type: "string",
          minLength: 1,
          format: "uri",
          description:
            "Full URL to scrape into LLM usable Markdown (must include http:// or https:// protocol)",
        },
      },
      {
        name: "includeLinks",
        in: "query",
        required: false,
        description: "Preserve hyperlinks in Markdown output",
        schema: {
          anyOf: [
            {
              type: "boolean",
            },
            {
              type: "string",
              enum: ["true", "false"],
            },
          ],
          default: true,
          description: "Preserve hyperlinks in Markdown output",
        },
      },
      {
        name: "includeImages",
        in: "query",
        required: false,
        description: "Include image references in Markdown output",
        schema: {
          anyOf: [
            {
              type: "boolean",
            },
            {
              type: "string",
              enum: ["true", "false"],
            },
          ],
          default: false,
          description: "Include image references in Markdown output",
        },
      },
      {
        name: "shortenBase64Images",
        in: "query",
        required: false,
        description: "Shorten base64-encoded image data in the Markdown output",
        schema: {
          anyOf: [
            {
              type: "boolean",
            },
            {
              type: "string",
              enum: ["true", "false"],
            },
          ],
          default: true,
          description:
            "Shorten base64-encoded image data in the Markdown output",
        },
      },
      {
        name: "useMainContentOnly",
        in: "query",
        required: false,
        description:
          "Extract only the main content of the page, excluding headers, footers, sidebars, and navigation",
        schema: {
          anyOf: [
            {
              type: "boolean",
            },
            {
              type: "string",
              enum: ["true", "false"],
            },
          ],
          default: false,
          description:
            "Extract only the main content of the page, excluding headers, footers, sidebars, and navigation",
        },
      },
      {
        name: "pdf",
        in: "query",
        required: false,
        description:
          "PDF parsing controls. Use start/end to limit text extraction and embedded-image detection/OCR to an inclusive 1-based page range.",
        schema: {
          type: "object",
          properties: {
            shouldParse: {
              anyOf: [
                {
                  type: "boolean",
                },
                {
                  type: "string",
                  enum: ["true", "false"],
                },
              ],
              default: true,
              description:
                "When true, PDF URLs are fetched and parsed. When false, PDF URLs are skipped and a 400 WEBSITE_ACCESS_ERROR is returned.",
            },
            start: {
              type: "integer",
              minimum: 1,
              description:
                "First 1-based PDF page to parse. When omitted, parsing starts at the first page.",
            },
            end: {
              type: "integer",
              minimum: 1,
              description:
                "Last 1-based PDF page to parse. When omitted, parsing ends at the last page. Must be greater than or equal to start when both are provided.",
            },
            ocr: {
              anyOf: [
                {
                  type: "boolean",
                },
                {
                  type: "string",
                  enum: ["true", "false"],
                },
              ],
              default: false,
              description:
                "When true, detect and OCR images embedded in the selected PDF pages, inserting recognized text at each image's position in page reading order while preserving the PDF text layer. This is separate from automatic scanned-PDF OCR fallback.",
            },
          },
          default: {
            shouldParse: true,
            ocr: false,
          },
          description:
            "PDF parsing controls. Use start/end to limit text extraction and embedded-image detection/OCR to an inclusive 1-based page range.",
        },
      },
      {
        name: "includeFrames",
        in: "query",
        required: false,
        description:
          "When true, the contents of iframes are rendered to Markdown.",
        schema: {
          anyOf: [
            {
              type: "boolean",
            },
            {
              type: "string",
              enum: ["true", "false"],
            },
          ],
          default: false,
          description:
            "When true, the contents of iframes are rendered to Markdown.",
        },
      },
      {
        name: "includeSelectors",
        in: "query",
        required: false,
        description:
          'CSS selectors. When provided, only matching HTML subtrees (and their descendants) are kept before conversion to Markdown. When omitted, the entire document is kept. Examples: "article.main", "#content", "[role=main]".',
        schema: {
          type: ["array", "null"],
          items: {
            type: "string",
            minLength: 1,
            maxLength: 2048,
          },
          maxItems: 50,
          description:
            'CSS selectors. When provided, only matching HTML subtrees (and their descendants) are kept before conversion to Markdown. When omitted, the entire document is kept. Examples: "article.main", "#content", "[role=main]".',
        },
      },
      {
        name: "excludeSelectors",
        in: "query",
        required: false,
        description:
          'CSS selectors to remove before conversion to Markdown. Applied after includeSelectors. Exclusion takes precedence: an element matching both is removed. Examples: "nav", "footer", ".ad-banner", "[aria-hidden=true]".',
        schema: {
          type: ["array", "null"],
          items: {
            type: "string",
            minLength: 1,
            maxLength: 2048,
          },
          maxItems: 50,
          description:
            'CSS selectors to remove before conversion to Markdown. Applied after includeSelectors. Exclusion takes precedence: an element matching both is removed. Examples: "nav", "footer", ".ad-banner", "[aria-hidden=true]".',
        },
      },
      {
        name: "maxAgeMs",
        in: "query",
        required: false,
        description:
          "Return a cached result if a prior scrape for the same parameters exists and is younger than this many milliseconds. Defaults to 1 day (86400000 ms) when omitted. Max is 30 days (2592000000 ms). Set to 0 to always scrape fresh.",
        schema: {
          type: ["integer", "null"],
          minimum: 0,
          maximum: 2592000000,
          default: 86400000,
          description:
            "Return a cached result if a prior scrape for the same parameters exists and is younger than this many milliseconds. Defaults to 1 day (86400000 ms) when omitted. Max is 30 days (2592000000 ms). Set to 0 to always scrape fresh.",
        },
      },
      {
        name: "waitForMs",
        in: "query",
        required: false,
        description:
          "Optional browser wait time in milliseconds after initial page load before converting the page to Markdown. Min: 0. Max: 30000 (30 seconds).",
        schema: {
          type: ["integer", "null"],
          minimum: 0,
          maximum: 30000,
          description:
            "Optional browser wait time in milliseconds after initial page load before converting the page to Markdown. Min: 0. Max: 30000 (30 seconds).",
        },
      },
      {
        name: "settleAnimations",
        in: "query",
        required: false,
        description:
          "When true, waits briefly for CSS and transition animations to settle before converting to Markdown. Defaults to false. This adds a bit of latency in exchange for more stable output on animated pages.",
        schema: {
          anyOf: [
            {
              type: "boolean",
            },
            {
              type: "string",
              enum: ["true", "false"],
            },
          ],
          default: false,
          description:
            "When true, waits briefly for CSS and transition animations to settle before converting to Markdown. Defaults to false. This adds a bit of latency in exchange for more stable output on animated pages.",
        },
      },
      {
        name: "actions",
        in: "query",
        required: false,
        description:
          "Optional browser actions executed in array order after the page loads and before content is captured. Requires a paid plan. Send a JSON array in the query parameter. Maximum: 5 actions.",
        schema: {
          type: ["array", "null"],
          items: {
            $ref: "#/components/schemas/WebScrapeAction",
          },
          maxItems: 5,
          description:
            "Optional browser actions executed in array order after the page loads and before content is captured. Requires a paid plan. Send a JSON array in the query parameter. Maximum: 5 actions.",
        },
      },
      {
        name: "headers",
        in: "query",
        required: false,
        description:
          "Optional outbound HTTP headers forwarded only to the target URL, sent as deep-object query params such as headers[X-Custom]=value. When provided, caching is bypassed: the result is neither read from nor written to cache.",
        schema: {
          type: "object",
          additionalProperties: {
            type: "string",
            maxLength: 8192,
            pattern: "^[^\\r\\n]*$",
          },
          description:
            "Optional outbound HTTP headers forwarded only to the target URL, sent as deep-object query params such as headers[X-Custom]=value. When provided, caching is bypassed: the result is neither read from nor written to cache.",
        },
      },
      {
        name: "country",
        in: "query",
        required: false,
        description:
          "Two-letter ISO 3166-1 alpha-2 country code identifying a supported Context.dev residential proxy exit location. Must be one of Context.dev's supported countries. When provided, Context.dev fetches the target page from that country.",
        schema: {
          $ref: "#/components/schemas/BrowserCountryCode",
        },
      },
      {
        name: "timeoutMS",
        in: "query",
        required: false,
        description:
          "Optional timeout in milliseconds for the request. If the request takes longer than this value, it will be aborted with a 408 status code. Maximum allowed value is 300000ms (5 minutes).",
        schema: {
          $ref: "#/components/schemas/LenientTimeoutMS",
        },
      },
      {
        name: "zdr",
        in: "query",
        required: false,
        description:
          "Set to enabled to bypass shared caches and omit request and response content from retained usage logs. Requires zero data retention to be enabled for your organization (contact support@context.dev), otherwise the request fails with ZDR_NOT_ENABLED. Successful ZDR responses include X-Context-ZDR: true.",
        schema: {
          type: "string",
          enum: ["enabled", "disabled"],
          default: "disabled",
          description:
            "Set to enabled to bypass shared caches and omit request and response content from retained usage logs. Requires zero data retention to be enabled for your organization (contact support@context.dev), otherwise the request fails with ZDR_NOT_ENABLED. Successful ZDR responses include X-Context-ZDR: true.",
        },
      },
      {
        name: "tags",
        in: "query",
        required: false,
        description:
          "Optional comma-separated caller-defined tags for tracking this request. Tags are recorded on the request's usage log and can be used to filter usage on the dashboard usage page. Up to 20 tags, each 1-50 characters.",
        schema: {
          $ref: "#/components/schemas/RequestTags",
        },
      },
    ],
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: true,
    },
  },
  {
    name: "web-scrape-images",
    title: "Scrape Images",
    method: "GET",
    path: "/web/scrape/images",
    description:
      "Scrape Images — Extract image assets from a web page, including standard URLs, inline SVGs, data URIs, responsive image sources, metadata, CSS backgrounds, video posters, and embeds. The base request costs 1 credit, or 2 credits with browser actions. When enrichment is enabled, the entire call costs 5 credits, including requests that also use actions.",
    parameters: [
      {
        name: "url",
        in: "query",
        required: true,
        description: "Page URL to inspect. Must include http:// or https://.",
        schema: {
          type: "string",
          minLength: 1,
          format: "uri",
          description: "Page URL to inspect. Must include http:// or https://.",
        },
      },
      {
        name: "maxAgeMs",
        in: "query",
        required: false,
        description:
          "Reuse a cached result this many milliseconds old or newer. Default: 86400000 (1 day). Set to 0 to bypass cache. Maximum: 2592000000 (30 days).",
        schema: {
          type: ["integer", "null"],
          minimum: 0,
          maximum: 2592000000,
          default: 86400000,
          description:
            "Reuse a cached result this many milliseconds old or newer. Default: 86400000 (1 day). Set to 0 to bypass cache. Maximum: 2592000000 (30 days).",
        },
      },
      {
        name: "enrichment",
        in: "query",
        required: false,
        description:
          "Optional per-image processing, sent as deep-object query params such as enrichment[resolution]=true.",
        schema: {
          type: ["object", "null"],
          properties: {
            resolution: {
              anyOf: [
                {
                  type: "boolean",
                },
                {
                  type: "string",
                  enum: ["true", "false"],
                },
              ],
              default: false,
              description: "Measure image width and height when possible.",
            },
            hostedUrl: {
              anyOf: [
                {
                  type: "boolean",
                },
                {
                  type: "string",
                  enum: ["true", "false"],
                },
              ],
              default: false,
              description:
                "Host materializable images on the Brand.dev CDN and return their URL and MIME type.",
            },
            classification: {
              anyOf: [
                {
                  type: "boolean",
                },
                {
                  type: "string",
                  enum: ["true", "false"],
                },
              ],
              default: false,
              description: "Classify each image by visual asset type.",
            },
            maxTimePerMs: {
              type: "integer",
              minimum: 1,
              maximum: 60000,
              default: 30000,
              description:
                "Per-image enrichment timeout in milliseconds. Default: 30000. Maximum: 60000.",
            },
          },
          additionalProperties: false,
          description:
            "Optional per-image processing, sent as deep-object query params such as enrichment[resolution]=true.",
        },
      },
      {
        name: "dedupe",
        in: "query",
        required: false,
        description:
          "When true, visually duplicate images are removed: every image is loaded and perceptually hashed, and only the highest-resolution copy of each duplicate group is kept. Images that cannot be downloaded or hashed are kept. Default: false.",
        schema: {
          anyOf: [
            {
              type: "boolean",
            },
            {
              type: "string",
              enum: ["true", "false"],
            },
          ],
          default: false,
          description:
            "When true, visually duplicate images are removed: every image is loaded and perceptually hashed, and only the highest-resolution copy of each duplicate group is kept. Images that cannot be downloaded or hashed are kept. Default: false.",
        },
      },
      {
        name: "waitForMs",
        in: "query",
        required: false,
        description:
          "Optional browser wait time in milliseconds after initial page load before collecting images. Min: 0. Max: 30000 (30 seconds).",
        schema: {
          type: ["integer", "null"],
          minimum: 0,
          maximum: 30000,
          description:
            "Optional browser wait time in milliseconds after initial page load before collecting images. Min: 0. Max: 30000 (30 seconds).",
        },
      },
      {
        name: "actions",
        in: "query",
        required: false,
        description:
          "Optional browser actions executed in array order after the page loads and before content is captured. Requires a paid plan. Send a JSON array in the query parameter. Maximum: 5 actions.",
        schema: {
          type: ["array", "null"],
          items: {
            $ref: "#/components/schemas/WebScrapeAction",
          },
          maxItems: 5,
          description:
            "Optional browser actions executed in array order after the page loads and before content is captured. Requires a paid plan. Send a JSON array in the query parameter. Maximum: 5 actions.",
        },
      },
      {
        name: "headers",
        in: "query",
        required: false,
        description:
          "Optional outbound HTTP headers forwarded only to the target URL, sent as deep-object query params such as headers[X-Custom]=value. When provided, caching is bypassed: the result is neither read from nor written to cache.",
        schema: {
          type: "object",
          additionalProperties: {
            type: "string",
            maxLength: 8192,
            pattern: "^[^\\r\\n]*$",
          },
          description:
            "Optional outbound HTTP headers forwarded only to the target URL, sent as deep-object query params such as headers[X-Custom]=value. When provided, caching is bypassed: the result is neither read from nor written to cache.",
        },
      },
      {
        name: "timeoutMS",
        in: "query",
        required: false,
        description:
          "Optional timeout in milliseconds for the request. If the request takes longer than this value, it will be aborted with a 408 status code. Maximum allowed value is 300000ms (5 minutes).",
        schema: {
          $ref: "#/components/schemas/LenientTimeoutMS",
        },
      },
      {
        name: "tags",
        in: "query",
        required: false,
        description:
          "Optional comma-separated caller-defined tags for tracking this request. Tags are recorded on the request's usage log and can be used to filter usage on the dashboard usage page. Up to 20 tags, each 1-50 characters.",
        schema: {
          $ref: "#/components/schemas/RequestTags",
        },
      },
    ],
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: true,
    },
  },
  {
    name: "web-scrape-sitemap",
    title: "Crawl Sitemap",
    method: "GET",
    path: "/web/scrape/sitemap",
    description:
      "Crawl Sitemap — Crawl an entire website's sitemap and return all discovered page URLs.",
    parameters: [
      {
        name: "domain",
        in: "query",
        required: true,
        description: "Domain to build a sitemap for",
        schema: {
          type: "string",
          minLength: 3,
          description: "Domain to build a sitemap for",
        },
      },
      {
        name: "maxLinks",
        in: "query",
        required: false,
        description:
          "Maximum number of links to return from the sitemap crawl. Defaults to 10,000. Minimum is 1, maximum is 100,000.",
        schema: {
          type: "integer",
          minimum: 1,
          maximum: 100000,
          default: 10000,
          description:
            "Maximum number of links to return from the sitemap crawl. Defaults to 10,000. Minimum is 1, maximum is 100,000.",
        },
      },
      {
        name: "sitemapUrl",
        in: "query",
        required: false,
        description:
          "Optional explicit sitemap URL. When provided, exactly this sitemap is crawled instead of discovering the domain's sitemaps.",
        schema: {
          type: "string",
          format: "uri",
          description:
            "Optional explicit sitemap URL. When provided, exactly this sitemap is crawled instead of discovering the domain's sitemaps.",
        },
      },
      {
        name: "urlRegex",
        in: "query",
        required: false,
        description:
          "Optional RE2-compatible regex pattern. Only URLs matching this pattern are returned and counted against maxLinks.",
        schema: {
          type: "string",
          maxLength: 256,
          description:
            "Optional RE2-compatible regex pattern. Only URLs matching this pattern are returned and counted against maxLinks.",
          example: "^https?://[^/]+/blog/",
        },
      },
      {
        name: "headers",
        in: "query",
        required: false,
        description:
          "Optional outbound HTTP headers forwarded only to the target URL, sent as deep-object query params such as headers[X-Custom]=value. When provided, caching is bypassed: the result is neither read from nor written to cache.",
        schema: {
          type: "object",
          additionalProperties: {
            type: "string",
            maxLength: 8192,
            pattern: "^[^\\r\\n]*$",
          },
          description:
            "Optional outbound HTTP headers forwarded only to the target URL, sent as deep-object query params such as headers[X-Custom]=value. When provided, caching is bypassed: the result is neither read from nor written to cache.",
        },
      },
      {
        name: "timeoutMS",
        in: "query",
        required: false,
        description:
          "Optional timeout in milliseconds for the request. If the request takes longer than this value, it will be aborted with a 408 status code. Maximum allowed value is 300000ms (5 minutes).",
        schema: {
          $ref: "#/components/schemas/LenientTimeoutMS",
        },
      },
      {
        name: "zdr",
        in: "query",
        required: false,
        description:
          "Set to enabled to bypass shared caches and omit request and response content from retained usage logs. Requires zero data retention to be enabled for your organization (contact support@context.dev), otherwise the request fails with ZDR_NOT_ENABLED. Successful ZDR responses include X-Context-ZDR: true.",
        schema: {
          type: "string",
          enum: ["enabled", "disabled"],
          default: "disabled",
          description:
            "Set to enabled to bypass shared caches and omit request and response content from retained usage logs. Requires zero data retention to be enabled for your organization (contact support@context.dev), otherwise the request fails with ZDR_NOT_ENABLED. Successful ZDR responses include X-Context-ZDR: true.",
        },
      },
      {
        name: "tags",
        in: "query",
        required: false,
        description:
          "Optional comma-separated caller-defined tags for tracking this request. Tags are recorded on the request's usage log and can be used to filter usage on the dashboard usage page. Up to 20 tags, each 1-50 characters.",
        schema: {
          $ref: "#/components/schemas/RequestTags",
        },
      },
    ],
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: true,
    },
  },
  {
    name: "web-crawl",
    title: "Crawl Website & Scrape Markdown",
    method: "POST",
    path: "/web/crawl",
    description:
      "Crawl Website & Scrape Markdown — Performs a crawl starting from a given URL, extracts page content as Markdown, and returns results for all crawled pages.",
    parameters: [],
    requestBody: {
      required: true,
      schema: {
        type: "object",
        properties: {
          url: {
            type: "string",
            format: "uri",
            description:
              "The starting URL for the crawl (must include http:// or https:// protocol)",
          },
          maxPages: {
            type: "integer",
            minimum: 1,
            maximum: 500,
            default: 100,
            description: "Maximum number of pages to crawl. Hard cap: 500.",
          },
          maxDepth: {
            type: "integer",
            minimum: 0,
            description:
              "Maximum link depth from the starting URL (0 = only the starting page)",
          },
          urlRegex: {
            type: "string",
            description:
              "Regex pattern. Only URLs matching this pattern will be followed and scraped.",
            example: "^https?://[^/]+/blog/",
          },
          includeLinks: {
            type: "boolean",
            default: true,
            description: "Preserve hyperlinks in the Markdown output",
          },
          includeImages: {
            type: "boolean",
            default: false,
            description: "Include image references in the Markdown output",
          },
          shortenBase64Images: {
            type: "boolean",
            default: true,
            description:
              "Truncate base64-encoded image data in the Markdown output",
          },
          useMainContentOnly: {
            type: "boolean",
            default: false,
            description:
              "Extract only the main content, stripping headers, footers, sidebars, and navigation",
          },
          followSubdomains: {
            type: "boolean",
            default: false,
            description:
              "When true, follow links on subdomains of the starting URL's domain (e.g. docs.example.com when starting from example.com). www and apex are always treated as equivalent.",
          },
          pdf: {
            type: "object",
            properties: {
              shouldParse: {
                type: "boolean",
                default: true,
                description:
                  "When true, PDF pages are fetched and parsed. When false, PDF pages are skipped entirely (not included in results and not counted as failures).",
              },
              ocr: {
                type: "boolean",
                default: false,
                description:
                  "When true, detect and OCR images embedded in the selected PDF pages, inserting recognized text at each image's position in page reading order while preserving the PDF text layer. This is separate from automatic scanned-PDF OCR fallback.",
              },
              start: {
                type: "integer",
                minimum: 1,
                description:
                  "First 1-based PDF page to parse. When omitted, parsing starts at the first page.",
              },
              end: {
                type: "integer",
                minimum: 1,
                description:
                  "Last 1-based PDF page to parse. When omitted, parsing ends at the last page. Must be greater than or equal to start when both are provided.",
              },
            },
            additionalProperties: false,
            default: {
              shouldParse: true,
              ocr: false,
            },
            description:
              "PDF parsing controls. Use start/end to limit text extraction and embedded-image detection/OCR to an inclusive 1-based page range.",
          },
          includeFrames: {
            type: "boolean",
            default: false,
            description:
              "When true, the contents of iframes are rendered to Markdown for each crawled page.",
          },
          includeSelectors: {
            type: "array",
            maxItems: 50,
            items: {
              type: "string",
              maxLength: 2048,
            },
            description:
              'CSS selectors. When provided, only matching HTML subtrees (and their descendants) are kept before each crawled page is converted to Markdown. When omitted, the entire document is kept. Examples: "article.main", "#content", "[role=main]".',
          },
          excludeSelectors: {
            type: "array",
            maxItems: 50,
            items: {
              type: "string",
              maxLength: 2048,
            },
            description:
              'CSS selectors to remove before each crawled page is converted to Markdown. Applied after includeSelectors. Exclusion takes precedence: an element matching both is removed. Examples: "nav", "footer", ".ad-banner", "[aria-hidden=true]".',
          },
          maxAgeMs: {
            type: "integer",
            minimum: 0,
            maximum: 2592000000,
            default: 86400000,
            description:
              "Return a cached result if a prior scrape for the same parameters exists and is younger than this many milliseconds. Defaults to 1 day (86400000 ms) when omitted. Max is 30 days (2592000000 ms). Set to 0 to always scrape fresh.",
          },
          waitForMs: {
            type: "integer",
            minimum: 0,
            maximum: 30000,
            description:
              "Optional browser wait time in milliseconds after initial page load for each crawled page. Min: 0. Max: 30000 (30 seconds). ",
          },
          settleAnimations: {
            type: "boolean",
            default: false,
            description:
              "When true, waits briefly for CSS and transition animations to settle before extracting each crawled page. Defaults to false. This adds a bit of latency in exchange for more stable output on animated pages.",
          },
          stopAfterMs: {
            type: "integer",
            minimum: 10000,
            maximum: 110000,
            default: 80000,
            description:
              "Soft time budget for the crawl in milliseconds. After each scrape, the crawler checks the elapsed time and, if exceeded, returns the pages collected so far instead of continuing. Min: 10000 (10s). Max: 110000 (110s). Default: 80000 (80s).",
          },
          country: {
            $ref: "#/components/schemas/BrowserCountryCode",
          },
          timeoutMS: {
            $ref: "#/components/schemas/TimeoutMS",
          },
          zdr: {
            type: "string",
            enum: ["enabled", "disabled"],
            default: "disabled",
            description:
              "Set to enabled to bypass shared caches and omit request and response content from retained usage logs. Requires zero data retention to be enabled for your organization (contact support@context.dev), otherwise the request fails with ZDR_NOT_ENABLED. Successful ZDR responses include X-Context-ZDR: true.",
          },
          tags: {
            $ref: "#/components/schemas/RequestTags",
          },
        },
        required: ["url"],
      },
      contentType: "application/json",
      binary: false,
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: true,
    },
  },
  {
    name: "web-extract",
    title: "Extract Structured Website Data",
    method: "POST",
    path: "/web/extract",
    description:
      "Extract Structured Website Data — Crawl a website, use the provided JSON Schema and instructions to prioritize relevant internal links, and extract structured data from the selected pages.",
    parameters: [],
    requestBody: {
      required: true,
      schema: {
        type: "object",
        properties: {
          url: {
            type: "string",
            format: "uri",
            description:
              "The starting website URL to crawl and extract from. Must include http:// or https://.",
          },
          schema: {
            type: "object",
            description:
              "JSON Schema for the returned data object. TypeScript Zod users can pass a JSON Schema generated from a Zod object; Python users can pass the equivalent JSON Schema object.",
            additionalProperties: true,
            example: {
              type: "object",
              properties: {
                mission_statement: {
                  type: "string",
                  description: "The company's stated mission.",
                },
                case_studies: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: {
                        type: "string",
                      },
                      url: {
                        type: "string",
                      },
                    },
                    required: ["title", "url"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["mission_statement", "case_studies"],
              additionalProperties: false,
            },
          },
          instructions: {
            type: "string",
            maxLength: 2000,
            description:
              "Optional extraction guidance, such as which facts to prioritize or how to interpret fields in the schema.",
          },
          factCheck: {
            type: "boolean",
            default: false,
            description:
              "When true, every returned value must be grounded in facts stated on the page; fields that cannot be supported by the page are returned as null/empty. When false (default), the model may make reasonable inferences and derivations from the page content (e.g. ideal customer, competitor analysis, recommendations) while keeping verifiable specifics (names, quotes, URLs, dates, metrics) faithful to the source.",
          },
          followSubdomains: {
            type: "boolean",
            default: false,
            description:
              "When true, follow links on subdomains of the starting URL's domain.",
          },
          maxPages: {
            type: "integer",
            minimum: 1,
            maximum: 50,
            default: 5,
            description:
              "Maximum number of pages to analyze for extraction. Hard cap: 50. Defaults to 5.",
          },
          maxDepth: {
            type: "integer",
            minimum: 0,
            description:
              "Optional maximum link depth from the starting URL (0 = only the starting page). If omitted, there is no crawl depth limit.",
          },
          pdf: {
            type: "object",
            properties: {
              shouldParse: {
                type: "boolean",
                default: true,
                description:
                  "When true, PDF pages are fetched and parsed. When false, PDF pages are skipped.",
              },
              start: {
                type: "integer",
                minimum: 1,
                description: "First 1-based PDF page to parse.",
              },
              end: {
                type: "integer",
                minimum: 1,
                description:
                  "Last 1-based PDF page to parse. Must be greater than or equal to start when both are provided.",
              },
            },
            additionalProperties: false,
            default: {
              shouldParse: true,
            },
          },
          includeFrames: {
            type: "boolean",
            default: false,
            description:
              "When true, iframe contents are included in Markdown before extraction.",
          },
          maxAgeMs: {
            type: "integer",
            minimum: 0,
            maximum: 2592000000,
            default: 604800000,
            description:
              "Return cached scrape results if a prior scrape for the same parameters is younger than this many milliseconds. Defaults to 7 days (604800000 ms).",
          },
          waitForMs: {
            type: "integer",
            minimum: 0,
            maximum: 30000,
            description:
              "Optional browser wait time in milliseconds after initial page load for each crawled page.",
          },
          settleAnimations: {
            type: "boolean",
            default: false,
            description:
              "When true, waits briefly for CSS and transition animations to settle before extracting each crawled page. Defaults to false. This adds a bit of latency in exchange for more stable output on animated pages.",
          },
          stopAfterMs: {
            type: "integer",
            minimum: 10000,
            maximum: 110000,
            default: 80000,
            description:
              "Soft time budget for the crawl in milliseconds. Min: 10000 (10s). Max: 110000 (110s). Default: 80000 (80s).",
          },
          timeoutMS: {
            $ref: "#/components/schemas/TimeoutMS",
          },
          tags: {
            $ref: "#/components/schemas/RequestTags",
          },
        },
        required: ["url", "schema"],
        additionalProperties: false,
      },
      contentType: "application/json",
      binary: false,
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: true,
    },
  },
  {
    name: "web-search",
    title: "Web Search",
    method: "POST",
    path: "/web/search",
    description:
      "Web Search — Search the web and optionally scrape each result to Markdown in one round-trip.",
    parameters: [],
    requestBody: {
      required: true,
      schema: {
        type: "object",
        properties: {
          query: {
            type: "string",
            minLength: 1,
            maxLength: 500,
            description:
              "Search query. Accepts natural language as well as Google-style search operators such as `site:`, `-site:`, `inurl:`, `intitle:`, quoted phrases, and `OR`.",
          },
          numResults: {
            type: "integer",
            minimum: 10,
            maximum: 100,
            default: 10,
            description:
              "Number of results to request and return (10–100). Defaults to 10.",
          },
          includeDomains: {
            type: "array",
            items: {
              type: "string",
            },
            description:
              'Allowlist — only return results from these domains. Example: ["arxiv.org", "github.com"].',
          },
          excludeDomains: {
            type: "array",
            items: {
              type: "string",
            },
            description:
              'Blocklist — drop results from these domains. Example: ["pinterest.com", "reddit.com"].',
          },
          freshness: {
            type: "string",
            enum: ["last_24_hours", "last_week", "last_month", "last_year"],
            description:
              "Restrict results to content published within this window.",
          },
          country: {
            type: "string",
            enum: [
              "af",
              "al",
              "dz",
              "as",
              "ad",
              "ao",
              "ai",
              "aq",
              "ag",
              "ar",
              "am",
              "aw",
              "au",
              "at",
              "az",
              "bs",
              "bh",
              "bd",
              "bb",
              "by",
              "be",
              "bz",
              "bj",
              "bm",
              "bt",
              "bo",
              "ba",
              "bw",
              "bv",
              "br",
              "io",
              "bn",
              "bg",
              "bf",
              "bi",
              "kh",
              "cm",
              "ca",
              "cv",
              "ky",
              "cf",
              "td",
              "cl",
              "cn",
              "cx",
              "cc",
              "co",
              "km",
              "cg",
              "cd",
              "ck",
              "cr",
              "ci",
              "hr",
              "cu",
              "cy",
              "cz",
              "dk",
              "dj",
              "dm",
              "do",
              "ec",
              "eg",
              "sv",
              "gq",
              "er",
              "ee",
              "et",
              "fk",
              "fo",
              "fj",
              "fi",
              "fr",
              "gf",
              "pf",
              "tf",
              "ga",
              "gm",
              "ge",
              "de",
              "gh",
              "gi",
              "gr",
              "gl",
              "gd",
              "gp",
              "gu",
              "gt",
              "gn",
              "gw",
              "gy",
              "ht",
              "hm",
              "va",
              "hn",
              "hk",
              "hu",
              "is",
              "in",
              "id",
              "ir",
              "iq",
              "ie",
              "il",
              "it",
              "jm",
              "jp",
              "jo",
              "kz",
              "ke",
              "ki",
              "kp",
              "kr",
              "kw",
              "kg",
              "la",
              "lv",
              "lb",
              "ls",
              "lr",
              "ly",
              "li",
              "lt",
              "lu",
              "mo",
              "mk",
              "mg",
              "mw",
              "my",
              "mv",
              "ml",
              "mt",
              "mh",
              "mq",
              "mr",
              "mu",
              "yt",
              "mx",
              "fm",
              "md",
              "mc",
              "mn",
              "ms",
              "ma",
              "mz",
              "mm",
              "na",
              "nr",
              "np",
              "nl",
              "an",
              "nc",
              "nz",
              "ni",
              "ne",
              "ng",
              "nu",
              "nf",
              "mp",
              "no",
              "om",
              "pk",
              "pw",
              "ps",
              "pa",
              "pg",
              "py",
              "pe",
              "ph",
              "pn",
              "pl",
              "pt",
              "pr",
              "qa",
              "re",
              "ro",
              "ru",
              "rw",
              "sh",
              "kn",
              "lc",
              "pm",
              "vc",
              "ws",
              "sm",
              "st",
              "sa",
              "sn",
              "rs",
              "sc",
              "sl",
              "sg",
              "sk",
              "si",
              "sb",
              "so",
              "za",
              "gs",
              "es",
              "lk",
              "sd",
              "sr",
              "sj",
              "sz",
              "se",
              "ch",
              "sy",
              "tw",
              "tj",
              "tz",
              "th",
              "tl",
              "tg",
              "tk",
              "to",
              "tt",
              "tn",
              "tr",
              "tm",
              "tc",
              "tv",
              "ug",
              "ua",
              "ae",
              "gb",
              "us",
              "um",
              "uy",
              "uz",
              "vu",
              "ve",
              "vn",
              "vg",
              "vi",
              "wf",
              "eh",
              "ye",
              "zm",
              "zw",
            ],
            description:
              'Two-letter ISO 3166-1 alpha-2 country code to localize results to a specific country (maps to Google\'s `gl` parameter). Example: "us", "gb", "de".',
          },
          queryFanout: {
            type: "boolean",
            description:
              "Expand the query into multiple parallel variants for broader recall.",
          },
          markdownOptions: {
            type: "object",
            additionalProperties: false,
            description:
              "Inline Markdown scraping for each result. Set `enabled: true` to activate.",
            properties: {
              enabled: {
                type: "boolean",
                default: false,
                description:
                  "Scrape each result to Markdown. Off by default to keep search cheap and fast.",
              },
              includeLinks: {
                type: "boolean",
                default: true,
                description: "Keep hyperlinks in the Markdown.",
              },
              includeImages: {
                type: "boolean",
                default: false,
                description: "Emit image references in the Markdown.",
              },
              shortenBase64Images: {
                type: "boolean",
                default: true,
                description:
                  "Truncate inline base64 image payloads to keep responses small.",
              },
              useMainContentOnly: {
                type: "boolean",
                default: false,
                description:
                  "Strip nav, header, footer, and sidebar — keep only the primary article content.",
              },
              pdf: {
                type: "object",
                properties: {
                  shouldParse: {
                    type: "boolean",
                    default: true,
                    description:
                      "Parse PDF URLs. When false, PDF results are skipped with WEBSITE_ACCESS_ERROR.",
                  },
                  start: {
                    type: "integer",
                    minimum: 1,
                    description:
                      "First PDF page to parse (1-based, inclusive). Defaults to page 1.",
                  },
                  end: {
                    type: "integer",
                    minimum: 1,
                    description:
                      "Last PDF page to parse (1-based, inclusive). Defaults to the final page. Must be >= start.",
                  },
                },
                additionalProperties: false,
                default: {
                  shouldParse: true,
                },
                description:
                  "PDF handling. Use start/end to bound text extraction and OCR to a page range.",
              },
              includeFrames: {
                type: "boolean",
                default: false,
                description: "Render iframe contents into the Markdown.",
              },
              maxAgeMs: {
                type: "integer",
                minimum: 0,
                maximum: 2592000000,
                default: 86400000,
                description:
                  "Cache TTL in ms for scraped Markdown keyed by URL + options. Default 1 day, max 30 days. Set to 0 to force a fresh scrape.",
              },
              waitForMs: {
                type: "integer",
                minimum: 0,
                maximum: 30000,
                description:
                  "Extra wait after page load before rendering, in ms (0–30000). Useful for JS-heavy pages.",
              },
              timeoutMS: {
                $ref: "#/components/schemas/TimeoutMS",
              },
            },
          },
          timeoutMS: {
            $ref: "#/components/schemas/TimeoutMS",
          },
          tags: {
            $ref: "#/components/schemas/RequestTags",
          },
        },
        required: ["query"],
        additionalProperties: false,
      },
      contentType: "application/json",
      binary: false,
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: true,
    },
  },
  {
    name: "web-competitors",
    title: "Find website competitors",
    method: "GET",
    path: "/web/competitors",
    description:
      "Find website competitors — Analyze a company's landing page and web search evidence to return direct competitors for the same product or market.",
    parameters: [
      {
        name: "domain",
        in: "query",
        required: true,
        description:
          "Company domain to analyze, such as `stripe.com`. Full http(s) URLs are accepted and normalized to their domain.",
        schema: {
          type: "string",
          minLength: 3,
          description:
            "Company domain to analyze, such as `stripe.com`. Full http(s) URLs are accepted and normalized to their domain.",
        },
      },
      {
        name: "numCompetitors",
        in: "query",
        required: false,
        description:
          "Exact number of direct competitors to return. Defaults to 5.",
        schema: {
          type: "integer",
          minimum: 1,
          maximum: 10,
          default: 5,
          description:
            "Exact number of direct competitors to return. Defaults to 5.",
        },
      },
      {
        name: "timeoutMS",
        in: "query",
        required: false,
        description:
          "Optional timeout in milliseconds for the request. If the request takes longer than this value, it will be aborted with a 408 status code. Maximum allowed value is 300000ms (5 minutes).",
        schema: {
          $ref: "#/components/schemas/TimeoutMS",
        },
      },
      {
        name: "tags",
        in: "query",
        required: false,
        description:
          "Optional comma-separated caller-defined tags for tracking this request. Tags are recorded on the request's usage log and can be used to filter usage on the dashboard usage page. Up to 20 tags, each 1-50 characters.",
        schema: {
          $ref: "#/components/schemas/RequestTags",
        },
      },
    ],
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: true,
    },
  },
  {
    name: "people-retrieve",
    title: "Retrieve Person",
    method: "POST",
    path: "/people/retrieve",
    description:
      "Retrieve Person — Retrieve and normalize a person profile from identifiers.",
    parameters: [],
    requestBody: {
      required: true,
      schema: {
        $ref: "#/components/schemas/PersonRetrieveRequest",
      },
      contentType: "application/json",
      binary: false,
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: true,
    },
  },
  {
    name: "brand-retrieve",
    title: "Retrieve brand data by domain",
    method: "GET",
    path: "/brand/retrieve",
    description:
      "Retrieve brand data by domain — Retrieve logos, backdrops, colors, industry, description, and more from any domain",
    parameters: [
      {
        name: "domain",
        in: "query",
        required: false,
        description:
          "Domain name to retrieve brand data for (e.g., 'example.com', 'google.com'). Cannot be used with name or ticker parameters.",
        schema: {
          type: "string",
          minLength: 3,
          description:
            "Domain name to retrieve brand data for (e.g., 'example.com', 'google.com'). Cannot be used with name or ticker parameters.",
        },
      },
      {
        name: "name",
        in: "query",
        required: false,
        description:
          "Company name to retrieve brand data for (e.g., 'Apple Inc'). Cannot be used with domain or ticker parameters.",
        schema: {
          type: "string",
          minLength: 3,
          maxLength: 30,
          description:
            "Company name to retrieve brand data for (e.g., 'Apple Inc'). Cannot be used with domain or ticker parameters.",
        },
      },
      {
        name: "ticker",
        in: "query",
        required: false,
        description:
          "Stock ticker symbol to retrieve brand data for (e.g., 'AAPL'). Cannot be used with domain or name parameters.",
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 15,
          pattern: "^[A-Za-z0-9.]+$",
          description:
            "Stock ticker symbol to retrieve brand data for (e.g., 'AAPL'). Cannot be used with domain or name parameters.",
        },
      },
      {
        name: "ticker_exchange",
        in: "query",
        required: false,
        description: "Stock exchange code.",
        schema: {
          $ref: "#/components/schemas/StockExchange",
        },
      },
      {
        name: "force_language",
        in: "query",
        required: false,
        description: "Language to force for the retrieved brand data.",
        schema: {
          allOf: [
            {
              $ref: "#/components/schemas/SupportedLanguage",
            },
            {
              type: ["string", "null"],
            },
          ],
        },
      },
      {
        name: "maxSpeed",
        in: "query",
        required: false,
        description:
          "Optional parameter to optimize the API call for maximum speed. When set to true, the API will skip time-consuming operations for faster response at the cost of less comprehensive data. Works with all three lookup methods.",
        schema: {
          anyOf: [
            {
              type: "boolean",
            },
            {
              type: "string",
              enum: ["true", "false"],
            },
          ],
          default: false,
          description:
            "Optional parameter to optimize the API call for maximum speed. When set to true, the API will skip time-consuming operations for faster response at the cost of less comprehensive data. Works with all three lookup methods.",
        },
      },
      {
        name: "maxAgeMs",
        in: "query",
        required: false,
        description:
          "Maximum age in milliseconds for cached brand data before the API performs a hard refresh. Defaults to 3 months (7776000000 ms). Values below 1 day (86400000 ms) are clamped to 1 day; values above 1 year (31536000000 ms) are clamped to 1 year.",
        schema: {
          type: ["integer", "null"],
          default: 7776000000,
          description:
            "Maximum age in milliseconds for cached brand data before the API performs a hard refresh. Defaults to 3 months (7776000000 ms). Values below 1 day (86400000 ms) are clamped to 1 day; values above 1 year (31536000000 ms) are clamped to 1 year.",
        },
      },
      {
        name: "timeoutMS",
        in: "query",
        required: false,
        description:
          "Optional timeout in milliseconds for the request. If the request takes longer than this value, it will be aborted with a 408 status code. Maximum allowed value is 300000ms (5 minutes).",
        schema: {
          $ref: "#/components/schemas/TimeoutMS",
        },
      },
      {
        name: "tags",
        in: "query",
        required: false,
        description:
          "Optional comma-separated caller-defined tags for tracking this request. Tags are recorded on the request's usage log and can be used to filter usage on the dashboard usage page. Up to 20 tags, each 1-50 characters.",
        schema: {
          $ref: "#/components/schemas/RequestTags",
        },
      },
    ],
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: true,
    },
  },
  {
    name: "brand-retrieve-unified",
    title: "Retrieve brand data",
    method: "POST",
    path: "/brand/retrieve",
    description:
      "Retrieve brand data — Retrieve logos, backdrops, colors, industry, description, and more. Provide exactly one lookup identifier in the request body: a domain, company name, email address, stock ticker, transaction descriptor, or direct URL. Note: `by_direct_url` fetches brand data only from the provided URL — not from the entire internet.",
    parameters: [],
    requestBody: {
      required: true,
      schema: {
        $ref: "#/components/schemas/BrandRetrieveRequest",
      },
      contentType: "application/json",
      binary: false,
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: true,
    },
  },
  {
    name: "brand-retrieve-by-name",
    title: "Retrieve brand data by company name",
    method: "GET",
    path: "/brand/retrieve-by-name",
    description:
      "Retrieve brand data by company name — Retrieve brand information using a company name.",
    parameters: [
      {
        name: "name",
        in: "query",
        required: true,
        description:
          "Company name to retrieve brand data for (e.g., 'Apple Inc', 'Microsoft Corporation'). Must be 3-30 characters.",
        schema: {
          type: "string",
          minLength: 3,
          maxLength: 30,
          description:
            "Company name to retrieve brand data for (e.g., 'Apple Inc', 'Microsoft Corporation'). Must be 3-30 characters.",
        },
      },
      {
        name: "force_language",
        in: "query",
        required: false,
        description: "Language to force for the retrieved brand data.",
        schema: {
          allOf: [
            {
              $ref: "#/components/schemas/SupportedLanguage",
            },
            {
              type: ["string", "null"],
            },
          ],
        },
      },
      {
        name: "maxSpeed",
        in: "query",
        required: false,
        description:
          "Optional parameter to optimize the API call for maximum speed. When set to true, the API will skip time-consuming operations for faster response at the cost of less comprehensive data.",
        schema: {
          anyOf: [
            {
              type: "boolean",
            },
            {
              type: "string",
              enum: ["true", "false"],
            },
          ],
          default: false,
          description:
            "Optional parameter to optimize the API call for maximum speed. When set to true, the API will skip time-consuming operations for faster response at the cost of less comprehensive data.",
        },
      },
      {
        name: "country_gl",
        in: "query",
        required: false,
        description:
          "Two-letter ISO 3166-1 alpha-2 country code (GL parameter) used to localize search.",
        schema: {
          $ref: "#/components/schemas/CountryGL",
        },
      },
      {
        name: "maxAgeMs",
        in: "query",
        required: false,
        description:
          "Maximum age in milliseconds for cached brand data before the API performs a hard refresh. Defaults to 3 months (7776000000 ms). Values below 1 day (86400000 ms) are clamped to 1 day; values above 1 year (31536000000 ms) are clamped to 1 year.",
        schema: {
          type: ["integer", "null"],
          default: 7776000000,
          description:
            "Maximum age in milliseconds for cached brand data before the API performs a hard refresh. Defaults to 3 months (7776000000 ms). Values below 1 day (86400000 ms) are clamped to 1 day; values above 1 year (31536000000 ms) are clamped to 1 year.",
        },
      },
      {
        name: "timeoutMS",
        in: "query",
        required: false,
        description:
          "Optional timeout in milliseconds for the request. If the request takes longer than this value, it will be aborted with a 408 status code. Maximum allowed value is 300000ms (5 minutes).",
        schema: {
          $ref: "#/components/schemas/TimeoutMS",
        },
      },
      {
        name: "tags",
        in: "query",
        required: false,
        description:
          "Optional comma-separated caller-defined tags for tracking this request. Tags are recorded on the request's usage log and can be used to filter usage on the dashboard usage page. Up to 20 tags, each 1-50 characters.",
        schema: {
          $ref: "#/components/schemas/RequestTags",
        },
      },
    ],
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: true,
    },
  },
  {
    name: "brand-retrieve-by-email",
    title: "Retrieve brand data by email address",
    method: "GET",
    path: "/brand/retrieve-by-email",
    description:
      "Retrieve brand data by email address — Retrieve brand information using an email address while detecting disposable and free email addresses. Disposable and free email addresses (like gmail.com, yahoo.com) will throw a 422 error.",
    parameters: [
      {
        name: "email",
        in: "query",
        required: true,
        description:
          "Email address to retrieve brand data for (e.g., 'contact@example.com'). The domain will be extracted from the email. Free email providers (gmail.com, yahoo.com, etc.) and disposable email addresses are not allowed.",
        schema: {
          type: "string",
          minLength: 1,
          format: "email",
          description:
            "Email address to retrieve brand data for (e.g., 'contact@example.com'). The domain will be extracted from the email. Free email providers (gmail.com, yahoo.com, etc.) and disposable email addresses are not allowed.",
        },
      },
      {
        name: "force_language",
        in: "query",
        required: false,
        description: "Language to force for the retrieved brand data.",
        schema: {
          allOf: [
            {
              $ref: "#/components/schemas/SupportedLanguage",
            },
            {
              type: ["string", "null"],
            },
          ],
        },
      },
      {
        name: "maxSpeed",
        in: "query",
        required: false,
        description:
          "Optional parameter to optimize the API call for maximum speed. When set to true, the API will skip time-consuming operations for faster response at the cost of less comprehensive data.",
        schema: {
          anyOf: [
            {
              type: "boolean",
            },
            {
              type: "string",
              enum: ["true", "false"],
            },
          ],
          default: false,
          description:
            "Optional parameter to optimize the API call for maximum speed. When set to true, the API will skip time-consuming operations for faster response at the cost of less comprehensive data.",
        },
      },
      {
        name: "maxAgeMs",
        in: "query",
        required: false,
        description:
          "Maximum age in milliseconds for cached brand data before the API performs a hard refresh. Defaults to 3 months (7776000000 ms). Values below 1 day (86400000 ms) are clamped to 1 day; values above 1 year (31536000000 ms) are clamped to 1 year.",
        schema: {
          type: ["integer", "null"],
          default: 7776000000,
          description:
            "Maximum age in milliseconds for cached brand data before the API performs a hard refresh. Defaults to 3 months (7776000000 ms). Values below 1 day (86400000 ms) are clamped to 1 day; values above 1 year (31536000000 ms) are clamped to 1 year.",
        },
      },
      {
        name: "timeoutMS",
        in: "query",
        required: false,
        description:
          "Optional timeout in milliseconds for the request. If the request takes longer than this value, it will be aborted with a 408 status code. Maximum allowed value is 300000ms (5 minutes).",
        schema: {
          $ref: "#/components/schemas/TimeoutMS",
        },
      },
      {
        name: "tags",
        in: "query",
        required: false,
        description:
          "Optional comma-separated caller-defined tags for tracking this request. Tags are recorded on the request's usage log and can be used to filter usage on the dashboard usage page. Up to 20 tags, each 1-50 characters.",
        schema: {
          $ref: "#/components/schemas/RequestTags",
        },
      },
    ],
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: true,
    },
  },
  {
    name: "brand-retrieve-by-ticker",
    title: "Retrieve brand data by stock ticker",
    method: "GET",
    path: "/brand/retrieve-by-ticker",
    description:
      "Retrieve brand data by stock ticker — Retrieve brand information using a stock ticker symbol.",
    parameters: [
      {
        name: "ticker",
        in: "query",
        required: true,
        description:
          "Stock ticker symbol to retrieve brand data for (e.g., 'AAPL', 'GOOGL', 'BRK.A'). Must be 1-15 characters, letters/numbers/dots only.",
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 15,
          pattern: "^[A-Za-z0-9.]+$",
          description:
            "Stock ticker symbol to retrieve brand data for (e.g., 'AAPL', 'GOOGL', 'BRK.A'). Must be 1-15 characters, letters/numbers/dots only.",
        },
      },
      {
        name: "ticker_exchange",
        in: "query",
        required: false,
        description: "Stock exchange code.",
        schema: {
          $ref: "#/components/schemas/StockExchange",
        },
      },
      {
        name: "force_language",
        in: "query",
        required: false,
        description: "Language to force for the retrieved brand data.",
        schema: {
          allOf: [
            {
              $ref: "#/components/schemas/SupportedLanguage",
            },
            {
              type: ["string", "null"],
            },
          ],
        },
      },
      {
        name: "maxSpeed",
        in: "query",
        required: false,
        description:
          "Optional parameter to optimize the API call for maximum speed. When set to true, the API will skip time-consuming operations for faster response at the cost of less comprehensive data.",
        schema: {
          anyOf: [
            {
              type: "boolean",
            },
            {
              type: "string",
              enum: ["true", "false"],
            },
          ],
          default: false,
          description:
            "Optional parameter to optimize the API call for maximum speed. When set to true, the API will skip time-consuming operations for faster response at the cost of less comprehensive data.",
        },
      },
      {
        name: "maxAgeMs",
        in: "query",
        required: false,
        description:
          "Maximum age in milliseconds for cached brand data before the API performs a hard refresh. Defaults to 3 months (7776000000 ms). Values below 1 day (86400000 ms) are clamped to 1 day; values above 1 year (31536000000 ms) are clamped to 1 year.",
        schema: {
          type: ["integer", "null"],
          default: 7776000000,
          description:
            "Maximum age in milliseconds for cached brand data before the API performs a hard refresh. Defaults to 3 months (7776000000 ms). Values below 1 day (86400000 ms) are clamped to 1 day; values above 1 year (31536000000 ms) are clamped to 1 year.",
        },
      },
      {
        name: "timeoutMS",
        in: "query",
        required: false,
        description:
          "Optional timeout in milliseconds for the request. If the request takes longer than this value, it will be aborted with a 408 status code. Maximum allowed value is 300000ms (5 minutes).",
        schema: {
          $ref: "#/components/schemas/TimeoutMS",
        },
      },
      {
        name: "tags",
        in: "query",
        required: false,
        description:
          "Optional comma-separated caller-defined tags for tracking this request. Tags are recorded on the request's usage log and can be used to filter usage on the dashboard usage page. Up to 20 tags, each 1-50 characters.",
        schema: {
          $ref: "#/components/schemas/RequestTags",
        },
      },
    ],
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: true,
    },
  },
  {
    name: "brand-retrieve-by-isin",
    title: "Retrieve brand data by ISIN",
    method: "GET",
    path: "/brand/retrieve-by-isin",
    description:
      "Retrieve brand data by ISIN — Retrieve brand information using an ISIN (International Securities Identification Number).",
    parameters: [
      {
        name: "isin",
        in: "query",
        required: true,
        description:
          "ISIN (International Securities Identification Number) to retrieve brand data for (e.g., 'AU000000IMD5', 'US0378331005'). Must be exactly 12 characters: 2 letters followed by 9 alphanumeric characters and ending with a digit.",
        schema: {
          type: "string",
          minLength: 12,
          maxLength: 12,
          pattern: "^[A-Z]{2}[A-Z0-9]{9}[0-9]$",
          description:
            "ISIN (International Securities Identification Number) to retrieve brand data for (e.g., 'AU000000IMD5', 'US0378331005'). Must be exactly 12 characters: 2 letters followed by 9 alphanumeric characters and ending with a digit.",
        },
      },
      {
        name: "force_language",
        in: "query",
        required: false,
        description: "Language to force for the retrieved brand data.",
        schema: {
          allOf: [
            {
              $ref: "#/components/schemas/SupportedLanguage",
            },
            {
              type: ["string", "null"],
            },
          ],
        },
      },
      {
        name: "maxSpeed",
        in: "query",
        required: false,
        description:
          "Optional parameter to optimize the API call for maximum speed. When set to true, the API will skip time-consuming operations for faster response at the cost of less comprehensive data.",
        schema: {
          anyOf: [
            {
              type: "boolean",
            },
            {
              type: "string",
              enum: ["true", "false"],
            },
          ],
          default: false,
          description:
            "Optional parameter to optimize the API call for maximum speed. When set to true, the API will skip time-consuming operations for faster response at the cost of less comprehensive data.",
        },
      },
      {
        name: "maxAgeMs",
        in: "query",
        required: false,
        description:
          "Maximum age in milliseconds for cached brand data before the API performs a hard refresh. Defaults to 3 months (7776000000 ms). Values below 1 day (86400000 ms) are clamped to 1 day; values above 1 year (31536000000 ms) are clamped to 1 year.",
        schema: {
          type: ["integer", "null"],
          default: 7776000000,
          description:
            "Maximum age in milliseconds for cached brand data before the API performs a hard refresh. Defaults to 3 months (7776000000 ms). Values below 1 day (86400000 ms) are clamped to 1 day; values above 1 year (31536000000 ms) are clamped to 1 year.",
        },
      },
      {
        name: "timeoutMS",
        in: "query",
        required: false,
        description:
          "Optional timeout in milliseconds for the request. If the request takes longer than this value, it will be aborted with a 408 status code. Maximum allowed value is 300000ms (5 minutes).",
        schema: {
          $ref: "#/components/schemas/TimeoutMS",
        },
      },
      {
        name: "tags",
        in: "query",
        required: false,
        description:
          "Optional comma-separated caller-defined tags for tracking this request. Tags are recorded on the request's usage log and can be used to filter usage on the dashboard usage page. Up to 20 tags, each 1-50 characters.",
        schema: {
          $ref: "#/components/schemas/RequestTags",
        },
      },
    ],
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: true,
    },
  },
  {
    name: "brand-transaction-identifier",
    title: "Identify brand from transaction data",
    method: "GET",
    path: "/brand/transaction_identifier",
    description:
      "Identify brand from transaction data — Endpoint specially designed for platforms that want to identify transaction data by the transaction title.",
    parameters: [
      {
        name: "transaction_info",
        in: "query",
        required: true,
        description: "Transaction information to identify the brand",
        schema: {
          type: "string",
          minLength: 3,
          maxLength: 500,
          description: "Transaction information to identify the brand",
        },
      },
      {
        name: "force_language",
        in: "query",
        required: false,
        description: "Language to force for the retrieved brand data.",
        schema: {
          allOf: [
            {
              $ref: "#/components/schemas/SupportedLanguage",
            },
            {
              type: ["string", "null"],
            },
          ],
        },
      },
      {
        name: "maxSpeed",
        in: "query",
        required: false,
        description:
          "Optional parameter to optimize the API call for maximum speed. When set to true, the API will skip time-consuming operations for faster response at the cost of less comprehensive data.",
        schema: {
          anyOf: [
            {
              type: "boolean",
            },
            {
              type: "string",
              enum: ["true", "false"],
            },
          ],
          default: false,
          description:
            "Optional parameter to optimize the API call for maximum speed. When set to true, the API will skip time-consuming operations for faster response at the cost of less comprehensive data.",
        },
      },
      {
        name: "timeoutMS",
        in: "query",
        required: false,
        description:
          "Optional timeout in milliseconds for the request. If the request takes longer than this value, it will be aborted with a 408 status code. Maximum allowed value is 300000ms (5 minutes).",
        schema: {
          $ref: "#/components/schemas/TimeoutMS",
        },
      },
      {
        name: "country_gl",
        in: "query",
        required: false,
        description:
          "Two-letter ISO 3166-1 alpha-2 country code (GL parameter) used to localize search.",
        schema: {
          $ref: "#/components/schemas/CountryGL",
        },
      },
      {
        name: "city",
        in: "query",
        required: false,
        description:
          "Optional city name to prioritize when searching for the brand.",
        schema: {
          type: "string",
          description:
            "Optional city name to prioritize when searching for the brand.",
        },
      },
      {
        name: "mcc",
        in: "query",
        required: false,
        description:
          "Optional Merchant Category Code (MCC) to help identify the business category/industry.",
        schema: {
          anyOf: [
            {
              type: "string",
            },
            {
              type: "number",
            },
          ],
          description:
            "Optional Merchant Category Code (MCC) to help identify the business category/industry.",
        },
      },
      {
        name: "phone",
        in: "query",
        required: false,
        description:
          "Optional phone number from the transaction to help verify brand match.",
        schema: {
          anyOf: [
            {
              type: "string",
            },
            {
              type: "number",
            },
          ],
          description:
            "Optional phone number from the transaction to help verify brand match.",
        },
      },
      {
        name: "high_confidence_only",
        in: "query",
        required: false,
        description:
          "When set to true, the API will perform an additional verification steps to ensure the identified brand matches the transaction with high confidence.",
        schema: {
          anyOf: [
            {
              type: "boolean",
            },
            {
              type: "string",
              enum: ["true", "false"],
            },
          ],
          default: false,
          description:
            "When set to true, the API will perform an additional verification steps to ensure the identified brand matches the transaction with high confidence.",
        },
      },
      {
        name: "tags",
        in: "query",
        required: false,
        description:
          "Optional comma-separated caller-defined tags for tracking this request. Tags are recorded on the request's usage log and can be used to filter usage on the dashboard usage page. Up to 20 tags, each 1-50 characters.",
        schema: {
          $ref: "#/components/schemas/RequestTags",
        },
      },
    ],
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: true,
    },
  },
  {
    name: "brand-retrieve-simplified",
    title: "Retrieve simplified brand data by domain",
    method: "GET",
    path: "/brand/retrieve-simplified",
    description:
      "Retrieve simplified brand data by domain — Returns a simplified version of brand data containing only essential information: domain, title, colors, logos, and backdrops. Optimized for faster responses and reduced data transfer.",
    parameters: [
      {
        name: "domain",
        in: "query",
        required: true,
        description: "Domain name to retrieve simplified brand data for",
        schema: {
          type: "string",
          minLength: 3,
          description: "Domain name to retrieve simplified brand data for",
        },
      },
      {
        name: "maxAgeMs",
        in: "query",
        required: false,
        description:
          "Maximum age in milliseconds for cached brand data before the API performs a hard refresh. Defaults to 3 months (7776000000 ms). Values below 1 day (86400000 ms) are clamped to 1 day; values above 1 year (31536000000 ms) are clamped to 1 year.",
        schema: {
          type: ["integer", "null"],
          default: 7776000000,
          description:
            "Maximum age in milliseconds for cached brand data before the API performs a hard refresh. Defaults to 3 months (7776000000 ms). Values below 1 day (86400000 ms) are clamped to 1 day; values above 1 year (31536000000 ms) are clamped to 1 year.",
        },
      },
      {
        name: "timeoutMS",
        in: "query",
        required: false,
        description:
          "Optional timeout in milliseconds for the request. If the request takes longer than this value, it will be aborted with a 408 status code. Maximum allowed value is 300000ms (5 minutes).",
        schema: {
          $ref: "#/components/schemas/TimeoutMS",
        },
      },
      {
        name: "theme",
        in: "query",
        required: false,
        description:
          "Optional theme preference used when selecting brand assets.",
        schema: {
          type: "string",
          enum: ["light", "dark"],
          description:
            "Optional theme preference used when selecting brand assets.",
        },
      },
      {
        name: "tags",
        in: "query",
        required: false,
        description:
          "Optional comma-separated caller-defined tags for tracking this request. Tags are recorded on the request's usage log and can be used to filter usage on the dashboard usage page. Up to 20 tags, each 1-50 characters.",
        schema: {
          $ref: "#/components/schemas/RequestTags",
        },
      },
    ],
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: true,
    },
  },
  {
    name: "web-styleguide",
    title: "Scrape Styleguide",
    method: "GET",
    path: "/web/styleguide",
    description:
      "Scrape Styleguide — Extract a comprehensive design system from a website including colors, typography, spacing, shadows, and UI components.",
    parameters: [
      {
        name: "domain",
        in: "query",
        required: false,
        description:
          "Domain name to extract styleguide from (e.g., 'example.com', 'google.com'). The domain will be automatically normalized and validated. You must provide either 'domain' or 'directUrl', but not both.",
        schema: {
          type: "string",
          minLength: 3,
          description:
            "Domain name to extract styleguide from (e.g., 'example.com', 'google.com'). The domain will be automatically normalized and validated. You must provide either 'domain' or 'directUrl', but not both.",
        },
      },
      {
        name: "directUrl",
        in: "query",
        required: false,
        description:
          "A specific URL to fetch the styleguide from directly, bypassing domain resolution (e.g., 'https://example.com/design-system'). When provided, the styleguide is extracted from this exact URL. You must provide either 'domain' or 'directUrl', but not both.",
        schema: {
          type: "string",
          format: "uri",
          description:
            "A specific URL to fetch the styleguide from directly, bypassing domain resolution (e.g., 'https://example.com/design-system'). When provided, the styleguide is extracted from this exact URL. You must provide either 'domain' or 'directUrl', but not both.",
        },
      },
      {
        name: "maxAgeMs",
        in: "query",
        required: false,
        description:
          "Maximum age in milliseconds for cached brand data before the API performs a hard refresh. Defaults to 3 months (7776000000 ms). Values below 1 day (86400000 ms) are clamped to 1 day; values above 1 year (31536000000 ms) are clamped to 1 year.",
        schema: {
          type: ["integer", "null"],
          default: 7776000000,
          description:
            "Maximum age in milliseconds for cached brand data before the API performs a hard refresh. Defaults to 3 months (7776000000 ms). Values below 1 day (86400000 ms) are clamped to 1 day; values above 1 year (31536000000 ms) are clamped to 1 year.",
        },
      },
      {
        name: "timeoutMS",
        in: "query",
        required: false,
        description:
          "Optional timeout in milliseconds for the request. If the request takes longer than this value, it will be aborted with a 408 status code. Maximum allowed value is 300000ms (5 minutes).",
        schema: {
          $ref: "#/components/schemas/TimeoutMS",
        },
      },
      {
        name: "colorScheme",
        in: "query",
        required: false,
        description:
          "Optional browser color scheme to emulate for websites that respond to prefers-color-scheme. This value is part of the styleguide cache key.",
        schema: {
          type: "string",
          enum: ["light", "dark"],
          description:
            "Optional browser color scheme to emulate for websites that respond to prefers-color-scheme. This value is part of the styleguide cache key.",
        },
      },
      {
        name: "tags",
        in: "query",
        required: false,
        description:
          "Optional comma-separated caller-defined tags for tracking this request. Tags are recorded on the request's usage log and can be used to filter usage on the dashboard usage page. Up to 20 tags, each 1-50 characters.",
        schema: {
          $ref: "#/components/schemas/RequestTags",
        },
      },
    ],
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: true,
    },
  },
  {
    name: "web-fonts",
    title: "Scrape Fonts",
    method: "GET",
    path: "/web/fonts",
    description:
      "Scrape Fonts — Scrape font information from a website including font families, usage statistics, fallbacks, and element/word counts.",
    parameters: [
      {
        name: "directUrl",
        in: "query",
        required: false,
        description:
          "A specific URL to fetch fonts from directly, bypassing domain resolution (e.g., 'https://example.com/design-system'). When provided, fonts are extracted from this exact URL. You must provide either 'domain' or 'directUrl', but not both.",
        schema: {
          type: "string",
          format: "uri",
          description:
            "A specific URL to fetch fonts from directly, bypassing domain resolution (e.g., 'https://example.com/design-system'). When provided, fonts are extracted from this exact URL. You must provide either 'domain' or 'directUrl', but not both.",
        },
      },
      {
        name: "domain",
        in: "query",
        required: false,
        description:
          "Domain name to extract fonts from (e.g., 'example.com', 'google.com'). The domain will be automatically normalized and validated. You must provide either 'domain' or 'directUrl', but not both.",
        schema: {
          type: "string",
          minLength: 3,
          description:
            "Domain name to extract fonts from (e.g., 'example.com', 'google.com'). The domain will be automatically normalized and validated. You must provide either 'domain' or 'directUrl', but not both.",
        },
      },
      {
        name: "maxAgeMs",
        in: "query",
        required: false,
        description:
          "Maximum age in milliseconds for cached brand data before the API performs a hard refresh. Defaults to 3 months (7776000000 ms). Values below 1 day (86400000 ms) are clamped to 1 day; values above 1 year (31536000000 ms) are clamped to 1 year.",
        schema: {
          type: ["integer", "null"],
          default: 7776000000,
          description:
            "Maximum age in milliseconds for cached brand data before the API performs a hard refresh. Defaults to 3 months (7776000000 ms). Values below 1 day (86400000 ms) are clamped to 1 day; values above 1 year (31536000000 ms) are clamped to 1 year.",
        },
      },
      {
        name: "timeoutMS",
        in: "query",
        required: false,
        description:
          "Optional timeout in milliseconds for the request. If the request takes longer than this value, it will be aborted with a 408 status code. Maximum allowed value is 300000ms (5 minutes).",
        schema: {
          $ref: "#/components/schemas/TimeoutMS",
        },
      },
      {
        name: "tags",
        in: "query",
        required: false,
        description:
          "Optional comma-separated caller-defined tags for tracking this request. Tags are recorded on the request's usage log and can be used to filter usage on the dashboard usage page. Up to 20 tags, each 1-50 characters.",
        schema: {
          $ref: "#/components/schemas/RequestTags",
        },
      },
    ],
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: true,
    },
  },
  {
    name: "web-screenshot",
    title: "Scrape Screenshot",
    method: "GET",
    path: "/web/screenshot",
    description: "Scrape Screenshot — Capture a screenshot of a website.",
    parameters: [
      {
        name: "domain",
        in: "query",
        required: false,
        description:
          "Domain name to take screenshot of (e.g., 'example.com', 'google.com'). The domain will be automatically normalized and validated. You must provide either 'domain' or 'directUrl', but not both.",
        schema: {
          type: "string",
          minLength: 3,
          description:
            "Domain name to take screenshot of (e.g., 'example.com', 'google.com'). The domain will be automatically normalized and validated. You must provide either 'domain' or 'directUrl', but not both.",
        },
      },
      {
        name: "directUrl",
        in: "query",
        required: false,
        description:
          "A specific URL to screenshot directly, bypassing domain resolution (e.g., 'https://example.com/pricing'). When provided, the screenshot is taken of this exact URL. You must provide either 'domain' or 'directUrl', but not both.",
        schema: {
          type: "string",
          format: "uri",
          description:
            "A specific URL to screenshot directly, bypassing domain resolution (e.g., 'https://example.com/pricing'). When provided, the screenshot is taken of this exact URL. You must provide either 'domain' or 'directUrl', but not both.",
        },
      },
      {
        name: "fullScreenshot",
        in: "query",
        required: false,
        description:
          "Optional parameter to determine screenshot type. If 'true', takes a full page screenshot capturing all content. If 'false' or not provided, takes a viewport screenshot (standard browser view).",
        schema: {
          type: "string",
          enum: ["true", "false"],
          description:
            "Optional parameter to determine screenshot type. If 'true', takes a full page screenshot capturing all content. If 'false' or not provided, takes a viewport screenshot (standard browser view).",
        },
      },
      {
        name: "page",
        in: "query",
        required: false,
        description:
          "Optional parameter to specify which page type to screenshot. If provided, the system will scrape the domain's links and use heuristics to find the most appropriate URL for the specified page type (30 supported languages). If not provided, screenshots the main domain landing page. Only applicable when using 'domain', not 'directUrl'.",
        schema: {
          type: "string",
          enum: [
            "login",
            "signup",
            "blog",
            "careers",
            "pricing",
            "terms",
            "privacy",
            "contact",
          ],
          description:
            "Optional parameter to specify which page type to screenshot. If provided, the system will scrape the domain's links and use heuristics to find the most appropriate URL for the specified page type (30 supported languages). If not provided, screenshots the main domain landing page. Only applicable when using 'domain', not 'directUrl'.",
        },
      },
      {
        name: "waitForMs",
        in: "query",
        required: false,
        description:
          "Optional browser wait time in milliseconds after initial page load before taking the screenshot. Min: 0. Max: 30000 (30 seconds). Defaults to 3000 ms when omitted.",
        schema: {
          type: ["integer", "null"],
          minimum: 0,
          maximum: 30000,
          default: 3000,
          description:
            "Optional browser wait time in milliseconds after initial page load before taking the screenshot. Min: 0. Max: 30000 (30 seconds). Defaults to 3000 ms when omitted.",
        },
      },
      {
        name: "viewport",
        in: "query",
        required: false,
        description:
          "Optional browser viewport dimensions for the screenshot. Defaults to 1920x1080.",
        schema: {
          type: "object",
          properties: {
            width: {
              type: "integer",
              minimum: 240,
              maximum: 7680,
              default: 1920,
              description: "Viewport width in pixels.",
            },
            height: {
              type: "integer",
              minimum: 240,
              maximum: 4320,
              default: 1080,
              description: "Viewport height in pixels.",
            },
          },
          default: {
            width: 1920,
            height: 1080,
          },
          description:
            "Optional browser viewport dimensions for the screenshot. Defaults to 1920x1080.",
        },
      },
      {
        name: "handleCookiePopup",
        in: "query",
        required: false,
        description:
          "Optional parameter to control cookie/consent popup handling. If 'true', we dismiss cookie banner before capture. If 'false' or not provided, captures the page without that step.",
        schema: {
          anyOf: [
            {
              type: "boolean",
            },
            {
              type: "string",
              enum: ["true", "false"],
            },
          ],
          default: false,
          description:
            "Optional parameter to control cookie/consent popup handling. If 'true', we dismiss cookie banner before capture. If 'false' or not provided, captures the page without that step.",
        },
      },
      {
        name: "colorScheme",
        in: "query",
        required: false,
        description:
          "Optional parameter to choose the site's visual theme in the screenshot. Use 'light' or 'dark' when the site offers both appearances.",
        schema: {
          type: "string",
          enum: ["light", "dark"],
          description:
            "Optional parameter to choose the site's visual theme in the screenshot. Use 'light' or 'dark' when the site offers both appearances.",
        },
      },
      {
        name: "scrollOffset",
        in: "query",
        required: false,
        description:
          "Optional vertical scroll offset in pixels for capturing a long page in viewport-sized chunks. When provided, the full page is captured once and the returned image is the viewport-sized slice that begins at this Y offset (e.g. request scrollOffset=0, then 1080, then 2160 to walk a 1920x1080 landing page top to bottom). The final slice may be shorter than the viewport height. Takes precedence over fullScreenshot. Max: 100000.",
        schema: {
          type: ["integer", "null"],
          minimum: 0,
          maximum: 100000,
          description:
            "Optional vertical scroll offset in pixels for capturing a long page in viewport-sized chunks. When provided, the full page is captured once and the returned image is the viewport-sized slice that begins at this Y offset (e.g. request scrollOffset=0, then 1080, then 2160 to walk a 1920x1080 landing page top to bottom). The final slice may be shorter than the viewport height. Takes precedence over fullScreenshot. Max: 100000.",
        },
      },
      {
        name: "maxAgeMs",
        in: "query",
        required: false,
        description:
          "Return a cached screenshot if a prior screenshot for the same parameters exists and is younger than this many milliseconds. Defaults to 1 day (86400000 ms) when omitted. Max is 30 days (2592000000 ms). Set to 0 to always capture fresh.",
        schema: {
          type: ["integer", "null"],
          minimum: 0,
          maximum: 2592000000,
          default: 86400000,
          description:
            "Return a cached screenshot if a prior screenshot for the same parameters exists and is younger than this many milliseconds. Defaults to 1 day (86400000 ms) when omitted. Max is 30 days (2592000000 ms). Set to 0 to always capture fresh.",
        },
      },
      {
        name: "country",
        in: "query",
        required: false,
        description:
          "Two-letter ISO 3166-1 alpha-2 country code identifying a supported Context.dev residential proxy exit location. Must be one of Context.dev's supported countries. When provided, Context.dev fetches the target page from that country.",
        schema: {
          $ref: "#/components/schemas/BrowserCountryCode",
        },
      },
      {
        name: "timeoutMS",
        in: "query",
        required: false,
        description:
          "Optional timeout in milliseconds for the request. If the request takes longer than this value, it will be aborted with a 408 status code. Maximum allowed value is 300000ms (5 minutes).",
        schema: {
          $ref: "#/components/schemas/LenientTimeoutMS",
        },
      },
      {
        name: "zdr",
        in: "query",
        required: false,
        description:
          "Set to enabled to bypass shared caches and omit request and response content from retained usage logs. Requires zero data retention to be enabled for your organization (contact support@context.dev), otherwise the request fails with ZDR_NOT_ENABLED. Successful ZDR responses include X-Context-ZDR: true.",
        schema: {
          type: "string",
          enum: ["enabled", "disabled"],
          default: "disabled",
          description:
            "Set to enabled to bypass shared caches and omit request and response content from retained usage logs. Requires zero data retention to be enabled for your organization (contact support@context.dev), otherwise the request fails with ZDR_NOT_ENABLED. Successful ZDR responses include X-Context-ZDR: true.",
        },
      },
      {
        name: "tags",
        in: "query",
        required: false,
        description:
          "Optional comma-separated caller-defined tags for tracking this request. Tags are recorded on the request's usage log and can be used to filter usage on the dashboard usage page. Up to 20 tags, each 1-50 characters.",
        schema: {
          $ref: "#/components/schemas/RequestTags",
        },
      },
    ],
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: true,
    },
  },
  {
    name: "web-naics",
    title: "Classify NAICS industries",
    method: "GET",
    path: "/web/naics",
    description:
      "Classify NAICS industries — Classify any brand into 2022 NAICS industry codes from its domain or name.",
    parameters: [
      {
        name: "input",
        in: "query",
        required: true,
        description:
          "Brand domain or title to retrieve NAICS code for. If a valid domain is provided, it will be used for classification, otherwise, we will search for the brand using the provided title.",
        schema: {
          type: "string",
          minLength: 4,
          description:
            "Brand domain or title to retrieve NAICS code for. If a valid domain is provided, it will be used for classification, otherwise, we will search for the brand using the provided title.",
        },
      },
      {
        name: "minResults",
        in: "query",
        required: false,
        description:
          "Minimum number of NAICS codes to return. Must be at least 1. Defaults to 1.",
        schema: {
          type: "integer",
          minimum: 1,
          maximum: 10,
          default: 1,
          description:
            "Minimum number of NAICS codes to return. Must be at least 1. Defaults to 1.",
        },
      },
      {
        name: "maxResults",
        in: "query",
        required: false,
        description:
          "Maximum number of NAICS codes to return. Must be between 1 and 10. Defaults to 5.",
        schema: {
          type: "integer",
          minimum: 1,
          maximum: 10,
          default: 5,
          description:
            "Maximum number of NAICS codes to return. Must be between 1 and 10. Defaults to 5.",
        },
      },
      {
        name: "timeoutMS",
        in: "query",
        required: false,
        description:
          "Optional timeout in milliseconds for the request. If the request takes longer than this value, it will be aborted with a 408 status code. Maximum allowed value is 300000ms (5 minutes).",
        schema: {
          $ref: "#/components/schemas/TimeoutMS",
        },
      },
      {
        name: "tags",
        in: "query",
        required: false,
        description:
          "Optional comma-separated caller-defined tags for tracking this request. Tags are recorded on the request's usage log and can be used to filter usage on the dashboard usage page. Up to 20 tags, each 1-50 characters.",
        schema: {
          $ref: "#/components/schemas/RequestTags",
        },
      },
    ],
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: true,
    },
  },
  {
    name: "web-sic",
    title: "Classify SIC industries",
    method: "GET",
    path: "/web/sic",
    description:
      "Classify SIC industries — Classify any brand into Standard Industrial Classification (SIC) codes from its domain or name. Choose between the original SIC system (`original_sic`) or the latest SIC list maintained by the SEC (`latest_sec`).",
    parameters: [
      {
        name: "input",
        in: "query",
        required: true,
        description:
          "Brand domain or title to retrieve SIC code for. If a valid domain is provided, it will be used for classification, otherwise, we will search for the brand using the provided title.",
        schema: {
          type: "string",
          minLength: 4,
          description:
            "Brand domain or title to retrieve SIC code for. If a valid domain is provided, it will be used for classification, otherwise, we will search for the brand using the provided title.",
        },
      },
      {
        name: "type",
        in: "query",
        required: false,
        description:
          "Which SIC dataset to classify against. `original_sic` uses the 1987 Standard Industrial Classification system; `latest_sec` uses the current SIC list as published by the SEC. Defaults to `original_sic`.",
        schema: {
          type: "string",
          enum: ["original_sic", "latest_sec"],
          default: "original_sic",
          description:
            "Which SIC dataset to classify against. `original_sic` uses the 1987 Standard Industrial Classification system; `latest_sec` uses the current SIC list as published by the SEC. Defaults to `original_sic`.",
        },
      },
      {
        name: "minResults",
        in: "query",
        required: false,
        description:
          "Minimum number of SIC codes to return. Must be at least 1. Defaults to 1.",
        schema: {
          type: "integer",
          minimum: 1,
          maximum: 10,
          default: 1,
          description:
            "Minimum number of SIC codes to return. Must be at least 1. Defaults to 1.",
        },
      },
      {
        name: "maxResults",
        in: "query",
        required: false,
        description:
          "Maximum number of SIC codes to return. Must be between 1 and 10. Defaults to 5.",
        schema: {
          type: "integer",
          minimum: 1,
          maximum: 10,
          default: 5,
          description:
            "Maximum number of SIC codes to return. Must be between 1 and 10. Defaults to 5.",
        },
      },
      {
        name: "timeoutMS",
        in: "query",
        required: false,
        description:
          "Optional timeout in milliseconds for the request. If the request takes longer than this value, it will be aborted with a 408 status code. Maximum allowed value is 300000ms (5 minutes).",
        schema: {
          $ref: "#/components/schemas/TimeoutMS",
        },
      },
      {
        name: "tags",
        in: "query",
        required: false,
        description:
          "Optional comma-separated caller-defined tags for tracking this request. Tags are recorded on the request's usage log and can be used to filter usage on the dashboard usage page. Up to 20 tags, each 1-50 characters.",
        schema: {
          $ref: "#/components/schemas/RequestTags",
        },
      },
    ],
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: true,
    },
  },
  {
    name: "brand-ai-query",
    title: "Query website data using AI",
    method: "POST",
    path: "/brand/ai/query",
    description:
      "Query website data using AI — Use AI to extract specific data points from a brand's website. The AI will crawl the website and extract the requested information based on the provided data points.",
    parameters: [],
    requestBody: {
      required: true,
      schema: {
        type: "object",
        required: ["domain", "data_to_extract"],
        properties: {
          domain: {
            type: "string",
            description: "The domain name to analyze",
          },
          specific_pages: {
            type: "object",
            description: "Optional object specifying which pages to analyze",
            properties: {
              home_page: {
                type: "boolean",
                description: "Whether to analyze the home page",
              },
              blog: {
                type: "boolean",
                description: "Whether to analyze the blog",
              },
              terms_and_conditions: {
                type: "boolean",
                description: "Whether to analyze the terms and conditions page",
              },
              privacy_policy: {
                type: "boolean",
                description: "Whether to analyze the privacy policy page",
              },
              about_us: {
                type: "boolean",
                description: "Whether to analyze the about us page",
              },
              contact_us: {
                type: "boolean",
                description: "Whether to analyze the contact us page",
              },
              careers: {
                type: "boolean",
                description: "Whether to analyze the careers page",
              },
              faq: {
                type: "boolean",
                description: "Whether to analyze the FAQ page",
              },
              pricing: {
                type: "boolean",
                description: "Whether to analyze the pricing page",
              },
            },
          },
          data_to_extract: {
            type: "array",
            description: "Array of data points to extract from the website",
            items: {
              type: "object",
              required: [
                "datapoint_name",
                "datapoint_type",
                "datapoint_description",
                "datapoint_example",
              ],
              properties: {
                datapoint_name: {
                  type: "string",
                  description: "Name of the data point to extract",
                },
                datapoint_type: {
                  type: "string",
                  enum: ["text", "number", "date", "boolean", "list", "url"],
                  description: "Type of the data point",
                },
                datapoint_list_type: {
                  type: "string",
                  enum: [
                    "string",
                    "text",
                    "number",
                    "date",
                    "boolean",
                    "list",
                    "url",
                    "object",
                  ],
                  default: "string",
                  description:
                    "Type of items in the list when datapoint_type is 'list'. Defaults to 'string'. Use 'object' to extract an array of objects matching a schema.",
                },
                datapoint_object_schema: {
                  type: "object",
                  description:
                    "Schema definition for objects when datapoint_list_type is 'object'. Provide a map of field names to their scalar types.",
                  additionalProperties: {
                    type: "string",
                    enum: ["string", "number", "date", "boolean"],
                  },
                  minProperties: 1,
                  example: {
                    testimonial_text: "string",
                    testimonial_author: "string",
                  },
                },
                datapoint_description: {
                  type: "string",
                  description: "Description of what to extract",
                },
                datapoint_example: {
                  type: "string",
                  description: "Example of the expected value",
                },
              },
            },
          },
          timeoutMS: {
            $ref: "#/components/schemas/TimeoutMS",
          },
          tags: {
            $ref: "#/components/schemas/RequestTags",
          },
        },
      },
      contentType: "application/json",
      binary: false,
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: true,
    },
  },
  {
    name: "brand-ai-product",
    title: "Extract a single product from a URL",
    method: "POST",
    path: "/brand/ai/product",
    description:
      "Extract a single product from a URL — Given a single URL, determines if it is a product page and extracts the product information.",
    parameters: [],
    requestBody: {
      required: true,
      schema: {
        type: "object",
        required: ["url"],
        properties: {
          url: {
            type: "string",
            format: "uri",
            description: "The product page URL to extract product data from.",
          },
          maxAgeMs: {
            type: "integer",
            minimum: 0,
            maximum: 2592000000,
            default: 604800000,
            description:
              "Return a cached result if a prior scrape for the same parameters exists and is younger than this many milliseconds. Defaults to 7 days (604800000 ms) when omitted. Max is 30 days (2592000000 ms). Set to 0 to always scrape fresh.",
          },
          timeoutMS: {
            $ref: "#/components/schemas/TimeoutMS",
          },
          tags: {
            $ref: "#/components/schemas/RequestTags",
          },
        },
      },
      contentType: "application/json",
      binary: false,
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: true,
    },
  },
  {
    name: "brand-ai-products",
    title: "Extract products from a brand's website",
    method: "POST",
    path: "/brand/ai/products",
    description:
      "Extract products from a brand's website — Extract product information from a brand's website. We will analyze the website and return a list of products with details such as name, description, image, pricing, features, and more.",
    parameters: [],
    requestBody: {
      required: true,
      schema: {
        oneOf: [
          {
            title: "By Domain",
            type: "object",
            required: ["domain"],
            properties: {
              domain: {
                type: "string",
                description: "The domain name to analyze.",
              },
              maxProducts: {
                type: "integer",
                minimum: 1,
                maximum: 12,
                description: "Maximum number of products to extract.",
              },
              maxAgeMs: {
                type: "integer",
                minimum: 0,
                maximum: 2592000000,
                default: 604800000,
                description:
                  "Return a cached result if a prior scrape for the same parameters exists and is younger than this many milliseconds. Defaults to 7 days (604800000 ms) when omitted. Max is 30 days (2592000000 ms). Set to 0 to always scrape fresh.",
              },
              timeoutMS: {
                $ref: "#/components/schemas/TimeoutMS",
              },
              tags: {
                $ref: "#/components/schemas/RequestTags",
              },
            },
          },
          {
            title: "By Direct URL",
            type: "object",
            required: ["directUrl"],
            properties: {
              directUrl: {
                type: "string",
                format: "uri",
                description:
                  "A specific URL to use directly as the starting point for extraction without domain resolution.",
              },
              maxProducts: {
                type: "integer",
                minimum: 1,
                maximum: 12,
                description: "Maximum number of products to extract.",
              },
              maxAgeMs: {
                type: "integer",
                minimum: 0,
                maximum: 2592000000,
                default: 604800000,
                description:
                  "Return a cached result if a prior scrape for the same parameters exists and is younger than this many milliseconds. Defaults to 7 days (604800000 ms) when omitted. Max is 30 days (2592000000 ms). Set to 0 to always scrape fresh.",
              },
              timeoutMS: {
                $ref: "#/components/schemas/TimeoutMS",
              },
              tags: {
                $ref: "#/components/schemas/RequestTags",
              },
            },
          },
        ],
      },
      contentType: "application/json",
      binary: false,
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: true,
    },
  },
  {
    name: "brand-prefetch",
    title: "Prefetch brand data for a domain",
    method: "POST",
    path: "/brand/prefetch",
    description:
      "Prefetch brand data for a domain — Signal that you may fetch brand data for a particular domain soon to improve latency.",
    parameters: [],
    requestBody: {
      required: true,
      schema: {
        type: "object",
        required: ["domain"],
        properties: {
          domain: {
            type: "string",
            description: "Domain name to prefetch brand data for",
          },
          timeoutMS: {
            $ref: "#/components/schemas/TimeoutMS",
          },
          tags: {
            $ref: "#/components/schemas/RequestTags",
          },
        },
      },
      contentType: "application/json",
      binary: false,
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      openWorldHint: true,
    },
  },
  {
    name: "brand-prefetch-by-email",
    title: "Prefetch brand data by email",
    method: "POST",
    path: "/brand/prefetch-by-email",
    description:
      "Prefetch brand data by email — Signal that you may fetch brand data for a particular domain soon to improve latency. This endpoint accepts an email address, extracts the domain from it, validates that it's not a disposable or free email provider, and queues the domain for prefetching.",
    parameters: [],
    requestBody: {
      required: true,
      schema: {
        type: "object",
        required: ["email"],
        properties: {
          email: {
            type: "string",
            format: "email",
            description:
              "Email address to prefetch brand data for. The domain will be extracted from the email. Free email providers (gmail.com, yahoo.com, etc.) and disposable email addresses are not allowed.",
          },
          timeoutMS: {
            $ref: "#/components/schemas/TimeoutMS",
          },
          tags: {
            $ref: "#/components/schemas/RequestTags",
          },
        },
      },
      contentType: "application/json",
      binary: false,
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      openWorldHint: true,
    },
  },
  {
    name: "utility-prefetch",
    title: "Prefetch brand data",
    method: "POST",
    path: "/utility/prefetch",
    description:
      "Prefetch brand data — Signal that you may fetch brand data soon to improve latency. The type field selects what to prefetch (currently only 'brand') and identifier carries exactly one lookup key: a domain, or an email whose domain is extracted and validated (free email providers and disposable email addresses are not allowed).",
    parameters: [],
    requestBody: {
      required: true,
      schema: {
        type: "object",
        required: ["type", "identifier"],
        properties: {
          type: {
            type: "string",
            enum: ["brand"],
            description:
              "What to prefetch. Currently only 'brand' is supported.",
          },
          identifier: {
            $ref: "#/components/schemas/UtilityPrefetchIdentifier",
          },
          timeoutMS: {
            $ref: "#/components/schemas/TimeoutMS",
          },
          tags: {
            $ref: "#/components/schemas/RequestTags",
          },
        },
      },
      contentType: "application/json",
      binary: false,
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      openWorldHint: true,
    },
  },
  {
    name: "list-monitors",
    title: "List monitors",
    method: "GET",
    path: "/monitors",
    description:
      "List monitors — Lists monitors for the authenticated organization. Supports free-text search (`q` over `search_by` fields, `prefix` or `exact` via `search_type`) plus status/type/tag filters. Results are paginated via the opaque `cursor`.",
    parameters: [
      {
        name: "q",
        in: "query",
        required: false,
        description:
          "Free-text search term, matched against the fields named in `search_by`.",
        schema: {
          type: "string",
          maxLength: 200,
          description:
            "Free-text search term, matched against the fields named in `search_by`.",
          example: "pricing",
        },
      },
      {
        name: "search_by",
        in: "query",
        required: false,
        description:
          "Comma-separated fields to search with `q`. Defaults to all of them. Note `instructions` only exists on extract monitors.",
        schema: {
          type: ["array", "null"],
          items: {
            type: "string",
            enum: ["name", "url", "instructions", "tags"],
          },
          description:
            "Comma-separated fields to search with `q`. Defaults to all of them. Note `instructions` only exists on extract monitors.",
          example: "name,url",
        },
      },
      {
        name: "search_type",
        in: "query",
        required: false,
        description:
          "`prefix` for as-you-type prefix matching (default), `exact` for full-token matching.",
        schema: {
          type: "string",
          enum: ["exact", "prefix"],
          description:
            "`prefix` for as-you-type prefix matching (default), `exact` for full-token matching.",
        },
      },
      {
        name: "status",
        in: "query",
        required: false,
        description: "Filter monitors by lifecycle status.",
        schema: {
          type: "string",
          enum: ["active", "paused", "failed"],
          description: "Filter monitors by lifecycle status.",
        },
      },
      {
        name: "target_type",
        in: "query",
        required: false,
        description: "Filter by target type.",
        schema: {
          type: "string",
          enum: ["page", "sitemap", "extract"],
          description: "Filter by target type.",
        },
      },
      {
        name: "change_detection_type",
        in: "query",
        required: false,
        description: "Filter by change detection type.",
        schema: {
          type: "string",
          enum: ["exact", "semantic"],
          description: "Filter by change detection type.",
        },
      },
      {
        name: "tags",
        in: "query",
        required: false,
        description:
          "Comma-separated list of tags to filter by (matches monitors having any of them).",
        schema: {
          type: ["array", "null"],
          items: {
            type: "string",
            minLength: 1,
            maxLength: 50,
          },
          maxItems: 20,
          description:
            "Comma-separated list of tags to filter by (matches monitors having any of them).",
          example: "pricing,competitor",
        },
      },
      {
        name: "tag",
        in: "query",
        required: false,
        description: "Filter to items that have this tag.",
        schema: {
          type: "string",
          description: "Filter to items that have this tag.",
          example: "pricing",
        },
      },
      {
        name: "limit",
        in: "query",
        required: false,
        description:
          "Maximum number of items to return per page (1-100). Defaults to 25.",
        schema: {
          type: "integer",
          minimum: 1,
          maximum: 100,
          description:
            "Maximum number of items to return per page (1-100). Defaults to 25.",
        },
      },
      {
        name: "cursor",
        in: "query",
        required: false,
        description: "Opaque pagination cursor from a previous response.",
        schema: {
          type: "string",
          description: "Opaque pagination cursor from a previous response.",
        },
      },
    ],
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: true,
    },
  },
  {
    name: "create-monitor",
    title: "Create a monitor",
    method: "POST",
    path: "/monitors",
    description:
      "Create a monitor — Creates a monitor. The request body is a union of the supported target/change detection combinations. The monitor runs immediately after creation to create its initial baseline.",
    parameters: [],
    requestBody: {
      required: true,
      schema: {
        $ref: "#/components/schemas/MonitorsCreateMonitorRequest",
      },
      contentType: "application/json",
      binary: false,
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      openWorldHint: true,
    },
  },
  {
    name: "get-monitor",
    title: "Get a monitor",
    method: "GET",
    path: "/monitors/{monitor_id}",
    description: "Get a monitor",
    parameters: [
      {
        name: "monitor_id",
        in: "path",
        required: true,
        schema: {
          type: "string",
          example: "mon_123",
        },
      },
    ],
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: true,
    },
  },
  {
    name: "update-monitor",
    title: "Update a monitor",
    method: "PATCH",
    path: "/monitors/{monitor_id}",
    description:
      "Update a monitor — Updates a monitor. If `target` or `change_detection` changes, the monitor creates a new baseline. Unsupported target/change detection combinations are rejected.",
    parameters: [
      {
        name: "monitor_id",
        in: "path",
        required: true,
        schema: {
          type: "string",
          example: "mon_123",
        },
      },
    ],
    requestBody: {
      required: true,
      schema: {
        $ref: "#/components/schemas/MonitorsUpdateMonitorRequest",
      },
      contentType: "application/json",
      binary: false,
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      openWorldHint: true,
    },
  },
  {
    name: "delete-monitor",
    title: "Delete a monitor",
    method: "DELETE",
    path: "/monitors/{monitor_id}",
    description: "Delete a monitor",
    parameters: [
      {
        name: "monitor_id",
        in: "path",
        required: true,
        schema: {
          type: "string",
          example: "mon_123",
        },
      },
    ],
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      openWorldHint: true,
    },
  },
  {
    name: "list-monitor-runs",
    title: "List monitor runs",
    method: "GET",
    path: "/monitors/{monitor_id}/runs",
    description: "List monitor runs",
    parameters: [
      {
        name: "monitor_id",
        in: "path",
        required: true,
        schema: {
          type: "string",
          example: "mon_123",
        },
      },
      {
        name: "status",
        in: "query",
        required: false,
        description: "Filter runs by lifecycle status.",
        schema: {
          type: "string",
          enum: ["queued", "running", "completed", "failed", "skipped"],
          description: "Filter runs by lifecycle status.",
        },
      },
      {
        name: "limit",
        in: "query",
        required: false,
        description:
          "Maximum number of items to return per page (1-100). Defaults to 25.",
        schema: {
          type: "integer",
          minimum: 1,
          maximum: 100,
          description:
            "Maximum number of items to return per page (1-100). Defaults to 25.",
        },
      },
      {
        name: "cursor",
        in: "query",
        required: false,
        description: "Opaque pagination cursor from a previous response.",
        schema: {
          type: "string",
          description: "Opaque pagination cursor from a previous response.",
        },
      },
    ],
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: true,
    },
  },
  {
    name: "list-monitor-changes",
    title: "List changes for a monitor",
    method: "GET",
    path: "/monitors/{monitor_id}/changes",
    description: "List changes for a monitor",
    parameters: [
      {
        name: "monitor_id",
        in: "path",
        required: true,
        schema: {
          type: "string",
          example: "mon_123",
        },
      },
      {
        name: "tag",
        in: "query",
        required: false,
        description: "Filter to items that have this tag.",
        schema: {
          type: "string",
          description: "Filter to items that have this tag.",
          example: "pricing",
        },
      },
      {
        name: "since",
        in: "query",
        required: false,
        description: "Only include items at or after this ISO 8601 timestamp.",
        schema: {
          type: "string",
          format: "date-time",
          description:
            "Only include items at or after this ISO 8601 timestamp.",
          example: "2026-06-01T00:00:00Z",
        },
      },
      {
        name: "until",
        in: "query",
        required: false,
        description: "Only include items before this ISO 8601 timestamp.",
        schema: {
          type: "string",
          format: "date-time",
          description: "Only include items before this ISO 8601 timestamp.",
          example: "2026-06-28T00:00:00Z",
        },
      },
      {
        name: "limit",
        in: "query",
        required: false,
        description:
          "Maximum number of items to return per page (1-100). Defaults to 25.",
        schema: {
          type: "integer",
          minimum: 1,
          maximum: 100,
          description:
            "Maximum number of items to return per page (1-100). Defaults to 25.",
        },
      },
      {
        name: "cursor",
        in: "query",
        required: false,
        description: "Opaque pagination cursor from a previous response.",
        schema: {
          type: "string",
          description: "Opaque pagination cursor from a previous response.",
        },
      },
    ],
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: true,
    },
  },
  {
    name: "list-account-runs",
    title: "List runs",
    method: "GET",
    path: "/monitors/runs",
    description:
      "List runs — Returns an account-wide feed of monitor runs across all monitors.",
    parameters: [
      {
        name: "status",
        in: "query",
        required: false,
        description: "Filter runs by lifecycle status.",
        schema: {
          type: "string",
          enum: ["queued", "running", "completed", "failed", "skipped"],
          description: "Filter runs by lifecycle status.",
        },
      },
      {
        name: "limit",
        in: "query",
        required: false,
        description:
          "Maximum number of items to return per page (1-100). Defaults to 25.",
        schema: {
          type: "integer",
          minimum: 1,
          maximum: 100,
          description:
            "Maximum number of items to return per page (1-100). Defaults to 25.",
        },
      },
      {
        name: "cursor",
        in: "query",
        required: false,
        description: "Opaque pagination cursor from a previous response.",
        schema: {
          type: "string",
          description: "Opaque pagination cursor from a previous response.",
        },
      },
    ],
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: true,
    },
  },
  {
    name: "list-monitor-credit-usage",
    title: "Monitor credit usage",
    method: "GET",
    path: "/monitors/credit-usage",
    description:
      "Monitor credit usage — Returns credits charged per monitor over an optional [since, until] window, newest spenders first.",
    parameters: [
      {
        name: "since",
        in: "query",
        required: false,
        description: "Only include items at or after this ISO 8601 timestamp.",
        schema: {
          type: "string",
          format: "date-time",
          description:
            "Only include items at or after this ISO 8601 timestamp.",
          example: "2026-06-01T00:00:00Z",
        },
      },
      {
        name: "until",
        in: "query",
        required: false,
        description: "Only include items before this ISO 8601 timestamp.",
        schema: {
          type: "string",
          format: "date-time",
          description: "Only include items before this ISO 8601 timestamp.",
          example: "2026-06-28T00:00:00Z",
        },
      },
    ],
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: true,
    },
  },
  {
    name: "get-monitor-limits",
    title: "Monitor limits",
    method: "GET",
    path: "/monitors/limits",
    description:
      "Monitor limits — Returns how many monitors the account has and the maximum it allows.",
    parameters: [],
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: true,
    },
  },
  {
    name: "list-changes",
    title: "List changes",
    method: "GET",
    path: "/monitors/changes",
    description:
      "List changes — Returns an account-wide feed of detected changes across monitors.",
    parameters: [
      {
        name: "monitor_id",
        in: "query",
        required: false,
        description: "Filter changes to a single monitor.",
        schema: {
          type: "string",
          description: "Filter changes to a single monitor.",
          example: "mon_123",
        },
      },
      {
        name: "target_type",
        in: "query",
        required: false,
        description: "Filter by target type.",
        schema: {
          type: "string",
          enum: ["page", "sitemap", "extract"],
          description: "Filter by target type.",
        },
      },
      {
        name: "change_detection_type",
        in: "query",
        required: false,
        description: "Filter by change detection type.",
        schema: {
          type: "string",
          enum: ["exact", "semantic"],
          description: "Filter by change detection type.",
        },
      },
      {
        name: "tag",
        in: "query",
        required: false,
        description: "Filter to items that have this tag.",
        schema: {
          type: "string",
          description: "Filter to items that have this tag.",
          example: "pricing",
        },
      },
      {
        name: "since",
        in: "query",
        required: false,
        description: "Only include items at or after this ISO 8601 timestamp.",
        schema: {
          type: "string",
          format: "date-time",
          description:
            "Only include items at or after this ISO 8601 timestamp.",
          example: "2026-06-01T00:00:00Z",
        },
      },
      {
        name: "until",
        in: "query",
        required: false,
        description: "Only include items before this ISO 8601 timestamp.",
        schema: {
          type: "string",
          format: "date-time",
          description: "Only include items before this ISO 8601 timestamp.",
          example: "2026-06-28T00:00:00Z",
        },
      },
      {
        name: "limit",
        in: "query",
        required: false,
        description:
          "Maximum number of items to return per page (1-100). Defaults to 25.",
        schema: {
          type: "integer",
          minimum: 1,
          maximum: 100,
          description:
            "Maximum number of items to return per page (1-100). Defaults to 25.",
        },
      },
      {
        name: "cursor",
        in: "query",
        required: false,
        description: "Opaque pagination cursor from a previous response.",
        schema: {
          type: "string",
          description: "Opaque pagination cursor from a previous response.",
        },
      },
    ],
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: true,
    },
  },
  {
    name: "get-change",
    title: "Get a change",
    method: "GET",
    path: "/monitors/changes/{change_id}",
    description: "Get a change",
    parameters: [
      {
        name: "change_id",
        in: "path",
        required: true,
        schema: {
          type: "string",
          example: "chg_123",
        },
      },
    ],
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: true,
    },
  },
  {
    name: "run-monitor-now",
    title: "Run a monitor now",
    method: "POST",
    path: "/monitors/{monitor_id}/run",
    description:
      "Run a monitor now — Triggers an immediate run of the monitor outside its normal schedule. The run is queued and processed asynchronously.",
    parameters: [
      {
        name: "monitor_id",
        in: "path",
        required: true,
        schema: {
          type: "string",
          example: "mon_123",
        },
      },
    ],
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      openWorldHint: true,
    },
  },
  {
    name: "rotate-monitor-webhook-secret",
    title: "Rotate a monitor webhook secret",
    method: "POST",
    path: "/monitors/{monitor_id}/webhook/rotate-secret",
    description:
      "Rotate a monitor webhook secret — Generates a new signing secret for the monitor's webhook and returns the updated monitor (including the new `webhook.secret`). The previous secret stops signing deliveries immediately, so update your endpoint before rotating.",
    parameters: [
      {
        name: "monitor_id",
        in: "path",
        required: true,
        schema: {
          type: "string",
          example: "mon_123",
        },
      },
    ],
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      openWorldHint: true,
    },
  },
  {
    name: "list-webdb-collections",
    title: "List collections",
    method: "GET",
    path: "/webdbs/collections",
    description: "List collections — Returns your WebDB collections.",
    parameters: [
      {
        name: "limit",
        in: "query",
        required: false,
        description: "Maximum items to return. Defaults to 25.",
        schema: {
          type: "integer",
          minimum: 1,
          maximum: 100,
          description: "Maximum items to return. Defaults to 25.",
        },
      },
      {
        name: "cursor",
        in: "query",
        required: false,
        description: "Pagination cursor from a previous response.",
        schema: {
          type: "string",
          description: "Pagination cursor from a previous response.",
        },
      },
      {
        name: "tags",
        in: "query",
        required: false,
        description:
          "Optional comma-separated caller-defined tags for tracking this request. Tags are recorded on the request's usage log and can be used to filter usage on the dashboard usage page. Up to 20 tags, each 1-50 characters.",
        schema: {
          $ref: "#/components/schemas/RequestTags",
        },
      },
    ],
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: true,
    },
  },
  {
    name: "create-webdb-collection",
    title: "Create a collection",
    method: "POST",
    path: "/webdbs/collections",
    description:
      "Create a collection — Creates a collection and queues its first sync. Use the preview endpoint first to test extraction.",
    parameters: [],
    requestBody: {
      required: true,
      schema: {
        $ref: "#/components/schemas/WebdbsCreateCollectionRequest",
      },
      contentType: "application/json",
      binary: false,
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      openWorldHint: true,
    },
  },
  {
    name: "get-webdb-collection",
    title: "Get a collection",
    method: "GET",
    path: "/webdbs/collections/{collection_id}",
    description: "Get a collection — Returns one WebDB collection.",
    parameters: [
      {
        name: "collection_id",
        in: "path",
        required: true,
        description: "Collection ID.",
        schema: {
          type: "string",
          example: "col_123",
          description: "Collection ID.",
        },
      },
      {
        name: "tags",
        in: "query",
        required: false,
        description:
          "Optional comma-separated caller-defined tags for tracking this request. Tags are recorded on the request's usage log and can be used to filter usage on the dashboard usage page. Up to 20 tags, each 1-50 characters.",
        schema: {
          $ref: "#/components/schemas/RequestTags",
        },
      },
    ],
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: true,
    },
  },
  {
    name: "update-webdb-collection",
    title: "Update a collection",
    method: "PATCH",
    path: "/webdbs/collections/{collection_id}",
    description:
      "Update a collection — Changes collection settings. New extraction rules apply on future syncs.",
    parameters: [
      {
        name: "collection_id",
        in: "path",
        required: true,
        description: "Collection ID.",
        schema: {
          type: "string",
          example: "col_123",
          description: "Collection ID.",
        },
      },
    ],
    requestBody: {
      required: true,
      schema: {
        $ref: "#/components/schemas/WebdbsUpdateCollectionRequest",
      },
      contentType: "application/json",
      binary: false,
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      openWorldHint: true,
    },
  },
  {
    name: "delete-webdb-collection",
    title: "Delete a collection",
    method: "DELETE",
    path: "/webdbs/collections/{collection_id}",
    description:
      "Delete a collection — Deletes a collection and all data stored for it.",
    parameters: [
      {
        name: "collection_id",
        in: "path",
        required: true,
        description: "Collection ID.",
        schema: {
          type: "string",
          example: "col_123",
          description: "Collection ID.",
        },
      },
      {
        name: "tags",
        in: "query",
        required: false,
        description:
          "Optional comma-separated caller-defined tags for tracking this request. Tags are recorded on the request's usage log and can be used to filter usage on the dashboard usage page. Up to 20 tags, each 1-50 characters.",
        schema: {
          $ref: "#/components/schemas/RequestTags",
        },
      },
    ],
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      openWorldHint: true,
    },
  },
  {
    name: "sync-webdb-collection",
    title: "Trigger a sync now",
    method: "POST",
    path: "/webdbs/collections/{collection_id}/sync",
    description:
      "Trigger a sync now — Queues a sync now. Returns the current run when a sync is already active.",
    parameters: [
      {
        name: "collection_id",
        in: "path",
        required: true,
        description: "Collection ID.",
        schema: {
          type: "string",
          example: "col_123",
          description: "Collection ID.",
        },
      },
      {
        name: "tags",
        in: "query",
        required: false,
        description:
          "Optional comma-separated caller-defined tags for tracking this request. Tags are recorded on the request's usage log and can be used to filter usage on the dashboard usage page. Up to 20 tags, each 1-50 characters.",
        schema: {
          $ref: "#/components/schemas/RequestTags",
        },
      },
    ],
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      openWorldHint: true,
    },
  },
  {
    name: "reprocess-webdb-collection",
    title: "Reprocess rows from stored snapshots",
    method: "POST",
    path: "/webdbs/collections/{collection_id}/reprocess",
    description:
      "Reprocess rows from stored snapshots — Extracts rows again from saved pages without fetching them again. Use `where` to select rows.",
    parameters: [
      {
        name: "collection_id",
        in: "path",
        required: true,
        description: "Collection ID.",
        schema: {
          type: "string",
          example: "col_123",
          description: "Collection ID.",
        },
      },
    ],
    requestBody: {
      required: false,
      schema: {
        $ref: "#/components/schemas/WebdbsReprocessRequest",
      },
      contentType: "application/json",
      binary: false,
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      openWorldHint: true,
    },
  },
  {
    name: "purge-webdb-collection",
    title: "Purge rows by URL pattern",
    method: "POST",
    path: "/webdbs/collections/{collection_id}/purge",
    description:
      "Purge rows by URL pattern — Permanently deletes matching rows, change history, and saved pages.",
    parameters: [
      {
        name: "collection_id",
        in: "path",
        required: true,
        description: "Collection ID.",
        schema: {
          type: "string",
          example: "col_123",
          description: "Collection ID.",
        },
      },
    ],
    requestBody: {
      required: true,
      schema: {
        $ref: "#/components/schemas/WebdbsPurgeRequest",
      },
      contentType: "application/json",
      binary: false,
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      openWorldHint: true,
    },
  },
  {
    name: "query-webdb-collection",
    title: "Query rows",
    method: "POST",
    path: "/webdbs/collections/{collection_id}/query",
    description:
      "Query rows — Filters and sorts collection rows. Use `next_cursor` to load more results.",
    parameters: [
      {
        name: "collection_id",
        in: "path",
        required: true,
        description: "Collection ID.",
        schema: {
          type: "string",
          example: "col_123",
          description: "Collection ID.",
        },
      },
    ],
    requestBody: {
      required: false,
      schema: {
        $ref: "#/components/schemas/WebdbsQueryRequest",
      },
      contentType: "application/json",
      binary: false,
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: true,
    },
  },
  {
    name: "list-webdb-collection-runs",
    title: "List runs for a collection",
    method: "GET",
    path: "/webdbs/collections/{collection_id}/runs",
    description:
      "List runs for a collection — Returns recent runs for a collection.",
    parameters: [
      {
        name: "collection_id",
        in: "path",
        required: true,
        description: "Collection ID.",
        schema: {
          type: "string",
          example: "col_123",
          description: "Collection ID.",
        },
      },
      {
        name: "limit",
        in: "query",
        required: false,
        description: "Maximum items to return. Defaults to 25.",
        schema: {
          type: "integer",
          minimum: 1,
          maximum: 100,
          description: "Maximum items to return. Defaults to 25.",
        },
      },
      {
        name: "cursor",
        in: "query",
        required: false,
        description: "Pagination cursor from a previous response.",
        schema: {
          type: "string",
          description: "Pagination cursor from a previous response.",
        },
      },
      {
        name: "tags",
        in: "query",
        required: false,
        description:
          "Optional comma-separated caller-defined tags for tracking this request. Tags are recorded on the request's usage log and can be used to filter usage on the dashboard usage page. Up to 20 tags, each 1-50 characters.",
        schema: {
          $ref: "#/components/schemas/RequestTags",
        },
      },
    ],
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: true,
    },
  },
  {
    name: "list-webdb-collection-rejections",
    title: "List rejections for a collection",
    method: "GET",
    path: "/webdbs/collections/{collection_id}/rejections",
    description:
      "List rejections for a collection — Returns pages that did not become rows and explains why.",
    parameters: [
      {
        name: "collection_id",
        in: "path",
        required: true,
        description: "Collection ID.",
        schema: {
          type: "string",
          example: "col_123",
          description: "Collection ID.",
        },
      },
      {
        name: "limit",
        in: "query",
        required: false,
        description: "Maximum items to return. Defaults to 25.",
        schema: {
          type: "integer",
          minimum: 1,
          maximum: 100,
          description: "Maximum items to return. Defaults to 25.",
        },
      },
      {
        name: "cursor",
        in: "query",
        required: false,
        description: "Pagination cursor from a previous response.",
        schema: {
          type: "string",
          description: "Pagination cursor from a previous response.",
        },
      },
      {
        name: "since",
        in: "query",
        required: false,
        description: "Return entries at or after this time.",
        schema: {
          type: "string",
          description: "Return entries at or after this time.",
          example: "2026-01-01T00:00:00Z",
        },
      },
      {
        name: "tags",
        in: "query",
        required: false,
        description:
          "Optional comma-separated caller-defined tags for tracking this request. Tags are recorded on the request's usage log and can be used to filter usage on the dashboard usage page. Up to 20 tags, each 1-50 characters.",
        schema: {
          $ref: "#/components/schemas/RequestTags",
        },
      },
    ],
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: true,
    },
  },
  {
    name: "list-webdb-collection-changes",
    title: "List changes for a collection",
    method: "GET",
    path: "/webdbs/collections/{collection_id}/changes",
    description:
      "List changes for a collection — Returns row changes for a collection, newest first.",
    parameters: [
      {
        name: "collection_id",
        in: "path",
        required: true,
        description: "Collection ID.",
        schema: {
          type: "string",
          example: "col_123",
          description: "Collection ID.",
        },
      },
      {
        name: "limit",
        in: "query",
        required: false,
        description: "Maximum items to return. Defaults to 25.",
        schema: {
          type: "integer",
          minimum: 1,
          maximum: 100,
          description: "Maximum items to return. Defaults to 25.",
        },
      },
      {
        name: "cursor",
        in: "query",
        required: false,
        description: "Pagination cursor from a previous response.",
        schema: {
          type: "string",
          description: "Pagination cursor from a previous response.",
        },
      },
      {
        name: "since",
        in: "query",
        required: false,
        description: "Return entries at or after this time.",
        schema: {
          type: "string",
          description: "Return entries at or after this time.",
          example: "2026-01-01T00:00:00Z",
        },
      },
      {
        name: "tags",
        in: "query",
        required: false,
        description:
          "Optional comma-separated caller-defined tags for tracking this request. Tags are recorded on the request's usage log and can be used to filter usage on the dashboard usage page. Up to 20 tags, each 1-50 characters.",
        schema: {
          $ref: "#/components/schemas/RequestTags",
        },
      },
    ],
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: true,
    },
  },
  {
    name: "get-webdb-row",
    title: "Get a row",
    method: "GET",
    path: "/webdbs/rows/{row_id}",
    description:
      "Get a row — Returns one row and links to its latest saved page.",
    parameters: [
      {
        name: "row_id",
        in: "path",
        required: true,
        description: "Row ID.",
        schema: {
          type: "string",
          example: "row_1a2b3c",
          description: "Row ID.",
        },
      },
      {
        name: "tags",
        in: "query",
        required: false,
        description:
          "Optional comma-separated caller-defined tags for tracking this request. Tags are recorded on the request's usage log and can be used to filter usage on the dashboard usage page. Up to 20 tags, each 1-50 characters.",
        schema: {
          $ref: "#/components/schemas/RequestTags",
        },
      },
    ],
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: true,
    },
  },
  {
    name: "delete-webdb-row",
    title: "Delete a row",
    method: "DELETE",
    path: "/webdbs/rows/{row_id}",
    description:
      "Delete a row — Deletes a row. Set `purge=true` to also delete its history and saved pages.",
    parameters: [
      {
        name: "row_id",
        in: "path",
        required: true,
        description: "Row ID.",
        schema: {
          type: "string",
          example: "row_1a2b3c",
          description: "Row ID.",
        },
      },
      {
        name: "purge",
        in: "query",
        required: false,
        description: "Also delete row history and saved pages.",
        schema: {
          type: "boolean",
          default: false,
          description: "Also delete row history and saved pages.",
        },
      },
      {
        name: "tags",
        in: "query",
        required: false,
        description:
          "Optional comma-separated caller-defined tags for tracking this request. Tags are recorded on the request's usage log and can be used to filter usage on the dashboard usage page. Up to 20 tags, each 1-50 characters.",
        schema: {
          $ref: "#/components/schemas/RequestTags",
        },
      },
    ],
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      openWorldHint: true,
    },
  },
  {
    name: "get-webdb-row-history",
    title: "Get a row's change history",
    method: "GET",
    path: "/webdbs/rows/{row_id}/history",
    description:
      "Get a row's change history — Returns changes for one row, newest first.",
    parameters: [
      {
        name: "row_id",
        in: "path",
        required: true,
        description: "Row ID.",
        schema: {
          type: "string",
          example: "row_1a2b3c",
          description: "Row ID.",
        },
      },
      {
        name: "limit",
        in: "query",
        required: false,
        description: "Maximum items to return. Defaults to 25.",
        schema: {
          type: "integer",
          minimum: 1,
          maximum: 100,
          description: "Maximum items to return. Defaults to 25.",
        },
      },
      {
        name: "cursor",
        in: "query",
        required: false,
        description: "Pagination cursor from a previous response.",
        schema: {
          type: "string",
          description: "Pagination cursor from a previous response.",
        },
      },
      {
        name: "tags",
        in: "query",
        required: false,
        description:
          "Optional comma-separated caller-defined tags for tracking this request. Tags are recorded on the request's usage log and can be used to filter usage on the dashboard usage page. Up to 20 tags, each 1-50 characters.",
        schema: {
          $ref: "#/components/schemas/RequestTags",
        },
      },
    ],
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: true,
    },
  },
  {
    name: "get-webdb-row-snapshot",
    title: "Download a row's page snapshot",
    method: "GET",
    path: "/webdbs/rows/{row_id}/snapshot",
    description:
      "Download a row's page snapshot — Redirects to the latest saved page in HTML or Markdown.",
    parameters: [
      {
        name: "row_id",
        in: "path",
        required: true,
        description: "Row ID.",
        schema: {
          type: "string",
          example: "row_1a2b3c",
          description: "Row ID.",
        },
      },
      {
        name: "format",
        in: "query",
        required: false,
        description: "Snapshot format to download.",
        schema: {
          type: "string",
          enum: ["markdown", "html"],
          default: "markdown",
          description: "Snapshot format to download.",
        },
      },
      {
        name: "tags",
        in: "query",
        required: false,
        description:
          "Optional comma-separated caller-defined tags for tracking this request. Tags are recorded on the request's usage log and can be used to filter usage on the dashboard usage page. Up to 20 tags, each 1-50 characters.",
        schema: {
          $ref: "#/components/schemas/RequestTags",
        },
      },
    ],
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: true,
    },
  },
  {
    name: "get-webdb-run",
    title: "Get a run",
    method: "GET",
    path: "/webdbs/runs/{run_id}",
    description:
      "Get a run — Returns the status and results of one collection run.",
    parameters: [
      {
        name: "run_id",
        in: "path",
        required: true,
        description: "Run ID.",
        schema: {
          type: "string",
          example: "run_123",
          description: "Run ID.",
        },
      },
      {
        name: "tags",
        in: "query",
        required: false,
        description:
          "Optional comma-separated caller-defined tags for tracking this request. Tags are recorded on the request's usage log and can be used to filter usage on the dashboard usage page. Up to 20 tags, each 1-50 characters.",
        schema: {
          $ref: "#/components/schemas/RequestTags",
        },
      },
    ],
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: true,
    },
  },
  {
    name: "list-webdb-webhooks",
    title: "List webhooks",
    method: "GET",
    path: "/webdbs/webhooks",
    description: "List webhooks — Returns your WebDB webhooks.",
    parameters: [
      {
        name: "limit",
        in: "query",
        required: false,
        description: "Maximum items to return. Defaults to 25.",
        schema: {
          type: "integer",
          minimum: 1,
          maximum: 100,
          description: "Maximum items to return. Defaults to 25.",
        },
      },
      {
        name: "cursor",
        in: "query",
        required: false,
        description: "Pagination cursor from a previous response.",
        schema: {
          type: "string",
          description: "Pagination cursor from a previous response.",
        },
      },
      {
        name: "tags",
        in: "query",
        required: false,
        description:
          "Optional comma-separated caller-defined tags for tracking this request. Tags are recorded on the request's usage log and can be used to filter usage on the dashboard usage page. Up to 20 tags, each 1-50 characters.",
        schema: {
          $ref: "#/components/schemas/RequestTags",
        },
      },
    ],
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: true,
    },
  },
  {
    name: "create-webdb-webhook",
    title: "Create a webhook",
    method: "POST",
    path: "/webdbs/webhooks",
    description:
      "Create a webhook — Creates a webhook for row and run events. Use the returned secret to verify signatures.",
    parameters: [],
    requestBody: {
      required: true,
      schema: {
        $ref: "#/components/schemas/WebdbsCreateWebhookRequest",
      },
      contentType: "application/json",
      binary: false,
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      openWorldHint: true,
    },
  },
  {
    name: "get-webdb-webhook",
    title: "Get a webhook",
    method: "GET",
    path: "/webdbs/webhooks/{webhook_id}",
    description: "Get a webhook — Returns one WebDB webhook.",
    parameters: [
      {
        name: "webhook_id",
        in: "path",
        required: true,
        description: "Webhook ID.",
        schema: {
          type: "string",
          example: "wh_123",
          description: "Webhook ID.",
        },
      },
      {
        name: "tags",
        in: "query",
        required: false,
        description:
          "Optional comma-separated caller-defined tags for tracking this request. Tags are recorded on the request's usage log and can be used to filter usage on the dashboard usage page. Up to 20 tags, each 1-50 characters.",
        schema: {
          $ref: "#/components/schemas/RequestTags",
        },
      },
    ],
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: true,
    },
  },
  {
    name: "update-webdb-webhook",
    title: "Update a webhook",
    method: "PATCH",
    path: "/webdbs/webhooks/{webhook_id}",
    description: "Update a webhook — Changes a WebDB webhook.",
    parameters: [
      {
        name: "webhook_id",
        in: "path",
        required: true,
        description: "Webhook ID.",
        schema: {
          type: "string",
          example: "wh_123",
          description: "Webhook ID.",
        },
      },
    ],
    requestBody: {
      required: true,
      schema: {
        $ref: "#/components/schemas/WebdbsUpdateWebhookRequest",
      },
      contentType: "application/json",
      binary: false,
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      openWorldHint: true,
    },
  },
  {
    name: "delete-webdb-webhook",
    title: "Delete a webhook",
    method: "DELETE",
    path: "/webdbs/webhooks/{webhook_id}",
    description: "Delete a webhook — Deletes a WebDB webhook.",
    parameters: [
      {
        name: "webhook_id",
        in: "path",
        required: true,
        description: "Webhook ID.",
        schema: {
          type: "string",
          example: "wh_123",
          description: "Webhook ID.",
        },
      },
      {
        name: "tags",
        in: "query",
        required: false,
        description:
          "Optional comma-separated caller-defined tags for tracking this request. Tags are recorded on the request's usage log and can be used to filter usage on the dashboard usage page. Up to 20 tags, each 1-50 characters.",
        schema: {
          $ref: "#/components/schemas/RequestTags",
        },
      },
    ],
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      openWorldHint: true,
    },
  },
  {
    name: "list-webdb-webhook-deliveries",
    title: "List webhook deliveries",
    method: "GET",
    path: "/webdbs/webhooks/{webhook_id}/deliveries",
    description:
      "List webhook deliveries — Returns delivery attempts for a webhook, newest first.",
    parameters: [
      {
        name: "webhook_id",
        in: "path",
        required: true,
        description: "Webhook ID.",
        schema: {
          type: "string",
          example: "wh_123",
          description: "Webhook ID.",
        },
      },
      {
        name: "limit",
        in: "query",
        required: false,
        description: "Maximum items to return. Defaults to 25.",
        schema: {
          type: "integer",
          minimum: 1,
          maximum: 100,
          description: "Maximum items to return. Defaults to 25.",
        },
      },
      {
        name: "cursor",
        in: "query",
        required: false,
        description: "Pagination cursor from a previous response.",
        schema: {
          type: "string",
          description: "Pagination cursor from a previous response.",
        },
      },
      {
        name: "tags",
        in: "query",
        required: false,
        description:
          "Optional comma-separated caller-defined tags for tracking this request. Tags are recorded on the request's usage log and can be used to filter usage on the dashboard usage page. Up to 20 tags, each 1-50 characters.",
        schema: {
          $ref: "#/components/schemas/RequestTags",
        },
      },
    ],
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: true,
    },
  },
  {
    name: "preview-webdb",
    title: "Preview extraction (dry run)",
    method: "POST",
    path: "/webdbs/preview",
    description:
      "Preview extraction (dry run) — Tests extraction on up to 5 URLs without creating a collection. Each URL costs 1 credit.",
    parameters: [],
    requestBody: {
      required: true,
      schema: {
        $ref: "#/components/schemas/WebdbsPreviewRequest",
      },
      contentType: "application/json",
      binary: false,
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: true,
    },
  },
  {
    name: "get-webdb-usage",
    title: "WebDBs credit usage",
    method: "GET",
    path: "/webdbs/usage",
    description:
      "WebDBs credit usage — Returns WebDB credit, row, sync, and storage usage.",
    parameters: [
      {
        name: "from",
        in: "query",
        required: false,
        description: "Start of the usage period.",
        schema: {
          type: "string",
          format: "date-time",
          description: "Start of the usage period.",
        },
      },
      {
        name: "to",
        in: "query",
        required: false,
        description: "End of the usage period.",
        schema: {
          type: "string",
          format: "date-time",
          description: "End of the usage period.",
        },
      },
      {
        name: "tags",
        in: "query",
        required: false,
        description:
          "Optional comma-separated caller-defined tags for tracking this request. Tags are recorded on the request's usage log and can be used to filter usage on the dashboard usage page. Up to 20 tags, each 1-50 characters.",
        schema: {
          $ref: "#/components/schemas/RequestTags",
        },
      },
    ],
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: true,
    },
  },
];

export const COMPONENT_SCHEMAS: Record<string, JsonSchema> = {
  RequestTags: {
    type: "array",
    items: {
      type: "string",
      minLength: 1,
      maxLength: 50,
    },
    maxItems: 20,
    description:
      "Optional tags for tracking usage. Up to 20 tags, each 1 to 50 characters.",
    example: ["production", "team-alpha"],
  },
  WebScrapeAction: {
    oneOf: [
      {
        $ref: "#/components/schemas/WebScrapeWaitAction",
      },
      {
        $ref: "#/components/schemas/WebScrapePerformAction",
      },
    ],
    discriminator: {
      propertyName: "do",
      mapping: {
        wait: "#/components/schemas/WebScrapeWaitAction",
        perform: "#/components/schemas/WebScrapePerformAction",
      },
    },
    description:
      "Browser action discriminated by `do`. Each variant exposes only its applicable fields.",
  },
  BrowserCountryCode: {
    type: "string",
    enum: [
      "ad",
      "ae",
      "af",
      "ag",
      "ai",
      "al",
      "am",
      "ao",
      "ar",
      "at",
      "au",
      "aw",
      "az",
      "ba",
      "bb",
      "bd",
      "be",
      "bf",
      "bg",
      "bh",
      "bi",
      "bj",
      "bm",
      "bn",
      "bo",
      "bq",
      "br",
      "bs",
      "bw",
      "by",
      "bz",
      "ca",
      "cd",
      "cf",
      "cg",
      "ch",
      "ci",
      "cl",
      "cm",
      "cn",
      "co",
      "cr",
      "cv",
      "cw",
      "cy",
      "cz",
      "de",
      "dj",
      "dk",
      "dm",
      "do",
      "dz",
      "ec",
      "ee",
      "eg",
      "es",
      "et",
      "fi",
      "fj",
      "fr",
      "ga",
      "gb",
      "gd",
      "ge",
      "gf",
      "gg",
      "gh",
      "gm",
      "gn",
      "gp",
      "gq",
      "gr",
      "gt",
      "gu",
      "gw",
      "gy",
      "hk",
      "hn",
      "hr",
      "ht",
      "hu",
      "id",
      "ie",
      "il",
      "im",
      "in",
      "iq",
      "ir",
      "is",
      "it",
      "je",
      "jm",
      "jo",
      "jp",
      "ke",
      "kg",
      "kh",
      "kn",
      "kr",
      "kw",
      "ky",
      "kz",
      "la",
      "lb",
      "lc",
      "lk",
      "lr",
      "ls",
      "lt",
      "lu",
      "lv",
      "ly",
      "ma",
      "mc",
      "md",
      "me",
      "mf",
      "mg",
      "mk",
      "ml",
      "mm",
      "mn",
      "mo",
      "mq",
      "mr",
      "mt",
      "mu",
      "mv",
      "mw",
      "mx",
      "my",
      "mz",
      "na",
      "nc",
      "ne",
      "ng",
      "ni",
      "nl",
      "no",
      "np",
      "nz",
      "om",
      "pa",
      "pe",
      "pf",
      "pg",
      "ph",
      "pk",
      "pl",
      "pr",
      "ps",
      "pt",
      "py",
      "qa",
      "re",
      "ro",
      "rs",
      "ru",
      "rw",
      "sa",
      "sc",
      "sd",
      "se",
      "sg",
      "si",
      "sk",
      "sl",
      "sm",
      "sn",
      "so",
      "sr",
      "ss",
      "st",
      "sv",
      "sx",
      "sy",
      "sz",
      "tc",
      "td",
      "tg",
      "th",
      "tj",
      "tl",
      "tm",
      "tn",
      "tr",
      "tt",
      "tw",
      "tz",
      "ua",
      "ug",
      "us",
      "uy",
      "uz",
      "vc",
      "ve",
      "vg",
      "vi",
      "vn",
      "ye",
      "yt",
      "za",
      "zm",
      "zw",
    ],
    example: "de",
    description:
      "Two-letter ISO 3166-1 alpha-2 country code identifying a supported Context.dev residential proxy exit location. Must be one of Context.dev's supported countries. When provided, Context.dev fetches the target page from that country.",
  },
  LenientTimeoutMS: {
    type: "integer",
    minimum: 1,
    maximum: 300000,
    description:
      "Optional timeout in milliseconds for the request. If the request takes longer than this value, it will be aborted with a 408 status code. Maximum allowed value is 300000ms (5 minutes).",
  },
  TimeoutMS: {
    type: "integer",
    minimum: 1000,
    maximum: 300000,
    description:
      "Optional timeout in milliseconds for the request. If the request takes longer than this value, it will be aborted with a 408 status code. Maximum allowed value is 300000ms (5 minutes).",
  },
  PersonRetrieveRequest: {
    type: "object",
    properties: {
      identifiers: {
        type: "object",
        properties: {
          linkedinUrl: {
            type: "string",
            format: "uri",
            description:
              "LinkedIn profile URL, e.g. https://www.linkedin.com/in/yahia-bakour/.",
          },
        },
        additionalProperties: false,
        description:
          "Known identifiers for the person. At least one identifier is required.",
      },
      timeoutMS: {
        $ref: "#/components/schemas/TimeoutMS",
      },
      tags: {
        $ref: "#/components/schemas/RequestTags",
      },
    },
    required: ["identifiers"],
    additionalProperties: false,
  },
  StockExchange: {
    type: "string",
    enum: [
      "AMEX",
      "AMS",
      "AQS",
      "ASX",
      "ATH",
      "BER",
      "BME",
      "BRU",
      "BSE",
      "BUD",
      "BUE",
      "BVC",
      "CBOE",
      "CNQ",
      "CPH",
      "DFM",
      "DOH",
      "DUB",
      "DUS",
      "DXE",
      "EGX",
      "FSX",
      "HAM",
      "HEL",
      "HKSE",
      "HOSE",
      "ICE",
      "IOB",
      "IST",
      "JKT",
      "JNB",
      "JPX",
      "KLS",
      "KOE",
      "KSC",
      "KUW",
      "LIS",
      "LSE",
      "MCX",
      "MEX",
      "MIL",
      "MUN",
      "NASDAQ",
      "NEO",
      "NSE",
      "NYSE",
      "NZE",
      "OSL",
      "OTC",
      "PAR",
      "PNK",
      "PRA",
      "RIS",
      "SAO",
      "SAU",
      "SES",
      "SET",
      "SGO",
      "SHH",
      "SHZ",
      "SIX",
      "STO",
      "STU",
      "TAI",
      "TAL",
      "TLV",
      "TSX",
      "TSXV",
      "TWO",
      "VIE",
      "WSE",
      "XETRA",
    ],
    description: "Stock exchange code.",
  },
  SupportedLanguage: {
    type: "string",
    enum: [
      "afrikaans",
      "albanian",
      "amharic",
      "arabic",
      "armenian",
      "assamese",
      "aymara",
      "azeri",
      "basque",
      "belarusian",
      "bengali",
      "bosnian",
      "bulgarian",
      "burmese",
      "cantonese",
      "catalan",
      "cebuano",
      "chinese",
      "corsican",
      "croatian",
      "czech",
      "danish",
      "dutch",
      "english",
      "esperanto",
      "estonian",
      "farsi",
      "fijian",
      "finnish",
      "french",
      "galician",
      "georgian",
      "german",
      "greek",
      "guarani",
      "gujarati",
      "haitian-creole",
      "hausa",
      "hawaiian",
      "hebrew",
      "hindi",
      "hmong",
      "hungarian",
      "icelandic",
      "igbo",
      "indonesian",
      "irish",
      "italian",
      "japanese",
      "javanese",
      "kannada",
      "kazakh",
      "khmer",
      "kinyarwanda",
      "korean",
      "kurdish",
      "kyrgyz",
      "lao",
      "latin",
      "latvian",
      "lingala",
      "lithuanian",
      "luxembourgish",
      "macedonian",
      "malagasy",
      "malay",
      "malayalam",
      "maltese",
      "maori",
      "marathi",
      "mongolian",
      "nepali",
      "norwegian",
      "odia",
      "oromo",
      "pashto",
      "pidgin",
      "polish",
      "portuguese",
      "punjabi",
      "quechua",
      "romanian",
      "russian",
      "samoan",
      "scottish-gaelic",
      "serbian",
      "sesotho",
      "shona",
      "sindhi",
      "sinhala",
      "slovak",
      "slovene",
      "somali",
      "spanish",
      "sundanese",
      "swahili",
      "swedish",
      "tagalog",
      "tajik",
      "tamil",
      "tatar",
      "telugu",
      "thai",
      "tibetan",
      "tigrinya",
      "tongan",
      "tswana",
      "turkish",
      "turkmen",
      "ukrainian",
      "urdu",
      "uyghur",
      "uzbek",
      "vietnamese",
      "welsh",
      "wolof",
      "xhosa",
      "yiddish",
      "yoruba",
      "zulu",
    ],
    description: "Language to force for the retrieved brand data.",
  },
  BrandRetrieveRequest: {
    oneOf: [
      {
        $ref: "#/components/schemas/BrandRetrieveByDomainRequest",
      },
      {
        $ref: "#/components/schemas/BrandRetrieveByNameRequest",
      },
      {
        $ref: "#/components/schemas/BrandRetrieveByEmailRequest",
      },
      {
        $ref: "#/components/schemas/BrandRetrieveByTickerRequest",
      },
      {
        $ref: "#/components/schemas/BrandRetrieveByDirectUrlRequest",
      },
      {
        $ref: "#/components/schemas/BrandRetrieveFromTransactionRequest",
      },
    ],
    discriminator: {
      propertyName: "type",
      mapping: {
        by_domain: "#/components/schemas/BrandRetrieveByDomainRequest",
        by_name: "#/components/schemas/BrandRetrieveByNameRequest",
        by_email: "#/components/schemas/BrandRetrieveByEmailRequest",
        by_ticker: "#/components/schemas/BrandRetrieveByTickerRequest",
        by_direct_url: "#/components/schemas/BrandRetrieveByDirectUrlRequest",
        by_transaction:
          "#/components/schemas/BrandRetrieveFromTransactionRequest",
      },
    },
    description: "Exactly one lookup type must be provided.",
  },
  CountryGL: {
    type: "string",
    enum: [
      "af",
      "al",
      "dz",
      "as",
      "ad",
      "ao",
      "ai",
      "aq",
      "ag",
      "ar",
      "am",
      "aw",
      "au",
      "at",
      "az",
      "bs",
      "bh",
      "bd",
      "bb",
      "by",
      "be",
      "bz",
      "bj",
      "bm",
      "bt",
      "bo",
      "ba",
      "bw",
      "bv",
      "br",
      "io",
      "bn",
      "bg",
      "bf",
      "bi",
      "kh",
      "cm",
      "ca",
      "cv",
      "ky",
      "cf",
      "td",
      "cl",
      "cn",
      "cx",
      "cc",
      "co",
      "km",
      "cg",
      "cd",
      "ck",
      "cr",
      "ci",
      "hr",
      "cu",
      "cy",
      "cz",
      "dk",
      "dj",
      "dm",
      "do",
      "ec",
      "eg",
      "sv",
      "gq",
      "er",
      "ee",
      "et",
      "fk",
      "fo",
      "fj",
      "fi",
      "fr",
      "gf",
      "pf",
      "tf",
      "ga",
      "gm",
      "ge",
      "de",
      "gh",
      "gi",
      "gr",
      "gl",
      "gd",
      "gp",
      "gu",
      "gt",
      "gn",
      "gw",
      "gy",
      "ht",
      "hm",
      "va",
      "hn",
      "hk",
      "hu",
      "is",
      "in",
      "id",
      "ir",
      "iq",
      "ie",
      "il",
      "it",
      "jm",
      "jp",
      "jo",
      "kz",
      "ke",
      "ki",
      "kp",
      "kr",
      "kw",
      "kg",
      "la",
      "lv",
      "lb",
      "ls",
      "lr",
      "ly",
      "li",
      "lt",
      "lu",
      "mo",
      "mk",
      "mg",
      "mw",
      "my",
      "mv",
      "ml",
      "mt",
      "mh",
      "mq",
      "mr",
      "mu",
      "yt",
      "mx",
      "fm",
      "md",
      "mc",
      "mn",
      "ms",
      "ma",
      "mz",
      "mm",
      "na",
      "nr",
      "np",
      "nl",
      "an",
      "nc",
      "nz",
      "ni",
      "ne",
      "ng",
      "nu",
      "nf",
      "mp",
      "no",
      "om",
      "pk",
      "pw",
      "ps",
      "pa",
      "pg",
      "py",
      "pe",
      "ph",
      "pn",
      "pl",
      "pt",
      "pr",
      "qa",
      "re",
      "ro",
      "ru",
      "rw",
      "sh",
      "kn",
      "lc",
      "pm",
      "vc",
      "ws",
      "sm",
      "st",
      "sa",
      "sn",
      "rs",
      "sc",
      "sl",
      "sg",
      "sk",
      "si",
      "sb",
      "so",
      "za",
      "gs",
      "es",
      "lk",
      "sd",
      "sr",
      "sj",
      "sz",
      "se",
      "ch",
      "sy",
      "tw",
      "tj",
      "tz",
      "th",
      "tl",
      "tg",
      "tk",
      "to",
      "tt",
      "tn",
      "tr",
      "tm",
      "tc",
      "tv",
      "ug",
      "ua",
      "ae",
      "gb",
      "us",
      "um",
      "uy",
      "uz",
      "vu",
      "ve",
      "vn",
      "vg",
      "vi",
      "wf",
      "eh",
      "ye",
      "zm",
      "zw",
    ],
    description:
      "Two-letter ISO 3166-1 alpha-2 country code (GL parameter) used to localize search.",
  },
  UtilityPrefetchIdentifier: {
    oneOf: [
      {
        $ref: "#/components/schemas/UtilityPrefetchDomainIdentifier",
      },
      {
        $ref: "#/components/schemas/UtilityPrefetchEmailIdentifier",
      },
    ],
    description:
      "Identifier of the brand to prefetch. Provide exactly one of domain or email.",
  },
  MonitorsCreateMonitorRequest: {
    type: "object",
    properties: {
      mode: {
        $ref: "#/components/schemas/MonitorsMode",
      },
      name: {
        type: "string",
        minLength: 1,
        maxLength: 200,
        example: "Acme pricing monitor",
      },
      tags: {
        type: "array",
        items: {
          type: "string",
          minLength: 1,
          maxLength: 50,
        },
        maxItems: 20,
        uniqueItems: true,
        description:
          "User-defined tags for grouping and filtering monitors and their changes. Duplicates are removed.",
        example: ["pricing", "competitor"],
      },
      target: {
        $ref: "#/components/schemas/MonitorsTarget",
      },
      change_detection: {
        $ref: "#/components/schemas/MonitorsChangeDetection",
      },
      schedule: {
        $ref: "#/components/schemas/MonitorsSchedule",
      },
      webhook: {
        $ref: "#/components/schemas/MonitorsNullableWebhookConfig",
      },
    },
    required: ["name", "target"],
    additionalProperties: false,
    title: "Create monitor request",
    description:
      "Creates a web monitor. `mode` is the constant `web`; the behavior is described by `target` (page, sitemap, or extract) and `change_detection` (exact or semantic). Supported combinations: page + exact, page + semantic, sitemap + exact, extract + semantic. `change_detection` is optional; page targets with `instructions` infer semantic detection, while page targets without them infer exact detection. Other targets default to their supported detection type. `schedule` is optional and defaults to once per day.",
  },
  MonitorsUpdateMonitorRequest: {
    type: "object",
    properties: {
      name: {
        type: "string",
        minLength: 1,
        maxLength: 200,
        example: "Acme pricing monitor",
      },
      tags: {
        type: "array",
        items: {
          type: "string",
          minLength: 1,
          maxLength: 50,
        },
        maxItems: 20,
        uniqueItems: true,
        description:
          "User-defined tags for grouping and filtering monitors and their changes. Duplicates are removed.",
        example: ["pricing", "competitor"],
      },
      status: {
        type: "string",
        enum: ["active", "paused"],
      },
      target: {
        $ref: "#/components/schemas/MonitorsTarget",
      },
      change_detection: {
        $ref: "#/components/schemas/MonitorsChangeDetection",
      },
      schedule: {
        $ref: "#/components/schemas/MonitorsSchedule",
      },
      webhook: {
        $ref: "#/components/schemas/MonitorsNullableWebhookConfig",
        description: "Set to null to remove the webhook.",
      },
    },
    additionalProperties: false,
    description:
      "Shared monitor update fields. `target` and `change_detection` can be updated, but the final combination must be supported.",
  },
  WebdbsCreateCollectionRequest: {
    type: "object",
    properties: {
      name: {
        type: "string",
        minLength: 1,
        maxLength: 200,
        description: "Collection name.",
      },
      description: {
        type: "string",
        maxLength: 2000,
        description: "Optional collection description.",
      },
      schema: {
        allOf: [
          {
            $ref: "#/components/schemas/WebdbsSchema",
          },
        ],
        description: "JSON Schema for each row.",
      },
      eligibility: {
        allOf: [
          {
            $ref: "#/components/schemas/WebdbsEligibility",
          },
          {
            description: "Rules for deciding which pages become rows.",
          },
        ],
      },
      targets: {
        type: "array",
        items: {
          $ref: "#/components/schemas/WebdbsTarget",
        },
        minItems: 1,
        maxItems: 20,
        description: "Sources that provide pages for the collection.",
      },
      sync: {
        allOf: [
          {
            $ref: "#/components/schemas/WebdbsSync",
          },
          {
            description: "Collection sync schedule. Defaults to once per day.",
          },
        ],
      },
      change_tracking: {
        allOf: [
          {
            $ref: "#/components/schemas/WebdbsChangeTracking",
          },
          {
            description: "Row change history settings.",
          },
        ],
      },
      budgets: {
        allOf: [
          {
            $ref: "#/components/schemas/WebdbsBudgets",
          },
          {
            description: "Optional collection spending limits.",
          },
        ],
      },
      on_disappear: {
        type: "string",
        enum: ["soft_delete", "hard_delete", "keep"],
        default: "soft_delete",
        description:
          "Action for rows whose source page disappears or becomes ineligible.",
      },
      stale_after: {
        type: "integer",
        minimum: 1,
        maximum: 50,
        default: 3,
        description: "Missed syncs before a row becomes stale.",
      },
      tags: {
        $ref: "#/components/schemas/RequestTags",
      },
    },
    required: ["name", "schema", "targets"],
    additionalProperties: false,
    title: "Create WebDB collection request",
    description: "Settings for a new WebDB collection.",
  },
  WebdbsUpdateCollectionRequest: {
    type: "object",
    properties: {
      name: {
        type: "string",
        minLength: 1,
        maxLength: 200,
        description: "Collection name.",
      },
      description: {
        type: "string",
        maxLength: 2000,
        description: "Optional collection description.",
      },
      schema: {
        allOf: [
          {
            $ref: "#/components/schemas/WebdbsSchema",
          },
        ],
        description: "JSON Schema for each row.",
      },
      eligibility: {
        allOf: [
          {
            $ref: "#/components/schemas/WebdbsEligibility",
          },
          {
            description: "Rules for deciding which pages become rows.",
          },
        ],
      },
      targets: {
        type: "array",
        items: {
          $ref: "#/components/schemas/WebdbsTarget",
        },
        minItems: 1,
        maxItems: 20,
        description: "Complete replacement list of collection targets.",
      },
      sync: {
        allOf: [
          {
            $ref: "#/components/schemas/WebdbsSync",
          },
          {
            description: "Collection sync schedule.",
          },
        ],
      },
      change_tracking: {
        allOf: [
          {
            $ref: "#/components/schemas/WebdbsChangeTracking",
          },
          {
            description: "Row change history settings.",
          },
        ],
      },
      budgets: {
        allOf: [
          {
            $ref: "#/components/schemas/WebdbsBudgets",
          },
          {
            description: "Optional collection spending limits.",
          },
        ],
      },
      on_disappear: {
        type: "string",
        enum: ["soft_delete", "hard_delete", "keep"],
        description:
          "Action for rows whose source page disappears or becomes ineligible.",
      },
      stale_after: {
        type: "integer",
        minimum: 1,
        maximum: 50,
        description: "Missed syncs before a row becomes stale.",
      },
      status: {
        type: "string",
        enum: ["active", "paused"],
        description: "Pause or resume syncing.",
      },
      tags: {
        $ref: "#/components/schemas/RequestTags",
      },
    },
    additionalProperties: false,
    title: "Update WebDB collection request",
    description: "Fields to update on a WebDB collection.",
  },
  WebdbsReprocessRequest: {
    type: "object",
    properties: {
      where: {
        type: "object",
        additionalProperties: {},
        description: "Rows to reprocess. Omit to reprocess every row.",
      },
      tags: {
        $ref: "#/components/schemas/RequestTags",
      },
    },
    additionalProperties: false,
    title: "WebDB reprocess request",
    description: "Selects rows to extract again from saved pages.",
  },
  WebdbsPurgeRequest: {
    type: "object",
    properties: {
      url_match: {
        type: "array",
        items: {
          type: "string",
        },
        minItems: 1,
        maxItems: 50,
        example: [
          "https://shop.com/products/:product_id",
          "https://foo.com/item?id=*",
          "https://foo.com/bar/*",
          "**/events/**",
        ],
        description:
          "URL patterns for rows to permanently delete. Supports exact URLs, `*`, `**`, and `:name` path values.",
      },
      tags: {
        $ref: "#/components/schemas/RequestTags",
      },
    },
    required: ["url_match"],
    additionalProperties: false,
    title: "WebDB purge request",
    description: "Selects rows to permanently delete by URL.",
  },
  WebdbsQueryRequest: {
    type: "object",
    properties: {
      where: {
        type: "object",
        additionalProperties: {},
        description:
          "Filters rows by field values. Supports comparisons, lists, text matching, and boolean groups.",
      },
      order_by: {
        type: "array",
        items: {
          type: "object",
          properties: {
            field: {
              type: "string",
              description: "Field used to sort rows.",
            },
            dir: {
              type: "string",
              enum: ["asc", "desc"],
              default: "asc",
              description: "Sort direction.",
            },
          },
          required: ["field"],
          additionalProperties: false,
        },
        maxItems: 3,
        description: "Fields used to sort the results.",
      },
      select: {
        type: "array",
        items: {
          type: "string",
          minLength: 1,
        },
        maxItems: 50,
        description: "Fields to include in each row. `_id` is always included.",
      },
      limit: {
        type: "integer",
        minimum: 1,
        maximum: 200,
        default: 25,
        description: "Maximum rows to return. Defaults to 25.",
      },
      cursor: {
        type: "string",
        description: "Pagination cursor from a previous query.",
      },
      tags: {
        $ref: "#/components/schemas/RequestTags",
      },
    },
    additionalProperties: false,
    title: "WebDB query request",
    description: "Filters, sorts, and selects fields from collection rows.",
  },
  WebdbsCreateWebhookRequest: {
    type: "object",
    properties: {
      url: {
        type: "string",
        format: "uri",
        description: "HTTPS URL that receives events.",
      },
      events: {
        type: "array",
        items: {
          type: "string",
          enum: [
            "row.created",
            "row.updated",
            "row.removed",
            "row.error",
            "row.cap_consumed",
            "run.completed",
            "run.failed",
            "credits.low",
            "credits.exhausted",
          ],
        },
        minItems: 1,
        description: "Events sent to this webhook.",
      },
      collection_id: {
        type: "string",
        description: "Collection to watch. Omit to watch all collections.",
      },
      on: {
        type: "object",
        properties: {
          fields: {
            type: "array",
            items: {
              type: "string",
            },
            minItems: 1,
            maxItems: 20,
            description: "Fields that trigger row.updated events.",
          },
        },
        required: ["fields"],
        additionalProperties: false,
        description: "Sends row.updated only when one of these fields changes.",
      },
      delivery: {
        type: "string",
        enum: ["instant", "batch"],
        default: "instant",
        description: "Send events immediately or in batches.",
      },
      batch: {
        type: "object",
        properties: {
          max_size: {
            type: "integer",
            minimum: 1,
            maximum: 500,
            description: "Maximum events in one batch.",
          },
          max_delay: {
            type: "string",
            pattern: "^(\\d+)(s|m|h|d)$",
            description: "Maximum wait before sending a batch.",
          },
        },
        additionalProperties: false,
        description: "Batch delivery settings.",
      },
      tags: {
        $ref: "#/components/schemas/RequestTags",
      },
    },
    required: ["url", "events"],
    additionalProperties: false,
    title: "Create WebDB webhook request",
    description: "Settings for a new WebDB webhook.",
  },
  WebdbsUpdateWebhookRequest: {
    type: "object",
    properties: {
      url: {
        type: "string",
        format: "uri",
        description: "HTTPS URL that receives events.",
      },
      events: {
        type: "array",
        items: {
          type: "string",
          enum: [
            "row.created",
            "row.updated",
            "row.removed",
            "row.error",
            "row.cap_consumed",
            "run.completed",
            "run.failed",
            "credits.low",
            "credits.exhausted",
          ],
        },
        minItems: 1,
        description: "Events sent to this webhook.",
      },
      collection_id: {
        type: "string",
        description: "Collection to watch.",
      },
      on: {
        type: "object",
        properties: {
          fields: {
            type: "array",
            items: {
              type: "string",
            },
            minItems: 1,
            maxItems: 20,
            description: "Fields that trigger row.updated events.",
          },
        },
        required: ["fields"],
        additionalProperties: false,
        description: "Sends row.updated only when one of these fields changes.",
      },
      delivery: {
        type: "string",
        enum: ["instant", "batch"],
        description: "Send events immediately or in batches.",
      },
      batch: {
        type: "object",
        properties: {
          max_size: {
            type: "integer",
            minimum: 1,
            maximum: 500,
            description: "Maximum events in one batch.",
          },
          max_delay: {
            type: "string",
            pattern: "^(\\d+)(s|m|h|d)$",
            description: "Maximum wait before sending a batch.",
          },
        },
        additionalProperties: false,
        description: "Batch delivery settings.",
      },
      tags: {
        $ref: "#/components/schemas/RequestTags",
      },
    },
    additionalProperties: false,
    title: "Update WebDB webhook request",
    description: "Fields to update on a WebDB webhook.",
  },
  WebdbsPreviewRequest: {
    type: "object",
    properties: {
      urls: {
        type: "array",
        items: {
          type: "string",
          format: "uri",
        },
        minItems: 1,
        maxItems: 5,
        description: "URLs to test. Maximum 5.",
      },
      schema: {
        allOf: [
          {
            $ref: "#/components/schemas/WebdbsSchema",
          },
        ],
        description: "JSON Schema for each row.",
      },
      eligibility: {
        allOf: [
          {
            $ref: "#/components/schemas/WebdbsEligibility",
          },
          {
            description: "Rules for deciding which pages become rows.",
          },
        ],
      },
      tags: {
        $ref: "#/components/schemas/RequestTags",
      },
    },
    required: ["urls", "schema"],
    additionalProperties: false,
    title: "WebDB preview request",
    description: "Tests extraction without creating a collection.",
  },
  WebScrapeWaitAction: {
    type: "object",
    properties: {
      do: {
        type: "string",
        enum: ["wait"],
      },
      timeMs: {
        type: "integer",
        minimum: 0,
        maximum: 30000,
      },
    },
    required: ["do", "timeMs"],
    additionalProperties: false,
    description:
      "Pause for a fixed number of milliseconds before continuing to the next action.",
    title: "Wait",
  },
  WebScrapePerformAction: {
    type: "object",
    properties: {
      do: {
        type: "string",
        enum: ["perform"],
      },
      action: {
        type: "string",
        minLength: 1,
        maxLength: 500,
      },
    },
    required: ["do", "action"],
    additionalProperties: false,
    description: "Resolve and perform one natural-language browser action.",
    title: "Perform",
  },
  BrandRetrieveByDomainRequest: {
    type: "object",
    properties: {
      force_language: {
        allOf: [
          {
            $ref: "#/components/schemas/SupportedLanguage",
          },
          {
            type: ["string", "null"],
          },
        ],
      },
      maxSpeed: {
        type: "boolean",
        description:
          "Optional parameter to optimize the API call for maximum speed. When set to true, the API will skip time-consuming operations for faster response at the cost of less comprehensive data.",
      },
      maxAgeMs: {
        type: "integer",
        description:
          "Maximum age in milliseconds for cached brand data before the API performs a hard refresh. Defaults to 3 months (7776000000 ms). Values below 1 day (86400000 ms) are clamped to 1 day; values above 1 year (31536000000 ms) are clamped to 1 year.",
      },
      timeoutMS: {
        $ref: "#/components/schemas/TimeoutMS",
      },
      type: {
        type: "string",
        enum: ["by_domain"],
        description: "Discriminator for domain-based brand retrieval.",
      },
      domain: {
        type: "string",
        minLength: 3,
        description:
          "Domain name to retrieve brand data for (e.g., 'stripe.com').",
      },
      tags: {
        $ref: "#/components/schemas/RequestTags",
      },
    },
    required: ["type", "domain"],
    additionalProperties: false,
    title: "By domain",
    description:
      "Retrieve brand data by domain. Cannot be combined with name, email, or ticker.",
  },
  BrandRetrieveByNameRequest: {
    type: "object",
    properties: {
      force_language: {
        allOf: [
          {
            $ref: "#/components/schemas/SupportedLanguage",
          },
          {
            type: ["string", "null"],
          },
        ],
      },
      maxSpeed: {
        type: "boolean",
        description:
          "Optional parameter to optimize the API call for maximum speed. When set to true, the API will skip time-consuming operations for faster response at the cost of less comprehensive data.",
      },
      maxAgeMs: {
        type: "integer",
        description:
          "Maximum age in milliseconds for cached brand data before the API performs a hard refresh. Defaults to 3 months (7776000000 ms). Values below 1 day (86400000 ms) are clamped to 1 day; values above 1 year (31536000000 ms) are clamped to 1 year.",
      },
      timeoutMS: {
        $ref: "#/components/schemas/TimeoutMS",
      },
      type: {
        type: "string",
        enum: ["by_name"],
        description: "Discriminator for name-based brand retrieval.",
      },
      name: {
        type: "string",
        minLength: 3,
        maxLength: 30,
        description:
          "Company name to retrieve brand data for (e.g., 'Apple Inc').",
      },
      country_gl: {
        type: "string",
        description:
          "Optional country code hint (GL parameter) to specify the country when looking up by company name.",
      },
      tags: {
        $ref: "#/components/schemas/RequestTags",
      },
    },
    required: ["type", "name"],
    additionalProperties: false,
    title: "By name",
    description:
      "Retrieve brand data by company name. Cannot be combined with domain, email, or ticker.",
  },
  BrandRetrieveByEmailRequest: {
    type: "object",
    properties: {
      force_language: {
        allOf: [
          {
            $ref: "#/components/schemas/SupportedLanguage",
          },
          {
            type: ["string", "null"],
          },
        ],
      },
      maxSpeed: {
        type: "boolean",
        description:
          "Optional parameter to optimize the API call for maximum speed. When set to true, the API will skip time-consuming operations for faster response at the cost of less comprehensive data.",
      },
      maxAgeMs: {
        type: "integer",
        description:
          "Maximum age in milliseconds for cached brand data before the API performs a hard refresh. Defaults to 3 months (7776000000 ms). Values below 1 day (86400000 ms) are clamped to 1 day; values above 1 year (31536000000 ms) are clamped to 1 year.",
      },
      timeoutMS: {
        $ref: "#/components/schemas/TimeoutMS",
      },
      type: {
        type: "string",
        enum: ["by_email"],
        description: "Discriminator for email-based brand retrieval.",
      },
      email: {
        type: "string",
        minLength: 1,
        format: "email",
        description:
          "Email address to retrieve brand data for (e.g., 'jane@stripe.com').",
      },
      tags: {
        $ref: "#/components/schemas/RequestTags",
      },
    },
    required: ["type", "email"],
    additionalProperties: false,
    title: "By email",
    description:
      "Retrieve brand data by email address. The domain is extracted from the email. Free and disposable email providers are rejected with 422. Cannot be combined with domain, name, or ticker.",
  },
  BrandRetrieveByTickerRequest: {
    type: "object",
    properties: {
      force_language: {
        allOf: [
          {
            $ref: "#/components/schemas/SupportedLanguage",
          },
          {
            type: ["string", "null"],
          },
        ],
      },
      maxSpeed: {
        type: "boolean",
        description:
          "Optional parameter to optimize the API call for maximum speed. When set to true, the API will skip time-consuming operations for faster response at the cost of less comprehensive data.",
      },
      maxAgeMs: {
        type: "integer",
        description:
          "Maximum age in milliseconds for cached brand data before the API performs a hard refresh. Defaults to 3 months (7776000000 ms). Values below 1 day (86400000 ms) are clamped to 1 day; values above 1 year (31536000000 ms) are clamped to 1 year.",
      },
      timeoutMS: {
        $ref: "#/components/schemas/TimeoutMS",
      },
      type: {
        type: "string",
        enum: ["by_ticker"],
        description: "Discriminator for ticker-based brand retrieval.",
      },
      ticker: {
        type: "string",
        minLength: 1,
        maxLength: 15,
        pattern: "^[A-Za-z0-9.]+$",
        description:
          "Stock ticker symbol to retrieve brand data for (e.g., 'AAPL').",
      },
      ticker_exchange: {
        type: "string",
        description:
          "Optional stock exchange for the ticker. Defaults to NASDAQ if not specified.",
      },
      tags: {
        $ref: "#/components/schemas/RequestTags",
      },
    },
    required: ["type", "ticker"],
    additionalProperties: false,
    title: "By stock",
    description:
      "Retrieve brand data by stock ticker. Cannot be combined with domain, name, or email.",
  },
  BrandRetrieveByDirectUrlRequest: {
    type: "object",
    properties: {
      type: {
        type: "string",
        enum: ["by_direct_url"],
        description: "Discriminator for direct-URL-based brand retrieval.",
      },
      direct_url: {
        type: "string",
        format: "uri",
        description:
          "Full http(s) URL to fetch brand data from (e.g., 'https://stripe.com/enterprise'). Only this URL is fetched — not the entire internet.",
      },
      timeoutMS: {
        $ref: "#/components/schemas/TimeoutMS",
      },
      tags: {
        $ref: "#/components/schemas/RequestTags",
      },
    },
    required: ["type", "direct_url"],
    additionalProperties: false,
    title: "By direct URL",
    description:
      "Retrieve brand data by fetching the provided URL directly. Note: if you use this, brand data is fetched only from the provided URL — not from the entire internet — so results are limited to what that single page contains. No domain resolution, database lookup, or cross-source enrichment is performed. Cannot be combined with domain, name, email, or ticker.",
  },
  BrandRetrieveFromTransactionRequest: {
    type: "object",
    properties: {
      type: {
        type: "string",
        enum: ["by_transaction"],
        description: "Discriminator for transaction-based brand retrieval.",
      },
      transaction_info: {
        type: "string",
        minLength: 3,
        maxLength: 500,
        description: "Transaction information to identify the brand.",
      },
      force_language: {
        allOf: [
          {
            $ref: "#/components/schemas/SupportedLanguage",
          },
          {
            type: ["string", "null"],
          },
        ],
      },
      maxSpeed: {
        type: "boolean",
        description:
          "Optional parameter to optimize the API call for maximum speed. When set to true, the API will skip time-consuming operations for faster response at the cost of less comprehensive data.",
      },
      timeoutMS: {
        $ref: "#/components/schemas/TimeoutMS",
      },
      country_gl: {
        type: "string",
        description:
          "Optional country code hint (GL parameter) to specify the country when identifying a transaction.",
      },
      city: {
        type: "string",
        description:
          "Optional city name to prioritize when searching for the brand.",
      },
      mcc: {
        anyOf: [
          {
            type: "string",
          },
          {
            type: "number",
          },
        ],
        description:
          "Optional Merchant Category Code (MCC) to help identify the business category or industry.",
      },
      phone: {
        anyOf: [
          {
            type: "string",
          },
          {
            type: "number",
          },
        ],
        description:
          "Optional phone number from the transaction to help verify brand match.",
      },
      high_confidence_only: {
        type: "boolean",
        description:
          "When set to true, the API performs additional verification to ensure the identified brand matches the transaction with high confidence.",
      },
      tags: {
        $ref: "#/components/schemas/RequestTags",
      },
    },
    required: ["type", "transaction_info"],
    additionalProperties: false,
    title: "By transaction",
    description:
      "Identify brand data from a transaction descriptor. Cannot be combined with domain, name, email, or ticker.",
  },
  UtilityPrefetchDomainIdentifier: {
    type: "object",
    properties: {
      domain: {
        type: "string",
        minLength: 3,
        description: "Domain name to prefetch brand data for",
      },
    },
    required: ["domain"],
    additionalProperties: false,
    title: "By domain",
    description: "Prefetch brand data by domain.",
  },
  UtilityPrefetchEmailIdentifier: {
    type: "object",
    properties: {
      email: {
        type: "string",
        minLength: 1,
        format: "email",
        description:
          "Email address to prefetch brand data for. The domain will be extracted from the email. Free email providers (gmail.com, yahoo.com, etc.) and disposable email addresses are not allowed.",
      },
    },
    required: ["email"],
    additionalProperties: false,
    title: "By email",
    description:
      "Prefetch brand data by email. The domain will be extracted and validated.",
  },
  MonitorsMode: {
    type: "string",
    enum: ["web"],
    description:
      "Top-level monitor category. Always `web` today; the concrete behavior is described by `target` and `change_detection`.",
    title: "Monitor mode",
  },
  MonitorsTarget: {
    oneOf: [
      {
        $ref: "#/components/schemas/MonitorsPageTarget",
      },
      {
        $ref: "#/components/schemas/MonitorsSitemapTarget",
      },
      {
        allOf: [
          {
            $ref: "#/components/schemas/MonitorsExtractTarget",
          },
          {
            description:
              "Watch the monitor-relevant pages of a site for meaningful changes. A crawl guided by `schema`/`instructions` selects up to `max_pages` relevant pages to track; each run re-checks exactly those pages, and confirmed content changes are judged for relevance against the monitor's `instructions` (and `schema`, when provided). The tracked page set is refreshed by a periodic re-discovery crawl.",
          },
        ],
      },
    ],
    discriminator: {
      propertyName: "type",
      mapping: {
        page: "#/components/schemas/MonitorsPageTarget",
        sitemap: "#/components/schemas/MonitorsSitemapTarget",
        extract: "#/components/schemas/MonitorsExtractTarget",
      },
    },
    description: "Discriminated union describing what the monitor watches.",
  },
  MonitorsChangeDetection: {
    oneOf: [
      {
        $ref: "#/components/schemas/MonitorsExactChangeDetection",
      },
      {
        $ref: "#/components/schemas/MonitorsSemanticChangeDetection",
      },
    ],
    discriminator: {
      propertyName: "type",
      mapping: {
        exact: "#/components/schemas/MonitorsExactChangeDetection",
        semantic: "#/components/schemas/MonitorsSemanticChangeDetection",
      },
    },
    description: "Discriminated union describing how changes are detected.",
  },
  MonitorsSchedule: {
    oneOf: [
      {
        $ref: "#/components/schemas/MonitorsIntervalSchedule",
      },
    ],
    discriminator: {
      propertyName: "type",
      mapping: {
        interval: "#/components/schemas/MonitorsIntervalSchedule",
      },
    },
    description:
      "Discriminated union describing how the monitor is scheduled. Only `interval` is supported today; `cron` and `exact_time` are reserved for future use.",
  },
  MonitorsNullableWebhookConfig: {
    anyOf: [
      {
        allOf: [
          {
            $ref: "#/components/schemas/MonitorsWebhookConfig",
          },
        ],
      },
      {
        type: "null",
      },
    ],
  },
  WebdbsSchema: {
    type: "object",
    additionalProperties: true,
    title: "WebDB row schema",
    description:
      "JSON Schema for the fields extracted into each row. Zod users can pass the output of z.toJSONSchema().",
    example: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "Product name.",
        },
        price: {
          type: "number",
          description: "Current price.",
        },
      },
      required: ["title"],
      additionalProperties: false,
    },
  },
  WebdbsEligibility: {
    type: "object",
    properties: {
      prefilter: {
        type: "object",
        properties: {
          url_match: {
            type: "array",
            items: {
              type: "string",
            },
            maxItems: 50,
            example: [
              "https://shop.com/products/:product_id",
              "https://foo.com/item?id=*",
              "https://foo.com/bar/*",
              "**/events/**",
            ],
            description:
              "URL patterns a page must match. Supports exact URLs, `*`, `**`, and `:name` path values.",
          },
          must_contain_any: {
            type: "array",
            items: {
              type: "string",
            },
            maxItems: 50,
            description: "Text where at least one value must appear.",
          },
          must_not_contain: {
            type: "array",
            items: {
              type: "string",
            },
            maxItems: 50,
            description: "Text values that must not appear.",
          },
        },
        additionalProperties: false,
        description: "Fast URL and text checks.",
      },
      semantic: {
        type: "object",
        properties: {
          condition: {
            type: "string",
            minLength: 1,
            maxLength: 4000,
            description: "Plain-language rule a page must satisfy.",
          },
          min_score: {
            type: "number",
            minimum: 0,
            maximum: 1,
            description: "Minimum matching score from 0 to 1. Defaults to 0.7.",
          },
        },
        required: ["condition"],
        additionalProperties: false,
        description: "AI check for whether a page should become a row.",
      },
    },
    additionalProperties: false,
    description: "Rules that decide whether a page becomes a row.",
    title: "WebDB eligibility rules",
  },
  WebdbsTarget: {
    oneOf: [
      {
        $ref: "#/components/schemas/WebdbsUrlTarget",
      },
      {
        $ref: "#/components/schemas/WebdbsUrlListTarget",
      },
      {
        $ref: "#/components/schemas/WebdbsSitemapTarget",
      },
      {
        $ref: "#/components/schemas/WebdbsCrawlTarget",
      },
    ],
    discriminator: {
      propertyName: "type",
      mapping: {
        url: "#/components/schemas/WebdbsUrlTarget",
        url_list: "#/components/schemas/WebdbsUrlListTarget",
        sitemap: "#/components/schemas/WebdbsSitemapTarget",
        crawl: "#/components/schemas/WebdbsCrawlTarget",
      },
    },
    description: "Source that provides pages for a collection.",
  },
  WebdbsSync: {
    type: "object",
    properties: {
      every: {
        type: "string",
        example: "6h",
        description:
          "Sync interval such as `6h`, or a five-field cron expression.",
      },
      mode: {
        type: "string",
        enum: ["incremental", "full"],
        default: "incremental",
        description:
          "Use `incremental` for changed pages or `full` for every page.",
      },
    },
    required: ["every"],
    additionalProperties: false,
    title: "WebDB sync schedule",
    description: "Controls when pages are checked for updates.",
  },
  WebdbsChangeTracking: {
    type: "object",
    properties: {
      enabled: {
        type: "boolean",
        description: "Whether to record row changes.",
      },
      granularity: {
        type: "string",
        enum: ["field"],
        description: "Records changes for each field.",
      },
      retention: {
        type: "string",
        pattern: "^(\\d+)(s|m|h|d)$",
        default: "90d",
        description: "How long to keep row changes, such as `90d`.",
      },
    },
    required: ["enabled"],
    additionalProperties: false,
    title: "WebDB change tracking",
    description: "Controls row change history.",
  },
  WebdbsBudgets: {
    type: "object",
    properties: {
      credits: {
        type: "integer",
        exclusiveMinimum: 0,
        description: "Maximum credits this collection can use.",
      },
    },
    additionalProperties: false,
    title: "WebDB spending limits",
    description: "Optional spending limits for a collection.",
  },
  MonitorsPageTarget: {
    type: "object",
    properties: {
      type: {
        type: "string",
        enum: ["page"],
      },
      url: {
        type: "string",
        format: "uri",
        example: "https://acme.com/pricing",
      },
      instructions: {
        type: "string",
        minLength: 1,
        maxLength: 2000,
        description:
          "Plain-language goal describing which page changes matter. When provided without change_detection, semantic detection is inferred.",
        example:
          "Report pricing or plan availability changes. Ignore counters, timestamps, testimonials, and navigation.",
      },
      normalize_whitespace: {
        type: "boolean",
        default: true,
        description: "Normalize whitespace before comparing or analyzing text.",
      },
    },
    required: ["type", "url"],
    additionalProperties: false,
    description:
      "Watch a single web page. Exact detection reports visible-text diffs; semantic detection judges confirmed stable diffs against `instructions`.",
    title: "Page target",
  },
  MonitorsSitemapTarget: {
    type: "object",
    properties: {
      type: {
        type: "string",
        enum: ["sitemap"],
      },
      url: {
        type: "string",
        format: "uri",
        description: "Sitemap URL to monitor.",
        example: "https://acme.com/sitemap.xml",
      },
      include: {
        type: "array",
        items: {
          type: "string",
          minLength: 1,
          maxLength: 200,
        },
        maxItems: 50,
        description: "URL path patterns to include (max 50).",
        example: ["/blog/*", "/pricing*"],
      },
      exclude: {
        type: "array",
        items: {
          type: "string",
          minLength: 1,
          maxLength: 200,
        },
        maxItems: 50,
        description: "URL path patterns to exclude (max 50).",
        example: ["/legal/*", "/privacy"],
      },
      max_urls: {
        type: "integer",
        minimum: 1,
        maximum: 10000,
        default: 5000,
        description:
          "Maximum number of sitemap URLs to track (capped at 10,000).",
      },
    },
    required: ["type", "url"],
    additionalProperties: false,
    description:
      "Watch a sitemap for URL additions and removals. Crawled URLs are normalized (lowercased host, no trailing slash/fragment) and scoped to the monitored site and its subdomains before comparison. On a detected difference the sitemap is re-fetched within the same run and only URLs both observations agree on are reported, suppressing transient crawl flaps.",
    title: "Sitemap target",
  },
  MonitorsExtractTarget: {
    type: "object",
    properties: {
      type: {
        type: "string",
        enum: ["extract"],
      },
      url: {
        type: "string",
        format: "uri",
        description: "Root URL to extract structured data from.",
        example: "https://acme.com",
      },
      schema: {
        type: "object",
        additionalProperties: {},
        description:
          "JSON Schema describing the data you care about. It is used three ways: it guides which pages are selected for tracking, it gives the change judge extra context on which changes matter (alongside `instructions`), and it defines the shape of the baseline `data` snapshot on GET /monitors/{monitor_id} (refreshed at most about once a day). It is not a response format for changes: change events and webhook payloads always contain diffs, summaries, and evidence excerpts — never data in this schema's shape. If omitted, a default summary + key-points schema is used.",
        example: {
          type: "object",
          properties: {
            plans: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: {
                    type: "string",
                  },
                  price: {
                    type: "string",
                  },
                },
              },
            },
          },
        },
      },
      instructions: {
        type: "string",
        minLength: 1,
        maxLength: 2000,
        description:
          "Natural-language instructions guiding which pages and facts to track and which changes to report.",
        example:
          "Extract every pricing plan with its monthly price and included limits.",
      },
      max_pages: {
        type: "integer",
        minimum: 1,
        maximum: 50,
        default: 10,
        description: "Maximum number of pages to track.",
      },
      max_depth: {
        type: "integer",
        minimum: 0,
        maximum: 10,
        description:
          "Optional maximum link depth from the starting URL (0 = only the starting page).",
      },
      follow_subdomains: {
        type: "boolean",
        default: false,
      },
    },
    required: ["type", "url", "instructions"],
    additionalProperties: false,
    title: "Extract target",
  },
  MonitorsExactChangeDetection: {
    type: "object",
    properties: {
      type: {
        type: "string",
        enum: ["exact"],
      },
    },
    required: ["type"],
    additionalProperties: false,
    description:
      "Detect exact changes. For page targets, this means visible text diffs. For sitemap targets, this means URL additions and removals.",
    title: "Exact",
  },
  MonitorsSemanticChangeDetection: {
    type: "object",
    properties: {
      type: {
        type: "string",
        enum: ["semantic"],
      },
      confidence_threshold: {
        type: "number",
        minimum: 0,
        maximum: 1,
        default: 0.75,
      },
    },
    required: ["type"],
    additionalProperties: false,
    description:
      "Detect meaning-level changes to page content, ignoring cosmetic or instruction-irrelevant differences. Which changes are meaningful is judged against the page or extract target's `instructions` (and an extract target's `schema`, when provided).",
    title: "Semantic",
  },
  MonitorsIntervalSchedule: {
    type: "object",
    properties: {
      type: {
        type: "string",
        enum: ["interval"],
      },
      frequency: {
        type: "integer",
        minimum: 1,
        maximum: 525600,
        description:
          "Number of units between runs. The resulting interval (frequency × unit) must be at least 10 minutes and at most 1 year (e.g. minimum 10 when unit is minutes; maximum 365 when unit is days).",
        example: 6,
      },
      unit: {
        $ref: "#/components/schemas/MonitorsScheduleUnit",
      },
    },
    required: ["type", "frequency", "unit"],
    additionalProperties: false,
    description:
      "Run the monitor on a fixed interval defined by a frequency and a unit, e.g. every 6 hours or every 2 days. The total interval (frequency × unit) must be between 10 minutes and 1 year.",
    title: "Interval",
  },
  MonitorsWebhookConfig: {
    type: "object",
    properties: {
      url: {
        type: "string",
        format: "uri",
        description: "Webhook URL events are delivered to.",
        example: "https://example.com/webhook",
      },
      events: {
        type: "array",
        items: {
          type: "string",
          enum: ["change.detected", "run.completed"],
        },
        minItems: 1,
        maxItems: 2,
        uniqueItems: true,
        description:
          'Events delivered to this endpoint. `change.detected` fires only when a run detects a change; `run.completed` fires on every completed run — including runs that detected no change — and embeds the change when one was detected. Defaults to `["change.detected"]` when omitted.',
        example: ["change.detected", "run.completed"],
      },
      secret: {
        type: "string",
        readOnly: true,
        description:
          'Signing secret used to verify webhook authenticity. Each delivery includes an `X-Context-Signature: t=<unix>,v1=<hmac>` header, where the HMAC is SHA-256 over `"{t}.{rawRequestBody}"` keyed by this secret. Recompute it with a constant-time compare and reject stale timestamps to prevent replay. Generated by the API; cannot be set by clients.',
        example: "whsec_8f3a…",
      },
    },
    required: ["url"],
    additionalProperties: false,
  },
  WebdbsUrlTarget: {
    type: "object",
    properties: {
      type: {
        type: "string",
        enum: ["url"],
        description: "Fetch one URL.",
      },
      seeds: {
        type: "array",
        items: {
          type: "string",
          format: "uri",
        },
        description: "URL to fetch.",
      },
      id: {
        type: "string",
        example: "tgt_123",
        description: "Stable target ID. Omit it when adding a target.",
      },
      sync: {
        allOf: [
          {
            $ref: "#/components/schemas/WebdbsSync",
          },
          {
            description: "Schedule for this target.",
          },
        ],
      },
      eligibility: {
        allOf: [
          {
            $ref: "#/components/schemas/WebdbsEligibility",
          },
          {
            description: "Extra eligibility rules for this target.",
          },
        ],
      },
      crawl_options: {
        type: "object",
        additionalProperties: {},
        description: "Optional page loading settings.",
      },
    },
    required: ["type", "seeds"],
    additionalProperties: false,
    title: "URL target",
    description: "Fetches exactly one page.",
  },
  WebdbsUrlListTarget: {
    type: "object",
    properties: {
      type: {
        type: "string",
        enum: ["url_list"],
        description: "Fetch a fixed list of URLs.",
      },
      seeds: {
        type: "array",
        items: {
          type: "string",
          format: "uri",
        },
        minItems: 1,
        maxItems: 10000,
        description: "URLs to fetch. Maximum 10000.",
      },
      id: {
        type: "string",
        example: "tgt_123",
        description: "Stable target ID. Omit it when adding a target.",
      },
      sync: {
        allOf: [
          {
            $ref: "#/components/schemas/WebdbsSync",
          },
          {
            description: "Schedule for this target.",
          },
        ],
      },
      eligibility: {
        allOf: [
          {
            $ref: "#/components/schemas/WebdbsEligibility",
          },
          {
            description: "Extra eligibility rules for this target.",
          },
        ],
      },
      crawl_options: {
        type: "object",
        additionalProperties: {},
        description: "Optional page loading settings.",
      },
    },
    required: ["type", "seeds"],
    additionalProperties: false,
    title: "URL list target",
    description: "Fetches a fixed set of pages.",
  },
  WebdbsSitemapTarget: {
    type: "object",
    properties: {
      type: {
        type: "string",
        enum: ["sitemap"],
        description: "Discover URLs from sitemaps.",
      },
      seeds: {
        type: "array",
        items: {
          type: "string",
          format: "uri",
        },
        minItems: 1,
        maxItems: 10,
        description: "Sitemap URLs to read. Maximum 10.",
      },
      ingest: {
        type: "object",
        properties: {
          match: {
            type: "array",
            items: {
              type: "string",
            },
            minItems: 1,
            maxItems: 100,
            example: [
              "https://shop.com/products/:product_id",
              "https://foo.com/item?id=*",
              "https://foo.com/bar/*",
              "**/events/**",
            ],
            description:
              "URL patterns for pages that become rows. Supports exact URLs, `*`, `**`, and `:name` path values.",
          },
        },
        required: ["match"],
        additionalProperties: false,
        description: "Rules for choosing pages to save as rows.",
      },
      id: {
        type: "string",
        example: "tgt_123",
        description: "Stable target ID. Omit it when adding a target.",
      },
      sync: {
        allOf: [
          {
            $ref: "#/components/schemas/WebdbsSync",
          },
          {
            description: "Schedule for this target.",
          },
        ],
      },
      eligibility: {
        allOf: [
          {
            $ref: "#/components/schemas/WebdbsEligibility",
          },
          {
            description: "Extra eligibility rules for this target.",
          },
        ],
      },
      crawl_options: {
        type: "object",
        additionalProperties: {},
        description: "Optional page loading settings.",
      },
      max_pages: {
        type: "integer",
        minimum: 1,
        maximum: 1000000,
        default: 10000,
        description: "Maximum pages processed for this target per sync.",
      },
    },
    required: ["type", "seeds"],
    additionalProperties: false,
    title: "Sitemap target",
    description: "Expands sitemap URLs into pages.",
  },
  WebdbsCrawlTarget: {
    type: "object",
    properties: {
      type: {
        type: "string",
        enum: ["crawl"],
        description: "Crawl links from starting URLs.",
      },
      seeds: {
        type: "array",
        items: {
          type: "string",
          format: "uri",
        },
        minItems: 1,
        maxItems: 100,
        description: "URLs where the crawl starts. Maximum 100.",
      },
      follow: {
        type: "object",
        properties: {
          match: {
            type: "array",
            items: {
              type: "string",
            },
            minItems: 1,
            maxItems: 100,
            example: [
              "https://shop.com/products/:product_id",
              "https://foo.com/item?id=*",
              "https://foo.com/bar/*",
              "**/events/**",
            ],
            description:
              "URL patterns for links to follow. Supports exact URLs, `*`, `**`, and `:name` path values.",
          },
          max_depth: {
            type: "integer",
            minimum: 1,
            maximum: 10,
            description: "Maximum link depth from each starting URL.",
          },
        },
        required: ["match"],
        additionalProperties: false,
        description: "Rules for which links the crawl follows.",
      },
      ingest: {
        type: "object",
        properties: {
          match: {
            type: "array",
            items: {
              type: "string",
            },
            minItems: 1,
            maxItems: 100,
            example: [
              "https://shop.com/products/:product_id",
              "https://foo.com/item?id=*",
              "https://foo.com/bar/*",
              "**/events/**",
            ],
            description:
              "URL patterns for pages that become rows. Supports exact URLs, `*`, `**`, and `:name` path values.",
          },
        },
        required: ["match"],
        additionalProperties: false,
        description: "Rules for choosing pages to save as rows.",
      },
      id: {
        type: "string",
        example: "tgt_123",
        description: "Stable target ID. Omit it when adding a target.",
      },
      sync: {
        allOf: [
          {
            $ref: "#/components/schemas/WebdbsSync",
          },
          {
            description: "Schedule for this target.",
          },
        ],
      },
      eligibility: {
        allOf: [
          {
            $ref: "#/components/schemas/WebdbsEligibility",
          },
          {
            description: "Extra eligibility rules for this target.",
          },
        ],
      },
      crawl_options: {
        type: "object",
        additionalProperties: {},
        description: "Optional page loading settings.",
      },
      max_pages: {
        type: "integer",
        minimum: 1,
        maximum: 1000000,
        default: 100,
        description: "Maximum pages processed for this target per sync.",
      },
    },
    required: ["type", "seeds", "ingest"],
    additionalProperties: false,
    title: "Crawl target",
    description: "Crawls a site and saves matching pages as rows.",
  },
  MonitorsScheduleUnit: {
    type: "string",
    enum: ["minutes", "hours", "days"],
    example: "hours",
  },
};
