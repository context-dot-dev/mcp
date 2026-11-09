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
    idempotentHint?: boolean;
    openWorldHint: boolean;
  };
};

export const ENDPOINTS: Endpoint[] = [
  {
    "name": "list-access-policies",
    "title": "List access policies",
    "method": "GET",
    "path": "/access-policies",
    "description": "List access policies — List your access policies, newest first.",
    "parameters": [
      {
        "name": "limit",
        "in": "query",
        "required": false,
        "description": "Number of policies per page.",
        "schema": {
          "type": "integer",
          "minimum": 1,
          "maximum": 100,
          "default": 25,
          "description": "Number of policies per page."
        }
      },
      {
        "name": "cursor",
        "in": "query",
        "required": false,
        "description": "The `next_cursor` from the previous page.",
        "schema": {
          "type": "string",
          "description": "The `next_cursor` from the previous page."
        }
      }
    ],
    "annotations": {
      "readOnlyHint": true,
      "destructiveHint": false,
      "openWorldHint": true
    }
  },
  {
    "name": "create-access-policy",
    "title": "Create an access policy",
    "method": "POST",
    "path": "/access-policies",
    "description": "Create an access policy — Create a list of domains your requests can or can't access.",
    "parameters": [],
    "requestBody": {
      "required": true,
      "schema": {
        "$ref": "#/components/schemas/CreateAccessPolicyRequest"
      },
      "contentType": "application/json",
      "binary": false
    },
    "annotations": {
      "readOnlyHint": false,
      "destructiveHint": true,
      "openWorldHint": true
    }
  },
  {
    "name": "get-access-policy",
    "title": "Retrieve an access policy",
    "method": "GET",
    "path": "/access-policies/{policy_id}",
    "description": "Retrieve an access policy — Retrieve an access policy.",
    "parameters": [
      {
        "name": "policy_id",
        "in": "path",
        "required": true,
        "description": "Access policy ID. Pass it in `policies` on any request.",
        "schema": {
          "type": "string",
          "description": "Access policy ID. Pass it in `policies` on any request.",
          "example": "pol_3f9c2a7e5b8d4c1f9a6e0b2d7c4f8a1e"
        }
      }
    ],
    "annotations": {
      "readOnlyHint": true,
      "destructiveHint": false,
      "openWorldHint": true
    }
  },
  {
    "name": "update-access-policy",
    "title": "Update an access policy",
    "method": "PATCH",
    "path": "/access-policies/{policy_id}",
    "description": "Update an access policy — Update an access policy. Changes apply right away, including to running batches and monitors.",
    "parameters": [
      {
        "name": "policy_id",
        "in": "path",
        "required": true,
        "description": "Access policy ID. Pass it in `policies` on any request.",
        "schema": {
          "type": "string",
          "description": "Access policy ID. Pass it in `policies` on any request.",
          "example": "pol_3f9c2a7e5b8d4c1f9a6e0b2d7c4f8a1e"
        }
      }
    ],
    "requestBody": {
      "required": true,
      "schema": {
        "$ref": "#/components/schemas/UpdateAccessPolicyRequest"
      },
      "contentType": "application/json",
      "binary": false
    },
    "annotations": {
      "readOnlyHint": false,
      "destructiveHint": true,
      "openWorldHint": true
    }
  },
  {
    "name": "delete-access-policy",
    "title": "Delete an access policy",
    "method": "DELETE",
    "path": "/access-policies/{policy_id}",
    "description": "Delete an access policy — Delete an access policy. Requests, batches, and monitors that still list it will fail.",
    "parameters": [
      {
        "name": "policy_id",
        "in": "path",
        "required": true,
        "description": "Access policy ID. Pass it in `policies` on any request.",
        "schema": {
          "type": "string",
          "description": "Access policy ID. Pass it in `policies` on any request.",
          "example": "pol_3f9c2a7e5b8d4c1f9a6e0b2d7c4f8a1e"
        }
      }
    ],
    "annotations": {
      "readOnlyHint": false,
      "destructiveHint": true,
      "openWorldHint": true
    }
  },
  {
    "name": "submit-feedback",
    "title": "Submit agent feedback",
    "method": "POST",
    "path": "/feedback",
    "description": "Submit agent feedback — Report an API issue or documentation mismatch, including request IDs when available.",
    "parameters": [],
    "requestBody": {
      "required": true,
      "schema": {
        "type": "object",
        "properties": {
          "request_id": {
            "type": "string",
            "format": "uuid",
            "description": "The request_id of the API call the feedback is about, from its response body or X-Request-Id header.",
            "example": "3f1c2a6e-8b4d-4c1e-9f0a-2d7b5e6c8a91"
          },
          "category": {
            "type": "string",
            "enum": [
              "bug",
              "docs_mismatch",
              "friction",
              "feature_gap",
              "quality_degradation",
              "other"
            ],
            "description": "Kind of issue."
          },
          "note": {
            "type": "string",
            "minLength": 1,
            "maxLength": 4000,
            "description": "What went wrong and what you expected instead.",
            "example": "Markdown drops the plan comparison table; expected all 4 rows."
          },
          "url": {
            "type": "string",
            "maxLength": 2048,
            "format": "uri",
            "description": "The page the feedback is about, such as one page of a crawl or a docs page.",
            "example": "https://stripe.com/pricing"
          },
          "tags": {
            "$ref": "#/components/schemas/RequestTags"
          }
        },
        "required": [
          "category",
          "note"
        ],
        "additionalProperties": false
      },
      "contentType": "application/json",
      "binary": false
    },
    "annotations": {
      "readOnlyHint": false,
      "destructiveHint": true,
      "openWorldHint": true
    }
  },
  {
    "name": "list-logs",
    "title": "List request logs",
    "method": "GET",
    "path": "/org/logs",
    "description": "List request logs — List your organization’s request logs with filters and pagination. Logs also include batch settlements and monitor runs.",
    "parameters": [
      {
        "name": "from",
        "in": "query",
        "required": false,
        "description": "Only include requests at or after this ISO 8601 timestamp. Defaults to 24 hours before `to`.",
        "schema": {
          "type": "string",
          "format": "date-time",
          "description": "Only include requests at or after this ISO 8601 timestamp. Defaults to 24 hours before `to`.",
          "example": "2026-09-10T00:00:00Z"
        }
      },
      {
        "name": "to",
        "in": "query",
        "required": false,
        "description": "Only include requests at or before this ISO 8601 timestamp. Defaults to now.",
        "schema": {
          "type": "string",
          "format": "date-time",
          "description": "Only include requests at or before this ISO 8601 timestamp. Defaults to now.",
          "example": "2026-09-11T00:00:00Z"
        }
      },
      {
        "name": "path",
        "in": "query",
        "required": false,
        "description": "Filter by endpoint path, with or without the /v1 prefix.",
        "schema": {
          "type": "string",
          "minLength": 1,
          "maxLength": 200,
          "pattern": "^\\/",
          "description": "Filter by endpoint path, with or without the /v1 prefix.",
          "example": "/brand/retrieve"
        }
      },
      {
        "name": "key_id",
        "in": "query",
        "required": false,
        "description": "Filter by the API key that made the request.",
        "schema": {
          "type": "string",
          "minLength": 1,
          "maxLength": 200,
          "description": "Filter by the API key that made the request."
        }
      },
      {
        "name": "status_code",
        "in": "query",
        "required": false,
        "description": "Filter by exact HTTP status code.",
        "schema": {
          "type": "integer",
          "minimum": 100,
          "maximum": 599,
          "description": "Filter by exact HTTP status code.",
          "example": 500
        }
      },
      {
        "name": "error_code",
        "in": "query",
        "required": false,
        "description": "Filter by the `error_code` returned in the response.",
        "schema": {
          "type": "string",
          "pattern": "^[A-Z][A-Z0-9_]{1,63}$",
          "description": "Filter by the `error_code` returned in the response.",
          "example": "WEBSITE_ACCESS_ERROR"
        }
      },
      {
        "name": "errors_only",
        "in": "query",
        "required": false,
        "description": "Only include requests that returned a 4xx or 5xx status.",
        "schema": {
          "type": "boolean",
          "default": false,
          "description": "Only include requests that returned a 4xx or 5xx status."
        }
      },
      {
        "name": "tags",
        "in": "query",
        "required": false,
        "description": "Comma-separated request tags. Matches requests carrying any of them. Up to 20 tags, each 1-50 characters.",
        "schema": {
          "type": "string",
          "description": "Comma-separated request tags. Matches requests carrying any of them. Up to 20 tags, each 1-50 characters.",
          "example": "nightly-import,team-alpha"
        }
      },
      {
        "name": "search",
        "in": "query",
        "required": false,
        "description": "Case-insensitive substring match against the request query and body, e.g. a domain.",
        "schema": {
          "type": "string",
          "minLength": 1,
          "maxLength": 200,
          "description": "Case-insensitive substring match against the request query and body, e.g. a domain.",
          "example": "acme.com"
        }
      },
      {
        "name": "page",
        "in": "query",
        "required": false,
        "description": "Page number, starting at 1.",
        "schema": {
          "type": "integer",
          "minimum": 1,
          "maximum": 1000,
          "default": 1,
          "description": "Page number, starting at 1."
        }
      },
      {
        "name": "limit",
        "in": "query",
        "required": false,
        "description": "Number of log entries per page.",
        "schema": {
          "type": "integer",
          "minimum": 1,
          "maximum": 100,
          "default": 50,
          "description": "Number of log entries per page."
        }
      }
    ],
    "annotations": {
      "readOnlyHint": true,
      "destructiveHint": false,
      "openWorldHint": true
    }
  },
  {
    "name": "get-log",
    "title": "Retrieve a request log",
    "method": "GET",
    "path": "/org/logs/{request_id}",
    "description": "Retrieve a request log — Retrieve a request’s metadata, retained input, and response. An entry becomes retrievable a few seconds after its request completes, so a 404 NOT_FOUND for a request that just finished means ingestion has not caught up yet; retry after a few seconds.",
    "parameters": [
      {
        "name": "request_id",
        "in": "path",
        "required": true,
        "description": "The request ID of the logged API call.",
        "schema": {
          "type": "string",
          "format": "uuid",
          "description": "The request ID of the logged API call."
        }
      }
    ],
    "annotations": {
      "readOnlyHint": true,
      "destructiveHint": false,
      "openWorldHint": true
    }
  },
  {
    "name": "list-browser-profiles",
    "title": "List browser profiles",
    "method": "GET",
    "path": "/org/browser/profiles",
    "description": "List browser profiles — List the browser profiles your organization created with `/web/scrape`, newest first.",
    "parameters": [
      {
        "name": "limit",
        "in": "query",
        "required": false,
        "description": "Number of profiles per page.",
        "schema": {
          "type": "integer",
          "minimum": 1,
          "maximum": 100,
          "default": 25,
          "description": "Number of profiles per page."
        }
      },
      {
        "name": "cursor",
        "in": "query",
        "required": false,
        "description": "The `next_cursor` from the previous page.",
        "schema": {
          "type": "string",
          "pattern": "^prof_[a-f0-9]{32}$",
          "description": "The `next_cursor` from the previous page."
        }
      }
    ],
    "annotations": {
      "readOnlyHint": true,
      "destructiveHint": false,
      "openWorldHint": true
    }
  },
  {
    "name": "web-scrape",
    "title": "Scrape Anything",
    "method": "POST",
    "path": "/web/scrape",
    "description": "Scrape Anything — Scrape anything from a URL on the internet. Returns the outputs you enable in formats. Handles PDFs, DOCX, PPT, XLSX, and 40 other file formats.",
    "parameters": [],
    "requestBody": {
      "required": true,
      "schema": {
        "$ref": "#/components/schemas/ScrapeRequest"
      },
      "contentType": "application/json",
      "binary": false
    },
    "annotations": {
      "readOnlyHint": false,
      "destructiveHint": true,
      "openWorldHint": true
    }
  },
  {
    "name": "get-usage",
    "title": "Retrieve credit usage",
    "method": "GET",
    "path": "/org/usage",
    "description": "Retrieve credit usage — Retrieve your organization’s credit balance, current-period usage, and next refill.",
    "parameters": [],
    "annotations": {
      "readOnlyHint": true,
      "destructiveHint": false,
      "openWorldHint": true
    }
  },
  {
    "name": "get-usage-history",
    "title": "Retrieve usage history",
    "method": "GET",
    "path": "/org/usage/history",
    "description": "Retrieve usage history — Retrieve credits and requests over time, bucketed by hour, day, or month. History is kept for one year.",
    "parameters": [
      {
        "name": "from",
        "in": "query",
        "required": false,
        "description": "Start of the range, as an ISO 8601 timestamp. Defaults to 24 hours before `to` for `hour`, 30 days for `day`, and 366 days for `month`.",
        "schema": {
          "type": "string",
          "format": "date-time",
          "description": "Start of the range, as an ISO 8601 timestamp. Defaults to 24 hours before `to` for `hour`, 30 days for `day`, and 366 days for `month`.",
          "example": "2026-09-01T00:00:00Z"
        }
      },
      {
        "name": "to",
        "in": "query",
        "required": false,
        "description": "End of the range, as an ISO 8601 timestamp. Defaults to now.",
        "schema": {
          "type": "string",
          "format": "date-time",
          "description": "End of the range, as an ISO 8601 timestamp. Defaults to now.",
          "example": "2026-10-01T00:00:00Z"
        }
      },
      {
        "name": "interval",
        "in": "query",
        "required": false,
        "description": "Bucket size. `hour` covers up to 7 days; `day` and `month` cover up to 366 days. Buckets start on UTC boundaries.",
        "schema": {
          "type": "string",
          "enum": [
            "hour",
            "day",
            "month"
          ],
          "default": "day",
          "description": "Bucket size. `hour` covers up to 7 days; `day` and `month` cover up to 366 days. Buckets start on UTC boundaries."
        }
      },
      {
        "name": "group_by",
        "in": "query",
        "required": false,
        "description": "Split each bucket by endpoint path, API key, or HTTP status code.",
        "schema": {
          "type": "string",
          "enum": [
            "path",
            "key_id",
            "status_code"
          ],
          "description": "Split each bucket by endpoint path, API key, or HTTP status code."
        }
      }
    ],
    "annotations": {
      "readOnlyHint": true,
      "destructiveHint": false,
      "openWorldHint": true
    }
  },
  {
    "name": "list-webhook-deliveries",
    "title": "List webhook deliveries",
    "method": "POST",
    "path": "/webhooks/deliveries",
    "description": "List webhook deliveries — List batch and monitor webhook deliveries from the last 30 days.",
    "parameters": [],
    "requestBody": {
      "required": true,
      "schema": {
        "oneOf": [
          {
            "type": "object",
            "properties": {
              "type": {
                "type": "string",
                "enum": [
                  "batch"
                ],
                "description": "Delivery source."
              },
              "batch_id": {
                "type": "string",
                "minLength": 1,
                "maxLength": 200,
                "pattern": "^[\\w-]+$",
                "description": "Filter by batch ID."
              },
              "status": {
                "type": "string",
                "enum": [
                  "pending",
                  "delivering",
                  "retrying",
                  "delivered",
                  "failed",
                  "cancelled"
                ],
                "description": "Filter by delivery status."
              },
              "created_after": {
                "type": "string",
                "format": "date-time",
                "description": "Only include events created after this ISO 8601 timestamp.",
                "example": "2026-09-01T00:00:00Z"
              },
              "limit": {
                "type": "integer",
                "minimum": 1,
                "maximum": 100,
                "default": 25,
                "description": "Number of deliveries to return."
              },
              "cursor": {
                "type": "string",
                "pattern": "^whd_[a-f0-9]{32}$",
                "description": "The next_cursor from the previous response."
              },
              "tags": {
                "$ref": "#/components/schemas/RequestTags"
              }
            },
            "required": [
              "type"
            ],
            "additionalProperties": false,
            "title": "By Batch"
          },
          {
            "type": "object",
            "properties": {
              "type": {
                "type": "string",
                "enum": [
                  "monitor"
                ],
                "description": "Delivery source."
              },
              "monitor_id": {
                "type": "string",
                "minLength": 1,
                "maxLength": 200,
                "pattern": "^[\\w-]+$",
                "description": "Filter by monitor ID."
              },
              "run_id": {
                "type": "string",
                "minLength": 1,
                "maxLength": 200,
                "pattern": "^[\\w-]+$",
                "description": "Filter by monitor run ID."
              },
              "status": {
                "type": "string",
                "enum": [
                  "pending",
                  "delivering",
                  "retrying",
                  "delivered",
                  "failed",
                  "cancelled"
                ],
                "description": "Filter by delivery status."
              },
              "created_after": {
                "type": "string",
                "format": "date-time",
                "description": "Only include events created after this ISO 8601 timestamp.",
                "example": "2026-09-01T00:00:00Z"
              },
              "limit": {
                "type": "integer",
                "minimum": 1,
                "maximum": 100,
                "default": 25,
                "description": "Number of deliveries to return."
              },
              "cursor": {
                "type": "string",
                "pattern": "^whd_[a-f0-9]{32}$",
                "description": "The next_cursor from the previous response."
              },
              "tags": {
                "$ref": "#/components/schemas/RequestTags"
              }
            },
            "required": [
              "type"
            ],
            "additionalProperties": false,
            "title": "By Monitor"
          }
        ],
        "discriminator": {
          "propertyName": "type"
        }
      },
      "contentType": "application/json",
      "binary": false
    },
    "annotations": {
      "readOnlyHint": true,
      "destructiveHint": false,
      "openWorldHint": true
    }
  },
  {
    "name": "get-webhook-delivery",
    "title": "Retrieve a webhook delivery",
    "method": "GET",
    "path": "/webhooks/deliveries/{delivery_id}",
    "description": "Retrieve a webhook delivery — Retrieve a webhook delivery’s status and original payload.",
    "parameters": [
      {
        "name": "delivery_id",
        "in": "path",
        "required": true,
        "description": "Delivery ID.",
        "schema": {
          "type": "string",
          "pattern": "^whd_[a-f0-9]{32}$",
          "description": "Delivery ID."
        }
      },
      {
        "name": "tags",
        "in": "query",
        "required": false,
        "description": "Comma-separated labels for filtering usage, e.g. `production,team-alpha`.",
        "schema": {
          "$ref": "#/components/schemas/RequestTags"
        }
      }
    ],
    "annotations": {
      "readOnlyHint": true,
      "destructiveHint": false,
      "openWorldHint": true
    }
  },
  {
    "name": "list-webhook-delivery-attempts",
    "title": "List webhook delivery attempts",
    "method": "GET",
    "path": "/webhooks/deliveries/{delivery_id}/attempts",
    "description": "List webhook delivery attempts — List a delivery’s attempts, newest first.",
    "parameters": [
      {
        "name": "delivery_id",
        "in": "path",
        "required": true,
        "description": "Delivery ID.",
        "schema": {
          "type": "string",
          "pattern": "^whd_[a-f0-9]{32}$",
          "description": "Delivery ID."
        }
      },
      {
        "name": "limit",
        "in": "query",
        "required": false,
        "description": "Number of attempts to return.",
        "schema": {
          "type": "integer",
          "minimum": 1,
          "maximum": 100,
          "default": 25,
          "description": "Number of attempts to return."
        }
      },
      {
        "name": "cursor",
        "in": "query",
        "required": false,
        "description": "The next_cursor from the previous response.",
        "schema": {
          "type": "string",
          "pattern": "^wha_[a-f0-9]{32}$",
          "description": "The next_cursor from the previous response."
        }
      },
      {
        "name": "tags",
        "in": "query",
        "required": false,
        "description": "Comma-separated labels for filtering usage, e.g. `production,team-alpha`.",
        "schema": {
          "$ref": "#/components/schemas/RequestTags"
        }
      }
    ],
    "annotations": {
      "readOnlyHint": true,
      "destructiveHint": false,
      "openWorldHint": true
    }
  },
  {
    "name": "retry-webhook-delivery",
    "title": "Retry a webhook delivery",
    "method": "POST",
    "path": "/webhooks/deliveries/{delivery_id}/retry",
    "description": "Retry a webhook delivery — Resend the original payload using the source’s current URL and secret. Available for 7 days after the event.",
    "parameters": [
      {
        "name": "delivery_id",
        "in": "path",
        "required": true,
        "description": "Delivery ID.",
        "schema": {
          "type": "string",
          "pattern": "^whd_[a-f0-9]{32}$",
          "description": "Delivery ID."
        }
      },
      {
        "name": "Idempotency-Key",
        "in": "header",
        "required": false,
        "description": "Unique key to prevent duplicate retry requests.",
        "schema": {
          "type": "string",
          "maxLength": 200,
          "description": "Unique key to prevent duplicate retry requests."
        }
      }
    ],
    "requestBody": {
      "required": false,
      "schema": {
        "type": "object",
        "properties": {
          "force": {
            "type": "boolean",
            "default": false,
            "description": "Resend even if the delivery already succeeded. Defaults to false."
          },
          "tags": {
            "$ref": "#/components/schemas/RequestTags"
          }
        },
        "additionalProperties": false
      },
      "contentType": "application/json",
      "binary": false
    },
    "annotations": {
      "readOnlyHint": false,
      "destructiveHint": true,
      "openWorldHint": true
    }
  },
  {
    "name": "get-news-search",
    "title": "Search news",
    "method": "POST",
    "path": "/news/search",
    "description": "Search news — Find news about a company by name, domain, ticker, or ISIN, or search all news with a natural-language query. Filter articles and continue through results with a cursor.",
    "parameters": [],
    "requestBody": {
      "required": true,
      "schema": {
        "type": "object",
        "properties": {
          "searchBy": {
            "oneOf": [
              {
                "$ref": "#/components/schemas/NewsSearchByNaturalLanguage"
              },
              {
                "$ref": "#/components/schemas/NewsSearchByEntity"
              }
            ],
            "discriminator": {
              "propertyName": "type",
              "mapping": {
                "natural_language": "#/components/schemas/NewsSearchByNaturalLanguage",
                "entity": "#/components/schemas/NewsSearchByEntity"
              }
            },
            "description": "What to search for: a specific company, or a natural-language query across all news."
          },
          "filterBy": {
            "type": "object",
            "properties": {
              "sourceDomain": {
                "type": "array",
                "items": {
                  "type": "string",
                  "minLength": 1,
                  "maxLength": 253
                },
                "minItems": 1,
                "maxItems": 3,
                "description": "Publisher domains to include. Up to 3."
              },
              "sourceCountry": {
                "type": "array",
                "items": {
                  "type": "string",
                  "enum": [
                    "ae",
                    "ar",
                    "au",
                    "ca",
                    "cg",
                    "ch",
                    "cl",
                    "cz",
                    "de",
                    "fi",
                    "fr",
                    "gb",
                    "hk",
                    "il",
                    "in",
                    "jp",
                    "kr",
                    "mx",
                    "ng",
                    "nl",
                    "pk",
                    "qa",
                    "sa",
                    "se",
                    "sg",
                    "us",
                    "za"
                  ]
                },
                "minItems": 1,
                "maxItems": 3,
                "description": "Publisher countries to include, as lowercase ISO 3166-1 alpha-2 codes. Up to 3."
              },
              "articleLanguage": {
                "type": "array",
                "items": {
                  "type": "string",
                  "enum": [
                    "am",
                    "ar",
                    "az",
                    "be",
                    "bg",
                    "bn",
                    "ca",
                    "ceb",
                    "cs",
                    "cy",
                    "da",
                    "de",
                    "el",
                    "en",
                    "es",
                    "et",
                    "eu",
                    "fa",
                    "fi",
                    "fr",
                    "gu",
                    "ha",
                    "haw",
                    "he",
                    "hi",
                    "hr",
                    "hu",
                    "hy",
                    "id",
                    "is",
                    "it",
                    "ja",
                    "ka",
                    "kk",
                    "kn",
                    "ko",
                    "ku",
                    "ky",
                    "lo",
                    "lt",
                    "lv",
                    "mk",
                    "ml",
                    "mn",
                    "mr",
                    "ms",
                    "ne",
                    "nl",
                    "no",
                    "or",
                    "pa",
                    "pl",
                    "ps",
                    "pt",
                    "ro",
                    "ru",
                    "sk",
                    "sl",
                    "so",
                    "sq",
                    "sr",
                    "sv",
                    "sw",
                    "ta",
                    "te",
                    "th",
                    "tl",
                    "tr",
                    "uk",
                    "ur",
                    "uz",
                    "vi",
                    "yo",
                    "zh"
                  ]
                },
                "minItems": 1,
                "maxItems": 3,
                "description": "Article languages to include. Up to 3."
              },
              "articleType": {
                "type": "array",
                "items": {
                  "type": "string",
                  "enum": [
                    "editorial",
                    "press_release",
                    "regulatory_filing",
                    "advisory"
                  ]
                },
                "minItems": 1,
                "maxItems": 3,
                "description": "Article types to include. Up to 3."
              },
              "date": {
                "type": "object",
                "properties": {
                  "from": {
                    "type": "integer",
                    "description": "Inclusive start of the published-at window, in epoch milliseconds."
                  },
                  "to": {
                    "type": "integer",
                    "description": "Inclusive end of the published-at window, in epoch milliseconds."
                  }
                },
                "additionalProperties": false,
                "description": "Published-at window in epoch milliseconds. from must be before or equal to to."
              }
            },
            "additionalProperties": false,
            "description": "Optional result filters. Use at most one of sourceDomain, sourceCountry, articleLanguage, or articleType. A date range may accompany that category; date.from must not exceed date.to.",
            "allOf": [
              {
                "not": {
                  "required": [
                    "sourceDomain",
                    "sourceCountry"
                  ]
                }
              },
              {
                "not": {
                  "required": [
                    "sourceDomain",
                    "articleLanguage"
                  ]
                }
              },
              {
                "not": {
                  "required": [
                    "sourceDomain",
                    "articleType"
                  ]
                }
              },
              {
                "not": {
                  "required": [
                    "sourceCountry",
                    "articleLanguage"
                  ]
                }
              },
              {
                "not": {
                  "required": [
                    "sourceCountry",
                    "articleType"
                  ]
                }
              },
              {
                "not": {
                  "required": [
                    "articleLanguage",
                    "articleType"
                  ]
                }
              }
            ]
          },
          "sortBy": {
            "type": "object",
            "properties": {
              "type": {
                "type": "string",
                "enum": [
                  "relevance",
                  "newest"
                ],
                "description": "Result ordering."
              }
            },
            "required": [
              "type"
            ],
            "additionalProperties": false,
            "description": "Result ordering. Defaults to newest for entity searches. Natural-language searches are always ordered by relevance."
          },
          "limit": {
            "type": "integer",
            "minimum": 1,
            "maximum": 100,
            "default": 10,
            "description": "Maximum results to return. Defaults to 10."
          },
          "cursor": {
            "type": [
              "string",
              "null"
            ],
            "maxLength": 300,
            "description": "Opaque next_cursor from the previous response, or null for the first page."
          },
          "policies": {
            "type": "array",
            "items": {
              "type": "string"
            },
            "description": "Access policy IDs to apply. A URL must pass every policy.",
            "example": [
              "pol_3f9c2a7e5b8d4c1f9a6e0b2d7c4f8a1e"
            ]
          },
          "tags": {
            "$ref": "#/components/schemas/RequestTags"
          }
        },
        "required": [
          "searchBy"
        ],
        "additionalProperties": false
      },
      "contentType": "application/json",
      "binary": false
    },
    "annotations": {
      "readOnlyHint": true,
      "destructiveHint": false,
      "openWorldHint": true
    }
  },
  {
    "name": "web-answers",
    "title": "Answer a research task",
    "method": "POST",
    "path": "/web/answers",
    "description": "Answer a research task — Research the web and return a sourced answer in your JSON shape. Choose `fast` for a short task or `ultra` for deeper research.",
    "parameters": [],
    "requestBody": {
      "required": true,
      "schema": {
        "$ref": "#/components/schemas/AnswersRequest"
      },
      "contentType": "application/json",
      "binary": false
    },
    "annotations": {
      "readOnlyHint": true,
      "destructiveHint": false,
      "openWorldHint": true
    }
  },
  {
    "name": "parse-document",
    "title": "Parse a file",
    "method": "POST",
    "path": "/parse",
    "description": "Parse a file — Convert uploaded file bytes into Markdown and optional HTML.",
    "parameters": [
      {
        "name": "extension",
        "in": "query",
        "required": false,
        "description": "Optional file extension hint, such as pdf, docx, xlsx, pptx, html, json, csv, md, py, rtf, jpg, png, or txt.",
        "schema": {
          "type": "string",
          "enum": [
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
            "pnm"
          ],
          "description": "Optional file extension hint, such as pdf, docx, xlsx, pptx, html, json, csv, md, py, rtf, jpg, png, or txt."
        }
      },
      {
        "name": "includeLinks",
        "in": "query",
        "required": false,
        "description": "Preserve hyperlinks in Markdown output",
        "schema": {
          "type": "boolean",
          "default": true,
          "description": "Preserve hyperlinks in Markdown output"
        }
      },
      {
        "name": "includeImages",
        "in": "query",
        "required": false,
        "description": "Include image references in Markdown output",
        "schema": {
          "type": "boolean",
          "default": false,
          "description": "Include image references in Markdown output"
        }
      },
      {
        "name": "shortenBase64Images",
        "in": "query",
        "required": false,
        "description": "Shorten base64-encoded image data in the Markdown output",
        "schema": {
          "type": "boolean",
          "default": true,
          "description": "Shorten base64-encoded image data in the Markdown output"
        }
      },
      {
        "name": "useMainContentOnly",
        "in": "query",
        "required": false,
        "description": "Extract only the main content from HTML-like inputs",
        "schema": {
          "type": "boolean",
          "default": false,
          "description": "Extract only the main content from HTML-like inputs"
        }
      },
      {
        "name": "ocr",
        "in": "query",
        "required": false,
        "description": "Read text from images and scanned PDF pages. PDF page ranges still apply.",
        "schema": {
          "type": "boolean",
          "default": false,
          "description": "Read text from images and scanned PDF pages. PDF page ranges still apply."
        }
      },
      {
        "name": "includeNumberedPages",
        "in": "query",
        "required": false,
        "description": "Start each PDF page in the Markdown with a `<!-- page N -->` line, where N is the original 1-based page number.",
        "schema": {
          "type": "boolean",
          "default": false,
          "description": "Start each PDF page in the Markdown with a `<!-- page N -->` line, where N is the original 1-based page number."
        }
      },
      {
        "name": "pdf",
        "in": "query",
        "required": false,
        "description": "PDF page-range options as a JSON object, e.g. {\"start\": 2, \"end\": 5}.",
        "schema": {
          "type": "object",
          "properties": {
            "start": {
              "type": "integer",
              "minimum": 1,
              "description": "First 1-based PDF page to parse."
            },
            "end": {
              "type": "integer",
              "minimum": 1,
              "description": "Last PDF page to parse (1-based, inclusive). Defaults to the final page. Must be >= start."
            }
          },
          "additionalProperties": false,
          "description": "PDF page-range options as a JSON object, e.g. {\"start\": 2, \"end\": 5}."
        }
      },
      {
        "name": "client",
        "in": "query",
        "required": false,
        "description": "Optional client identifier used for usage attribution.",
        "schema": {
          "type": "string",
          "minLength": 1,
          "maxLength": 100,
          "description": "Optional client identifier used for usage attribution."
        }
      },
      {
        "name": "zdr",
        "in": "query",
        "required": false,
        "description": "`enabled` turns on zero data retention. Returns 403 `ZDR_NOT_ENABLED` unless your organization has ZDR.",
        "schema": {
          "type": "string",
          "enum": [
            "enabled",
            "disabled"
          ],
          "default": "disabled",
          "description": "`enabled` turns on zero data retention. Returns 403 `ZDR_NOT_ENABLED` unless your organization has ZDR."
        }
      },
      {
        "name": "tags",
        "in": "query",
        "required": false,
        "description": "Comma-separated labels for filtering usage, e.g. `production,team-alpha`.",
        "schema": {
          "$ref": "#/components/schemas/RequestTags"
        }
      }
    ],
    "requestBody": {
      "required": true,
      "description": "Raw file bytes, up to 50 MiB.",
      "schema": {
        "type": "string",
        "format": "binary"
      },
      "contentType": "application/octet-stream",
      "binary": true
    },
    "annotations": {
      "readOnlyHint": true,
      "destructiveHint": false,
      "openWorldHint": true
    }
  },
  {
    "name": "get-web-scrape-bytes",
    "title": "Scrape raw bytes",
    "method": "GET",
    "path": "/web/scrape/bytes",
    "description": "Scrape raw bytes — Downloads a resource and returns its bytes as base64. Without waitForMs, returns the original HTTP response without image conversion, text extraction, or character-encoding changes. HTTP compression is decoded before base64 encoding. Supply waitForMs to render HTML with JavaScript in the browser and return the resulting HTML as UTF-8 bytes after the wait. Non-HTML resources, including images and PDFs, keep their original bytes and do not incur a browser wait. Follows public redirects and retries failed downloads through ISP and residential proxies, with a direct fallback. When country is specified, only a residential proxy in that country is used. Supply headers such as Referer for images that require a referring page. Cached results are reused according to maxAgeMs (default: 3 days; maximum: 1 year). Set maxAgeMs=0 to fetch fresh and refresh the cache. Cache identity includes the exact URL, country, waitForMs, and normalized outbound headers. Credential-bearing headers and zero data retention bypass cache reads and writes. cache_metadata reports hit, miss, or zdr and the cached result age in milliseconds. Maximum decoded resource size: 50 MiB (52428800 bytes), before base64 encoding. Successful requests cost 1 credit; errors are not billed.",
    "parameters": [
      {
        "name": "url",
        "in": "query",
        "required": true,
        "description": "Full HTTP(S) URL of the resource to download, such as an image, PDF, or page.",
        "schema": {
          "type": "string",
          "minLength": 1,
          "format": "uri",
          "description": "Full HTTP(S) URL of the resource to download, such as an image, PDF, or page."
        }
      },
      {
        "name": "headers",
        "in": "query",
        "required": false,
        "description": "Headers for the target origin. Credentials are removed on cross-origin redirects and bypass caching.",
        "schema": {
          "type": "object",
          "additionalProperties": {
            "type": "string",
            "maxLength": 8192,
            "pattern": "^[^\\r\\n]*$"
          },
          "description": "Headers for the target origin. Credentials are removed on cross-origin redirects and bypass caching."
        }
      },
      {
        "name": "country",
        "in": "query",
        "required": false,
        "description": "Fetch from this country (ISO 3166-1 alpha-2).",
        "schema": {
          "$ref": "#/components/schemas/BrowserCountryCode"
        }
      },
      {
        "name": "waitForMs",
        "in": "query",
        "required": false,
        "description": "Optional browser wait time after initial page load, in milliseconds (0–30000; 0 uses 500). When supplied, HTML is rendered with JavaScript and returned as UTF-8 bytes. Other resources keep their original bytes without a browser wait. Omit to download the original HTTP response. When combined with timeoutOpts, timeoutOpts.milliseconds must be at least waitForMs + 10000 ms; a shorter deadline is rejected with 400 TIMEOUT_TOO_SHORT_FOR_WAIT.",
        "schema": {
          "type": [
            "integer",
            "null"
          ],
          "minimum": 0,
          "maximum": 30000,
          "description": "Optional browser wait time after initial page load, in milliseconds (0–30000; 0 uses 500). When supplied, HTML is rendered with JavaScript and returned as UTF-8 bytes. Other resources keep their original bytes without a browser wait. Omit to download the original HTTP response. When combined with timeoutOpts, timeoutOpts.milliseconds must be at least waitForMs + 10000 ms; a shorter deadline is rejected with 400 TIMEOUT_TOO_SHORT_FOR_WAIT."
        }
      },
      {
        "name": "timeoutOpts",
        "in": "query",
        "required": false,
        "description": "Request deadline and what to return when it passes.",
        "schema": {
          "$ref": "#/components/schemas/LenientTimeout"
        }
      },
      {
        "name": "maxAgeMs",
        "in": "query",
        "required": false,
        "description": "Maximum cache age in milliseconds. Defaults to 3 days (259200000 ms). Maximum: 1 year (31536000000 ms). `0` fetches fresh.",
        "schema": {
          "type": [
            "integer",
            "null"
          ],
          "minimum": 0,
          "maximum": 31536000000,
          "default": 259200000,
          "description": "Maximum cache age in milliseconds. Defaults to 3 days (259200000 ms). Maximum: 1 year (31536000000 ms). `0` fetches fresh."
        }
      },
      {
        "name": "zdr",
        "in": "query",
        "required": false,
        "description": "`enabled` turns on zero data retention. Returns 403 `ZDR_NOT_ENABLED` unless your organization has ZDR.",
        "schema": {
          "type": "string",
          "enum": [
            "enabled",
            "disabled"
          ],
          "default": "disabled",
          "description": "`enabled` turns on zero data retention. Returns 403 `ZDR_NOT_ENABLED` unless your organization has ZDR."
        }
      },
      {
        "name": "tags",
        "in": "query",
        "required": false,
        "description": "Comma-separated labels for filtering usage, e.g. `production,team-alpha`.",
        "schema": {
          "$ref": "#/components/schemas/RequestTags"
        }
      }
    ],
    "annotations": {
      "readOnlyHint": true,
      "destructiveHint": false,
      "openWorldHint": true
    }
  },
  {
    "name": "web-scrape-html",
    "title": "Scrape HTML",
    "method": "GET",
    "path": "/web/scrape/html",
    "description": "Scrape HTML — Scrapes the given URL and returns the HTML content of the page. Optional extractRules return deterministic structured data in extracted using CSS selectors, attributes, lists, and nested rules, without an LLM or additional credits. Rules run on the returned HTML after selector and main-content filtering. Send extractRules as a JSON-encoded query parameter. The base request costs 1 credit; requests with browser actions cost 2 credits. A request that hits its timeoutOpts.milliseconds deadline fails with 408 and is not billed, unless timeoutOpts.behavior=return-partial is set — then the page as rendered so far is returned with `finalDOMState: \"still-loading\"` and billed at the base cost of 1 credit.",
    "parameters": [
      {
        "name": "url",
        "in": "query",
        "required": true,
        "description": "Full URL to scrape (must include http:// or https:// protocol)",
        "schema": {
          "type": "string",
          "minLength": 1,
          "format": "uri",
          "description": "Full URL to scrape (must include http:// or https:// protocol)"
        }
      },
      {
        "name": "pdf",
        "in": "query",
        "required": false,
        "description": "PDF handling. `start`/`end` limit parsing to an inclusive, 1-based page range.",
        "schema": {
          "type": "object",
          "properties": {
            "shouldParse": {
              "type": "boolean",
              "default": true,
              "description": "Parse PDF URLs. When false, PDFs fail with `PDF_SKIPPED`."
            },
            "start": {
              "type": "integer",
              "minimum": 1,
              "description": "First 1-based PDF page to parse."
            },
            "end": {
              "type": "integer",
              "minimum": 1,
              "description": "Last PDF page to parse (1-based, inclusive). Defaults to the final page. Must be >= start."
            },
            "ocr": {
              "type": "boolean",
              "default": false,
              "description": "Read scanned PDF pages with OCR; preserve pages that already have text."
            }
          },
          "default": {
            "shouldParse": true,
            "ocr": false
          },
          "description": "PDF handling. `start`/`end` limit parsing to an inclusive, 1-based page range."
        }
      },
      {
        "name": "includeFrames",
        "in": "query",
        "required": false,
        "description": "When true, iframes are rendered inline into the returned HTML.",
        "schema": {
          "type": "boolean",
          "default": false,
          "description": "When true, iframes are rendered inline into the returned HTML."
        }
      },
      {
        "name": "useMainContentOnly",
        "in": "query",
        "required": false,
        "description": "When true, return only the page's main content in the HTML response, excluding headers, footers, sidebars, and navigation when detectable.",
        "schema": {
          "type": "boolean",
          "default": false,
          "description": "When true, return only the page's main content in the HTML response, excluding headers, footers, sidebars, and navigation when detectable."
        }
      },
      {
        "name": "extractRules",
        "in": "query",
        "required": false,
        "description": "CSS extraction rules, as a JSON object. Up to 100 fields and 5 nesting levels. XPath is unsupported.",
        "schema": {
          "type": "object",
          "additionalProperties": {
            "anyOf": [
              {
                "type": "string",
                "minLength": 1,
                "maxLength": 2048
              },
              {
                "type": "object",
                "properties": {
                  "selector": {
                    "type": "string",
                    "minLength": 1,
                    "maxLength": 2048,
                    "description": "CSS selector to match within the current page or parent rule."
                  },
                  "type": {
                    "type": "string",
                    "enum": [
                      "item",
                      "list"
                    ],
                    "description": "Return the first match with `item` or all matches with `list`."
                  },
                  "output": {
                    "anyOf": [
                      {
                        "type": "string",
                        "enum": [
                          "text",
                          "html"
                        ]
                      },
                      {
                        "type": "string",
                        "pattern": "^@.*$"
                      },
                      {
                        "$ref": "#/components/schemas/HtmlExtractionRules"
                      }
                    ],
                    "description": "Return text, HTML, an attribute such as `@href`, or nested field rules. Defaults to text."
                  }
                },
                "required": [
                  "selector"
                ],
                "additionalProperties": false
              }
            ]
          },
          "description": "CSS extraction rules, as a JSON object. Up to 100 fields and 5 nesting levels. XPath is unsupported."
        }
      },
      {
        "name": "includeSelectors",
        "in": "query",
        "required": false,
        "description": "Keep only elements matching these CSS selectors.",
        "schema": {
          "type": [
            "array",
            "null"
          ],
          "items": {
            "type": "string",
            "minLength": 1,
            "maxLength": 2048
          },
          "maxItems": 50,
          "description": "Keep only elements matching these CSS selectors."
        }
      },
      {
        "name": "excludeSelectors",
        "in": "query",
        "required": false,
        "description": "CSS selectors to remove from the result. Applied after includeSelectors. Exclusion takes precedence: an element matching both is removed. Examples: \"nav\", \"footer\", \".ad-banner\", \"[aria-hidden=true]\".",
        "schema": {
          "type": [
            "array",
            "null"
          ],
          "items": {
            "type": "string",
            "minLength": 1,
            "maxLength": 2048
          },
          "maxItems": 50,
          "description": "CSS selectors to remove from the result. Applied after includeSelectors. Exclusion takes precedence: an element matching both is removed. Examples: \"nav\", \"footer\", \".ad-banner\", \"[aria-hidden=true]\"."
        }
      },
      {
        "name": "maxAgeMs",
        "in": "query",
        "required": false,
        "description": "Maximum cache age in milliseconds. Defaults to 3 days (259200000 ms). Maximum: 1 year (31536000000 ms). `0` fetches fresh.",
        "schema": {
          "type": [
            "integer",
            "null"
          ],
          "minimum": 0,
          "maximum": 31536000000,
          "default": 259200000,
          "description": "Maximum cache age in milliseconds. Defaults to 3 days (259200000 ms). Maximum: 1 year (31536000000 ms). `0` fetches fresh."
        }
      },
      {
        "name": "waitForMs",
        "in": "query",
        "required": false,
        "description": "Optional browser wait time in milliseconds after initial page load. Min: 0. Max: 30000 (30 seconds). When combined with timeoutOpts, timeoutOpts.milliseconds must be at least waitForMs + 10000 ms; a shorter deadline is rejected with 400 TIMEOUT_TOO_SHORT_FOR_WAIT.",
        "schema": {
          "type": [
            "integer",
            "null"
          ],
          "minimum": 0,
          "maximum": 30000,
          "description": "Optional browser wait time in milliseconds after initial page load. Min: 0. Max: 30000 (30 seconds). When combined with timeoutOpts, timeoutOpts.milliseconds must be at least waitForMs + 10000 ms; a shorter deadline is rejected with 400 TIMEOUT_TOO_SHORT_FOR_WAIT."
        }
      },
      {
        "name": "settleAnimations",
        "in": "query",
        "required": false,
        "description": "When true, waits briefly for CSS and transition animations to settle before extracting HTML. Defaults to false. This adds a bit of latency in exchange for more stable output on animated pages.",
        "schema": {
          "type": "boolean",
          "default": false,
          "description": "When true, waits briefly for CSS and transition animations to settle before extracting HTML. Defaults to false. This adds a bit of latency in exchange for more stable output on animated pages."
        }
      },
      {
        "name": "actions",
        "in": "query",
        "required": false,
        "description": "Optional browser actions executed in array order after the page loads and before content is captured. Requires a paid plan. Send a JSON array in the query parameter. Maximum: 5 actions.",
        "schema": {
          "type": [
            "array",
            "null"
          ],
          "items": {
            "$ref": "#/components/schemas/WebScrapeAction"
          },
          "maxItems": 5,
          "description": "Optional browser actions executed in array order after the page loads and before content is captured. Requires a paid plan. Send a JSON array in the query parameter. Maximum: 5 actions."
        }
      },
      {
        "name": "headers",
        "in": "query",
        "required": false,
        "description": "HTTP headers for the target origin. Non-empty headers bypass caching.",
        "schema": {
          "type": "object",
          "additionalProperties": {
            "type": "string",
            "maxLength": 8192,
            "pattern": "^[^\\r\\n]*$"
          },
          "description": "HTTP headers for the target origin. Non-empty headers bypass caching."
        }
      },
      {
        "name": "country",
        "in": "query",
        "required": false,
        "description": "Fetch from this country (ISO 3166-1 alpha-2).",
        "schema": {
          "$ref": "#/components/schemas/BrowserCountryCode"
        }
      },
      {
        "name": "timeoutOpts",
        "in": "query",
        "required": false,
        "description": "Request deadline and what to return when it passes.",
        "schema": {
          "$ref": "#/components/schemas/ScrapeTimeout"
        }
      },
      {
        "name": "zdr",
        "in": "query",
        "required": false,
        "description": "`enabled` turns on zero data retention. Returns 403 `ZDR_NOT_ENABLED` unless your organization has ZDR.",
        "schema": {
          "type": "string",
          "enum": [
            "enabled",
            "disabled"
          ],
          "default": "disabled",
          "description": "`enabled` turns on zero data retention. Returns 403 `ZDR_NOT_ENABLED` unless your organization has ZDR."
        }
      },
      {
        "name": "tags",
        "in": "query",
        "required": false,
        "description": "Comma-separated labels for filtering usage, e.g. `production,team-alpha`.",
        "schema": {
          "$ref": "#/components/schemas/RequestTags"
        }
      }
    ],
    "annotations": {
      "readOnlyHint": true,
      "destructiveHint": false,
      "openWorldHint": true
    }
  },
  {
    "name": "web-scrape-markdown",
    "title": "Scrape Markdown",
    "method": "GET",
    "path": "/web/scrape/markdown",
    "description": "Scrape Markdown — Scrapes the given URL into LLM usable Markdown. Inspect key_metadata on JSON responses from a recognized API key; use error_code to distinguish stable failure categories. ### YouTube YouTube URLs return the video or channel itself rather than the surrounding player and navigation chrome. A URL addressing a single video (`/watch`, `youtu.be`, `/shorts`, `/embed`, `/live`) returns its title, channel, duration, view count, keywords, full description, and the transcript when the video has captions that can be retrieved; videos without captions return everything except the transcript. A channel URL (`/channel/UC…`, `/@handle`, `/c/…`, `/user/…`) returns its name, handle, subscriber count, video count, and full description. When `includeImages=true`, video responses also include the thumbnail and channel responses include the avatar. Costs the same as any other scrape. ### Billing & errors | HTTP status | Billed? | Meaning | | --- | --- | --- | | 200 | Yes — 1 credit, or 2 credits with actions | Successful scrape, including a zero-length result when includeSelectors matched nothing. A partial result (`finalDOMState: \"still-loading\"`, only with timeoutOpts.behavior=return-partial) is billed at the base 1 credit with no OCR or actions surcharge | | 400 | No | Invalid input, skipped PDF, or the page could not be scraped. error_code WEBSITE_BLOCKED specifically means t…",
    "parameters": [
      {
        "name": "url",
        "in": "query",
        "required": true,
        "description": "Full URL to scrape into LLM usable Markdown (must include http:// or https:// protocol)",
        "schema": {
          "type": "string",
          "minLength": 1,
          "format": "uri",
          "description": "Full URL to scrape into LLM usable Markdown (must include http:// or https:// protocol)"
        }
      },
      {
        "name": "includeLinks",
        "in": "query",
        "required": false,
        "description": "Preserve hyperlinks in Markdown output (`html-conversion` only).",
        "schema": {
          "type": "boolean",
          "default": true,
          "description": "Preserve hyperlinks in Markdown output (`html-conversion` only)."
        }
      },
      {
        "name": "includeImages",
        "in": "query",
        "required": false,
        "description": "Include image references in Markdown output (`html-conversion` only).",
        "schema": {
          "type": "boolean",
          "default": false,
          "description": "Include image references in Markdown output (`html-conversion` only)."
        }
      },
      {
        "name": "shortenBase64Images",
        "in": "query",
        "required": false,
        "description": "Shorten base64-encoded image data in the Markdown output (`html-conversion` only).",
        "schema": {
          "type": "boolean",
          "default": true,
          "description": "Shorten base64-encoded image data in the Markdown output (`html-conversion` only)."
        }
      },
      {
        "name": "useMainContentOnly",
        "in": "query",
        "required": false,
        "description": "Extract only the main content of the page, excluding headers, footers, sidebars, and navigation",
        "schema": {
          "type": "boolean",
          "default": false,
          "description": "Extract only the main content of the page, excluding headers, footers, sidebars, and navigation"
        }
      },
      {
        "name": "includeHTML",
        "in": "query",
        "required": false,
        "description": "When true, the response also includes an `html` field with the page HTML the Markdown was converted from — the same body the Scrape HTML endpoint returns for the equivalent request.",
        "schema": {
          "type": "boolean",
          "default": false,
          "description": "When true, the response also includes an `html` field with the page HTML the Markdown was converted from — the same body the Scrape HTML endpoint returns for the equivalent request."
        }
      },
      {
        "name": "sourcePreference",
        "in": "query",
        "required": false,
        "description": "Markdown sources in order of preference: `html-conversion` converts the page HTML, `markdown-direct` uses Markdown the site publishes.",
        "schema": {
          "type": "array",
          "items": {
            "type": "string",
            "enum": [
              "html-conversion",
              "markdown-direct"
            ]
          },
          "minItems": 1,
          "uniqueItems": true,
          "default": [
            "html-conversion",
            "markdown-direct"
          ],
          "description": "Markdown sources in order of preference: `html-conversion` converts the page HTML, `markdown-direct` uses Markdown the site publishes."
        }
      },
      {
        "name": "pdf",
        "in": "query",
        "required": false,
        "description": "PDF handling. `start`/`end` limit parsing to an inclusive, 1-based page range.",
        "schema": {
          "type": "object",
          "properties": {
            "shouldParse": {
              "type": "boolean",
              "default": true,
              "description": "Parse PDF URLs. When false, PDFs fail with `PDF_SKIPPED`."
            },
            "start": {
              "type": "integer",
              "minimum": 1,
              "description": "First 1-based PDF page to parse."
            },
            "end": {
              "type": "integer",
              "minimum": 1,
              "description": "Last PDF page to parse (1-based, inclusive). Defaults to the final page. Must be >= start."
            },
            "ocr": {
              "type": "boolean",
              "default": false,
              "description": "Read scanned PDF pages with OCR; preserve pages that already have text."
            }
          },
          "default": {
            "shouldParse": true,
            "ocr": false
          },
          "description": "PDF handling. `start`/`end` limit parsing to an inclusive, 1-based page range."
        }
      },
      {
        "name": "includeFrames",
        "in": "query",
        "required": false,
        "description": "When true, the contents of iframes are rendered to Markdown.",
        "schema": {
          "type": "boolean",
          "default": false,
          "description": "When true, the contents of iframes are rendered to Markdown."
        }
      },
      {
        "name": "includeSelectors",
        "in": "query",
        "required": false,
        "description": "Keep matching HTML subtrees before converting to Markdown.",
        "schema": {
          "type": [
            "array",
            "null"
          ],
          "items": {
            "type": "string",
            "minLength": 1,
            "maxLength": 2048
          },
          "maxItems": 50,
          "description": "Keep matching HTML subtrees before converting to Markdown."
        }
      },
      {
        "name": "excludeSelectors",
        "in": "query",
        "required": false,
        "description": "Remove matching elements after inclusions. Exclusions take precedence.",
        "schema": {
          "type": [
            "array",
            "null"
          ],
          "items": {
            "type": "string",
            "minLength": 1,
            "maxLength": 2048
          },
          "maxItems": 50,
          "description": "Remove matching elements after inclusions. Exclusions take precedence."
        }
      },
      {
        "name": "maxAgeMs",
        "in": "query",
        "required": false,
        "description": "Maximum cache age in milliseconds. Defaults to 3 days (259200000 ms). Maximum: 1 year (31536000000 ms). `0` fetches fresh.",
        "schema": {
          "type": [
            "integer",
            "null"
          ],
          "minimum": 0,
          "maximum": 31536000000,
          "default": 259200000,
          "description": "Maximum cache age in milliseconds. Defaults to 3 days (259200000 ms). Maximum: 1 year (31536000000 ms). `0` fetches fresh."
        }
      },
      {
        "name": "waitForMs",
        "in": "query",
        "required": false,
        "description": "Optional browser wait time in milliseconds after initial page load before converting the page to Markdown. Min: 0. Max: 30000 (30 seconds). When combined with timeoutOpts, timeoutOpts.milliseconds must be at least waitForMs + 10000 ms; a shorter deadline is rejected with 400 TIMEOUT_TOO_SHORT_FOR_WAIT.",
        "schema": {
          "type": [
            "integer",
            "null"
          ],
          "minimum": 0,
          "maximum": 30000,
          "description": "Optional browser wait time in milliseconds after initial page load before converting the page to Markdown. Min: 0. Max: 30000 (30 seconds). When combined with timeoutOpts, timeoutOpts.milliseconds must be at least waitForMs + 10000 ms; a shorter deadline is rejected with 400 TIMEOUT_TOO_SHORT_FOR_WAIT."
        }
      },
      {
        "name": "settleAnimations",
        "in": "query",
        "required": false,
        "description": "When true, waits briefly for CSS and transition animations to settle before converting to Markdown. Defaults to false. This adds a bit of latency in exchange for more stable output on animated pages.",
        "schema": {
          "type": "boolean",
          "default": false,
          "description": "When true, waits briefly for CSS and transition animations to settle before converting to Markdown. Defaults to false. This adds a bit of latency in exchange for more stable output on animated pages."
        }
      },
      {
        "name": "actions",
        "in": "query",
        "required": false,
        "description": "Optional browser actions executed in array order after the page loads and before content is captured. Requires a paid plan. Send a JSON array in the query parameter. Maximum: 5 actions.",
        "schema": {
          "type": [
            "array",
            "null"
          ],
          "items": {
            "$ref": "#/components/schemas/WebScrapeAction"
          },
          "maxItems": 5,
          "description": "Optional browser actions executed in array order after the page loads and before content is captured. Requires a paid plan. Send a JSON array in the query parameter. Maximum: 5 actions."
        }
      },
      {
        "name": "headers",
        "in": "query",
        "required": false,
        "description": "HTTP headers for the target origin. Non-empty headers bypass caching.",
        "schema": {
          "type": "object",
          "additionalProperties": {
            "type": "string",
            "maxLength": 8192,
            "pattern": "^[^\\r\\n]*$"
          },
          "description": "HTTP headers for the target origin. Non-empty headers bypass caching."
        }
      },
      {
        "name": "country",
        "in": "query",
        "required": false,
        "description": "Fetch from this country (ISO 3166-1 alpha-2).",
        "schema": {
          "$ref": "#/components/schemas/BrowserCountryCode"
        }
      },
      {
        "name": "timeoutOpts",
        "in": "query",
        "required": false,
        "description": "Request deadline and what to return when it passes.",
        "schema": {
          "$ref": "#/components/schemas/ScrapeTimeout"
        }
      },
      {
        "name": "zdr",
        "in": "query",
        "required": false,
        "description": "`enabled` turns on zero data retention. Returns 403 `ZDR_NOT_ENABLED` unless your organization has ZDR.",
        "schema": {
          "type": "string",
          "enum": [
            "enabled",
            "disabled"
          ],
          "default": "disabled",
          "description": "`enabled` turns on zero data retention. Returns 403 `ZDR_NOT_ENABLED` unless your organization has ZDR."
        }
      },
      {
        "name": "tags",
        "in": "query",
        "required": false,
        "description": "Comma-separated labels for filtering usage, e.g. `production,team-alpha`.",
        "schema": {
          "$ref": "#/components/schemas/RequestTags"
        }
      }
    ],
    "annotations": {
      "readOnlyHint": true,
      "destructiveHint": false,
      "openWorldHint": true
    }
  },
  {
    "name": "web-scrape-images",
    "title": "Scrape Images",
    "method": "GET",
    "path": "/web/scrape/images",
    "description": "Scrape Images — Extract image assets from a web page, including standard URLs, inline SVGs, data URIs, responsive image sources, metadata, CSS backgrounds, video posters, and embeds. The base request costs 1 credit, or 2 credits with browser actions. When enrichment is enabled, the entire call costs 5 credits, including requests that also use actions.",
    "parameters": [
      {
        "name": "url",
        "in": "query",
        "required": true,
        "description": "Page URL to inspect. Must include http:// or https://.",
        "schema": {
          "type": "string",
          "minLength": 1,
          "format": "uri",
          "description": "Page URL to inspect. Must include http:// or https://."
        }
      },
      {
        "name": "maxAgeMs",
        "in": "query",
        "required": false,
        "description": "Maximum cache age in milliseconds. Defaults to 3 days (259200000 ms). Maximum: 1 year (31536000000 ms). `0` fetches fresh.",
        "schema": {
          "type": [
            "integer",
            "null"
          ],
          "minimum": 0,
          "maximum": 31536000000,
          "default": 259200000,
          "description": "Maximum cache age in milliseconds. Defaults to 3 days (259200000 ms). Maximum: 1 year (31536000000 ms). `0` fetches fresh."
        }
      },
      {
        "name": "enrichment",
        "in": "query",
        "required": false,
        "description": "Optional per-image processing, sent as deep-object query params such as enrichment[resolution]=true.",
        "schema": {
          "type": [
            "object",
            "null"
          ],
          "properties": {
            "resolution": {
              "type": "boolean",
              "default": false,
              "description": "Measure image width and height when possible."
            },
            "hostedUrl": {
              "type": "boolean",
              "default": false,
              "description": "Host materializable images on the Context.dev CDN and return their URL and MIME type. Ignored when zero data retention is enabled."
            },
            "classification": {
              "type": "boolean",
              "default": false,
              "description": "Classify each image by visual asset type."
            },
            "maxTimePerMs": {
              "type": "integer",
              "minimum": 1,
              "maximum": 60000,
              "default": 30000,
              "description": "Per-image enrichment timeout in milliseconds. Default: 30000. Maximum: 60000."
            }
          },
          "additionalProperties": false,
          "description": "Optional per-image processing, sent as deep-object query params such as enrichment[resolution]=true."
        }
      },
      {
        "name": "dedupe",
        "in": "query",
        "required": false,
        "description": "Remove visual duplicates, keeping the highest-resolution copy. Undownloadable images remain.",
        "schema": {
          "type": "boolean",
          "default": false,
          "description": "Remove visual duplicates, keeping the highest-resolution copy. Undownloadable images remain."
        }
      },
      {
        "name": "waitForMs",
        "in": "query",
        "required": false,
        "description": "Optional browser wait time in milliseconds after initial page load before collecting images. Min: 0. Max: 30000 (30 seconds). When combined with timeoutOpts, timeoutOpts.milliseconds must be at least waitForMs + 10000 ms; a shorter deadline is rejected with 400 TIMEOUT_TOO_SHORT_FOR_WAIT.",
        "schema": {
          "type": [
            "integer",
            "null"
          ],
          "minimum": 0,
          "maximum": 30000,
          "description": "Optional browser wait time in milliseconds after initial page load before collecting images. Min: 0. Max: 30000 (30 seconds). When combined with timeoutOpts, timeoutOpts.milliseconds must be at least waitForMs + 10000 ms; a shorter deadline is rejected with 400 TIMEOUT_TOO_SHORT_FOR_WAIT."
        }
      },
      {
        "name": "actions",
        "in": "query",
        "required": false,
        "description": "Optional browser actions executed in array order after the page loads and before content is captured. Requires a paid plan. Send a JSON array in the query parameter. Maximum: 5 actions.",
        "schema": {
          "type": [
            "array",
            "null"
          ],
          "items": {
            "$ref": "#/components/schemas/WebScrapeAction"
          },
          "maxItems": 5,
          "description": "Optional browser actions executed in array order after the page loads and before content is captured. Requires a paid plan. Send a JSON array in the query parameter. Maximum: 5 actions."
        }
      },
      {
        "name": "headers",
        "in": "query",
        "required": false,
        "description": "HTTP headers for the target origin. Non-empty headers bypass caching.",
        "schema": {
          "type": "object",
          "additionalProperties": {
            "type": "string",
            "maxLength": 8192,
            "pattern": "^[^\\r\\n]*$"
          },
          "description": "HTTP headers for the target origin. Non-empty headers bypass caching."
        }
      },
      {
        "name": "country",
        "in": "query",
        "required": false,
        "description": "Fetch from this country (ISO 3166-1 alpha-2).",
        "schema": {
          "$ref": "#/components/schemas/BrowserCountryCode"
        }
      },
      {
        "name": "timeoutOpts",
        "in": "query",
        "required": false,
        "description": "Request deadline and what to return when it passes.",
        "schema": {
          "$ref": "#/components/schemas/ScrapeTimeout"
        }
      },
      {
        "name": "zdr",
        "in": "query",
        "required": false,
        "description": "`enabled` turns on zero data retention. Returns 403 `ZDR_NOT_ENABLED` unless your organization has ZDR.",
        "schema": {
          "type": "string",
          "enum": [
            "enabled",
            "disabled"
          ],
          "default": "disabled",
          "description": "`enabled` turns on zero data retention. Returns 403 `ZDR_NOT_ENABLED` unless your organization has ZDR."
        }
      },
      {
        "name": "tags",
        "in": "query",
        "required": false,
        "description": "Comma-separated labels for filtering usage, e.g. `production,team-alpha`.",
        "schema": {
          "$ref": "#/components/schemas/RequestTags"
        }
      }
    ],
    "annotations": {
      "readOnlyHint": true,
      "destructiveHint": false,
      "openWorldHint": true
    }
  },
  {
    "name": "web-scrape-sitemap",
    "title": "Crawl Sitemap",
    "method": "GET",
    "path": "/web/scrape/sitemap",
    "description": "Crawl Sitemap — Crawl an entire website's sitemap and return all discovered page URLs. Set `includeSubdomains=true` to also discover public pages and sitemaps on child hosts such as `docs.example.com` or `brand.example.com`. Pass `search` to have the discovered URLs filtered down to the pages about a phrase (for example `pricing and plans` or `api authentication docs`), most relevant first — a searched crawl scans the whole sitemap and costs 2 credits instead of 1.",
    "parameters": [
      {
        "name": "domain",
        "in": "query",
        "required": true,
        "description": "Domain to map, e.g. `stripe.com`.",
        "schema": {
          "type": "string",
          "minLength": 3,
          "description": "Domain to map, e.g. `stripe.com`.",
          "example": "stripe.com"
        }
      },
      {
        "name": "includeSubdomains",
        "in": "query",
        "required": false,
        "description": "Include URLs on subdomains.",
        "schema": {
          "type": "boolean",
          "default": false,
          "description": "Include URLs on subdomains."
        }
      },
      {
        "name": "maxLinks",
        "in": "query",
        "required": false,
        "description": "Maximum number of URLs to return.",
        "schema": {
          "type": "integer",
          "minimum": 1,
          "maximum": 100000,
          "default": 10000,
          "description": "Maximum number of URLs to return."
        }
      },
      {
        "name": "sitemapUrl",
        "in": "query",
        "required": false,
        "description": "Fetch this sitemap instead of discovering sitemaps. Must belong to the domain or a subdomain.",
        "schema": {
          "type": "string",
          "format": "uri",
          "description": "Fetch this sitemap instead of discovering sitemaps. Must belong to the domain or a subdomain."
        }
      },
      {
        "name": "urlRegex",
        "in": "query",
        "required": false,
        "description": "Regex pattern. Only URLs matching this pattern are returned and counted against maxLinks.",
        "schema": {
          "type": "string",
          "maxLength": 256,
          "description": "Regex pattern. Only URLs matching this pattern are returned and counted against maxLinks.",
          "example": "^https?://[^/]+/blog/"
        }
      },
      {
        "name": "excludeUrlRegex",
        "in": "query",
        "required": false,
        "description": "Regex pattern. URLs matching this pattern are not returned, even when they match urlRegex.",
        "schema": {
          "type": "string",
          "maxLength": 256,
          "description": "Regex pattern. URLs matching this pattern are not returned, even when they match urlRegex.",
          "example": "/tag/|/author/"
        }
      },
      {
        "name": "search",
        "in": "query",
        "required": false,
        "description": "Filter URLs by a topic or phrase, most relevant first.",
        "schema": {
          "type": "string",
          "minLength": 2,
          "maxLength": 200,
          "description": "Filter URLs by a topic or phrase, most relevant first.",
          "example": "help center and troubleshooting articles"
        }
      },
      {
        "name": "headers",
        "in": "query",
        "required": false,
        "description": "HTTP headers for the target origin. Non-empty headers bypass caching.",
        "schema": {
          "type": "object",
          "additionalProperties": {
            "type": "string",
            "maxLength": 8192,
            "pattern": "^[^\\r\\n]*$"
          },
          "description": "HTTP headers for the target origin. Non-empty headers bypass caching."
        }
      },
      {
        "name": "timeoutOpts",
        "in": "query",
        "required": false,
        "description": "Request deadline and what to return when it passes.",
        "schema": {
          "$ref": "#/components/schemas/LenientPartialTimeout"
        }
      },
      {
        "name": "zdr",
        "in": "query",
        "required": false,
        "description": "`enabled` turns on zero data retention. Returns 403 `ZDR_NOT_ENABLED` unless your organization has ZDR.",
        "schema": {
          "type": "string",
          "enum": [
            "enabled",
            "disabled"
          ],
          "default": "disabled",
          "description": "`enabled` turns on zero data retention. Returns 403 `ZDR_NOT_ENABLED` unless your organization has ZDR."
        }
      },
      {
        "name": "tags",
        "in": "query",
        "required": false,
        "description": "Comma-separated labels for filtering usage, e.g. `production,team-alpha`.",
        "schema": {
          "$ref": "#/components/schemas/RequestTags"
        }
      }
    ],
    "annotations": {
      "readOnlyHint": true,
      "destructiveHint": false,
      "openWorldHint": true
    }
  },
  {
    "name": "web-map",
    "title": "Map URLs",
    "method": "GET",
    "path": "/web/urls",
    "description": "Map URLs — Discover a site's URLs, with page titles, descriptions, keywords, and language when available. Metadata can be missing on newly discovered URLs.",
    "parameters": [
      {
        "name": "domain",
        "in": "query",
        "required": true,
        "description": "Domain to map, e.g. `stripe.com`.",
        "schema": {
          "type": "string",
          "minLength": 3,
          "description": "Domain to map, e.g. `stripe.com`.",
          "example": "stripe.com"
        }
      },
      {
        "name": "includeSubdomains",
        "in": "query",
        "required": false,
        "description": "Include URLs on subdomains.",
        "schema": {
          "type": "boolean",
          "default": false,
          "description": "Include URLs on subdomains."
        }
      },
      {
        "name": "maxLinks",
        "in": "query",
        "required": false,
        "description": "Maximum number of URLs to return.",
        "schema": {
          "type": "integer",
          "minimum": 1,
          "maximum": 100000,
          "default": 10000,
          "description": "Maximum number of URLs to return."
        }
      },
      {
        "name": "sitemapUrl",
        "in": "query",
        "required": false,
        "description": "Fetch this sitemap instead of discovering sitemaps. Must belong to the domain or a subdomain.",
        "schema": {
          "type": "string",
          "format": "uri",
          "description": "Fetch this sitemap instead of discovering sitemaps. Must belong to the domain or a subdomain."
        }
      },
      {
        "name": "urlRegex",
        "in": "query",
        "required": false,
        "description": "Regex pattern. Only URLs matching this pattern are returned and counted against maxLinks.",
        "schema": {
          "type": "string",
          "maxLength": 256,
          "description": "Regex pattern. Only URLs matching this pattern are returned and counted against maxLinks.",
          "example": "^https?://[^/]+/blog/"
        }
      },
      {
        "name": "excludeUrlRegex",
        "in": "query",
        "required": false,
        "description": "Regex pattern. URLs matching this pattern are not returned, even when they match urlRegex.",
        "schema": {
          "type": "string",
          "maxLength": 256,
          "description": "Regex pattern. URLs matching this pattern are not returned, even when they match urlRegex.",
          "example": "/tag/|/author/"
        }
      },
      {
        "name": "search",
        "in": "query",
        "required": false,
        "description": "Filter URLs by a topic or phrase, most relevant first.",
        "schema": {
          "type": "string",
          "minLength": 2,
          "maxLength": 200,
          "description": "Filter URLs by a topic or phrase, most relevant first.",
          "example": "help center and troubleshooting articles"
        }
      },
      {
        "name": "headers",
        "in": "query",
        "required": false,
        "description": "HTTP headers for the target origin. Non-empty headers bypass caching.",
        "schema": {
          "type": "object",
          "additionalProperties": {
            "type": "string",
            "maxLength": 8192,
            "pattern": "^[^\\r\\n]*$"
          },
          "description": "HTTP headers for the target origin. Non-empty headers bypass caching."
        }
      },
      {
        "name": "timeoutOpts",
        "in": "query",
        "required": false,
        "description": "Request deadline and what to return when it passes.",
        "schema": {
          "$ref": "#/components/schemas/LenientPartialTimeout"
        }
      },
      {
        "name": "zdr",
        "in": "query",
        "required": false,
        "description": "`enabled` turns on zero data retention. Returns 403 `ZDR_NOT_ENABLED` unless your organization has ZDR.",
        "schema": {
          "type": "string",
          "enum": [
            "enabled",
            "disabled"
          ],
          "default": "disabled",
          "description": "`enabled` turns on zero data retention. Returns 403 `ZDR_NOT_ENABLED` unless your organization has ZDR."
        }
      },
      {
        "name": "policies",
        "in": "query",
        "required": false,
        "description": "Comma-separated access policy IDs to apply. A URL must pass every policy.",
        "schema": {
          "type": "array",
          "items": {
            "type": "string"
          }
        }
      },
      {
        "name": "tags",
        "in": "query",
        "required": false,
        "description": "Comma-separated labels for filtering usage, e.g. `production,team-alpha`.",
        "schema": {
          "$ref": "#/components/schemas/RequestTags"
        }
      }
    ],
    "annotations": {
      "readOnlyHint": true,
      "destructiveHint": false,
      "openWorldHint": true
    }
  },
  {
    "name": "web-crawl",
    "title": "Crawl a website",
    "method": "POST",
    "path": "/web/crawl",
    "description": "Crawl a website — Crawl a website and return page content as Markdown. Use a batch for crawls beyond 500 pages.",
    "parameters": [],
    "requestBody": {
      "required": true,
      "schema": {
        "type": "object",
        "properties": {
          "url": {
            "type": "string",
            "minLength": 1,
            "format": "uri",
            "description": "Start URL, including `http://` or `https://`."
          },
          "maxPages": {
            "type": "integer",
            "minimum": 1,
            "maximum": 500,
            "default": 100,
            "description": "Maximum pages to crawl."
          },
          "maxDepth": {
            "type": "integer",
            "minimum": 0,
            "description": "Maximum link depth from the starting URL (0 = only the starting page)"
          },
          "urlRegex": {
            "type": "string",
            "maxLength": 256,
            "description": "Regex pattern. Only URLs matching this pattern will be followed and scraped. An automatic prefix scope in the form ^<starting URL> follows a redirect of the starting page.",
            "example": "^https?://[^/]+/blog/"
          },
          "excludeUrlRegex": {
            "type": "string",
            "maxLength": 256,
            "description": "Regex pattern. URLs matching this pattern are never followed or scraped, even when they match urlRegex. The starting URL is always scraped.",
            "example": "/tag/|/author/"
          },
          "includeLinks": {
            "type": "boolean",
            "default": true,
            "description": "Preserve hyperlinks in the Markdown output (`html-conversion` only)."
          },
          "includeImages": {
            "type": "boolean",
            "default": false,
            "description": "Include image references in the Markdown output (`html-conversion` only)."
          },
          "shortenBase64Images": {
            "type": "boolean",
            "default": true,
            "description": "Truncate base64-encoded image data in the Markdown output (`html-conversion` only)."
          },
          "useMainContentOnly": {
            "type": "boolean",
            "default": false,
            "description": "Extract only the main content, stripping headers, footers, sidebars, and navigation"
          },
          "sourcePreference": {
            "type": "array",
            "items": {
              "type": "string",
              "enum": [
                "html-conversion",
                "markdown-direct"
              ]
            },
            "minItems": 1,
            "default": [
              "html-conversion",
              "markdown-direct"
            ],
            "uniqueItems": true,
            "description": "Markdown sources in order of preference: `html-conversion` converts the page HTML, `markdown-direct` uses Markdown the site publishes."
          },
          "followSubdomains": {
            "type": "boolean",
            "default": false,
            "description": "When true, follow links on subdomains of the starting URL's domain (e.g. docs.example.com when starting from example.com). www and apex are always treated as equivalent."
          },
          "pdf": {
            "type": "object",
            "properties": {
              "shouldParse": {
                "type": "boolean",
                "default": true,
                "description": "When true, PDF pages are fetched and parsed. When false, PDF pages are skipped entirely (not included in results and not counted as failures)."
              },
              "start": {
                "type": "integer",
                "minimum": 1,
                "description": "First 1-based PDF page to parse."
              },
              "end": {
                "type": "integer",
                "minimum": 1,
                "description": "Last PDF page to parse (1-based, inclusive). Defaults to the final page. Must be >= start."
              },
              "ocr": {
                "type": "boolean",
                "default": false,
                "description": "Read scanned PDF pages with OCR; preserve pages that already have text."
              }
            },
            "default": {
              "shouldParse": true,
              "ocr": false
            },
            "additionalProperties": false,
            "description": "PDF handling. `start`/`end` limit parsing to an inclusive, 1-based page range."
          },
          "includeFrames": {
            "type": "boolean",
            "default": false,
            "description": "When true, the contents of iframes are rendered to Markdown for each crawled page."
          },
          "includeSelectors": {
            "type": [
              "array",
              "null"
            ],
            "items": {
              "type": "string",
              "minLength": 1,
              "maxLength": 2048
            },
            "maxItems": 50,
            "description": "Keep matching HTML subtrees before converting each page to Markdown."
          },
          "excludeSelectors": {
            "type": [
              "array",
              "null"
            ],
            "items": {
              "type": "string",
              "minLength": 1,
              "maxLength": 2048
            },
            "maxItems": 50,
            "description": "Remove matching elements after inclusions. Exclusions take precedence."
          },
          "maxAgeMs": {
            "type": [
              "integer",
              "null"
            ],
            "minimum": 0,
            "maximum": 2592000000,
            "default": 86400000,
            "description": "Maximum cache age in milliseconds. Defaults to 1 day; `0` fetches fresh."
          },
          "waitForMs": {
            "type": [
              "integer",
              "null"
            ],
            "minimum": 0,
            "maximum": 30000,
            "default": 3500,
            "description": "Browser wait time in milliseconds after initial page load for each crawled page. Defaults to 3500 (3.5 seconds). Min: 0. Max: 30000 (30 seconds)."
          },
          "settleAnimations": {
            "type": "boolean",
            "default": false,
            "description": "Wait briefly for CSS animations and transitions to settle before reading each page."
          },
          "stopAfterMs": {
            "type": "integer",
            "minimum": 10000,
            "default": 80000,
            "maximum": 110000,
            "description": "Soft crawl deadline in milliseconds. Returns pages collected before the next deadline check."
          },
          "timeoutOpts": {
            "$ref": "#/components/schemas/PartialTimeout"
          },
          "country": {
            "$ref": "#/components/schemas/BrowserCountryCode"
          },
          "zdr": {
            "type": "string",
            "enum": [
              "enabled",
              "disabled"
            ],
            "default": "disabled",
            "description": "`enabled` turns on zero data retention. Returns 403 `ZDR_NOT_ENABLED` unless your organization has ZDR."
          },
          "policies": {
            "type": "array",
            "items": {
              "type": "string"
            },
            "description": "Access policy IDs to apply. A URL must pass every policy.",
            "example": [
              "pol_3f9c2a7e5b8d4c1f9a6e0b2d7c4f8a1e"
            ]
          },
          "tags": {
            "$ref": "#/components/schemas/RequestTags"
          }
        },
        "required": [
          "url"
        ]
      },
      "contentType": "application/json",
      "binary": false
    },
    "annotations": {
      "readOnlyHint": true,
      "destructiveHint": false,
      "openWorldHint": true
    }
  },
  {
    "name": "web-extract",
    "title": "Extract structured data",
    "method": "POST",
    "path": "/web/extract",
    "description": "Extract structured data — Extract website data using your JSON Schema and instructions.",
    "parameters": [],
    "requestBody": {
      "required": true,
      "schema": {
        "type": "object",
        "properties": {
          "url": {
            "type": "string",
            "minLength": 1,
            "format": "uri",
            "description": "The starting website URL to crawl and extract from. Must include http:// or https://."
          },
          "schema": {
            "type": "object",
            "additionalProperties": {},
            "description": "JSON Schema (not an example object) for the returned object. Image fields include relevant page image references.",
            "example": {
              "type": "object",
              "properties": {
                "mission_statement": {
                  "type": "string",
                  "description": "The company's stated mission."
                },
                "case_studies": {
                  "type": "array",
                  "items": {
                    "type": "object",
                    "properties": {
                      "title": {
                        "type": "string"
                      },
                      "url": {
                        "type": "string"
                      }
                    },
                    "required": [
                      "title",
                      "url"
                    ],
                    "additionalProperties": false
                  }
                }
              },
              "required": [
                "mission_statement",
                "case_studies"
              ],
              "additionalProperties": false
            }
          },
          "instructions": {
            "type": "string",
            "maxLength": 2000,
            "description": "Optional extraction guidance, such as which facts to prioritize or how to interpret fields in the schema."
          },
          "factCheck": {
            "type": "boolean",
            "default": false,
            "description": "Require facts stated on the page. Unsupported fields become null or empty."
          },
          "followSubdomains": {
            "type": "boolean",
            "default": false,
            "description": "When true, follow links on subdomains of the starting URL's domain."
          },
          "maxPages": {
            "type": "integer",
            "minimum": 1,
            "maximum": 50,
            "default": 5,
            "description": "Maximum number of pages to analyze for extraction. Hard cap: 50. Defaults to 5."
          },
          "maxDepth": {
            "type": "integer",
            "minimum": 0,
            "description": "Optional maximum link depth from the starting URL (0 = only the starting page). If omitted, there is no crawl depth limit."
          },
          "pdf": {
            "type": "object",
            "properties": {
              "shouldParse": {
                "type": "boolean",
                "default": true,
                "description": "When true, PDF pages are fetched and parsed. When false, PDF pages are skipped."
              },
              "start": {
                "type": "integer",
                "minimum": 1,
                "description": "First 1-based PDF page to parse."
              },
              "end": {
                "type": "integer",
                "minimum": 1,
                "description": "Last PDF page to parse (1-based, inclusive). Defaults to the final page. Must be >= start."
              }
            },
            "default": {
              "shouldParse": true
            },
            "additionalProperties": false,
            "description": "PDF handling. `start`/`end` limit parsing to an inclusive, 1-based page range."
          },
          "includeFrames": {
            "type": "boolean",
            "default": false,
            "description": "When true, iframe contents are included in Markdown before extraction."
          },
          "maxAgeMs": {
            "type": [
              "integer",
              "null"
            ],
            "minimum": 0,
            "maximum": 2592000000,
            "default": 604800000,
            "description": "Return cached scrape results if a prior scrape for the same parameters is younger than this many milliseconds. Defaults to 7 days (604800000 ms)."
          },
          "waitForMs": {
            "type": [
              "integer",
              "null"
            ],
            "minimum": 0,
            "maximum": 30000,
            "description": "Optional browser wait time in milliseconds after initial page load for each crawled page."
          },
          "settleAnimations": {
            "type": "boolean",
            "default": false,
            "description": "Wait briefly for CSS animations and transitions to settle before reading each page."
          },
          "actions": {
            "type": [
              "array",
              "null"
            ],
            "items": {
              "$ref": "#/components/schemas/WebScrapeAction"
            },
            "maxItems": 5,
            "description": "Browser steps before page discovery. Requires a paid plan; defaults the crawl budget to 110000 ms."
          },
          "stopAfterMs": {
            "type": "integer",
            "minimum": 10000,
            "default": 80000,
            "maximum": 110000,
            "description": "Soft time budget for the crawl in milliseconds. Min: 10000 (10s). Max: 110000 (110s). Defaults to 80000 (80s), or 110000 (110s) when browser actions are provided."
          },
          "timeoutOpts": {
            "$ref": "#/components/schemas/PartialTimeout"
          },
          "zdr": {
            "type": "string",
            "enum": [
              "enabled",
              "disabled"
            ],
            "default": "disabled",
            "description": "`enabled` turns on zero data retention. Returns 403 `ZDR_NOT_ENABLED` unless your organization has ZDR."
          },
          "policies": {
            "type": "array",
            "items": {
              "type": "string"
            },
            "description": "Access policy IDs to apply. A URL must pass every policy.",
            "example": [
              "pol_3f9c2a7e5b8d4c1f9a6e0b2d7c4f8a1e"
            ]
          },
          "tags": {
            "$ref": "#/components/schemas/RequestTags"
          }
        },
        "required": [
          "url",
          "schema"
        ],
        "additionalProperties": false
      },
      "contentType": "application/json",
      "binary": false
    },
    "annotations": {
      "readOnlyHint": true,
      "destructiveHint": false,
      "openWorldHint": true
    }
  },
  {
    "name": "web-search",
    "title": "Search the web",
    "method": "POST",
    "path": "/web/search",
    "description": "Search the web — Search the web and optionally return page content or relevant passages with each result.",
    "parameters": [],
    "requestBody": {
      "required": true,
      "schema": {
        "type": "object",
        "properties": {
          "query": {
            "type": "string",
            "minLength": 1,
            "maxLength": 500,
            "description": "Search query. Accepts natural language as well as Google-style search operators such as `site:`, `-site:`, `inurl:`, `intitle:`, quoted phrases, and `OR`."
          },
          "numResults": {
            "type": "integer",
            "minimum": 1,
            "maximum": 100,
            "default": 10,
            "description": "Number of results to request and return (1–100). Defaults to 10."
          },
          "includeDomains": {
            "type": "array",
            "items": {
              "type": "string",
              "minLength": 3
            },
            "maxItems": 100,
            "description": "Allowlist — only return results from these domains. Up to 100 domains. Example: [\"arxiv.org\", \"github.com\"]."
          },
          "excludeDomains": {
            "type": "array",
            "items": {
              "type": "string",
              "minLength": 3
            },
            "maxItems": 100,
            "description": "Blocklist — drop results from these domains. Up to 100 domains. Example: [\"pinterest.com\", \"reddit.com\"]."
          },
          "freshness": {
            "type": "string",
            "enum": [
              "last_24_hours",
              "last_week",
              "last_month",
              "last_year"
            ],
            "description": "Restrict results to content published within this window."
          },
          "country": {
            "type": "string",
            "enum": [
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
              "zw"
            ],
            "description": "Two-letter ISO 3166-1 alpha-2 country code to localize results to a specific country (maps to Google's `gl` parameter). Example: \"us\", \"gb\", \"de\"."
          },
          "languages": {
            "anyOf": [
              {
                "type": "string",
                "enum": [
                  "all"
                ]
              },
              {
                "type": "array",
                "items": {
                  "type": "string",
                  "enum": [
                    "am",
                    "ar",
                    "az",
                    "be",
                    "bg",
                    "bn",
                    "ca",
                    "ceb",
                    "cs",
                    "cy",
                    "da",
                    "de",
                    "el",
                    "en",
                    "es",
                    "et",
                    "eu",
                    "fa",
                    "fi",
                    "fr",
                    "gu",
                    "ha",
                    "haw",
                    "he",
                    "hi",
                    "hr",
                    "hu",
                    "hy",
                    "id",
                    "is",
                    "it",
                    "ja",
                    "ka",
                    "kk",
                    "kn",
                    "ko",
                    "ku",
                    "ky",
                    "lo",
                    "lt",
                    "lv",
                    "mk",
                    "ml",
                    "mn",
                    "mr",
                    "ms",
                    "ne",
                    "nl",
                    "no",
                    "or",
                    "pa",
                    "pl",
                    "ps",
                    "pt",
                    "ro",
                    "ru",
                    "sk",
                    "sl",
                    "so",
                    "sq",
                    "sr",
                    "sv",
                    "sw",
                    "ta",
                    "te",
                    "th",
                    "tl",
                    "tr",
                    "uk",
                    "ur",
                    "uz",
                    "vi",
                    "yo",
                    "zh"
                  ]
                },
                "minItems": 1
              }
            ],
            "default": "all",
            "description": "Languages to return results in, as BCP 47 language codes such as `en` or `de`, or \"all\" for any language. Defaults to \"all\". Example: [\"en\", \"de\"]."
          },
          "queryFanout": {
            "type": "boolean",
            "description": "Currently has no effect."
          },
          "markdownOptions": {
            "type": [
              "object",
              "null"
            ],
            "properties": {
              "enabled": {
                "type": "boolean",
                "default": false,
                "description": "Scrape each result to Markdown. Adds 1 credit per result with Markdown."
              },
              "includeLinks": {
                "type": "boolean",
                "default": true,
                "description": "Keep hyperlinks in the Markdown."
              },
              "includeImages": {
                "type": "boolean",
                "default": false,
                "description": "Emit image references in the Markdown."
              },
              "shortenBase64Images": {
                "type": "boolean",
                "default": true,
                "description": "Truncate inline base64 image payloads to keep responses small."
              },
              "useMainContentOnly": {
                "type": "boolean",
                "default": false,
                "description": "Strip nav, header, footer, and sidebar — keep only the primary article content."
              },
              "pdf": {
                "type": "object",
                "properties": {
                  "shouldParse": {
                    "type": "boolean",
                    "default": true,
                    "description": "Parse PDF URLs. When false, PDF results are skipped with WEBSITE_ACCESS_ERROR."
                  },
                  "start": {
                    "type": "integer",
                    "minimum": 1,
                    "description": "First 1-based PDF page to parse."
                  },
                  "end": {
                    "type": "integer",
                    "minimum": 1,
                    "description": "Last PDF page to parse (1-based, inclusive). Defaults to the final page. Must be >= start."
                  }
                },
                "default": {
                  "shouldParse": true
                },
                "additionalProperties": false,
                "description": "PDF handling. `start`/`end` limit parsing to an inclusive, 1-based page range."
              },
              "includeFrames": {
                "type": "boolean",
                "default": false,
                "description": "Render iframe contents into the Markdown."
              },
              "maxAgeMs": {
                "type": [
                  "integer",
                  "null"
                ],
                "minimum": 0,
                "maximum": 31536000000,
                "description": "Maximum cache age in milliseconds for result page content. Defaults to 180 days (15552000000 ms) when Markdown is requested, or 365 days (31536000000 ms) when only highlights are requested. Explicit values override either default. Maximum: 365 days. Set to 0 to force a fresh scrape."
              },
              "waitForMs": {
                "type": [
                  "integer",
                  "null"
                ],
                "minimum": 0,
                "maximum": 30000,
                "description": "Extra wait after page load before rendering, in ms (0–30000). Useful for JS-heavy pages."
              },
              "timeoutOpts": {
                "$ref": "#/components/schemas/ScrapeTimeout"
              }
            },
            "additionalProperties": false,
            "description": "Inline Markdown scraping for each result. Set `enabled: true` to activate."
          },
          "highlightsOptions": {
            "type": [
              "object",
              "null"
            ],
            "properties": {
              "enabled": {
                "type": "boolean",
                "default": false,
                "description": "Return relevant passages for each result. Adds 1 credit per 10 results."
              },
              "maxCharacters": {
                "type": "integer",
                "minimum": 100,
                "maximum": 20000,
                "default": 4000,
                "description": "Maximum combined length of passages per result."
              }
            },
            "additionalProperties": false,
            "description": "Passages from each result page that are relevant to the query. Pages are read with the `markdownOptions` settings."
          },
          "descriptionMaxCharacters": {
            "type": [
              "integer",
              "null"
            ],
            "minimum": 0,
            "default": null,
            "description": "Maximum length of each result's `description`, in characters."
          },
          "timeoutOpts": {
            "$ref": "#/components/schemas/PartialTimeout"
          },
          "zdr": {
            "type": "string",
            "enum": [
              "enabled",
              "disabled"
            ],
            "default": "disabled",
            "description": "`enabled` turns on zero data retention. Returns 403 `ZDR_NOT_ENABLED` unless your organization has ZDR."
          },
          "policies": {
            "type": "array",
            "items": {
              "type": "string"
            },
            "description": "Access policy IDs to apply. A URL must pass every policy.",
            "example": [
              "pol_3f9c2a7e5b8d4c1f9a6e0b2d7c4f8a1e"
            ]
          },
          "tags": {
            "$ref": "#/components/schemas/RequestTags"
          }
        },
        "required": [
          "query"
        ],
        "additionalProperties": false
      },
      "contentType": "application/json",
      "binary": false
    },
    "annotations": {
      "readOnlyHint": true,
      "destructiveHint": false,
      "openWorldHint": true
    }
  },
  {
    "name": "web-competitors",
    "title": "Find website competitors",
    "method": "GET",
    "path": "/web/competitors",
    "description": "Find website competitors — Analyze a company's landing page and web search evidence to return direct competitors for the same product or market.",
    "parameters": [
      {
        "name": "domain",
        "in": "query",
        "required": true,
        "description": "Company domain to analyze, such as `stripe.com`. Full http(s) URLs are accepted and normalized to their domain.",
        "schema": {
          "type": "string",
          "minLength": 3,
          "description": "Company domain to analyze, such as `stripe.com`. Full http(s) URLs are accepted and normalized to their domain."
        }
      },
      {
        "name": "numCompetitors",
        "in": "query",
        "required": false,
        "description": "Exact number of direct competitors to return. Defaults to 5.",
        "schema": {
          "type": "integer",
          "minimum": 1,
          "maximum": 10,
          "default": 5,
          "description": "Exact number of direct competitors to return. Defaults to 5."
        }
      },
      {
        "name": "timeoutOpts",
        "in": "query",
        "required": false,
        "description": "Request deadline and what to return when it passes.",
        "schema": {
          "$ref": "#/components/schemas/PartialTimeout"
        }
      },
      {
        "name": "zdr",
        "in": "query",
        "required": false,
        "description": "`enabled` turns on zero data retention. Returns 403 `ZDR_NOT_ENABLED` unless your organization has ZDR.",
        "schema": {
          "type": "string",
          "enum": [
            "enabled",
            "disabled"
          ],
          "default": "disabled",
          "description": "`enabled` turns on zero data retention. Returns 403 `ZDR_NOT_ENABLED` unless your organization has ZDR."
        }
      },
      {
        "name": "tags",
        "in": "query",
        "required": false,
        "description": "Comma-separated labels for filtering usage, e.g. `production,team-alpha`.",
        "schema": {
          "$ref": "#/components/schemas/RequestTags"
        }
      }
    ],
    "annotations": {
      "readOnlyHint": true,
      "destructiveHint": false,
      "openWorldHint": true
    }
  },
  {
    "name": "people-enrich",
    "title": "Enrich a person",
    "method": "POST",
    "path": "/people/enrich",
    "description": "Enrich a person — Find a person from identity clues and return their profile with a match score. Available on all plans; free or disposable email addresses return 422.",
    "parameters": [],
    "requestBody": {
      "required": true,
      "schema": {
        "$ref": "#/components/schemas/PersonEnrichmentRequest"
      },
      "contentType": "application/json",
      "binary": false
    },
    "annotations": {
      "readOnlyHint": true,
      "destructiveHint": false,
      "openWorldHint": true
    }
  },
  {
    "name": "people-retrieve",
    "title": "Retrieve Person",
    "method": "POST",
    "path": "/people/retrieve",
    "description": "Retrieve Person — Retrieve and normalize a person profile from identifiers. Education and experience entries include LinkedIn-derived organization data (website, logo, employee counts, followers, headquarters, and Context.dev industry classification) when available.",
    "parameters": [],
    "requestBody": {
      "required": true,
      "schema": {
        "$ref": "#/components/schemas/PersonRetrieveRequest"
      },
      "contentType": "application/json",
      "binary": false
    },
    "annotations": {
      "readOnlyHint": true,
      "destructiveHint": false,
      "openWorldHint": true
    }
  },
  {
    "name": "brand-retrieve",
    "title": "Retrieve brand data by domain",
    "method": "GET",
    "path": "/brand/retrieve",
    "description": "Retrieve brand data by domain — Retrieve logos, backdrops, colors, industry, description, and more from any domain",
    "parameters": [
      {
        "name": "domain",
        "in": "query",
        "required": false,
        "description": "Domain name to retrieve brand data for (e.g., 'example.com', 'google.com'). Cannot be used with name or ticker parameters.",
        "schema": {
          "type": "string",
          "minLength": 3,
          "description": "Domain name to retrieve brand data for (e.g., 'example.com', 'google.com'). Cannot be used with name or ticker parameters."
        }
      },
      {
        "name": "name",
        "in": "query",
        "required": false,
        "description": "Company name to retrieve brand data for (e.g., 'Apple Inc'). Cannot be used with domain or ticker parameters.",
        "schema": {
          "type": "string",
          "minLength": 3,
          "maxLength": 30,
          "description": "Company name to retrieve brand data for (e.g., 'Apple Inc'). Cannot be used with domain or ticker parameters."
        }
      },
      {
        "name": "ticker",
        "in": "query",
        "required": false,
        "description": "Stock ticker symbol to retrieve brand data for (e.g., 'AAPL'). Cannot be used with domain or name parameters.",
        "schema": {
          "type": "string",
          "minLength": 1,
          "maxLength": 15,
          "pattern": "^[A-Za-z0-9.]+$",
          "description": "Stock ticker symbol to retrieve brand data for (e.g., 'AAPL'). Cannot be used with domain or name parameters."
        }
      },
      {
        "name": "ticker_exchange",
        "in": "query",
        "required": false,
        "description": "Stock exchange code.",
        "schema": {
          "$ref": "#/components/schemas/StockExchange"
        }
      },
      {
        "name": "force_language",
        "in": "query",
        "required": false,
        "description": "Language, e.g. `english`.",
        "schema": {
          "allOf": [
            {
              "$ref": "#/components/schemas/SupportedLanguage"
            },
            {
              "type": [
                "string",
                "null"
              ]
            }
          ]
        }
      },
      {
        "name": "maxSpeed",
        "in": "query",
        "required": false,
        "description": "Skip slower enrichment steps for a faster, less detailed response.",
        "schema": {
          "type": "boolean",
          "default": false,
          "description": "Skip slower enrichment steps for a faster, less detailed response."
        }
      },
      {
        "name": "maxAgeMs",
        "in": "query",
        "required": false,
        "description": "Maximum age of cached brand data in ms. Defaults to 3 months; clamped to 0–1 year. `0` refreshes.",
        "schema": {
          "type": [
            "integer",
            "null"
          ],
          "default": 7776000000,
          "description": "Maximum age of cached brand data in ms. Defaults to 3 months; clamped to 0–1 year. `0` refreshes."
        }
      },
      {
        "name": "timeoutOpts",
        "in": "query",
        "required": false,
        "description": "Request deadline and what to return when it passes.",
        "schema": {
          "$ref": "#/components/schemas/PartialTimeout"
        }
      },
      {
        "name": "zdr",
        "in": "query",
        "required": false,
        "description": "`enabled` disables request logs and traces and omits request and response content from usage logs. Brand data and hosted assets may still be stored. Returns 403 `ZDR_NOT_ENABLED` unless your organization has ZDR.",
        "schema": {
          "type": "string",
          "enum": [
            "enabled",
            "disabled"
          ],
          "description": "`enabled` disables request logs and traces and omits request and response content from usage logs. Brand data and hosted assets may still be stored. Returns 403 `ZDR_NOT_ENABLED` unless your organization has ZDR."
        }
      },
      {
        "name": "tags",
        "in": "query",
        "required": false,
        "description": "Comma-separated labels for filtering usage, e.g. `production,team-alpha`.",
        "schema": {
          "$ref": "#/components/schemas/RequestTags"
        }
      }
    ],
    "annotations": {
      "readOnlyHint": true,
      "destructiveHint": false,
      "openWorldHint": true
    }
  },
  {
    "name": "brand-retrieve-unified",
    "title": "Retrieve a brand",
    "method": "POST",
    "path": "/brand/retrieve",
    "description": "Retrieve a brand — Retrieve logos, colors, company details, and social links using one lookup identifier. A direct URL limits extraction to that page.",
    "parameters": [],
    "requestBody": {
      "required": true,
      "schema": {
        "$ref": "#/components/schemas/BrandRetrieveRequest"
      },
      "contentType": "application/json",
      "binary": false
    },
    "annotations": {
      "readOnlyHint": true,
      "destructiveHint": false,
      "openWorldHint": true
    }
  },
  {
    "name": "brand-retrieve-by-name",
    "title": "Retrieve brand data by company name",
    "method": "GET",
    "path": "/brand/retrieve-by-name",
    "description": "Retrieve brand data by company name — Retrieve brand information using a company name.",
    "parameters": [
      {
        "name": "name",
        "in": "query",
        "required": true,
        "description": "Company name to retrieve brand data for (e.g., 'Apple Inc', 'Microsoft Corporation'). Must be 3-30 characters.",
        "schema": {
          "type": "string",
          "minLength": 3,
          "maxLength": 30,
          "description": "Company name to retrieve brand data for (e.g., 'Apple Inc', 'Microsoft Corporation'). Must be 3-30 characters."
        }
      },
      {
        "name": "force_language",
        "in": "query",
        "required": false,
        "description": "Language, e.g. `english`.",
        "schema": {
          "allOf": [
            {
              "$ref": "#/components/schemas/SupportedLanguage"
            },
            {
              "type": [
                "string",
                "null"
              ]
            }
          ]
        }
      },
      {
        "name": "maxSpeed",
        "in": "query",
        "required": false,
        "description": "Optional parameter to optimize the API call for maximum speed. When set to true, the API will skip time-consuming operations for faster response at the cost of less comprehensive data.",
        "schema": {
          "type": "boolean",
          "default": false,
          "description": "Optional parameter to optimize the API call for maximum speed. When set to true, the API will skip time-consuming operations for faster response at the cost of less comprehensive data."
        }
      },
      {
        "name": "country_gl",
        "in": "query",
        "required": false,
        "description": "Two-letter ISO 3166-1 alpha-2 country code (GL parameter) used to localize search.",
        "schema": {
          "$ref": "#/components/schemas/CountryGL"
        }
      },
      {
        "name": "maxAgeMs",
        "in": "query",
        "required": false,
        "description": "Maximum age of cached brand data in ms. Defaults to 3 months; clamped to 0–1 year. `0` refreshes.",
        "schema": {
          "type": [
            "integer",
            "null"
          ],
          "default": 7776000000,
          "description": "Maximum age of cached brand data in ms. Defaults to 3 months; clamped to 0–1 year. `0` refreshes."
        }
      },
      {
        "name": "timeoutOpts",
        "in": "query",
        "required": false,
        "description": "Request deadline and what to return when it passes.",
        "schema": {
          "$ref": "#/components/schemas/PartialTimeout"
        }
      },
      {
        "name": "zdr",
        "in": "query",
        "required": false,
        "description": "`enabled` disables request logs and traces and omits request and response content from usage logs. Brand data and hosted assets may still be stored. Returns 403 `ZDR_NOT_ENABLED` unless your organization has ZDR.",
        "schema": {
          "type": "string",
          "enum": [
            "enabled",
            "disabled"
          ],
          "description": "`enabled` disables request logs and traces and omits request and response content from usage logs. Brand data and hosted assets may still be stored. Returns 403 `ZDR_NOT_ENABLED` unless your organization has ZDR."
        }
      },
      {
        "name": "tags",
        "in": "query",
        "required": false,
        "description": "Comma-separated labels for filtering usage, e.g. `production,team-alpha`.",
        "schema": {
          "$ref": "#/components/schemas/RequestTags"
        }
      }
    ],
    "annotations": {
      "readOnlyHint": true,
      "destructiveHint": false,
      "openWorldHint": true
    }
  },
  {
    "name": "brand-search",
    "title": "Auto-complete Brand",
    "method": "GET",
    "path": "/brand/search",
    "description": "Auto-complete Brand — Find up to 10 brands by name or domain, ordered by popularity. Optionally filter by country and primary language; both filters must match when provided together. Results include description, country, and language when available. Use the returned domain to retrieve a full brand profile.",
    "parameters": [
      {
        "name": "query",
        "in": "query",
        "required": true,
        "description": "Search term, matched against the fields selected by queryBy (e.g. 'nike', 'nike.com', 'nik').",
        "schema": {
          "type": "string",
          "minLength": 1,
          "maxLength": 100,
          "description": "Search term, matched against the fields selected by queryBy (e.g. 'nike', 'nike.com', 'nik')."
        }
      },
      {
        "name": "country",
        "in": "query",
        "required": false,
        "description": "Only return brands in this country, as an uppercase ISO 3166-1 alpha-2 code such as US or GB.",
        "schema": {
          "type": "string",
          "enum": [
            "AD",
            "AE",
            "AF",
            "AG",
            "AI",
            "AL",
            "AM",
            "AO",
            "AQ",
            "AR",
            "AS",
            "AT",
            "AU",
            "AW",
            "AX",
            "AZ",
            "BA",
            "BB",
            "BD",
            "BE",
            "BF",
            "BG",
            "BH",
            "BI",
            "BJ",
            "BL",
            "BM",
            "BN",
            "BO",
            "BQ",
            "BR",
            "BS",
            "BT",
            "BV",
            "BW",
            "BY",
            "BZ",
            "CA",
            "CC",
            "CD",
            "CF",
            "CG",
            "CH",
            "CI",
            "CK",
            "CL",
            "CM",
            "CN",
            "CO",
            "CR",
            "CU",
            "CV",
            "CW",
            "CX",
            "CY",
            "CZ",
            "DE",
            "DJ",
            "DK",
            "DM",
            "DO",
            "DZ",
            "EC",
            "EE",
            "EG",
            "EH",
            "ER",
            "ES",
            "ET",
            "FI",
            "FJ",
            "FK",
            "FM",
            "FO",
            "FR",
            "GA",
            "GB",
            "GD",
            "GE",
            "GF",
            "GG",
            "GH",
            "GI",
            "GL",
            "GM",
            "GN",
            "GP",
            "GQ",
            "GR",
            "GS",
            "GT",
            "GU",
            "GW",
            "GY",
            "HK",
            "HM",
            "HN",
            "HR",
            "HT",
            "HU",
            "ID",
            "IE",
            "IL",
            "IM",
            "IN",
            "IO",
            "IQ",
            "IR",
            "IS",
            "IT",
            "JE",
            "JM",
            "JO",
            "JP",
            "KE",
            "KG",
            "KH",
            "KI",
            "KM",
            "KN",
            "KP",
            "KR",
            "KW",
            "KY",
            "KZ",
            "LA",
            "LB",
            "LC",
            "LI",
            "LK",
            "LR",
            "LS",
            "LT",
            "LU",
            "LV",
            "LY",
            "MA",
            "MC",
            "MD",
            "ME",
            "MF",
            "MG",
            "MH",
            "MK",
            "ML",
            "MM",
            "MN",
            "MO",
            "MP",
            "MQ",
            "MR",
            "MS",
            "MT",
            "MU",
            "MV",
            "MW",
            "MX",
            "MY",
            "MZ",
            "NA",
            "NC",
            "NE",
            "NF",
            "NG",
            "NI",
            "NL",
            "NO",
            "NP",
            "NR",
            "NU",
            "NZ",
            "OM",
            "PA",
            "PE",
            "PF",
            "PG",
            "PH",
            "PK",
            "PL",
            "PM",
            "PN",
            "PR",
            "PS",
            "PT",
            "PW",
            "PY",
            "QA",
            "RE",
            "RO",
            "RS",
            "RU",
            "RW",
            "SA",
            "SB",
            "SC",
            "SD",
            "SE",
            "SG",
            "SH",
            "SI",
            "SJ",
            "SK",
            "SL",
            "SM",
            "SN",
            "SO",
            "SR",
            "SS",
            "ST",
            "SV",
            "SX",
            "SY",
            "SZ",
            "TC",
            "TD",
            "TF",
            "TG",
            "TH",
            "TJ",
            "TK",
            "TL",
            "TM",
            "TN",
            "TO",
            "TR",
            "TT",
            "TV",
            "TW",
            "TZ",
            "UA",
            "UG",
            "UM",
            "US",
            "UY",
            "UZ",
            "VA",
            "VC",
            "VE",
            "VG",
            "VI",
            "VN",
            "VU",
            "WF",
            "WS",
            "YE",
            "YT",
            "ZA",
            "ZM",
            "ZW"
          ],
          "description": "Only return brands in this country, as an uppercase ISO 3166-1 alpha-2 code such as US or GB.",
          "example": "US"
        }
      },
      {
        "name": "language",
        "in": "query",
        "required": false,
        "description": "Only return brands with this primary language, such as english or french.",
        "schema": {
          "type": "string",
          "enum": [
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
            "zulu"
          ],
          "description": "Only return brands with this primary language, such as english or french."
        }
      },
      {
        "name": "autocomplete",
        "in": "query",
        "required": false,
        "description": "Whether the search term matches by prefix, so partial words match as they are typed (e.g. 'nik' matches Nike). Set to false to match whole words only.",
        "schema": {
          "type": "boolean",
          "default": true,
          "description": "Whether the search term matches by prefix, so partial words match as they are typed (e.g. 'nik' matches Nike). Set to false to match whole words only."
        }
      },
      {
        "name": "queryBy",
        "in": "query",
        "required": false,
        "description": "Fields to match the search term against, as a comma-separated list or repeated parameter: 'name', 'domain', or both. Defaults to both.",
        "schema": {
          "type": "array",
          "items": {
            "type": "string",
            "enum": [
              "name",
              "domain"
            ]
          },
          "minItems": 1,
          "default": [
            "name",
            "domain"
          ],
          "description": "Fields to match the search term against, as a comma-separated list or repeated parameter: 'name', 'domain', or both. Defaults to both."
        }
      },
      {
        "name": "typoTolerance",
        "in": "query",
        "required": false,
        "description": "Maximum number of typos tolerated when matching, from 0 to 2. Defaults to 0 (no typo tolerance).",
        "schema": {
          "type": "integer",
          "minimum": 0,
          "maximum": 2,
          "default": 0,
          "description": "Maximum number of typos tolerated when matching, from 0 to 2. Defaults to 0 (no typo tolerance)."
        }
      },
      {
        "name": "tags",
        "in": "query",
        "required": false,
        "description": "Comma-separated labels for filtering usage, e.g. `production,team-alpha`.",
        "schema": {
          "$ref": "#/components/schemas/RequestTags"
        }
      }
    ],
    "annotations": {
      "readOnlyHint": true,
      "destructiveHint": false,
      "openWorldHint": true
    }
  },
  {
    "name": "brand-retrieve-by-email",
    "title": "Retrieve brand data by email address",
    "method": "GET",
    "path": "/brand/retrieve-by-email",
    "description": "Retrieve brand data by email address — Retrieve brand information using an email address while detecting disposable and free email addresses. Disposable and free email addresses (like gmail.com, yahoo.com) will throw a 422 error.",
    "parameters": [
      {
        "name": "email",
        "in": "query",
        "required": true,
        "description": "Work email address. Free and disposable email providers are rejected.",
        "schema": {
          "type": "string",
          "minLength": 1,
          "format": "email",
          "description": "Work email address. Free and disposable email providers are rejected."
        }
      },
      {
        "name": "force_language",
        "in": "query",
        "required": false,
        "description": "Language, e.g. `english`.",
        "schema": {
          "allOf": [
            {
              "$ref": "#/components/schemas/SupportedLanguage"
            },
            {
              "type": [
                "string",
                "null"
              ]
            }
          ]
        }
      },
      {
        "name": "maxSpeed",
        "in": "query",
        "required": false,
        "description": "Optional parameter to optimize the API call for maximum speed. When set to true, the API will skip time-consuming operations for faster response at the cost of less comprehensive data.",
        "schema": {
          "type": "boolean",
          "default": false,
          "description": "Optional parameter to optimize the API call for maximum speed. When set to true, the API will skip time-consuming operations for faster response at the cost of less comprehensive data."
        }
      },
      {
        "name": "maxAgeMs",
        "in": "query",
        "required": false,
        "description": "Maximum age of cached brand data in ms. Defaults to 3 months; clamped to 0–1 year. `0` refreshes.",
        "schema": {
          "type": [
            "integer",
            "null"
          ],
          "default": 7776000000,
          "description": "Maximum age of cached brand data in ms. Defaults to 3 months; clamped to 0–1 year. `0` refreshes."
        }
      },
      {
        "name": "timeoutOpts",
        "in": "query",
        "required": false,
        "description": "Request deadline and what to return when it passes.",
        "schema": {
          "$ref": "#/components/schemas/PartialTimeout"
        }
      },
      {
        "name": "zdr",
        "in": "query",
        "required": false,
        "description": "`enabled` disables request logs and traces and omits request and response content from usage logs. Brand data and hosted assets may still be stored. Returns 403 `ZDR_NOT_ENABLED` unless your organization has ZDR.",
        "schema": {
          "type": "string",
          "enum": [
            "enabled",
            "disabled"
          ],
          "description": "`enabled` disables request logs and traces and omits request and response content from usage logs. Brand data and hosted assets may still be stored. Returns 403 `ZDR_NOT_ENABLED` unless your organization has ZDR."
        }
      },
      {
        "name": "tags",
        "in": "query",
        "required": false,
        "description": "Comma-separated labels for filtering usage, e.g. `production,team-alpha`.",
        "schema": {
          "$ref": "#/components/schemas/RequestTags"
        }
      }
    ],
    "annotations": {
      "readOnlyHint": true,
      "destructiveHint": false,
      "openWorldHint": true
    }
  },
  {
    "name": "brand-retrieve-by-ticker",
    "title": "Retrieve brand data by stock ticker",
    "method": "GET",
    "path": "/brand/retrieve-by-ticker",
    "description": "Retrieve brand data by stock ticker — Retrieve brand information using a stock ticker symbol.",
    "parameters": [
      {
        "name": "ticker",
        "in": "query",
        "required": true,
        "description": "Stock ticker symbol to retrieve brand data for (e.g., 'AAPL', 'GOOGL', 'BRK.A'). Must be 1-15 characters, letters/numbers/dots only.",
        "schema": {
          "type": "string",
          "minLength": 1,
          "maxLength": 15,
          "pattern": "^[A-Za-z0-9.]+$",
          "description": "Stock ticker symbol to retrieve brand data for (e.g., 'AAPL', 'GOOGL', 'BRK.A'). Must be 1-15 characters, letters/numbers/dots only."
        }
      },
      {
        "name": "ticker_exchange",
        "in": "query",
        "required": false,
        "description": "Stock exchange code.",
        "schema": {
          "$ref": "#/components/schemas/StockExchange"
        }
      },
      {
        "name": "force_language",
        "in": "query",
        "required": false,
        "description": "Language, e.g. `english`.",
        "schema": {
          "allOf": [
            {
              "$ref": "#/components/schemas/SupportedLanguage"
            },
            {
              "type": [
                "string",
                "null"
              ]
            }
          ]
        }
      },
      {
        "name": "maxSpeed",
        "in": "query",
        "required": false,
        "description": "Optional parameter to optimize the API call for maximum speed. When set to true, the API will skip time-consuming operations for faster response at the cost of less comprehensive data.",
        "schema": {
          "type": "boolean",
          "default": false,
          "description": "Optional parameter to optimize the API call for maximum speed. When set to true, the API will skip time-consuming operations for faster response at the cost of less comprehensive data."
        }
      },
      {
        "name": "maxAgeMs",
        "in": "query",
        "required": false,
        "description": "Maximum age of cached brand data in ms. Defaults to 3 months; clamped to 0–1 year. `0` refreshes.",
        "schema": {
          "type": [
            "integer",
            "null"
          ],
          "default": 7776000000,
          "description": "Maximum age of cached brand data in ms. Defaults to 3 months; clamped to 0–1 year. `0` refreshes."
        }
      },
      {
        "name": "timeoutOpts",
        "in": "query",
        "required": false,
        "description": "Request deadline and what to return when it passes.",
        "schema": {
          "$ref": "#/components/schemas/PartialTimeout"
        }
      },
      {
        "name": "zdr",
        "in": "query",
        "required": false,
        "description": "`enabled` disables request logs and traces and omits request and response content from usage logs. Brand data and hosted assets may still be stored. Returns 403 `ZDR_NOT_ENABLED` unless your organization has ZDR.",
        "schema": {
          "type": "string",
          "enum": [
            "enabled",
            "disabled"
          ],
          "description": "`enabled` disables request logs and traces and omits request and response content from usage logs. Brand data and hosted assets may still be stored. Returns 403 `ZDR_NOT_ENABLED` unless your organization has ZDR."
        }
      },
      {
        "name": "tags",
        "in": "query",
        "required": false,
        "description": "Comma-separated labels for filtering usage, e.g. `production,team-alpha`.",
        "schema": {
          "$ref": "#/components/schemas/RequestTags"
        }
      }
    ],
    "annotations": {
      "readOnlyHint": true,
      "destructiveHint": false,
      "openWorldHint": true
    }
  },
  {
    "name": "brand-retrieve-by-isin",
    "title": "Retrieve brand data by ISIN",
    "method": "GET",
    "path": "/brand/retrieve-by-isin",
    "description": "Retrieve brand data by ISIN — Retrieve brand information using an ISIN (International Securities Identification Number).",
    "parameters": [
      {
        "name": "isin",
        "in": "query",
        "required": true,
        "description": "Company ISIN: 12 characters, such as `US0378331005`.",
        "schema": {
          "type": "string",
          "minLength": 12,
          "maxLength": 12,
          "pattern": "^[A-Z]{2}[A-Z0-9]{9}[0-9]$",
          "description": "Company ISIN: 12 characters, such as `US0378331005`."
        }
      },
      {
        "name": "force_language",
        "in": "query",
        "required": false,
        "description": "Language, e.g. `english`.",
        "schema": {
          "allOf": [
            {
              "$ref": "#/components/schemas/SupportedLanguage"
            },
            {
              "type": [
                "string",
                "null"
              ]
            }
          ]
        }
      },
      {
        "name": "maxSpeed",
        "in": "query",
        "required": false,
        "description": "Optional parameter to optimize the API call for maximum speed. When set to true, the API will skip time-consuming operations for faster response at the cost of less comprehensive data.",
        "schema": {
          "type": "boolean",
          "default": false,
          "description": "Optional parameter to optimize the API call for maximum speed. When set to true, the API will skip time-consuming operations for faster response at the cost of less comprehensive data."
        }
      },
      {
        "name": "maxAgeMs",
        "in": "query",
        "required": false,
        "description": "Maximum age of cached brand data in ms. Defaults to 3 months; clamped to 0–1 year. `0` refreshes.",
        "schema": {
          "type": [
            "integer",
            "null"
          ],
          "default": 7776000000,
          "description": "Maximum age of cached brand data in ms. Defaults to 3 months; clamped to 0–1 year. `0` refreshes."
        }
      },
      {
        "name": "timeoutOpts",
        "in": "query",
        "required": false,
        "description": "Request deadline and what to return when it passes.",
        "schema": {
          "$ref": "#/components/schemas/PartialTimeout"
        }
      },
      {
        "name": "zdr",
        "in": "query",
        "required": false,
        "description": "`enabled` disables request logs and traces and omits request and response content from usage logs. Brand data and hosted assets may still be stored. Returns 403 `ZDR_NOT_ENABLED` unless your organization has ZDR.",
        "schema": {
          "type": "string",
          "enum": [
            "enabled",
            "disabled"
          ],
          "description": "`enabled` disables request logs and traces and omits request and response content from usage logs. Brand data and hosted assets may still be stored. Returns 403 `ZDR_NOT_ENABLED` unless your organization has ZDR."
        }
      },
      {
        "name": "tags",
        "in": "query",
        "required": false,
        "description": "Comma-separated labels for filtering usage, e.g. `production,team-alpha`.",
        "schema": {
          "$ref": "#/components/schemas/RequestTags"
        }
      }
    ],
    "annotations": {
      "readOnlyHint": true,
      "destructiveHint": false,
      "openWorldHint": true
    }
  },
  {
    "name": "brand-retrieve-simplified",
    "title": "Retrieve simplified brand data by domain",
    "method": "GET",
    "path": "/brand/retrieve-simplified",
    "description": "Retrieve simplified brand data by domain — Returns a simplified version of brand data containing only essential information: domain, title, colors, logos, and backdrops. Optimized for faster responses and reduced data transfer.",
    "parameters": [
      {
        "name": "domain",
        "in": "query",
        "required": true,
        "description": "Domain name to retrieve simplified brand data for",
        "schema": {
          "type": "string",
          "minLength": 3,
          "description": "Domain name to retrieve simplified brand data for"
        }
      },
      {
        "name": "maxAgeMs",
        "in": "query",
        "required": false,
        "description": "Maximum age of cached brand data in ms. Defaults to 3 months; clamped to 0–1 year. `0` refreshes.",
        "schema": {
          "type": [
            "integer",
            "null"
          ],
          "default": 7776000000,
          "description": "Maximum age of cached brand data in ms. Defaults to 3 months; clamped to 0–1 year. `0` refreshes."
        }
      },
      {
        "name": "timeoutOpts",
        "in": "query",
        "required": false,
        "description": "Request deadline and what to return when it passes.",
        "schema": {
          "$ref": "#/components/schemas/PartialTimeout"
        }
      },
      {
        "name": "theme",
        "in": "query",
        "required": false,
        "description": "Optional theme preference used when selecting brand assets.",
        "schema": {
          "type": "string",
          "enum": [
            "light",
            "dark"
          ],
          "description": "Optional theme preference used when selecting brand assets."
        }
      },
      {
        "name": "zdr",
        "in": "query",
        "required": false,
        "description": "`enabled` disables request logs and traces and omits request and response content from usage logs. Brand data and hosted assets may still be stored. Returns 403 `ZDR_NOT_ENABLED` unless your organization has ZDR.",
        "schema": {
          "type": "string",
          "enum": [
            "enabled",
            "disabled"
          ],
          "description": "`enabled` disables request logs and traces and omits request and response content from usage logs. Brand data and hosted assets may still be stored. Returns 403 `ZDR_NOT_ENABLED` unless your organization has ZDR."
        }
      },
      {
        "name": "tags",
        "in": "query",
        "required": false,
        "description": "Comma-separated labels for filtering usage, e.g. `production,team-alpha`.",
        "schema": {
          "$ref": "#/components/schemas/RequestTags"
        }
      }
    ],
    "annotations": {
      "readOnlyHint": true,
      "destructiveHint": false,
      "openWorldHint": true
    }
  },
  {
    "name": "web-styleguide",
    "title": "Extract a styleguide",
    "method": "GET",
    "path": "/web/styleguide",
    "description": "Extract a styleguide — Extract colors, typography, spacing, and component styles from a website.",
    "parameters": [
      {
        "name": "domain",
        "in": "query",
        "required": false,
        "description": "Domain name to extract styleguide from (e.g., 'example.com', 'google.com'). The domain will be automatically normalized and validated. You must provide either 'domain' or 'directUrl', but not both.",
        "schema": {
          "type": "string",
          "minLength": 3,
          "description": "Domain name to extract styleguide from (e.g., 'example.com', 'google.com'). The domain will be automatically normalized and validated. You must provide either 'domain' or 'directUrl', but not both."
        }
      },
      {
        "name": "directUrl",
        "in": "query",
        "required": false,
        "description": "Exact URL to inspect. Provide either `domain` or `directUrl`, not both.",
        "schema": {
          "type": "string",
          "format": "uri",
          "description": "Exact URL to inspect. Provide either `domain` or `directUrl`, not both."
        }
      },
      {
        "name": "maxAgeMs",
        "in": "query",
        "required": false,
        "description": "Maximum age of cached brand data in ms. Defaults to 3 months; clamped to 0–1 year. `0` refreshes.",
        "schema": {
          "type": [
            "integer",
            "null"
          ],
          "default": 7776000000,
          "description": "Maximum age of cached brand data in ms. Defaults to 3 months; clamped to 0–1 year. `0` refreshes."
        }
      },
      {
        "name": "timeoutOpts",
        "in": "query",
        "required": false,
        "description": "Request deadline and what to return when it passes.",
        "schema": {
          "$ref": "#/components/schemas/ScrapeTimeout"
        }
      },
      {
        "name": "colorScheme",
        "in": "query",
        "required": false,
        "description": "Optional browser color scheme to emulate for websites that respond to prefers-color-scheme. This value is part of the styleguide cache key.",
        "schema": {
          "type": "string",
          "enum": [
            "light",
            "dark"
          ],
          "description": "Optional browser color scheme to emulate for websites that respond to prefers-color-scheme. This value is part of the styleguide cache key."
        }
      },
      {
        "name": "zdr",
        "in": "query",
        "required": false,
        "description": "`enabled` disables request logs and traces and omits request and response content from usage logs. Brand data and hosted assets may still be stored. Returns 403 `ZDR_NOT_ENABLED` unless your organization has ZDR.",
        "schema": {
          "type": "string",
          "enum": [
            "enabled",
            "disabled"
          ],
          "description": "`enabled` disables request logs and traces and omits request and response content from usage logs. Brand data and hosted assets may still be stored. Returns 403 `ZDR_NOT_ENABLED` unless your organization has ZDR."
        }
      },
      {
        "name": "policies",
        "in": "query",
        "required": false,
        "description": "Comma-separated access policy IDs to apply. A URL must pass every policy.",
        "schema": {
          "type": "array",
          "items": {
            "type": "string"
          }
        }
      },
      {
        "name": "tags",
        "in": "query",
        "required": false,
        "description": "Comma-separated labels for filtering usage, e.g. `production,team-alpha`.",
        "schema": {
          "$ref": "#/components/schemas/RequestTags"
        }
      }
    ],
    "annotations": {
      "readOnlyHint": true,
      "destructiveHint": false,
      "openWorldHint": true
    }
  },
  {
    "name": "web-fonts",
    "title": "Extract fonts",
    "method": "GET",
    "path": "/web/fonts",
    "description": "Extract fonts — Identify fonts and available font files used by a website.",
    "parameters": [
      {
        "name": "directUrl",
        "in": "query",
        "required": false,
        "description": "Exact page to inspect. Provide either `domain` or `directUrl`.",
        "schema": {
          "type": "string",
          "format": "uri",
          "description": "Exact page to inspect. Provide either `domain` or `directUrl`."
        }
      },
      {
        "name": "domain",
        "in": "query",
        "required": false,
        "description": "Domain name to extract fonts from (e.g., 'example.com', 'google.com'). The domain will be automatically normalized and validated. You must provide either 'domain' or 'directUrl', but not both.",
        "schema": {
          "type": "string",
          "minLength": 3,
          "description": "Domain name to extract fonts from (e.g., 'example.com', 'google.com'). The domain will be automatically normalized and validated. You must provide either 'domain' or 'directUrl', but not both."
        }
      },
      {
        "name": "maxAgeMs",
        "in": "query",
        "required": false,
        "description": "Maximum age of cached brand data in ms. Defaults to 3 months; clamped to 0–1 year. `0` refreshes.",
        "schema": {
          "type": [
            "integer",
            "null"
          ],
          "default": 7776000000,
          "description": "Maximum age of cached brand data in ms. Defaults to 3 months; clamped to 0–1 year. `0` refreshes."
        }
      },
      {
        "name": "timeoutOpts",
        "in": "query",
        "required": false,
        "description": "Request deadline and what to return when it passes.",
        "schema": {
          "$ref": "#/components/schemas/ScrapeTimeout"
        }
      },
      {
        "name": "policies",
        "in": "query",
        "required": false,
        "description": "Comma-separated access policy IDs to apply. A URL must pass every policy.",
        "schema": {
          "type": "array",
          "items": {
            "type": "string"
          }
        }
      },
      {
        "name": "tags",
        "in": "query",
        "required": false,
        "description": "Comma-separated labels for filtering usage, e.g. `production,team-alpha`.",
        "schema": {
          "$ref": "#/components/schemas/RequestTags"
        }
      }
    ],
    "annotations": {
      "readOnlyHint": true,
      "destructiveHint": false,
      "openWorldHint": true
    }
  },
  {
    "name": "get-web-scrape-screenshot",
    "title": "Scrape Screenshot",
    "method": "GET",
    "path": "/web/scrape/screenshot",
    "description": "Scrape Screenshot — Capture the given HTTP or HTTPS URL with configurable viewport, full-page capture, wait time, popup handling, theme, scroll offset, cache age, country, and request timeout. Defaults to a 1920x1080 viewport, a 3-second wait, and a cache age of 3 days. With timeoutOpts.behavior=return-partial, a screenshot of the page rendered so far may be returned; inspect finalDOMState to identify an incomplete render. Successful requests cost 1 credit; errors are not billed.",
    "parameters": [
      {
        "name": "url",
        "in": "query",
        "required": true,
        "schema": {
          "type": "string",
          "minLength": 1,
          "format": "uri"
        }
      },
      {
        "name": "headers",
        "in": "query",
        "required": false,
        "description": "Optional outbound HTTP headers, using the same JSON object or deep-object query format as other scrape endpoints (for example headers[Authorization]=Bearer token). Headers are scoped to the target origin during capture. For domain/page requests, discovery receives no custom headers and only pages on the resolved origin are eligible. Non-empty headers bypass screenshot caching and return an in-memory data URL; no screenshot is uploaded. Empty objects behave like omitted headers.",
        "schema": {
          "type": "object",
          "additionalProperties": {
            "type": "string",
            "maxLength": 8192,
            "pattern": "^[^\\r\\n]*$"
          },
          "description": "Optional outbound HTTP headers, using the same JSON object or deep-object query format as other scrape endpoints (for example headers[Authorization]=Bearer token). Headers are scoped to the target origin during capture. For domain/page requests, discovery receives no custom headers and only pages on the resolved origin are eligible. Non-empty headers bypass screenshot caching and return an in-memory data URL; no screenshot is uploaded. Empty objects behave like omitted headers."
        }
      },
      {
        "name": "fullScreenshot",
        "in": "query",
        "required": false,
        "description": "Optional parameter to determine screenshot type. If 'true', takes a full page screenshot capturing all content. If 'false' or not provided, takes a viewport screenshot (standard browser view).",
        "schema": {
          "type": "string",
          "enum": [
            "true",
            "false"
          ],
          "description": "Optional parameter to determine screenshot type. If 'true', takes a full page screenshot capturing all content. If 'false' or not provided, takes a viewport screenshot (standard browser view)."
        }
      },
      {
        "name": "waitForMs",
        "in": "query",
        "required": false,
        "description": "Optional browser wait time in milliseconds after initial page load before taking the screenshot. Min: 0. Max: 30000 (30 seconds). Defaults to 3000 ms when omitted. When combined with timeoutOpts, timeoutOpts.milliseconds must be at least waitForMs + 10000 ms; a shorter deadline is rejected with 400 TIMEOUT_TOO_SHORT_FOR_WAIT.",
        "schema": {
          "type": [
            "integer",
            "null"
          ],
          "minimum": 0,
          "maximum": 30000,
          "default": 3000,
          "description": "Optional browser wait time in milliseconds after initial page load before taking the screenshot. Min: 0. Max: 30000 (30 seconds). Defaults to 3000 ms when omitted. When combined with timeoutOpts, timeoutOpts.milliseconds must be at least waitForMs + 10000 ms; a shorter deadline is rejected with 400 TIMEOUT_TOO_SHORT_FOR_WAIT."
        }
      },
      {
        "name": "viewport",
        "in": "query",
        "required": false,
        "description": "Optional browser viewport dimensions for the screenshot. Defaults to 1920x1080.",
        "schema": {
          "type": "object",
          "properties": {
            "width": {
              "type": "integer",
              "minimum": 240,
              "maximum": 7680,
              "default": 1920,
              "description": "Viewport width in pixels."
            },
            "height": {
              "type": "integer",
              "minimum": 240,
              "maximum": 4320,
              "default": 1080,
              "description": "Viewport height in pixels."
            }
          },
          "default": {
            "width": 1920,
            "height": 1080
          },
          "description": "Optional browser viewport dimensions for the screenshot. Defaults to 1920x1080."
        }
      },
      {
        "name": "handleCookiePopup",
        "in": "query",
        "required": false,
        "description": "Optional parameter to control cookie/consent popup handling. If 'true', we dismiss cookie banner before capture. If 'false' or not provided, captures the page without that step.",
        "schema": {
          "type": "boolean",
          "default": false,
          "description": "Optional parameter to control cookie/consent popup handling. If 'true', we dismiss cookie banner before capture. If 'false' or not provided, captures the page without that step."
        }
      },
      {
        "name": "clearPopups",
        "in": "query",
        "required": false,
        "description": "Optional parameter for comprehensive popup cleanup. If 'true', the browser dismisses detected cookie/consent UI and clears other detected obstructive popups and overlays before capture. If 'false' or not provided, this parameter requests no cleanup; handleCookiePopup can still request cookie/consent handling independently.",
        "schema": {
          "type": "boolean",
          "default": false,
          "description": "Optional parameter for comprehensive popup cleanup. If 'true', the browser dismisses detected cookie/consent UI and clears other detected obstructive popups and overlays before capture. If 'false' or not provided, this parameter requests no cleanup; handleCookiePopup can still request cookie/consent handling independently."
        }
      },
      {
        "name": "colorScheme",
        "in": "query",
        "required": false,
        "description": "Optional parameter to choose the site's visual theme in the screenshot. Use 'light' or 'dark' when the site offers both appearances.",
        "schema": {
          "type": "string",
          "enum": [
            "light",
            "dark"
          ],
          "description": "Optional parameter to choose the site's visual theme in the screenshot. Use 'light' or 'dark' when the site offers both appearances."
        }
      },
      {
        "name": "scrollOffset",
        "in": "query",
        "required": false,
        "description": "Optional vertical scroll offset in pixels for capturing a long page in viewport-sized chunks. When provided, the full page is captured once and the returned image is the viewport-sized slice that begins at this Y offset (e.g. request scrollOffset=0, then 1080, then 2160 to walk a 1920x1080 landing page top to bottom). The final slice may be shorter than the viewport height. Takes precedence over fullScreenshot. Max: 100000.",
        "schema": {
          "type": [
            "integer",
            "null"
          ],
          "minimum": 0,
          "maximum": 100000,
          "description": "Optional vertical scroll offset in pixels for capturing a long page in viewport-sized chunks. When provided, the full page is captured once and the returned image is the viewport-sized slice that begins at this Y offset (e.g. request scrollOffset=0, then 1080, then 2160 to walk a 1920x1080 landing page top to bottom). The final slice may be shorter than the viewport height. Takes precedence over fullScreenshot. Max: 100000."
        }
      },
      {
        "name": "maxAgeMs",
        "in": "query",
        "required": false,
        "description": "Maximum cache age in milliseconds. Defaults to 3 days (259200000 ms). Maximum: 1 year (31536000000 ms). `0` fetches fresh.",
        "schema": {
          "type": [
            "integer",
            "null"
          ],
          "minimum": 0,
          "maximum": 31536000000,
          "default": 259200000,
          "description": "Maximum cache age in milliseconds. Defaults to 3 days (259200000 ms). Maximum: 1 year (31536000000 ms). `0` fetches fresh."
        }
      },
      {
        "name": "country",
        "in": "query",
        "required": false,
        "description": "Fetch from this country (ISO 3166-1 alpha-2).",
        "schema": {
          "$ref": "#/components/schemas/BrowserCountryCode"
        }
      },
      {
        "name": "timeoutOpts",
        "in": "query",
        "required": false,
        "description": "Request deadline and what to return when it passes.",
        "schema": {
          "$ref": "#/components/schemas/ScrapeTimeout"
        }
      },
      {
        "name": "zdr",
        "in": "query",
        "required": false,
        "description": "`enabled` turns on zero data retention. Returns 403 `ZDR_NOT_ENABLED` unless your organization has ZDR.",
        "schema": {
          "type": "string",
          "enum": [
            "enabled",
            "disabled"
          ],
          "default": "disabled",
          "description": "`enabled` turns on zero data retention. Returns 403 `ZDR_NOT_ENABLED` unless your organization has ZDR."
        }
      },
      {
        "name": "tags",
        "in": "query",
        "required": false,
        "description": "Comma-separated labels for filtering usage, e.g. `production,team-alpha`.",
        "schema": {
          "$ref": "#/components/schemas/RequestTags"
        }
      }
    ],
    "annotations": {
      "readOnlyHint": true,
      "destructiveHint": false,
      "openWorldHint": true
    }
  },
  {
    "name": "web-screenshot",
    "title": "Scrape Screenshot",
    "method": "GET",
    "path": "/web/screenshot",
    "description": "Scrape Screenshot — Capture a screenshot of a website.",
    "parameters": [
      {
        "name": "headers",
        "in": "query",
        "required": false,
        "description": "Optional outbound HTTP headers, using the same JSON object or deep-object query format as other scrape endpoints (for example headers[Authorization]=Bearer token). Headers are scoped to the target origin during capture. For domain/page requests, discovery receives no custom headers and only pages on the resolved origin are eligible. Non-empty headers bypass screenshot caching and return an in-memory data URL; no screenshot is uploaded. Empty objects behave like omitted headers.",
        "schema": {
          "type": "object",
          "additionalProperties": {
            "type": "string",
            "maxLength": 8192,
            "pattern": "^[^\\r\\n]*$"
          },
          "description": "Optional outbound HTTP headers, using the same JSON object or deep-object query format as other scrape endpoints (for example headers[Authorization]=Bearer token). Headers are scoped to the target origin during capture. For domain/page requests, discovery receives no custom headers and only pages on the resolved origin are eligible. Non-empty headers bypass screenshot caching and return an in-memory data URL; no screenshot is uploaded. Empty objects behave like omitted headers."
        }
      },
      {
        "name": "domain",
        "in": "query",
        "required": false,
        "description": "Domain name to take screenshot of (e.g., 'example.com', 'google.com'). The domain will be automatically normalized and validated. You must provide either 'domain' or 'directUrl', but not both.",
        "schema": {
          "type": "string",
          "minLength": 3,
          "description": "Domain name to take screenshot of (e.g., 'example.com', 'google.com'). The domain will be automatically normalized and validated. You must provide either 'domain' or 'directUrl', but not both."
        }
      },
      {
        "name": "directUrl",
        "in": "query",
        "required": false,
        "description": "A specific URL to screenshot directly, bypassing domain resolution (e.g., 'https://example.com/pricing'). When provided, the screenshot is taken of this exact URL. You must provide either 'domain' or 'directUrl', but not both.",
        "schema": {
          "type": "string",
          "format": "uri",
          "description": "A specific URL to screenshot directly, bypassing domain resolution (e.g., 'https://example.com/pricing'). When provided, the screenshot is taken of this exact URL. You must provide either 'domain' or 'directUrl', but not both."
        }
      },
      {
        "name": "fullScreenshot",
        "in": "query",
        "required": false,
        "description": "Optional parameter to determine screenshot type. If 'true', takes a full page screenshot capturing all content. If 'false' or not provided, takes a viewport screenshot (standard browser view).",
        "schema": {
          "type": "string",
          "enum": [
            "true",
            "false"
          ],
          "description": "Optional parameter to determine screenshot type. If 'true', takes a full page screenshot capturing all content. If 'false' or not provided, takes a viewport screenshot (standard browser view)."
        }
      },
      {
        "name": "page",
        "in": "query",
        "required": false,
        "description": "Optional parameter to specify which page type to screenshot. If provided, the system will scrape the domain's links and use heuristics to find the most appropriate URL for the specified page type (30 supported languages). If not provided, screenshots the main domain landing page. Only applicable when using 'domain', not 'directUrl'.",
        "schema": {
          "type": "string",
          "enum": [
            "login",
            "signup",
            "blog",
            "careers",
            "pricing",
            "terms",
            "privacy",
            "contact"
          ],
          "description": "Optional parameter to specify which page type to screenshot. If provided, the system will scrape the domain's links and use heuristics to find the most appropriate URL for the specified page type (30 supported languages). If not provided, screenshots the main domain landing page. Only applicable when using 'domain', not 'directUrl'."
        }
      },
      {
        "name": "waitForMs",
        "in": "query",
        "required": false,
        "description": "Optional browser wait time in milliseconds after initial page load before taking the screenshot. Min: 0. Max: 30000 (30 seconds). Defaults to 3000 ms when omitted. When combined with timeoutOpts, timeoutOpts.milliseconds must be at least waitForMs + 10000 ms; a shorter deadline is rejected with 400 TIMEOUT_TOO_SHORT_FOR_WAIT.",
        "schema": {
          "type": [
            "integer",
            "null"
          ],
          "minimum": 0,
          "maximum": 30000,
          "default": 3000,
          "description": "Optional browser wait time in milliseconds after initial page load before taking the screenshot. Min: 0. Max: 30000 (30 seconds). Defaults to 3000 ms when omitted. When combined with timeoutOpts, timeoutOpts.milliseconds must be at least waitForMs + 10000 ms; a shorter deadline is rejected with 400 TIMEOUT_TOO_SHORT_FOR_WAIT."
        }
      },
      {
        "name": "viewport",
        "in": "query",
        "required": false,
        "description": "Optional browser viewport dimensions for the screenshot. Defaults to 1920x1080.",
        "schema": {
          "type": "object",
          "properties": {
            "width": {
              "type": "integer",
              "minimum": 240,
              "maximum": 7680,
              "default": 1920,
              "description": "Viewport width in pixels."
            },
            "height": {
              "type": "integer",
              "minimum": 240,
              "maximum": 4320,
              "default": 1080,
              "description": "Viewport height in pixels."
            }
          },
          "default": {
            "width": 1920,
            "height": 1080
          },
          "description": "Optional browser viewport dimensions for the screenshot. Defaults to 1920x1080."
        }
      },
      {
        "name": "handleCookiePopup",
        "in": "query",
        "required": false,
        "description": "Optional parameter to control cookie/consent popup handling. If 'true', we dismiss cookie banner before capture. If 'false' or not provided, captures the page without that step.",
        "schema": {
          "type": "boolean",
          "default": false,
          "description": "Optional parameter to control cookie/consent popup handling. If 'true', we dismiss cookie banner before capture. If 'false' or not provided, captures the page without that step."
        }
      },
      {
        "name": "clearPopups",
        "in": "query",
        "required": false,
        "description": "Optional parameter for comprehensive popup cleanup. If 'true', the browser dismisses detected cookie/consent UI and clears other detected obstructive popups and overlays before capture. If 'false' or not provided, this parameter requests no cleanup; handleCookiePopup can still request cookie/consent handling independently.",
        "schema": {
          "type": "boolean",
          "default": false,
          "description": "Optional parameter for comprehensive popup cleanup. If 'true', the browser dismisses detected cookie/consent UI and clears other detected obstructive popups and overlays before capture. If 'false' or not provided, this parameter requests no cleanup; handleCookiePopup can still request cookie/consent handling independently."
        }
      },
      {
        "name": "colorScheme",
        "in": "query",
        "required": false,
        "description": "Optional parameter to choose the site's visual theme in the screenshot. Use 'light' or 'dark' when the site offers both appearances.",
        "schema": {
          "type": "string",
          "enum": [
            "light",
            "dark"
          ],
          "description": "Optional parameter to choose the site's visual theme in the screenshot. Use 'light' or 'dark' when the site offers both appearances."
        }
      },
      {
        "name": "scrollOffset",
        "in": "query",
        "required": false,
        "description": "Optional vertical scroll offset in pixels for capturing a long page in viewport-sized chunks. When provided, the full page is captured once and the returned image is the viewport-sized slice that begins at this Y offset (e.g. request scrollOffset=0, then 1080, then 2160 to walk a 1920x1080 landing page top to bottom). The final slice may be shorter than the viewport height. Takes precedence over fullScreenshot. Max: 100000.",
        "schema": {
          "type": [
            "integer",
            "null"
          ],
          "minimum": 0,
          "maximum": 100000,
          "description": "Optional vertical scroll offset in pixels for capturing a long page in viewport-sized chunks. When provided, the full page is captured once and the returned image is the viewport-sized slice that begins at this Y offset (e.g. request scrollOffset=0, then 1080, then 2160 to walk a 1920x1080 landing page top to bottom). The final slice may be shorter than the viewport height. Takes precedence over fullScreenshot. Max: 100000."
        }
      },
      {
        "name": "maxAgeMs",
        "in": "query",
        "required": false,
        "description": "Return a cached screenshot if a prior screenshot for the same parameters exists and is younger than this many milliseconds. Defaults to 1 day (86400000 ms) when omitted. Max is 30 days (2592000000 ms). Set to 0 to always capture fresh.",
        "schema": {
          "type": [
            "integer",
            "null"
          ],
          "minimum": 0,
          "maximum": 2592000000,
          "default": 86400000,
          "description": "Return a cached screenshot if a prior screenshot for the same parameters exists and is younger than this many milliseconds. Defaults to 1 day (86400000 ms) when omitted. Max is 30 days (2592000000 ms). Set to 0 to always capture fresh."
        }
      },
      {
        "name": "country",
        "in": "query",
        "required": false,
        "description": "Fetch from this country (ISO 3166-1 alpha-2).",
        "schema": {
          "$ref": "#/components/schemas/BrowserCountryCode"
        }
      },
      {
        "name": "timeoutOpts",
        "in": "query",
        "required": false,
        "description": "Request deadline and what to return when it passes.",
        "schema": {
          "$ref": "#/components/schemas/ScrapeTimeout"
        }
      },
      {
        "name": "zdr",
        "in": "query",
        "required": false,
        "description": "`enabled` turns on zero data retention. Returns 403 `ZDR_NOT_ENABLED` unless your organization has ZDR.",
        "schema": {
          "type": "string",
          "enum": [
            "enabled",
            "disabled"
          ],
          "default": "disabled",
          "description": "`enabled` turns on zero data retention. Returns 403 `ZDR_NOT_ENABLED` unless your organization has ZDR."
        }
      },
      {
        "name": "tags",
        "in": "query",
        "required": false,
        "description": "Comma-separated labels for filtering usage, e.g. `production,team-alpha`.",
        "schema": {
          "$ref": "#/components/schemas/RequestTags"
        }
      }
    ],
    "annotations": {
      "readOnlyHint": true,
      "destructiveHint": false,
      "openWorldHint": true
    }
  },
  {
    "name": "web-naics",
    "title": "Classify NAICS codes",
    "method": "GET",
    "path": "/web/naics",
    "description": "Classify NAICS codes — Classify a company into NAICS industry codes.",
    "parameters": [
      {
        "name": "input",
        "in": "query",
        "required": true,
        "description": "Brand domain or title to retrieve NAICS code for. If a valid domain is provided, it will be used for classification, otherwise, we will search for the brand using the provided title.",
        "schema": {
          "type": "string",
          "minLength": 4,
          "description": "Brand domain or title to retrieve NAICS code for. If a valid domain is provided, it will be used for classification, otherwise, we will search for the brand using the provided title."
        }
      },
      {
        "name": "minResults",
        "in": "query",
        "required": false,
        "description": "Minimum number of NAICS codes to return. Must be at least 1. Defaults to 1.",
        "schema": {
          "type": "integer",
          "minimum": 1,
          "maximum": 10,
          "default": 1,
          "description": "Minimum number of NAICS codes to return. Must be at least 1. Defaults to 1."
        }
      },
      {
        "name": "maxResults",
        "in": "query",
        "required": false,
        "description": "Maximum number of NAICS codes to return. Must be between 1 and 10. Defaults to 5.",
        "schema": {
          "type": "integer",
          "minimum": 1,
          "maximum": 10,
          "default": 5,
          "description": "Maximum number of NAICS codes to return. Must be between 1 and 10. Defaults to 5."
        }
      },
      {
        "name": "timeoutOpts",
        "in": "query",
        "required": false,
        "description": "Request deadline and what to return when it passes.",
        "schema": {
          "$ref": "#/components/schemas/PartialTimeout"
        }
      },
      {
        "name": "zdr",
        "in": "query",
        "required": false,
        "description": "`enabled` turns on zero data retention. Returns 403 `ZDR_NOT_ENABLED` unless your organization has ZDR.",
        "schema": {
          "type": "string",
          "enum": [
            "enabled",
            "disabled"
          ],
          "default": "disabled",
          "description": "`enabled` turns on zero data retention. Returns 403 `ZDR_NOT_ENABLED` unless your organization has ZDR."
        }
      },
      {
        "name": "tags",
        "in": "query",
        "required": false,
        "description": "Comma-separated labels for filtering usage, e.g. `production,team-alpha`.",
        "schema": {
          "$ref": "#/components/schemas/RequestTags"
        }
      }
    ],
    "annotations": {
      "readOnlyHint": true,
      "destructiveHint": false,
      "openWorldHint": true
    }
  },
  {
    "name": "web-sic",
    "title": "Classify SIC codes",
    "method": "GET",
    "path": "/web/sic",
    "description": "Classify SIC codes — Classify a company into SIC industry codes.",
    "parameters": [
      {
        "name": "input",
        "in": "query",
        "required": true,
        "description": "Brand domain or title to retrieve SIC code for. If a valid domain is provided, it will be used for classification, otherwise, we will search for the brand using the provided title.",
        "schema": {
          "type": "string",
          "minLength": 4,
          "description": "Brand domain or title to retrieve SIC code for. If a valid domain is provided, it will be used for classification, otherwise, we will search for the brand using the provided title."
        }
      },
      {
        "name": "type",
        "in": "query",
        "required": false,
        "description": "SIC dataset: `original_sic` (1987) or `latest_sec` (current SEC list).",
        "schema": {
          "type": "string",
          "enum": [
            "original_sic",
            "latest_sec"
          ],
          "default": "original_sic",
          "description": "SIC dataset: `original_sic` (1987) or `latest_sec` (current SEC list)."
        }
      },
      {
        "name": "minResults",
        "in": "query",
        "required": false,
        "description": "Minimum number of SIC codes to return. Must be at least 1. Defaults to 1.",
        "schema": {
          "type": "integer",
          "minimum": 1,
          "maximum": 10,
          "default": 1,
          "description": "Minimum number of SIC codes to return. Must be at least 1. Defaults to 1."
        }
      },
      {
        "name": "maxResults",
        "in": "query",
        "required": false,
        "description": "Maximum number of SIC codes to return. Must be between 1 and 10. Defaults to 5.",
        "schema": {
          "type": "integer",
          "minimum": 1,
          "maximum": 10,
          "default": 5,
          "description": "Maximum number of SIC codes to return. Must be between 1 and 10. Defaults to 5."
        }
      },
      {
        "name": "timeoutOpts",
        "in": "query",
        "required": false,
        "description": "Request deadline and what to return when it passes.",
        "schema": {
          "$ref": "#/components/schemas/PartialTimeout"
        }
      },
      {
        "name": "zdr",
        "in": "query",
        "required": false,
        "description": "`enabled` turns on zero data retention. Returns 403 `ZDR_NOT_ENABLED` unless your organization has ZDR.",
        "schema": {
          "type": "string",
          "enum": [
            "enabled",
            "disabled"
          ],
          "default": "disabled",
          "description": "`enabled` turns on zero data retention. Returns 403 `ZDR_NOT_ENABLED` unless your organization has ZDR."
        }
      },
      {
        "name": "tags",
        "in": "query",
        "required": false,
        "description": "Comma-separated labels for filtering usage, e.g. `production,team-alpha`.",
        "schema": {
          "$ref": "#/components/schemas/RequestTags"
        }
      }
    ],
    "annotations": {
      "readOnlyHint": true,
      "destructiveHint": false,
      "openWorldHint": true
    }
  },
  {
    "name": "brand-ai-product",
    "title": "Extract a single product from a URL",
    "method": "POST",
    "path": "/brand/ai/product",
    "description": "Extract a single product from a URL — Given a single URL, determines if it is a product page and extracts the product information.",
    "parameters": [],
    "requestBody": {
      "required": true,
      "schema": {
        "type": "object",
        "properties": {
          "url": {
            "type": "string",
            "format": "uri",
            "description": "The product page URL to extract product data from."
          },
          "maxAgeMs": {
            "type": [
              "integer",
              "null"
            ],
            "minimum": 0,
            "maximum": 2592000000,
            "default": 604800000,
            "description": "Return a cached result if a prior scrape for the same parameters exists and is younger than this many milliseconds. Defaults to 7 days (604800000 ms) when omitted. Max is 30 days (2592000000 ms). Set to 0 to always scrape fresh."
          },
          "timeoutOpts": {
            "$ref": "#/components/schemas/PartialTimeout"
          },
          "zdr": {
            "type": "string",
            "enum": [
              "enabled",
              "disabled"
            ],
            "default": "disabled",
            "description": "`enabled` turns on zero data retention. Returns 403 `ZDR_NOT_ENABLED` unless your organization has ZDR."
          },
          "tags": {
            "$ref": "#/components/schemas/RequestTags"
          }
        },
        "required": [
          "url"
        ]
      },
      "contentType": "application/json",
      "binary": false
    },
    "annotations": {
      "readOnlyHint": true,
      "destructiveHint": false,
      "openWorldHint": true
    }
  },
  {
    "name": "brand-ai-products",
    "title": "Extract products from a brand's website",
    "method": "POST",
    "path": "/brand/ai/products",
    "description": "Extract products from a brand's website — Extract product information from a brand's website. We will analyze the website and return a list of products with details such as name, description, image, pricing, features, and more.",
    "parameters": [],
    "requestBody": {
      "required": true,
      "schema": {
        "oneOf": [
          {
            "type": "object",
            "properties": {
              "domain": {
                "type": "string",
                "minLength": 3,
                "description": "The domain name to analyze."
              },
              "maxProducts": {
                "type": "integer",
                "minimum": 1,
                "maximum": 12,
                "description": "Maximum number of products to extract."
              },
              "maxAgeMs": {
                "type": [
                  "integer",
                  "null"
                ],
                "minimum": 0,
                "maximum": 2592000000,
                "default": 604800000,
                "description": "Return a cached result if a prior scrape for the same parameters exists and is younger than this many milliseconds. Defaults to 7 days (604800000 ms) when omitted. Max is 30 days (2592000000 ms). Set to 0 to always scrape fresh."
              },
              "timeoutOpts": {
                "$ref": "#/components/schemas/PartialTimeout"
              },
              "tags": {
                "$ref": "#/components/schemas/RequestTags"
              }
            },
            "required": [
              "domain"
            ],
            "title": "By Domain"
          },
          {
            "type": "object",
            "properties": {
              "directUrl": {
                "type": "string",
                "format": "uri",
                "description": "A specific URL to use directly as the starting point for extraction without domain resolution."
              },
              "maxProducts": {
                "type": "integer",
                "minimum": 1,
                "maximum": 12,
                "description": "Maximum number of products to extract."
              },
              "maxAgeMs": {
                "type": [
                  "integer",
                  "null"
                ],
                "minimum": 0,
                "maximum": 2592000000,
                "default": 604800000,
                "description": "Return a cached result if a prior scrape for the same parameters exists and is younger than this many milliseconds. Defaults to 7 days (604800000 ms) when omitted. Max is 30 days (2592000000 ms). Set to 0 to always scrape fresh."
              },
              "timeoutOpts": {
                "$ref": "#/components/schemas/PartialTimeout"
              },
              "tags": {
                "$ref": "#/components/schemas/RequestTags"
              }
            },
            "required": [
              "directUrl"
            ],
            "title": "By Direct URL"
          }
        ]
      },
      "contentType": "application/json",
      "binary": false
    },
    "annotations": {
      "readOnlyHint": true,
      "destructiveHint": false,
      "openWorldHint": true
    }
  },
  {
    "name": "brand-prefetch",
    "title": "Prefetch brand data for a domain",
    "method": "POST",
    "path": "/brand/prefetch",
    "description": "Prefetch brand data for a domain — Signal that you may fetch brand data for a particular domain soon to improve latency.",
    "parameters": [],
    "requestBody": {
      "required": true,
      "schema": {
        "type": "object",
        "properties": {
          "domain": {
            "type": "string",
            "minLength": 3,
            "description": "Domain name to prefetch brand data for"
          },
          "timeoutOpts": {
            "$ref": "#/components/schemas/Timeout"
          },
          "tags": {
            "$ref": "#/components/schemas/RequestTags"
          }
        },
        "required": [
          "domain"
        ]
      },
      "contentType": "application/json",
      "binary": false
    },
    "annotations": {
      "readOnlyHint": false,
      "destructiveHint": true,
      "openWorldHint": true
    }
  },
  {
    "name": "brand-prefetch-by-email",
    "title": "Prefetch brand data by email",
    "method": "POST",
    "path": "/brand/prefetch-by-email",
    "description": "Prefetch brand data by email — Signal that you may fetch brand data for a particular domain soon to improve latency. This endpoint accepts an email address, extracts the domain from it, validates that it's not a disposable or free email provider, and queues the domain for prefetching.",
    "parameters": [],
    "requestBody": {
      "required": true,
      "schema": {
        "type": "object",
        "properties": {
          "email": {
            "type": "string",
            "minLength": 1,
            "format": "email",
            "description": "Email address to prefetch brand data for. The domain will be extracted from the email. Free email providers (gmail.com, yahoo.com, etc.) and disposable email addresses are not allowed."
          },
          "timeoutOpts": {
            "$ref": "#/components/schemas/Timeout"
          },
          "tags": {
            "$ref": "#/components/schemas/RequestTags"
          }
        },
        "required": [
          "email"
        ]
      },
      "contentType": "application/json",
      "binary": false
    },
    "annotations": {
      "readOnlyHint": false,
      "destructiveHint": true,
      "openWorldHint": true
    }
  },
  {
    "name": "utility-prefetch",
    "title": "Prefetch brand data",
    "method": "POST",
    "path": "/utility/prefetch",
    "description": "Prefetch brand data — Queue brand or styleguide data so a later lookup can return sooner.",
    "parameters": [],
    "requestBody": {
      "required": true,
      "schema": {
        "type": "object",
        "properties": {
          "type": {
            "type": "string",
            "enum": [
              "brand",
              "styleguide"
            ],
            "description": "Data to prefetch."
          },
          "identifier": {
            "$ref": "#/components/schemas/UtilityPrefetchIdentifier"
          },
          "timeoutOpts": {
            "$ref": "#/components/schemas/Timeout"
          },
          "policies": {
            "type": "array",
            "items": {
              "type": "string"
            },
            "description": "Access policy IDs to apply. A URL must pass every policy.",
            "example": [
              "pol_3f9c2a7e5b8d4c1f9a6e0b2d7c4f8a1e"
            ]
          },
          "tags": {
            "$ref": "#/components/schemas/RequestTags"
          }
        },
        "required": [
          "type",
          "identifier"
        ]
      },
      "contentType": "application/json",
      "binary": false
    },
    "annotations": {
      "readOnlyHint": false,
      "destructiveHint": true,
      "openWorldHint": true
    }
  },
  {
    "name": "list-monitors",
    "title": "List monitors",
    "method": "GET",
    "path": "/monitors",
    "description": "List monitors — List your monitors with optional search and filters.",
    "parameters": [
      {
        "name": "q",
        "in": "query",
        "required": false,
        "description": "Free-text search term, matched against the fields named in `search_by`.",
        "schema": {
          "type": "string",
          "maxLength": 200,
          "description": "Free-text search term, matched against the fields named in `search_by`.",
          "example": "pricing"
        }
      },
      {
        "name": "search_by",
        "in": "query",
        "required": false,
        "description": "Fields to search with `q`. Defaults to all fields; page, extract, and search targets can have instructions, and `url` matches a search target’s query.",
        "schema": {
          "type": [
            "array",
            "null"
          ],
          "items": {
            "type": "string",
            "enum": [
              "name",
              "url",
              "instructions",
              "tags"
            ]
          },
          "description": "Fields to search with `q`. Defaults to all fields; page, extract, and search targets can have instructions, and `url` matches a search target’s query.",
          "example": "name,url"
        }
      },
      {
        "name": "search_type",
        "in": "query",
        "required": false,
        "description": "`prefix` for as-you-type prefix matching (default), `exact` for full-token matching.",
        "schema": {
          "type": "string",
          "enum": [
            "exact",
            "prefix"
          ],
          "description": "`prefix` for as-you-type prefix matching (default), `exact` for full-token matching."
        }
      },
      {
        "name": "status",
        "in": "query",
        "required": false,
        "description": "Filter monitors by lifecycle status.",
        "schema": {
          "type": "string",
          "enum": [
            "active",
            "paused",
            "failed"
          ],
          "description": "Filter monitors by lifecycle status."
        }
      },
      {
        "name": "target_type",
        "in": "query",
        "required": false,
        "description": "Filter by target type.",
        "schema": {
          "type": "string",
          "enum": [
            "page",
            "sitemap",
            "extract",
            "search"
          ],
          "description": "Filter by target type."
        }
      },
      {
        "name": "change_detection_type",
        "in": "query",
        "required": false,
        "description": "Filter by change detection type.",
        "schema": {
          "type": "string",
          "enum": [
            "exact",
            "semantic"
          ],
          "description": "Filter by change detection type."
        }
      },
      {
        "name": "tags",
        "in": "query",
        "required": false,
        "description": "Comma-separated list of tags to filter by (matches monitors having any of them).",
        "schema": {
          "type": [
            "array",
            "null"
          ],
          "items": {
            "type": "string",
            "minLength": 1,
            "maxLength": 50
          },
          "maxItems": 20,
          "description": "Comma-separated list of tags to filter by (matches monitors having any of them).",
          "example": "pricing,competitor"
        }
      },
      {
        "name": "tag",
        "in": "query",
        "required": false,
        "description": "Filter to items that have this tag.",
        "schema": {
          "type": "string",
          "description": "Filter to items that have this tag.",
          "example": "pricing"
        }
      },
      {
        "name": "limit",
        "in": "query",
        "required": false,
        "description": "Maximum number of items to return per page (1-100). Defaults to 25.",
        "schema": {
          "type": "integer",
          "minimum": 1,
          "maximum": 100,
          "description": "Maximum number of items to return per page (1-100). Defaults to 25."
        }
      },
      {
        "name": "cursor",
        "in": "query",
        "required": false,
        "description": "Opaque pagination cursor from a previous response.",
        "schema": {
          "type": "string",
          "description": "Opaque pagination cursor from a previous response."
        }
      }
    ],
    "annotations": {
      "readOnlyHint": true,
      "destructiveHint": false,
      "openWorldHint": true
    }
  },
  {
    "name": "create-monitor",
    "title": "Create a monitor",
    "method": "POST",
    "path": "/monitors",
    "description": "Create a monitor — Watch a page, URL inventory, or extracted website data on a schedule. A run starts immediately to capture the baseline.",
    "parameters": [],
    "requestBody": {
      "required": true,
      "schema": {
        "$ref": "#/components/schemas/MonitorsCreateMonitorRequest"
      },
      "contentType": "application/json",
      "binary": false
    },
    "annotations": {
      "readOnlyHint": false,
      "destructiveHint": true,
      "openWorldHint": true
    }
  },
  {
    "name": "get-monitor",
    "title": "Retrieve a monitor",
    "method": "GET",
    "path": "/monitors/{monitor_id}",
    "description": "Retrieve a monitor — Retrieve a monitor’s configuration and current state.",
    "parameters": [
      {
        "name": "monitor_id",
        "in": "path",
        "required": true,
        "description": "ID of the monitor.",
        "schema": {
          "type": "string",
          "description": "ID of the monitor.",
          "example": "mon_123"
        }
      }
    ],
    "annotations": {
      "readOnlyHint": true,
      "destructiveHint": false,
      "openWorldHint": true
    }
  },
  {
    "name": "update-monitor",
    "title": "Update a monitor",
    "method": "PATCH",
    "path": "/monitors/{monitor_id}",
    "description": "Update a monitor — Update a monitor. Changing its target or change detection replaces the baseline and queues a new baseline run.",
    "parameters": [
      {
        "name": "monitor_id",
        "in": "path",
        "required": true,
        "description": "ID of the monitor.",
        "schema": {
          "type": "string",
          "description": "ID of the monitor.",
          "example": "mon_123"
        }
      }
    ],
    "requestBody": {
      "required": true,
      "schema": {
        "$ref": "#/components/schemas/MonitorsUpdateMonitorRequest"
      },
      "contentType": "application/json",
      "binary": false
    },
    "annotations": {
      "readOnlyHint": false,
      "destructiveHint": true,
      "openWorldHint": true
    }
  },
  {
    "name": "delete-monitor",
    "title": "Delete a monitor",
    "method": "DELETE",
    "path": "/monitors/{monitor_id}",
    "description": "Delete a monitor — Delete a monitor and stop future runs and webhook retries.",
    "parameters": [
      {
        "name": "monitor_id",
        "in": "path",
        "required": true,
        "description": "ID of the monitor.",
        "schema": {
          "type": "string",
          "description": "ID of the monitor.",
          "example": "mon_123"
        }
      }
    ],
    "annotations": {
      "readOnlyHint": false,
      "destructiveHint": true,
      "openWorldHint": true
    }
  },
  {
    "name": "list-monitor-runs",
    "title": "List monitor runs",
    "method": "GET",
    "path": "/monitors/{monitor_id}/runs",
    "description": "List monitor runs — List a monitor’s runs, newest first.",
    "parameters": [
      {
        "name": "monitor_id",
        "in": "path",
        "required": true,
        "description": "ID of the monitor.",
        "schema": {
          "type": "string",
          "description": "ID of the monitor.",
          "example": "mon_123"
        }
      },
      {
        "name": "status",
        "in": "query",
        "required": false,
        "description": "Filter runs by lifecycle status.",
        "schema": {
          "allOf": [
            {
              "$ref": "#/components/schemas/MonitorsRunStatus"
            },
            {
              "description": "Filter runs by lifecycle status."
            }
          ]
        }
      },
      {
        "name": "limit",
        "in": "query",
        "required": false,
        "description": "Maximum number of items to return per page (1-100). Defaults to 25.",
        "schema": {
          "type": "integer",
          "minimum": 1,
          "maximum": 100,
          "description": "Maximum number of items to return per page (1-100). Defaults to 25."
        }
      },
      {
        "name": "cursor",
        "in": "query",
        "required": false,
        "description": "Opaque pagination cursor from a previous response.",
        "schema": {
          "type": "string",
          "description": "Opaque pagination cursor from a previous response."
        }
      }
    ],
    "annotations": {
      "readOnlyHint": true,
      "destructiveHint": false,
      "openWorldHint": true
    }
  },
  {
    "name": "get-monitor-run",
    "title": "Retrieve a monitor run",
    "method": "GET",
    "path": "/monitors/{monitor_id}/runs/{run_id}",
    "description": "Retrieve a monitor run — Retrieve the status, timing, and results of one monitor run.",
    "parameters": [
      {
        "name": "monitor_id",
        "in": "path",
        "required": true,
        "description": "ID of the monitor.",
        "schema": {
          "type": "string",
          "description": "ID of the monitor.",
          "example": "mon_123"
        }
      },
      {
        "name": "run_id",
        "in": "path",
        "required": true,
        "description": "ID of the monitor run.",
        "schema": {
          "type": "string",
          "description": "ID of the monitor run.",
          "example": "run_123"
        }
      }
    ],
    "annotations": {
      "readOnlyHint": true,
      "destructiveHint": false,
      "openWorldHint": true
    }
  },
  {
    "name": "list-monitor-changes",
    "title": "List monitor changes",
    "method": "GET",
    "path": "/monitors/{monitor_id}/changes",
    "description": "List monitor changes — List full change records for a monitor, newest first.",
    "parameters": [
      {
        "name": "monitor_id",
        "in": "path",
        "required": true,
        "description": "ID of the monitor.",
        "schema": {
          "type": "string",
          "description": "ID of the monitor.",
          "example": "mon_123"
        }
      },
      {
        "name": "tag",
        "in": "query",
        "required": false,
        "description": "Filter to items that have this tag.",
        "schema": {
          "type": "string",
          "description": "Filter to items that have this tag.",
          "example": "pricing"
        }
      },
      {
        "name": "since",
        "in": "query",
        "required": false,
        "description": "Only include items at or after this ISO 8601 timestamp.",
        "schema": {
          "type": "string",
          "format": "date-time",
          "description": "Only include items at or after this ISO 8601 timestamp.",
          "example": "2026-06-01T00:00:00Z"
        }
      },
      {
        "name": "until",
        "in": "query",
        "required": false,
        "description": "Only include items before this ISO 8601 timestamp.",
        "schema": {
          "type": "string",
          "format": "date-time",
          "description": "Only include items before this ISO 8601 timestamp.",
          "example": "2026-06-28T00:00:00Z"
        }
      },
      {
        "name": "limit",
        "in": "query",
        "required": false,
        "description": "Maximum number of items to return per page (1-100). Defaults to 25.",
        "schema": {
          "type": "integer",
          "minimum": 1,
          "maximum": 100,
          "description": "Maximum number of items to return per page (1-100). Defaults to 25."
        }
      },
      {
        "name": "cursor",
        "in": "query",
        "required": false,
        "description": "Opaque pagination cursor from a previous response.",
        "schema": {
          "type": "string",
          "description": "Opaque pagination cursor from a previous response."
        }
      }
    ],
    "annotations": {
      "readOnlyHint": true,
      "destructiveHint": false,
      "openWorldHint": true
    }
  },
  {
    "name": "list-account-runs",
    "title": "List runs for all monitors",
    "method": "GET",
    "path": "/monitors/runs",
    "description": "List runs for all monitors — List runs across your monitors, newest first.",
    "parameters": [
      {
        "name": "status",
        "in": "query",
        "required": false,
        "description": "Filter runs by lifecycle status.",
        "schema": {
          "allOf": [
            {
              "$ref": "#/components/schemas/MonitorsRunStatus"
            },
            {
              "description": "Filter runs by lifecycle status."
            }
          ]
        }
      },
      {
        "name": "limit",
        "in": "query",
        "required": false,
        "description": "Maximum number of items to return per page (1-100). Defaults to 25.",
        "schema": {
          "type": "integer",
          "minimum": 1,
          "maximum": 100,
          "description": "Maximum number of items to return per page (1-100). Defaults to 25."
        }
      },
      {
        "name": "cursor",
        "in": "query",
        "required": false,
        "description": "Opaque pagination cursor from a previous response.",
        "schema": {
          "type": "string",
          "description": "Opaque pagination cursor from a previous response."
        }
      }
    ],
    "annotations": {
      "readOnlyHint": true,
      "destructiveHint": false,
      "openWorldHint": true
    }
  },
  {
    "name": "list-monitor-credit-usage",
    "title": "Retrieve monitor credit usage",
    "method": "GET",
    "path": "/monitors/credit-usage",
    "description": "Retrieve monitor credit usage — Return usage per monitor, highest first, for up to the 10,000 most recent runs in the requested window.",
    "parameters": [
      {
        "name": "since",
        "in": "query",
        "required": false,
        "description": "Only include items at or after this ISO 8601 timestamp.",
        "schema": {
          "type": "string",
          "format": "date-time",
          "description": "Only include items at or after this ISO 8601 timestamp.",
          "example": "2026-06-01T00:00:00Z"
        }
      },
      {
        "name": "until",
        "in": "query",
        "required": false,
        "description": "Only include items before this ISO 8601 timestamp.",
        "schema": {
          "type": "string",
          "format": "date-time",
          "description": "Only include items before this ISO 8601 timestamp.",
          "example": "2026-06-28T00:00:00Z"
        }
      }
    ],
    "annotations": {
      "readOnlyHint": true,
      "destructiveHint": false,
      "openWorldHint": true
    }
  },
  {
    "name": "get-monitor-limits",
    "title": "Retrieve monitor limits",
    "method": "GET",
    "path": "/monitors/limits",
    "description": "Retrieve monitor limits — Retrieve your organization’s monitor allowance and usage.",
    "parameters": [],
    "annotations": {
      "readOnlyHint": true,
      "destructiveHint": false,
      "openWorldHint": true
    }
  },
  {
    "name": "list-changes",
    "title": "List changes for all monitors",
    "method": "GET",
    "path": "/monitors/changes",
    "description": "List changes for all monitors — List full change records across your monitors, newest first.",
    "parameters": [
      {
        "name": "monitor_id",
        "in": "query",
        "required": false,
        "description": "Filter changes to a single monitor.",
        "schema": {
          "type": "string",
          "description": "Filter changes to a single monitor.",
          "example": "mon_123"
        }
      },
      {
        "name": "target_type",
        "in": "query",
        "required": false,
        "description": "Filter by target type.",
        "schema": {
          "type": "string",
          "enum": [
            "page",
            "sitemap",
            "extract",
            "search"
          ],
          "description": "Filter by target type."
        }
      },
      {
        "name": "change_detection_type",
        "in": "query",
        "required": false,
        "description": "Filter by change detection type.",
        "schema": {
          "type": "string",
          "enum": [
            "exact",
            "semantic"
          ],
          "description": "Filter by change detection type."
        }
      },
      {
        "name": "tag",
        "in": "query",
        "required": false,
        "description": "Filter to items that have this tag.",
        "schema": {
          "type": "string",
          "description": "Filter to items that have this tag.",
          "example": "pricing"
        }
      },
      {
        "name": "since",
        "in": "query",
        "required": false,
        "description": "Only include items at or after this ISO 8601 timestamp.",
        "schema": {
          "type": "string",
          "format": "date-time",
          "description": "Only include items at or after this ISO 8601 timestamp.",
          "example": "2026-06-01T00:00:00Z"
        }
      },
      {
        "name": "until",
        "in": "query",
        "required": false,
        "description": "Only include items before this ISO 8601 timestamp.",
        "schema": {
          "type": "string",
          "format": "date-time",
          "description": "Only include items before this ISO 8601 timestamp.",
          "example": "2026-06-28T00:00:00Z"
        }
      },
      {
        "name": "limit",
        "in": "query",
        "required": false,
        "description": "Maximum number of items to return per page (1-100). Defaults to 25.",
        "schema": {
          "type": "integer",
          "minimum": 1,
          "maximum": 100,
          "description": "Maximum number of items to return per page (1-100). Defaults to 25."
        }
      },
      {
        "name": "cursor",
        "in": "query",
        "required": false,
        "description": "Opaque pagination cursor from a previous response.",
        "schema": {
          "type": "string",
          "description": "Opaque pagination cursor from a previous response."
        }
      }
    ],
    "annotations": {
      "readOnlyHint": true,
      "destructiveHint": false,
      "openWorldHint": true
    }
  },
  {
    "name": "get-change",
    "title": "Retrieve a monitor change",
    "method": "GET",
    "path": "/monitors/changes/{change_id}",
    "description": "Retrieve a monitor change — Retrieve a detected change, including its diff and available evidence.",
    "parameters": [
      {
        "name": "change_id",
        "in": "path",
        "required": true,
        "description": "ID of the detected change.",
        "schema": {
          "type": "string",
          "description": "ID of the detected change.",
          "example": "chg_123"
        }
      }
    ],
    "annotations": {
      "readOnlyHint": true,
      "destructiveHint": false,
      "openWorldHint": true
    }
  },
  {
    "name": "run-monitor-now",
    "title": "Run a monitor now",
    "method": "POST",
    "path": "/monitors/{monitor_id}/run",
    "description": "Run a monitor now — Queue a run without changing the regular schedule. Paused monitors return 409.",
    "parameters": [
      {
        "name": "monitor_id",
        "in": "path",
        "required": true,
        "description": "ID of the monitor.",
        "schema": {
          "type": "string",
          "description": "ID of the monitor.",
          "example": "mon_123"
        }
      }
    ],
    "annotations": {
      "readOnlyHint": false,
      "destructiveHint": true,
      "openWorldHint": true
    }
  },
  {
    "name": "rotate-monitor-webhook-secret",
    "title": "Rotate a monitor webhook secret",
    "method": "POST",
    "path": "/monitors/{monitor_id}/webhook/rotate-secret",
    "description": "Rotate a monitor webhook secret — Generate and return a new signing secret. It takes effect immediately for all subsequent delivery attempts.",
    "parameters": [
      {
        "name": "monitor_id",
        "in": "path",
        "required": true,
        "description": "ID of the monitor.",
        "schema": {
          "type": "string",
          "description": "ID of the monitor.",
          "example": "mon_123"
        }
      }
    ],
    "annotations": {
      "readOnlyHint": false,
      "destructiveHint": true,
      "openWorldHint": true
    }
  },
  {
    "name": "submit-batch",
    "title": "Submit a batch",
    "method": "POST",
    "path": "/batch/submit",
    "description": "Submit a batch — Scrape up to 100,000 URLs, or crawl a site, asynchronously using the same formats and scrape parameters as POST /web/scrape. Choose Markdown, HTML, screenshots, images, bytes, parsed fields, products, highlights, and JSON. Submission persists the input and returns immediately with status pending. Organizations with fewer than 10 available credits and no overage are rejected with 402 up front. Each organization can submit up to 2,500 batches per minute, independently of its polling budget. Batches wait pending when execution capacity is full. Validation, sitemap discovery, the full credit quote, and shard scheduling happen afterward. Poll the batch ID or receive a webhook when it finishes. Deferred rejections appear as status failed with a failure code and message.",
    "parameters": [
      {
        "name": "Idempotency-Key",
        "in": "header",
        "required": false,
        "description": "Unique key per submission. Retrying with the same key and body returns the original batch; a different body returns `409`.",
        "schema": {
          "type": "string",
          "maxLength": 200,
          "description": "Unique key per submission. Retrying with the same key and body returns the original batch; a different body returns `409`."
        }
      }
    ],
    "requestBody": {
      "required": true,
      "schema": {
        "$ref": "#/components/schemas/BatchSubmitRequest"
      },
      "contentType": "application/json",
      "binary": false
    },
    "annotations": {
      "readOnlyHint": false,
      "destructiveHint": true,
      "openWorldHint": true
    }
  },
  {
    "name": "list-batches",
    "title": "List batches",
    "method": "GET",
    "path": "/batch/list",
    "description": "List batches — List your batches, newest first, with optional filters.",
    "parameters": [
      {
        "name": "shouldIncludeUnified",
        "in": "query",
        "required": false,
        "description": "Include batches submitted with Scrape Anything formats. Defaults to false.",
        "schema": {
          "type": "boolean",
          "default": false,
          "description": "Include batches submitted with Scrape Anything formats. Defaults to false."
        }
      },
      {
        "name": "limit",
        "in": "query",
        "required": false,
        "description": "Batches per page. Defaults to 25.",
        "schema": {
          "type": "integer",
          "minimum": 1,
          "maximum": 100,
          "default": 25,
          "description": "Batches per page. Defaults to 25."
        }
      },
      {
        "name": "cursor",
        "in": "query",
        "required": false,
        "description": "Cursor from the previous page.",
        "schema": {
          "type": "string",
          "description": "Cursor from the previous page."
        }
      },
      {
        "name": "status",
        "in": "query",
        "required": false,
        "description": "Filter by status.",
        "schema": {
          "type": "string",
          "enum": [
            "pending",
            "queued",
            "running",
            "cancelling",
            "completed",
            "cancelled",
            "failed"
          ],
          "description": "Filter by status."
        }
      },
      {
        "name": "q",
        "in": "query",
        "required": false,
        "description": "Free-text search term, matched against the batch id, crawl source (start URL or sitemap domain), and tags.",
        "schema": {
          "type": "string",
          "maxLength": 200,
          "description": "Free-text search term, matched against the batch id, crawl source (start URL or sitemap domain), and tags.",
          "example": "batch_1a2b"
        }
      },
      {
        "name": "search_type",
        "in": "query",
        "required": false,
        "description": "`prefix` for as-you-type prefix matching (default), `exact` for full-token matching.",
        "schema": {
          "type": "string",
          "enum": [
            "exact",
            "prefix"
          ],
          "description": "`prefix` for as-you-type prefix matching (default), `exact` for full-token matching."
        }
      },
      {
        "name": "tags",
        "in": "query",
        "required": false,
        "description": "Tags to filter by (matches batches having any of them). Pass repeated `tags` params or one comma-separated list, e.g. `tags=docs,competitor`.",
        "schema": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "array",
              "items": {
                "type": "string"
              }
            }
          ],
          "description": "Tags to filter by (matches batches having any of them). Pass repeated `tags` params or one comma-separated list, e.g. `tags=docs,competitor`.",
          "example": "docs,competitor"
        }
      }
    ],
    "annotations": {
      "readOnlyHint": true,
      "destructiveHint": false,
      "openWorldHint": true
    }
  },
  {
    "name": "get-batch",
    "title": "Retrieve a batch",
    "method": "GET",
    "path": "/batch/{batch_id}",
    "description": "Retrieve a batch — Get batch progress and result download links. Result files are deleted 180 days after the batch finishes.",
    "parameters": [
      {
        "name": "batch_id",
        "in": "path",
        "required": true,
        "description": "Batch ID.",
        "schema": {
          "type": "string",
          "example": "batch_9f2c8a",
          "description": "Batch ID."
        }
      }
    ],
    "annotations": {
      "readOnlyHint": true,
      "destructiveHint": false,
      "openWorldHint": true
    }
  },
  {
    "name": "delete-batch",
    "title": "Delete a batch",
    "method": "DELETE",
    "path": "/batch/{batch_id}",
    "description": "Delete a batch — Permanently delete a finished batch and its results. Its webhook deliveries can no longer be retried.",
    "parameters": [
      {
        "name": "batch_id",
        "in": "path",
        "required": true,
        "description": "Batch ID.",
        "schema": {
          "type": "string",
          "example": "batch_9f2c8a",
          "description": "Batch ID."
        }
      }
    ],
    "annotations": {
      "readOnlyHint": false,
      "destructiveHint": true,
      "openWorldHint": true
    }
  },
  {
    "name": "get-batch-results",
    "title": "List batch results",
    "method": "GET",
    "path": "/batch/{batch_id}/results",
    "description": "List batch results — Page through a finished batch’s results as JSON. Each record contains result with the same outputs and per-format errors as POST /web/scrape. Results remain available for 180 days.",
    "parameters": [
      {
        "name": "batch_id",
        "in": "path",
        "required": true,
        "description": "Batch ID.",
        "schema": {
          "type": "string",
          "example": "batch_9f2c8a",
          "description": "Batch ID."
        }
      },
      {
        "name": "limit",
        "in": "query",
        "required": false,
        "description": "Records per page. Defaults to 25. A page can close early so its payload stays under ~8 MB; rely on next_cursor rather than counting records.",
        "schema": {
          "type": "integer",
          "minimum": 1,
          "maximum": 100,
          "default": 25,
          "description": "Records per page. Defaults to 25. A page can close early so its payload stays under ~8 MB; rely on next_cursor rather than counting records."
        }
      },
      {
        "name": "cursor",
        "in": "query",
        "required": false,
        "description": "next_cursor from the previous page.",
        "schema": {
          "type": "string",
          "pattern": "^\\d+:\\d+$",
          "description": "next_cursor from the previous page."
        }
      }
    ],
    "annotations": {
      "readOnlyHint": true,
      "destructiveHint": false,
      "openWorldHint": true
    }
  },
  {
    "name": "cancel-batch",
    "title": "Cancel a batch",
    "method": "POST",
    "path": "/batch/{batch_id}/cancel",
    "description": "Cancel a batch — Stop a batch from starting new pages. Pages already in progress finish before the batch becomes cancelled.",
    "parameters": [
      {
        "name": "batch_id",
        "in": "path",
        "required": true,
        "description": "Batch ID.",
        "schema": {
          "type": "string",
          "example": "batch_9f2c8a",
          "description": "Batch ID."
        }
      }
    ],
    "annotations": {
      "readOnlyHint": false,
      "destructiveHint": true,
      "openWorldHint": true
    }
  },
  {
    "name": "company-search",
    "title": "Search companies",
    "method": "POST",
    "path": "/company/search",
    "description": "Search companies — Find companies with a natural-language query.",
    "parameters": [],
    "requestBody": {
      "required": true,
      "schema": {
        "type": "object",
        "properties": {
          "query": {
            "type": "string",
            "minLength": 1,
            "maxLength": 5000,
            "description": "Describe the companies to find. Up to 500 characters in `fast` mode and 5000 in `ultra` mode.",
            "example": "Solar startups in California that raised a Series B"
          },
          "mode": {
            "type": "string",
            "enum": [
              "fast",
              "ultra"
            ],
            "default": "fast",
            "description": "`fast` returns results in about two seconds; `ultra` searches more thoroughly and checks every result against each criterion in the query. `ultra` can take up to 20 seconds, so allow for that in your client timeout."
          },
          "filters": {
            "$ref": "#/components/schemas/CompanySearchFilters"
          },
          "cursor": {
            "type": "string",
            "maxLength": 64,
            "description": "Use next_cursor with the same query, mode and filters to fetch the next page."
          },
          "tags": {
            "$ref": "#/components/schemas/RequestTags"
          }
        },
        "required": [
          "query"
        ],
        "additionalProperties": false,
        "example": {
          "query": "Solar startups in California that raised a Series B"
        }
      },
      "contentType": "application/json",
      "binary": false
    },
    "annotations": {
      "readOnlyHint": true,
      "destructiveHint": false,
      "openWorldHint": true
    }
  },
  {
    "name": "people-search",
    "title": "Search people",
    "method": "POST",
    "path": "/people/search",
    "description": "Search people — Find people with a natural-language query.",
    "parameters": [],
    "requestBody": {
      "required": true,
      "schema": {
        "type": "object",
        "properties": {
          "query": {
            "type": "string",
            "minLength": 1,
            "maxLength": 5000,
            "description": "Describe the people to find. Up to 500 characters in `fast` mode and 5000 in `ultra` mode.",
            "example": "VPs of sales at solar companies in California"
          },
          "mode": {
            "type": "string",
            "enum": [
              "fast",
              "ultra"
            ],
            "default": "fast",
            "description": "`fast` matches people on basic criteria (e.g. their role, location or background); `ultra` plans a deeper search, judges each candidate against every criterion in the query. Complex `ultra` searches can take up to 30 seconds to complete, so allow for that in your client timeout."
          },
          "filters": {
            "$ref": "#/components/schemas/PeopleSearchFilters"
          },
          "cursor": {
            "type": "string",
            "maxLength": 65536,
            "description": "Use next_cursor with the same query, mode and filters to fetch the next page."
          },
          "tags": {
            "$ref": "#/components/schemas/RequestTags"
          }
        },
        "required": [
          "query"
        ],
        "additionalProperties": false,
        "example": {
          "query": "VPs of sales at solar companies in California"
        }
      },
      "contentType": "application/json",
      "binary": false
    },
    "annotations": {
      "readOnlyHint": true,
      "destructiveHint": false,
      "openWorldHint": true
    }
  }
];

export const COMPONENT_SCHEMAS: Record<string, JsonSchema> = {
  "CreateAccessPolicyRequest": {
    "type": "object",
    "properties": {
      "name": {
        "type": "string",
        "minLength": 1,
        "description": "A name to recognize this policy.",
        "example": "Research sources"
      },
      "allowed_domains": {
        "type": "array",
        "items": {
          "type": "string"
        },
        "description": "Only these domains and their subdomains can be accessed. Send this or `blocked_domains`.",
        "example": [
          "arxiv.org",
          "*.gov"
        ]
      },
      "blocked_domains": {
        "type": "array",
        "items": {
          "type": "string"
        },
        "description": "These domains and their subdomains can't be accessed. Send this or `allowed_domains`.",
        "example": [
          "facebook.com",
          "tiktok.com"
        ]
      },
      "applies_to": {
        "type": "string",
        "enum": [
          "request",
          "api_keys",
          "organization"
        ],
        "default": "request",
        "description": "`request` applies when listed in `policies`. `api_keys` applies to every request made with `api_key_ids`. `organization` applies to every request."
      },
      "api_key_ids": {
        "type": "array",
        "items": {
          "type": "string"
        },
        "description": "API key IDs to apply this policy to. Required when `applies_to` is `api_keys`.",
        "example": [
          "ctxt_keyid_4b7e2f9a1c8d4e6fa3b5c7d9e1f20a4b"
        ]
      }
    },
    "required": [
      "name"
    ]
  },
  "UpdateAccessPolicyRequest": {
    "type": "object",
    "properties": {
      "name": {
        "type": "string",
        "minLength": 1,
        "description": "A name to recognize this policy.",
        "example": "Research sources"
      },
      "allowed_domains": {
        "type": "array",
        "items": {
          "type": "string"
        },
        "description": "Only these domains and their subdomains can be accessed. Send this or `blocked_domains`.",
        "example": [
          "arxiv.org",
          "*.gov"
        ]
      },
      "blocked_domains": {
        "type": "array",
        "items": {
          "type": "string"
        },
        "description": "These domains and their subdomains can't be accessed. Send this or `allowed_domains`.",
        "example": [
          "facebook.com",
          "tiktok.com"
        ]
      },
      "applies_to": {
        "type": "string",
        "enum": [
          "request",
          "api_keys",
          "organization"
        ],
        "description": "`request` applies when listed in `policies`. `api_keys` applies to every request made with `api_key_ids`. `organization` applies to every request."
      },
      "api_key_ids": {
        "type": "array",
        "items": {
          "type": "string"
        },
        "description": "API key IDs to apply this policy to. Required when `applies_to` is `api_keys`.",
        "example": [
          "ctxt_keyid_4b7e2f9a1c8d4e6fa3b5c7d9e1f20a4b"
        ]
      }
    }
  },
  "RequestTags": {
    "type": "array",
    "items": {
      "type": "string",
      "minLength": 1,
      "maxLength": 50
    },
    "maxItems": 20,
    "description": "Labels for filtering usage in the dashboard.",
    "example": [
      "production",
      "team-alpha"
    ]
  },
  "ScrapeRequest": {
    "type": "object",
    "properties": {
      "url": {
        "type": "string",
        "minLength": 1,
        "format": "uri",
        "pattern": "^[Hh][Tt][Tt][Pp][Ss]?://",
        "description": "Public HTTP or HTTPS URL to scrape."
      },
      "formats": {
        "$ref": "#/components/schemas/ScrapeFormats"
      },
      "sharedParams": {
        "$ref": "#/components/schemas/ScrapeSharedParams"
      },
      "markdownParams": {
        "$ref": "#/components/schemas/ScrapeMarkdownParams"
      },
      "screenshotParams": {
        "$ref": "#/components/schemas/ScrapeScreenshotParams"
      },
      "imageParams": {
        "$ref": "#/components/schemas/ScrapeImageParams"
      },
      "parseParams": {
        "$ref": "#/components/schemas/ScrapeParseParams"
      },
      "productParams": {
        "$ref": "#/components/schemas/ScrapeProductParams"
      },
      "highlightsParams": {
        "$ref": "#/components/schemas/ScrapeHighlightsParams"
      },
      "jsonParams": {
        "$ref": "#/components/schemas/ScrapeJsonParams"
      },
      "maxAgeMs": {
        "type": "integer",
        "minimum": 0,
        "maximum": 31536000000,
        "default": 259200000,
        "description": "Maximum age of a cached output, in milliseconds. `0` fetches fresh. Defaults to 3 days (259200000 ms). Maximum: 1 year (31536000000 ms)."
      },
      "zdr": {
        "type": "string",
        "enum": [
          "enabled",
          "disabled"
        ],
        "default": "disabled",
        "description": "`enabled` turns on zero data retention. Your organization must have ZDR enabled."
      },
      "timeoutOpts": {
        "$ref": "#/components/schemas/ScrapeTimeout"
      },
      "tags": {
        "$ref": "#/components/schemas/RequestTags"
      },
      "policies": {
        "type": "array",
        "items": {
          "type": "string"
        },
        "description": "Access policy IDs to apply. A URL must pass every policy.",
        "example": [
          "pol_3f9c2a7e5b8d4c1f9a6e0b2d7c4f8a1e"
        ]
      }
    },
    "required": [
      "url",
      "formats"
    ],
    "additionalProperties": false,
    "allOf": [
      {
        "if": {
          "required": [
            "markdownParams"
          ]
        },
        "then": {
          "properties": {
            "formats": {
              "required": [
                "markdown"
              ],
              "properties": {
                "markdown": {
                  "const": true
                }
              }
            }
          }
        }
      },
      {
        "if": {
          "required": [
            "screenshotParams"
          ]
        },
        "then": {
          "properties": {
            "formats": {
              "required": [
                "screenshot"
              ],
              "properties": {
                "screenshot": {
                  "const": true
                }
              }
            }
          }
        }
      },
      {
        "if": {
          "required": [
            "imageParams"
          ]
        },
        "then": {
          "properties": {
            "formats": {
              "required": [
                "images"
              ],
              "properties": {
                "images": {
                  "const": true
                }
              }
            }
          }
        }
      },
      {
        "if": {
          "required": [
            "parseParams"
          ]
        },
        "then": {
          "properties": {
            "formats": {
              "required": [
                "parse"
              ],
              "properties": {
                "parse": {
                  "const": true
                }
              }
            }
          }
        }
      },
      {
        "if": {
          "properties": {
            "formats": {
              "required": [
                "parse"
              ],
              "properties": {
                "parse": {
                  "const": true
                }
              }
            }
          }
        },
        "then": {
          "required": [
            "parseParams"
          ]
        }
      },
      {
        "if": {
          "required": [
            "productParams"
          ]
        },
        "then": {
          "properties": {
            "formats": {
              "required": [
                "product"
              ],
              "properties": {
                "product": {
                  "const": true
                }
              }
            }
          }
        }
      },
      {
        "if": {
          "required": [
            "highlightsParams"
          ]
        },
        "then": {
          "properties": {
            "formats": {
              "required": [
                "highlights"
              ],
              "properties": {
                "highlights": {
                  "const": true
                }
              }
            }
          }
        }
      },
      {
        "if": {
          "properties": {
            "formats": {
              "required": [
                "highlights"
              ],
              "properties": {
                "highlights": {
                  "const": true
                }
              }
            }
          }
        },
        "then": {
          "required": [
            "highlightsParams"
          ]
        }
      },
      {
        "if": {
          "required": [
            "jsonParams"
          ]
        },
        "then": {
          "properties": {
            "formats": {
              "required": [
                "json"
              ],
              "properties": {
                "json": {
                  "const": true
                }
              }
            }
          }
        }
      },
      {
        "if": {
          "properties": {
            "formats": {
              "required": [
                "json"
              ],
              "properties": {
                "json": {
                  "const": true
                }
              }
            }
          }
        },
        "then": {
          "required": [
            "jsonParams"
          ]
        }
      }
    ]
  },
  "NewsSearchByNaturalLanguage": {
    "type": "object",
    "properties": {
      "type": {
        "type": "string",
        "enum": [
          "natural_language"
        ],
        "description": "Use `natural_language` to search all news with a plain-language query."
      },
      "query": {
        "type": "string",
        "minLength": 2,
        "maxLength": 1000,
        "description": "What to search for, in plain language, such as \"chip export restrictions to China\"."
      }
    },
    "required": [
      "type",
      "query"
    ],
    "additionalProperties": false,
    "description": "Search all news with a plain-language query. Returns up to 100 matches, ordered by relevance.",
    "title": "By Natural Language"
  },
  "NewsSearchByEntity": {
    "type": "object",
    "properties": {
      "type": {
        "type": "string",
        "enum": [
          "entity"
        ],
        "description": "Use `entity` to find news about a specific company."
      },
      "entity": {
        "oneOf": [
          {
            "$ref": "#/components/schemas/NewsSearchEntityByName"
          },
          {
            "$ref": "#/components/schemas/NewsSearchEntityByDomain"
          },
          {
            "$ref": "#/components/schemas/NewsSearchEntityByTicker"
          },
          {
            "$ref": "#/components/schemas/NewsSearchEntityByIsin"
          }
        ],
        "discriminator": {
          "propertyName": "type",
          "mapping": {
            "name": "#/components/schemas/NewsSearchEntityByName",
            "domain": "#/components/schemas/NewsSearchEntityByDomain",
            "ticker": "#/components/schemas/NewsSearchEntityByTicker",
            "isin": "#/components/schemas/NewsSearchEntityByIsin"
          }
        },
        "description": "The company to search news for, identified by name, domain, ticker, or ISIN."
      }
    },
    "required": [
      "type",
      "entity"
    ],
    "additionalProperties": false,
    "description": "Find news about a specific company.",
    "title": "By Entity"
  },
  "AnswersRequest": {
    "type": "object",
    "properties": {
      "mode": {
        "type": "string",
        "enum": [
          "fast",
          "ultra"
        ],
        "description": "`fast` prioritizes speed, with extra verification for people and companies; `ultra` supports deeper research (default)."
      },
      "task": {
        "type": "string",
        "minLength": 1,
        "maxLength": 2000,
        "description": "Research task. The agent selects company/profile lookups, web searches, or page reads. Include domains or URLs to focus the research."
      },
      "json_format": {
        "type": "object",
        "additionalProperties": {},
        "description": "Example answer object, not JSON Schema. Up to 8 levels, 500 values, and 16000 characters; unknowns may be null."
      },
      "timeoutOpts": {
        "$ref": "#/components/schemas/PartialTimeout"
      },
      "tags": {
        "$ref": "#/components/schemas/RequestTags"
      },
      "zdr": {
        "type": "string",
        "enum": [
          "enabled",
          "disabled"
        ],
        "description": "`enabled` turns on zero data retention. Returns 403 `ZDR_NOT_ENABLED` unless your organization has ZDR."
      },
      "policies": {
        "type": "array",
        "items": {
          "type": "string"
        },
        "description": "Access policy IDs to apply. A URL must pass every policy.",
        "example": [
          "pol_3f9c2a7e5b8d4c1f9a6e0b2d7c4f8a1e"
        ]
      }
    },
    "required": [
      "task"
    ],
    "additionalProperties": false
  },
  "BrowserCountryCode": {
    "type": "string",
    "enum": [
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
      "zw"
    ],
    "example": "de",
    "description": "Fetch from this country (ISO 3166-1 alpha-2)."
  },
  "LenientTimeout": {
    "type": "object",
    "properties": {
      "milliseconds": {
        "type": "integer",
        "minimum": 1,
        "maximum": 300000,
        "description": "Deadline in milliseconds."
      },
      "behavior": {
        "type": "string",
        "enum": [
          "fail"
        ],
        "default": "fail",
        "description": "Only \"fail\" is supported: return 408 at the deadline."
      }
    },
    "required": [
      "milliseconds"
    ],
    "additionalProperties": false,
    "description": "Request deadline and what to return when it passes."
  },
  "HtmlExtractionRules": {
    "type": "object",
    "additionalProperties": {
      "anyOf": [
        {
          "type": "string",
          "minLength": 1,
          "maxLength": 2048
        },
        {
          "type": "object",
          "properties": {
            "selector": {
              "type": "string",
              "minLength": 1,
              "maxLength": 2048,
              "description": "CSS selector to match within the current page or parent rule."
            },
            "type": {
              "type": "string",
              "enum": [
                "item",
                "list"
              ],
              "description": "Return the first match with `item` or all matches with `list`."
            },
            "output": {
              "anyOf": [
                {
                  "type": "string",
                  "enum": [
                    "text",
                    "html"
                  ]
                },
                {
                  "type": "string",
                  "pattern": "^@.*$"
                },
                {
                  "$ref": "#/components/schemas/HtmlExtractionRules"
                }
              ],
              "description": "Return text, HTML, an attribute such as `@href`, or nested field rules. Defaults to text."
            }
          },
          "required": [
            "selector"
          ],
          "additionalProperties": false
        }
      ]
    }
  },
  "WebScrapeAction": {
    "oneOf": [
      {
        "$ref": "#/components/schemas/WebScrapeWaitAction"
      },
      {
        "$ref": "#/components/schemas/WebScrapePerformAction"
      },
      {
        "$ref": "#/components/schemas/WebScrapeScrollAction"
      }
    ],
    "discriminator": {
      "propertyName": "do",
      "mapping": {
        "wait": "#/components/schemas/WebScrapeWaitAction",
        "perform": "#/components/schemas/WebScrapePerformAction",
        "scroll": "#/components/schemas/WebScrapeScrollAction"
      }
    },
    "description": "Browser action discriminated by `do`. Each variant exposes only its applicable fields."
  },
  "ScrapeTimeout": {
    "type": "object",
    "properties": {
      "milliseconds": {
        "type": "integer",
        "minimum": 1,
        "maximum": 300000,
        "description": "Deadline in milliseconds."
      },
      "behavior": {
        "type": "string",
        "enum": [
          "fail",
          "return-partial"
        ],
        "default": "fail",
        "description": "\"fail\" returns 408 at the deadline. \"return-partial\" returns available results; inspect the response’s partial flag. \"return-partial\" requires at least 5000 ms."
      }
    },
    "required": [
      "milliseconds"
    ],
    "additionalProperties": false,
    "description": "Request deadline and what to return when it passes."
  },
  "LenientPartialTimeout": {
    "type": "object",
    "properties": {
      "milliseconds": {
        "type": "integer",
        "minimum": 1,
        "maximum": 300000,
        "description": "Deadline in milliseconds."
      },
      "behavior": {
        "type": "string",
        "enum": [
          "fail",
          "return-partial"
        ],
        "default": "fail",
        "description": "\"fail\" returns 408 at the deadline. \"return-partial\" returns available results; inspect the response’s partial flag."
      }
    },
    "required": [
      "milliseconds"
    ],
    "additionalProperties": false,
    "description": "Request deadline and what to return when it passes."
  },
  "PartialTimeout": {
    "type": "object",
    "properties": {
      "milliseconds": {
        "type": "integer",
        "minimum": 1000,
        "maximum": 300000,
        "description": "Deadline in milliseconds."
      },
      "behavior": {
        "type": "string",
        "enum": [
          "fail",
          "return-partial"
        ],
        "default": "fail",
        "description": "\"fail\" returns 408 at the deadline. \"return-partial\" returns available results; inspect the response’s partial flag."
      }
    },
    "required": [
      "milliseconds"
    ],
    "additionalProperties": false,
    "description": "Request deadline and what to return when it passes."
  },
  "PersonEnrichmentRequest": {
    "type": "object",
    "properties": {
      "social_urls": {
        "type": "array",
        "items": {
          "type": "string",
          "format": "uri"
        },
        "minItems": 1,
        "maxItems": 20,
        "description": "Public profile URLs for the person. A person-profile URL can identify the person without a name."
      },
      "name": {
        "type": "object",
        "properties": {
          "first": {
            "type": "string",
            "minLength": 1,
            "maxLength": 100,
            "description": "First or given name."
          },
          "last": {
            "type": "string",
            "minLength": 1,
            "maxLength": 100,
            "description": "Last or family name."
          }
        },
        "additionalProperties": false,
        "description": "Person name. Without an email or person-profile URL, provide both first and last name plus company, education, or location."
      },
      "email": {
        "type": "string",
        "maxLength": 320,
        "format": "email",
        "description": "Email address of the person to find."
      },
      "company": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string",
            "minLength": 1,
            "maxLength": 200,
            "description": "Name of a company associated with the person."
          },
          "domain": {
            "type": "string",
            "minLength": 1,
            "maxLength": 253,
            "description": "Website domain of a company associated with the person."
          }
        },
        "additionalProperties": false,
        "description": "Company context to help identify the person. Provide a name or domain."
      },
      "education": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "institution": {
              "type": "object",
              "properties": {
                "name": {
                  "type": "string",
                  "minLength": 1,
                  "maxLength": 200,
                  "description": "Name of the school or university."
                },
                "domain": {
                  "type": "string",
                  "minLength": 1,
                  "maxLength": 253,
                  "description": "Website domain of the school or university."
                }
              },
              "additionalProperties": false,
              "description": "School or university, identified by name or domain."
            },
            "degree": {
              "type": "string",
              "minLength": 1,
              "maxLength": 200,
              "description": "Degree or qualification earned."
            },
            "field_of_study": {
              "type": "string",
              "minLength": 1,
              "maxLength": 200,
              "description": "Subject or major studied."
            },
            "graduation_year": {
              "type": "integer",
              "minimum": 1900,
              "maximum": 2200,
              "description": "Four-digit graduation year."
            }
          },
          "additionalProperties": false
        },
        "minItems": 1,
        "maxItems": 10,
        "description": "Education history to help distinguish people with similar names."
      },
      "location": {
        "type": "object",
        "properties": {
          "city": {
            "type": "string",
            "minLength": 1,
            "maxLength": 200,
            "description": "City associated with the person."
          },
          "region": {
            "type": "string",
            "minLength": 1,
            "maxLength": 200,
            "description": "State, province, or region associated with the person."
          },
          "country": {
            "type": "string",
            "minLength": 1,
            "maxLength": 200,
            "description": "Country associated with the person."
          }
        },
        "additionalProperties": false,
        "description": "Location context to help identify the person. Provide a city, region, or country."
      },
      "timeoutOpts": {
        "$ref": "#/components/schemas/PartialTimeout"
      },
      "zdr": {
        "type": "string",
        "enum": [
          "enabled",
          "disabled"
        ],
        "description": "`enabled` turns on zero data retention. Returns 403 `ZDR_NOT_ENABLED` unless your organization has ZDR."
      },
      "tags": {
        "$ref": "#/components/schemas/RequestTags"
      }
    },
    "additionalProperties": false,
    "description": "Identity clues for one person. Provide a person email, a person-profile social URL, or both first and last name with company, education, or location. All supplied clues are considered together."
  },
  "PersonRetrieveRequest": {
    "type": "object",
    "properties": {
      "identifiers": {
        "type": "object",
        "properties": {
          "linkedinUrl": {
            "type": "string",
            "format": "uri",
            "description": "LinkedIn profile URL, e.g. https://www.linkedin.com/in/yahia-bakour/."
          }
        },
        "additionalProperties": false,
        "description": "Known identifiers for the person. At least one identifier is required."
      },
      "timeoutOpts": {
        "$ref": "#/components/schemas/PartialTimeout"
      },
      "tags": {
        "$ref": "#/components/schemas/RequestTags"
      }
    },
    "required": [
      "identifiers"
    ],
    "additionalProperties": false
  },
  "StockExchange": {
    "type": "string",
    "enum": [
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
      "XETRA"
    ],
    "description": "Stock exchange code."
  },
  "SupportedLanguage": {
    "type": "string",
    "enum": [
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
      "zulu"
    ],
    "description": "Language, e.g. `english`."
  },
  "BrandRetrieveRequest": {
    "oneOf": [
      {
        "$ref": "#/components/schemas/BrandRetrieveByDomainRequest"
      },
      {
        "$ref": "#/components/schemas/BrandRetrieveByNameRequest"
      },
      {
        "$ref": "#/components/schemas/BrandRetrieveByEmailRequest"
      },
      {
        "$ref": "#/components/schemas/BrandRetrieveByTickerRequest"
      },
      {
        "$ref": "#/components/schemas/BrandRetrieveByDirectUrlRequest"
      },
      {
        "$ref": "#/components/schemas/BrandRetrieveFromTransactionRequest"
      }
    ],
    "discriminator": {
      "propertyName": "type",
      "mapping": {
        "by_domain": "#/components/schemas/BrandRetrieveByDomainRequest",
        "by_name": "#/components/schemas/BrandRetrieveByNameRequest",
        "by_email": "#/components/schemas/BrandRetrieveByEmailRequest",
        "by_ticker": "#/components/schemas/BrandRetrieveByTickerRequest",
        "by_direct_url": "#/components/schemas/BrandRetrieveByDirectUrlRequest",
        "by_transaction": "#/components/schemas/BrandRetrieveFromTransactionRequest"
      }
    },
    "description": "One lookup, chosen by `type`."
  },
  "CountryGL": {
    "type": "string",
    "enum": [
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
      "zw"
    ],
    "description": "Two-letter ISO 3166-1 alpha-2 country code (GL parameter) used to localize search."
  },
  "Timeout": {
    "type": "object",
    "properties": {
      "milliseconds": {
        "type": "integer",
        "minimum": 1000,
        "maximum": 300000,
        "description": "Deadline in milliseconds."
      },
      "behavior": {
        "type": "string",
        "enum": [
          "fail"
        ],
        "default": "fail",
        "description": "Only \"fail\" is supported: return 408 at the deadline."
      }
    },
    "required": [
      "milliseconds"
    ],
    "additionalProperties": false,
    "description": "Request deadline and what to return when it passes."
  },
  "UtilityPrefetchIdentifier": {
    "oneOf": [
      {
        "$ref": "#/components/schemas/UtilityPrefetchDomainIdentifier"
      },
      {
        "$ref": "#/components/schemas/UtilityPrefetchEmailIdentifier"
      }
    ],
    "description": "Identifier of the target to prefetch. Provide exactly one of domain or email."
  },
  "MonitorsCreateMonitorRequest": {
    "type": "object",
    "properties": {
      "mode": {
        "$ref": "#/components/schemas/MonitorsMode"
      },
      "name": {
        "type": "string",
        "minLength": 1,
        "maxLength": 200,
        "description": "Display name for the monitor.",
        "example": "Acme pricing monitor"
      },
      "tags": {
        "type": "array",
        "items": {
          "type": "string",
          "minLength": 1,
          "maxLength": 50
        },
        "maxItems": 20,
        "uniqueItems": true,
        "description": "Labels for filtering monitors, their changes, and their usage.",
        "example": [
          "pricing",
          "competitor"
        ]
      },
      "target": {
        "$ref": "#/components/schemas/MonitorsTarget"
      },
      "change_detection": {
        "$ref": "#/components/schemas/MonitorsChangeDetection"
      },
      "schedule": {
        "$ref": "#/components/schemas/MonitorsSchedule"
      },
      "webhook": {
        "$ref": "#/components/schemas/MonitorsNullableWebhookConfig"
      },
      "policies": {
        "type": "array",
        "items": {
          "type": "string"
        },
        "description": "Access policy IDs to apply to every run.",
        "example": [
          "pol_3f9c2a7e5b8d4c1f9a6e0b2d7c4f8a1e"
        ]
      }
    },
    "required": [
      "name",
      "target"
    ],
    "additionalProperties": false,
    "title": "Create monitor request",
    "description": "Monitor target, detection method, and schedule. Omitted schedules run daily."
  },
  "MonitorsUpdateMonitorRequest": {
    "type": "object",
    "properties": {
      "name": {
        "type": "string",
        "minLength": 1,
        "maxLength": 200,
        "description": "Display name for the monitor.",
        "example": "Acme pricing monitor"
      },
      "tags": {
        "type": "array",
        "items": {
          "type": "string",
          "minLength": 1,
          "maxLength": 50
        },
        "maxItems": 20,
        "uniqueItems": true,
        "description": "Labels for filtering monitors, their changes, and their usage.",
        "example": [
          "pricing",
          "competitor"
        ]
      },
      "status": {
        "type": "string",
        "enum": [
          "active",
          "paused"
        ],
        "description": "Set `paused` to stop scheduled runs or `active` to resume them."
      },
      "target": {
        "$ref": "#/components/schemas/MonitorsTarget"
      },
      "change_detection": {
        "$ref": "#/components/schemas/MonitorsChangeDetection"
      },
      "schedule": {
        "$ref": "#/components/schemas/MonitorsSchedule"
      },
      "webhook": {
        "$ref": "#/components/schemas/MonitorsNullableWebhookConfig",
        "description": "Set to null to remove the webhook. Changing `url` issues a new secret."
      },
      "policies": {
        "type": "array",
        "items": {
          "type": "string"
        },
        "description": "Access policy IDs to apply to every run. Send an empty list to remove them.",
        "example": [
          "pol_3f9c2a7e5b8d4c1f9a6e0b2d7c4f8a1e"
        ]
      }
    },
    "additionalProperties": false,
    "description": "Send only the fields to change. `target` replaces the whole target."
  },
  "MonitorsRunStatus": {
    "type": "string",
    "enum": [
      "queued",
      "running",
      "completed",
      "failed",
      "skipped"
    ],
    "description": "Lifecycle status of a run. `skipped` runs never executed — see `skip_reason` (insufficient credits, monitor paused, or superseded by a concurrent run)."
  },
  "BatchSubmitRequest": {
    "type": "object",
    "properties": {
      "input": {
        "oneOf": [
          {
            "type": "object",
            "properties": {
              "mode": {
                "type": "string",
                "enum": [
                  "scrape"
                ],
                "description": "Scrape the pages in `data.urls`."
              },
              "data": {
                "oneOf": [
                  {
                    "type": "object",
                    "properties": {
                      "format": {
                        "type": "string",
                        "enum": [
                          "markdown"
                        ],
                        "description": "Return page content as Markdown."
                      },
                      "urls": {
                        "type": "array",
                        "items": {
                          "type": "object",
                          "properties": {
                            "url": {
                              "type": "string",
                              "minLength": 1,
                              "description": "Page URL to scrape.",
                              "example": "https://example.com/products/anvil"
                            },
                            "itemId": {
                              "type": "string",
                              "minLength": 1,
                              "maxLength": 200,
                              "description": "Your ID for this page, returned with its result. The same URL can use different IDs.",
                              "example": "sku-1"
                            },
                            "meta": {
                              "type": "object",
                              "additionalProperties": {},
                              "description": "Custom JSON returned unchanged with this page result."
                            }
                          },
                          "required": [
                            "url"
                          ],
                          "additionalProperties": false,
                          "description": "A page to scrape, with optional data for matching results."
                        },
                        "minItems": 1,
                        "maxItems": 100000,
                        "description": "Pages to scrape. Maximum 100000."
                      },
                      "options": {
                        "type": "object",
                        "properties": {
                          "includeLinks": {
                            "type": "boolean",
                            "default": true,
                            "description": "Include links in the Markdown (`html-conversion` only)."
                          },
                          "includeImages": {
                            "type": "boolean",
                            "default": false,
                            "description": "Include image references in the Markdown (`html-conversion` only)."
                          },
                          "shortenBase64Images": {
                            "type": "boolean",
                            "default": true,
                            "description": "Shorten inline base64 image data (`html-conversion` only)."
                          },
                          "useMainContentOnly": {
                            "type": "boolean",
                            "default": false,
                            "description": "Return the main content without navigation or footers."
                          },
                          "includeHTML": {
                            "type": "boolean",
                            "default": false,
                            "description": "Also return each page's HTML in `html`."
                          },
                          "sourcePreference": {
                            "type": "array",
                            "items": {
                              "type": "string",
                              "enum": [
                                "html-conversion",
                                "markdown-direct"
                              ]
                            },
                            "minItems": 1,
                            "default": [
                              "html-conversion",
                              "markdown-direct"
                            ],
                            "uniqueItems": true,
                            "description": "Markdown sources in order of preference: `html-conversion` converts the page HTML, `markdown-direct` uses Markdown the site publishes."
                          },
                          "pdf": {
                            "type": "object",
                            "properties": {
                              "shouldParse": {
                                "type": "boolean",
                                "default": true,
                                "description": "Parse PDF URLs. When false, PDFs fail with `PDF_SKIPPED`."
                              },
                              "start": {
                                "type": "integer",
                                "minimum": 1,
                                "description": "First 1-based PDF page to parse."
                              },
                              "end": {
                                "type": "integer",
                                "minimum": 1,
                                "description": "Last PDF page to parse (1-based, inclusive). Defaults to the final page. Must be >= start."
                              },
                              "ocr": {
                                "type": "boolean",
                                "default": false,
                                "description": "Read scanned PDF pages with OCR; preserve pages that already have text."
                              }
                            },
                            "default": {
                              "shouldParse": true,
                              "ocr": false
                            },
                            "description": "PDF handling. `start`/`end` limit parsing to an inclusive, 1-based page range."
                          },
                          "includeSelectors": {
                            "type": [
                              "array",
                              "null"
                            ],
                            "items": {
                              "type": "string",
                              "minLength": 1,
                              "maxLength": 2048
                            },
                            "maxItems": 50,
                            "description": "Keep only elements matching these CSS selectors. Filtered pages ignore `maxAgeMs`."
                          },
                          "excludeSelectors": {
                            "type": [
                              "array",
                              "null"
                            ],
                            "items": {
                              "type": "string",
                              "minLength": 1,
                              "maxLength": 2048
                            },
                            "maxItems": 50,
                            "description": "Remove elements matching these CSS selectors. Applied after `includeSelectors`, so an element matching both is removed."
                          },
                          "waitForMs": {
                            "type": "integer",
                            "minimum": 0,
                            "maximum": 15000,
                            "description": "How long to wait after initial page load, in milliseconds. `0` waits 500 ms."
                          },
                          "settleAnimations": {
                            "type": "boolean",
                            "default": false,
                            "description": "Wait for CSS animations to finish before extracting, on browser-rendered pages."
                          },
                          "country": {
                            "$ref": "#/components/schemas/BrowserCountryCode"
                          },
                          "maxAgeMs": {
                            "type": [
                              "integer",
                              "null"
                            ],
                            "minimum": 0,
                            "maximum": 31536000000,
                            "default": 259200000,
                            "description": "Maximum cache age in milliseconds. Defaults to 3 days (259200000 ms). Maximum: 1 year (31536000000 ms). `0` fetches fresh."
                          }
                        },
                        "additionalProperties": false,
                        "description": "Options for Markdown output."
                      }
                    },
                    "required": [
                      "format",
                      "urls"
                    ],
                    "additionalProperties": false,
                    "description": "Scrape the listed pages as Markdown.",
                    "title": "Markdown",
                    "deprecated": true,
                    "x-stainless-skip": [
                      "php"
                    ]
                  },
                  {
                    "type": "object",
                    "properties": {
                      "format": {
                        "type": "string",
                        "enum": [
                          "html"
                        ],
                        "description": "Return page content as HTML."
                      },
                      "urls": {
                        "type": "array",
                        "items": {
                          "type": "object",
                          "properties": {
                            "url": {
                              "type": "string",
                              "minLength": 1,
                              "description": "Page URL to scrape.",
                              "example": "https://example.com/products/anvil"
                            },
                            "itemId": {
                              "type": "string",
                              "minLength": 1,
                              "maxLength": 200,
                              "description": "Your ID for this page, returned with its result. The same URL can use different IDs.",
                              "example": "sku-1"
                            },
                            "meta": {
                              "type": "object",
                              "additionalProperties": {},
                              "description": "Custom JSON returned unchanged with this page result."
                            }
                          },
                          "required": [
                            "url"
                          ],
                          "additionalProperties": false,
                          "description": "A page to scrape, with optional data for matching results."
                        },
                        "minItems": 1,
                        "maxItems": 100000,
                        "description": "Pages to scrape. Maximum 100000."
                      },
                      "options": {
                        "type": "object",
                        "properties": {
                          "useMainContentOnly": {
                            "type": "boolean",
                            "default": false,
                            "description": "Return the main content without navigation or footers."
                          },
                          "pdf": {
                            "type": "object",
                            "properties": {
                              "shouldParse": {
                                "type": "boolean",
                                "default": true,
                                "description": "Parse PDF URLs. When false, PDFs fail with `PDF_SKIPPED`."
                              },
                              "start": {
                                "type": "integer",
                                "minimum": 1,
                                "description": "First 1-based PDF page to parse."
                              },
                              "end": {
                                "type": "integer",
                                "minimum": 1,
                                "description": "Last PDF page to parse (1-based, inclusive). Defaults to the final page. Must be >= start."
                              },
                              "ocr": {
                                "type": "boolean",
                                "default": false,
                                "description": "Read scanned PDF pages with OCR; preserve pages that already have text."
                              }
                            },
                            "default": {
                              "shouldParse": true,
                              "ocr": false
                            },
                            "description": "PDF handling. `start`/`end` limit parsing to an inclusive, 1-based page range."
                          },
                          "includeSelectors": {
                            "type": [
                              "array",
                              "null"
                            ],
                            "items": {
                              "type": "string",
                              "minLength": 1,
                              "maxLength": 2048
                            },
                            "maxItems": 50,
                            "description": "Keep only elements matching these CSS selectors. Filtered pages ignore `maxAgeMs`."
                          },
                          "excludeSelectors": {
                            "type": [
                              "array",
                              "null"
                            ],
                            "items": {
                              "type": "string",
                              "minLength": 1,
                              "maxLength": 2048
                            },
                            "maxItems": 50,
                            "description": "Remove elements matching these CSS selectors. Applied after `includeSelectors`, so an element matching both is removed."
                          },
                          "waitForMs": {
                            "type": "integer",
                            "minimum": 0,
                            "maximum": 15000,
                            "description": "How long to wait after initial page load, in milliseconds. `0` waits 500 ms."
                          },
                          "settleAnimations": {
                            "type": "boolean",
                            "default": false,
                            "description": "Wait for CSS animations to finish before extracting, on browser-rendered pages."
                          },
                          "country": {
                            "$ref": "#/components/schemas/BrowserCountryCode"
                          },
                          "maxAgeMs": {
                            "type": [
                              "integer",
                              "null"
                            ],
                            "minimum": 0,
                            "maximum": 31536000000,
                            "default": 259200000,
                            "description": "Maximum cache age in milliseconds. Defaults to 3 days (259200000 ms). Maximum: 1 year (31536000000 ms). `0` fetches fresh."
                          }
                        },
                        "default": {
                          "useMainContentOnly": false,
                          "pdf": {
                            "shouldParse": true,
                            "ocr": false
                          },
                          "settleAnimations": false,
                          "maxAgeMs": 259200000
                        },
                        "additionalProperties": false,
                        "description": "Options for HTML output."
                      }
                    },
                    "required": [
                      "format",
                      "urls"
                    ],
                    "additionalProperties": false,
                    "description": "Scrape the listed pages as HTML.",
                    "title": "HTML",
                    "deprecated": true,
                    "x-stainless-skip": [
                      "php"
                    ]
                  },
                  {
                    "$ref": "#/components/schemas/BatchUnifiedScrapeData"
                  }
                ],
                "title": "Scrape data",
                "description": "Pages to scrape and their output format."
              }
            },
            "required": [
              "mode",
              "data"
            ],
            "additionalProperties": false,
            "title": "Scrape",
            "description": "Scrape a list of up to 100,000 URLs."
          },
          {
            "type": "object",
            "properties": {
              "mode": {
                "type": "string",
                "enum": [
                  "crawl"
                ],
                "description": "Discover and scrape pages from `data.source`."
              },
              "data": {
                "oneOf": [
                  {
                    "type": "object",
                    "properties": {
                      "format": {
                        "type": "string",
                        "enum": [
                          "markdown"
                        ],
                        "description": "Return page content as Markdown."
                      },
                      "source": {
                        "oneOf": [
                          {
                            "type": "object",
                            "properties": {
                              "type": {
                                "type": "string",
                                "enum": [
                                  "start_url"
                                ],
                                "description": "Start from one page."
                              },
                              "url": {
                                "type": "string",
                                "minLength": 1,
                                "description": "Page where crawling begins. A URL without a scheme is read as https://.",
                                "example": "https://example.com/docs"
                              },
                              "controls": {
                                "type": "object",
                                "properties": {
                                  "maxUrls": {
                                    "type": "integer",
                                    "minimum": 1,
                                    "maximum": 100000,
                                    "default": 100,
                                    "description": "Maximum pages to fetch. Unused reserved credits are refunded. Maximum 100000."
                                  },
                                  "maxDepth": {
                                    "type": "integer",
                                    "minimum": 0,
                                    "maximum": 50,
                                    "description": "Maximum link depth. Source pages are depth 0. No limit when omitted."
                                  },
                                  "followSubdomains": {
                                    "type": "boolean",
                                    "default": false,
                                    "description": "Follow links to subdomains."
                                  },
                                  "regex": {
                                    "type": "string",
                                    "maxLength": 256,
                                    "description": "Regex pattern for URLs to include. The `start_url` itself is always included.",
                                    "example": "^https://example\\.com/docs/"
                                  },
                                  "excludeRegex": {
                                    "type": "string",
                                    "maxLength": 256,
                                    "description": "Regex pattern for URLs to exclude, even when they match `regex`. The `start_url` itself is always included.",
                                    "example": "/tag/|/author/"
                                  },
                                  "languages": {
                                    "anyOf": [
                                      {
                                        "type": "string",
                                        "enum": [
                                          "same_as_start_url"
                                        ]
                                      },
                                      {
                                        "type": "array",
                                        "items": {
                                          "type": "string",
                                          "enum": [
                                            "am",
                                            "ar",
                                            "az",
                                            "be",
                                            "bg",
                                            "bn",
                                            "ca",
                                            "ceb",
                                            "cs",
                                            "cy",
                                            "da",
                                            "de",
                                            "el",
                                            "en",
                                            "es",
                                            "et",
                                            "eu",
                                            "fa",
                                            "fi",
                                            "fr",
                                            "gu",
                                            "ha",
                                            "haw",
                                            "he",
                                            "hi",
                                            "hr",
                                            "hu",
                                            "hy",
                                            "id",
                                            "is",
                                            "it",
                                            "ja",
                                            "ka",
                                            "kk",
                                            "kn",
                                            "ko",
                                            "ku",
                                            "ky",
                                            "lo",
                                            "lt",
                                            "lv",
                                            "mk",
                                            "ml",
                                            "mn",
                                            "mr",
                                            "ms",
                                            "ne",
                                            "nl",
                                            "no",
                                            "or",
                                            "pa",
                                            "pl",
                                            "ps",
                                            "pt",
                                            "ro",
                                            "ru",
                                            "sk",
                                            "sl",
                                            "so",
                                            "sq",
                                            "sr",
                                            "sv",
                                            "sw",
                                            "ta",
                                            "te",
                                            "th",
                                            "tl",
                                            "tr",
                                            "uk",
                                            "ur",
                                            "uz",
                                            "vi",
                                            "yo",
                                            "zh"
                                          ]
                                        },
                                        "minItems": 1
                                      }
                                    ],
                                    "description": "Only follow pages in these languages, or `same_as_start_url`; all languages when omitted.",
                                    "example": "same_as_start_url"
                                  }
                                },
                                "default": {
                                  "maxUrls": 100,
                                  "followSubdomains": false
                                },
                                "additionalProperties": false,
                                "description": "Limits and filters for page discovery."
                              }
                            },
                            "required": [
                              "type",
                              "url"
                            ],
                            "additionalProperties": false,
                            "description": "Discover pages by following links from one URL.",
                            "title": "Start URL"
                          },
                          {
                            "type": "object",
                            "properties": {
                              "type": {
                                "type": "string",
                                "enum": [
                                  "sitemap"
                                ],
                                "description": "Scrape the URLs in the domain's sitemap."
                              },
                              "domain": {
                                "type": "string",
                                "minLength": 3,
                                "description": "Domain whose sitemap lists the pages to scrape. A full URL is reduced to its domain.",
                                "example": "example.com"
                              },
                              "controls": {
                                "type": "object",
                                "properties": {
                                  "maxUrls": {
                                    "type": "integer",
                                    "minimum": 1,
                                    "maximum": 100000,
                                    "default": 100,
                                    "description": "Maximum pages to fetch. Unused reserved credits are refunded. Maximum 100000."
                                  },
                                  "regex": {
                                    "type": "string",
                                    "maxLength": 256,
                                    "description": "Regex pattern; only sitemap URLs matching it are scraped.",
                                    "example": "^https://example\\.com/docs/"
                                  },
                                  "excludeRegex": {
                                    "type": "string",
                                    "maxLength": 256,
                                    "description": "Regex pattern; sitemap URLs matching it are not scraped, even when they match `regex`.",
                                    "example": "/tag/|/author/"
                                  }
                                },
                                "default": {
                                  "maxUrls": 100
                                },
                                "additionalProperties": false,
                                "description": "Limits and filters for the sitemap URLs. A sitemap batch scrapes exactly those URLs and never follows links off them, so there is no crawl depth here."
                              }
                            },
                            "required": [
                              "type",
                              "domain"
                            ],
                            "additionalProperties": false,
                            "description": "Scrape the pages listed in a domain's sitemap. Links on those pages are not followed.",
                            "title": "Sitemap"
                          }
                        ],
                        "discriminator": {
                          "propertyName": "type"
                        },
                        "title": "Crawl source",
                        "description": "How to find pages to crawl."
                      },
                      "options": {
                        "type": "object",
                        "properties": {
                          "includeLinks": {
                            "type": "boolean",
                            "default": true,
                            "description": "Include links in the Markdown (`html-conversion` only)."
                          },
                          "includeImages": {
                            "type": "boolean",
                            "default": false,
                            "description": "Include image references in the Markdown (`html-conversion` only)."
                          },
                          "shortenBase64Images": {
                            "type": "boolean",
                            "default": true,
                            "description": "Shorten inline base64 image data (`html-conversion` only)."
                          },
                          "useMainContentOnly": {
                            "type": "boolean",
                            "default": false,
                            "description": "Return the main content without navigation or footers."
                          },
                          "includeHTML": {
                            "type": "boolean",
                            "default": false,
                            "description": "Also return each page's HTML in `html`."
                          },
                          "sourcePreference": {
                            "type": "array",
                            "items": {
                              "type": "string",
                              "enum": [
                                "html-conversion",
                                "markdown-direct"
                              ]
                            },
                            "minItems": 1,
                            "default": [
                              "html-conversion",
                              "markdown-direct"
                            ],
                            "uniqueItems": true,
                            "description": "Markdown sources in order of preference: `html-conversion` converts the page HTML, `markdown-direct` uses Markdown the site publishes."
                          },
                          "pdf": {
                            "type": "object",
                            "properties": {
                              "shouldParse": {
                                "type": "boolean",
                                "default": true,
                                "description": "Parse PDF URLs. When false, PDFs fail with `PDF_SKIPPED`."
                              },
                              "start": {
                                "type": "integer",
                                "minimum": 1,
                                "description": "First 1-based PDF page to parse."
                              },
                              "end": {
                                "type": "integer",
                                "minimum": 1,
                                "description": "Last PDF page to parse (1-based, inclusive). Defaults to the final page. Must be >= start."
                              },
                              "ocr": {
                                "type": "boolean",
                                "default": false,
                                "description": "Read scanned PDF pages with OCR; preserve pages that already have text."
                              }
                            },
                            "default": {
                              "shouldParse": true,
                              "ocr": false
                            },
                            "description": "PDF handling. `start`/`end` limit parsing to an inclusive, 1-based page range."
                          },
                          "includeSelectors": {
                            "type": [
                              "array",
                              "null"
                            ],
                            "items": {
                              "type": "string",
                              "minLength": 1,
                              "maxLength": 2048
                            },
                            "maxItems": 50,
                            "description": "Keep only elements matching these CSS selectors. Filtered pages ignore `maxAgeMs`."
                          },
                          "excludeSelectors": {
                            "type": [
                              "array",
                              "null"
                            ],
                            "items": {
                              "type": "string",
                              "minLength": 1,
                              "maxLength": 2048
                            },
                            "maxItems": 50,
                            "description": "Remove elements matching these CSS selectors. Applied after `includeSelectors`, so an element matching both is removed."
                          },
                          "waitForMs": {
                            "type": "integer",
                            "minimum": 0,
                            "maximum": 15000,
                            "description": "How long to wait after initial page load, in milliseconds. `0` waits 500 ms."
                          },
                          "settleAnimations": {
                            "type": "boolean",
                            "default": false,
                            "description": "Wait for CSS animations to finish before extracting, on browser-rendered pages."
                          },
                          "country": {
                            "$ref": "#/components/schemas/BrowserCountryCode"
                          },
                          "maxAgeMs": {
                            "type": [
                              "integer",
                              "null"
                            ],
                            "minimum": 0,
                            "maximum": 31536000000,
                            "default": 259200000,
                            "description": "Maximum cache age in milliseconds. Defaults to 3 days (259200000 ms). Maximum: 1 year (31536000000 ms). `0` fetches fresh."
                          }
                        },
                        "additionalProperties": false,
                        "description": "Options for Markdown output."
                      }
                    },
                    "required": [
                      "format",
                      "source"
                    ],
                    "additionalProperties": false,
                    "title": "Markdown",
                    "description": "Crawl pages and return Markdown.",
                    "deprecated": true,
                    "x-stainless-skip": [
                      "php"
                    ]
                  },
                  {
                    "type": "object",
                    "properties": {
                      "format": {
                        "type": "string",
                        "enum": [
                          "html"
                        ],
                        "description": "Return page content as HTML."
                      },
                      "source": {
                        "oneOf": [
                          {
                            "type": "object",
                            "properties": {
                              "type": {
                                "type": "string",
                                "enum": [
                                  "start_url"
                                ],
                                "description": "Start from one page."
                              },
                              "url": {
                                "type": "string",
                                "minLength": 1,
                                "description": "Page where crawling begins. A URL without a scheme is read as https://.",
                                "example": "https://example.com/docs"
                              },
                              "controls": {
                                "type": "object",
                                "properties": {
                                  "maxUrls": {
                                    "type": "integer",
                                    "minimum": 1,
                                    "maximum": 100000,
                                    "default": 100,
                                    "description": "Maximum pages to fetch. Unused reserved credits are refunded. Maximum 100000."
                                  },
                                  "maxDepth": {
                                    "type": "integer",
                                    "minimum": 0,
                                    "maximum": 50,
                                    "description": "Maximum link depth. Source pages are depth 0. No limit when omitted."
                                  },
                                  "followSubdomains": {
                                    "type": "boolean",
                                    "default": false,
                                    "description": "Follow links to subdomains."
                                  },
                                  "regex": {
                                    "type": "string",
                                    "maxLength": 256,
                                    "description": "Regex pattern for URLs to include. The `start_url` itself is always included.",
                                    "example": "^https://example\\.com/docs/"
                                  },
                                  "excludeRegex": {
                                    "type": "string",
                                    "maxLength": 256,
                                    "description": "Regex pattern for URLs to exclude, even when they match `regex`. The `start_url` itself is always included.",
                                    "example": "/tag/|/author/"
                                  },
                                  "languages": {
                                    "anyOf": [
                                      {
                                        "type": "string",
                                        "enum": [
                                          "same_as_start_url"
                                        ]
                                      },
                                      {
                                        "type": "array",
                                        "items": {
                                          "type": "string",
                                          "enum": [
                                            "am",
                                            "ar",
                                            "az",
                                            "be",
                                            "bg",
                                            "bn",
                                            "ca",
                                            "ceb",
                                            "cs",
                                            "cy",
                                            "da",
                                            "de",
                                            "el",
                                            "en",
                                            "es",
                                            "et",
                                            "eu",
                                            "fa",
                                            "fi",
                                            "fr",
                                            "gu",
                                            "ha",
                                            "haw",
                                            "he",
                                            "hi",
                                            "hr",
                                            "hu",
                                            "hy",
                                            "id",
                                            "is",
                                            "it",
                                            "ja",
                                            "ka",
                                            "kk",
                                            "kn",
                                            "ko",
                                            "ku",
                                            "ky",
                                            "lo",
                                            "lt",
                                            "lv",
                                            "mk",
                                            "ml",
                                            "mn",
                                            "mr",
                                            "ms",
                                            "ne",
                                            "nl",
                                            "no",
                                            "or",
                                            "pa",
                                            "pl",
                                            "ps",
                                            "pt",
                                            "ro",
                                            "ru",
                                            "sk",
                                            "sl",
                                            "so",
                                            "sq",
                                            "sr",
                                            "sv",
                                            "sw",
                                            "ta",
                                            "te",
                                            "th",
                                            "tl",
                                            "tr",
                                            "uk",
                                            "ur",
                                            "uz",
                                            "vi",
                                            "yo",
                                            "zh"
                                          ]
                                        },
                                        "minItems": 1
                                      }
                                    ],
                                    "description": "Only follow pages in these languages, or `same_as_start_url`; all languages when omitted.",
                                    "example": "same_as_start_url"
                                  }
                                },
                                "default": {
                                  "maxUrls": 100,
                                  "followSubdomains": false
                                },
                                "additionalProperties": false,
                                "description": "Limits and filters for page discovery."
                              }
                            },
                            "required": [
                              "type",
                              "url"
                            ],
                            "additionalProperties": false,
                            "description": "Discover pages by following links from one URL.",
                            "title": "Start URL"
                          },
                          {
                            "type": "object",
                            "properties": {
                              "type": {
                                "type": "string",
                                "enum": [
                                  "sitemap"
                                ],
                                "description": "Scrape the URLs in the domain's sitemap."
                              },
                              "domain": {
                                "type": "string",
                                "minLength": 3,
                                "description": "Domain whose sitemap lists the pages to scrape. A full URL is reduced to its domain.",
                                "example": "example.com"
                              },
                              "controls": {
                                "type": "object",
                                "properties": {
                                  "maxUrls": {
                                    "type": "integer",
                                    "minimum": 1,
                                    "maximum": 100000,
                                    "default": 100,
                                    "description": "Maximum pages to fetch. Unused reserved credits are refunded. Maximum 100000."
                                  },
                                  "regex": {
                                    "type": "string",
                                    "maxLength": 256,
                                    "description": "Regex pattern; only sitemap URLs matching it are scraped.",
                                    "example": "^https://example\\.com/docs/"
                                  },
                                  "excludeRegex": {
                                    "type": "string",
                                    "maxLength": 256,
                                    "description": "Regex pattern; sitemap URLs matching it are not scraped, even when they match `regex`.",
                                    "example": "/tag/|/author/"
                                  }
                                },
                                "default": {
                                  "maxUrls": 100
                                },
                                "additionalProperties": false,
                                "description": "Limits and filters for the sitemap URLs. A sitemap batch scrapes exactly those URLs and never follows links off them, so there is no crawl depth here."
                              }
                            },
                            "required": [
                              "type",
                              "domain"
                            ],
                            "additionalProperties": false,
                            "description": "Scrape the pages listed in a domain's sitemap. Links on those pages are not followed.",
                            "title": "Sitemap"
                          }
                        ],
                        "discriminator": {
                          "propertyName": "type"
                        },
                        "title": "Crawl source",
                        "description": "How to find pages to crawl."
                      },
                      "options": {
                        "type": "object",
                        "properties": {
                          "useMainContentOnly": {
                            "type": "boolean",
                            "default": false,
                            "description": "Return the main content without navigation or footers."
                          },
                          "pdf": {
                            "type": "object",
                            "properties": {
                              "shouldParse": {
                                "type": "boolean",
                                "default": true,
                                "description": "Parse PDF URLs. When false, PDFs fail with `PDF_SKIPPED`."
                              },
                              "start": {
                                "type": "integer",
                                "minimum": 1,
                                "description": "First 1-based PDF page to parse."
                              },
                              "end": {
                                "type": "integer",
                                "minimum": 1,
                                "description": "Last PDF page to parse (1-based, inclusive). Defaults to the final page. Must be >= start."
                              },
                              "ocr": {
                                "type": "boolean",
                                "default": false,
                                "description": "Read scanned PDF pages with OCR; preserve pages that already have text."
                              }
                            },
                            "default": {
                              "shouldParse": true,
                              "ocr": false
                            },
                            "description": "PDF handling. `start`/`end` limit parsing to an inclusive, 1-based page range."
                          },
                          "includeSelectors": {
                            "type": [
                              "array",
                              "null"
                            ],
                            "items": {
                              "type": "string",
                              "minLength": 1,
                              "maxLength": 2048
                            },
                            "maxItems": 50,
                            "description": "Keep only elements matching these CSS selectors. Filtered pages ignore `maxAgeMs`."
                          },
                          "excludeSelectors": {
                            "type": [
                              "array",
                              "null"
                            ],
                            "items": {
                              "type": "string",
                              "minLength": 1,
                              "maxLength": 2048
                            },
                            "maxItems": 50,
                            "description": "Remove elements matching these CSS selectors. Applied after `includeSelectors`, so an element matching both is removed."
                          },
                          "waitForMs": {
                            "type": "integer",
                            "minimum": 0,
                            "maximum": 15000,
                            "description": "How long to wait after initial page load, in milliseconds. `0` waits 500 ms."
                          },
                          "settleAnimations": {
                            "type": "boolean",
                            "default": false,
                            "description": "Wait for CSS animations to finish before extracting, on browser-rendered pages."
                          },
                          "country": {
                            "$ref": "#/components/schemas/BrowserCountryCode"
                          },
                          "maxAgeMs": {
                            "type": [
                              "integer",
                              "null"
                            ],
                            "minimum": 0,
                            "maximum": 31536000000,
                            "default": 259200000,
                            "description": "Maximum cache age in milliseconds. Defaults to 3 days (259200000 ms). Maximum: 1 year (31536000000 ms). `0` fetches fresh."
                          }
                        },
                        "default": {
                          "useMainContentOnly": false,
                          "pdf": {
                            "shouldParse": true,
                            "ocr": false
                          },
                          "settleAnimations": false,
                          "maxAgeMs": 259200000
                        },
                        "additionalProperties": false,
                        "description": "Options for HTML output."
                      }
                    },
                    "required": [
                      "format",
                      "source"
                    ],
                    "additionalProperties": false,
                    "title": "HTML",
                    "description": "Crawl pages and return HTML.",
                    "deprecated": true,
                    "x-stainless-skip": [
                      "php"
                    ]
                  },
                  {
                    "$ref": "#/components/schemas/BatchUnifiedCrawlData"
                  }
                ],
                "title": "Crawl data",
                "description": "Crawl source and output format."
              }
            },
            "required": [
              "mode",
              "data"
            ],
            "additionalProperties": false,
            "title": "Crawl",
            "description": "Crawl pages starting from a URL or from a domain's sitemap."
          }
        ],
        "discriminator": {
          "propertyName": "mode"
        },
        "title": "Batch input",
        "description": "Choose a URL list or a site crawl."
      },
      "webhookUrl": {
        "type": "string",
        "format": "uri",
        "description": "Legacy URL notified when the batch finishes. Preserves one best-effort attempt. Cannot be combined with webhook."
      },
      "webhook": {
        "type": "object",
        "properties": {
          "url": {
            "type": "string",
            "format": "uri",
            "description": "Public HTTP(S) URL that receives batch completion, failure, or cancellation events."
          },
          "retry": {
            "$ref": "#/components/schemas/WebhookRetry"
          }
        },
        "required": [
          "url"
        ],
        "additionalProperties": false,
        "description": "Where to send the batch's final-status event. Omit `retry` for one attempt; `{}` uses the default retry schedule."
      },
      "tags": {
        "type": "array",
        "items": {
          "type": "string",
          "minLength": 1,
          "maxLength": 50
        },
        "maxItems": 20,
        "description": "Tags stored on the batch. Filter the batch list by them later.",
        "example": [
          "docs",
          "competitor"
        ]
      },
      "policies": {
        "type": "array",
        "items": {
          "type": "string"
        },
        "description": "Access policy IDs to apply to every page. A URL must pass every policy.",
        "example": [
          "pol_3f9c2a7e5b8d4c1f9a6e0b2d7c4f8a1e"
        ]
      }
    },
    "required": [
      "input"
    ],
    "additionalProperties": false,
    "title": "Submit batch request",
    "description": "Create an asynchronous scraping job."
  },
  "CompanySearchFilters": {
    "type": "object",
    "properties": {
      "countries": {
        "type": "array",
        "items": {
          "type": "string",
          "pattern": "^[A-Z]{2}$"
        },
        "description": "Headquarters countries as two-letter codes, such as US or GB."
      },
      "employees_min": {
        "type": "integer",
        "minimum": 0,
        "description": "Minimum headcount; includes overlapping employee ranges."
      },
      "employees_max": {
        "type": "integer",
        "minimum": 0,
        "description": "Maximum headcount; includes overlapping employee ranges."
      }
    },
    "additionalProperties": false,
    "description": "Additional constraints every result must match."
  },
  "PeopleSearchFilters": {
    "type": "object",
    "properties": {
      "countries": {
        "type": "array",
        "items": {
          "type": "string",
          "pattern": "^[A-Z]{2}$"
        },
        "description": "Countries people live in as two-letter codes, such as US or GB."
      },
      "years_of_experience_min": {
        "type": "integer",
        "minimum": 0,
        "description": "Minimum years of professional experience."
      },
      "years_of_experience_max": {
        "type": "integer",
        "minimum": 0,
        "description": "Maximum years of professional experience."
      }
    },
    "additionalProperties": false,
    "description": "Additional constraints every result must match."
  },
  "ScrapeFormats": {
    "type": "object",
    "properties": {
      "html": {
        "type": "boolean",
        "default": false,
        "description": "Rendered HTML."
      },
      "markdown": {
        "type": "boolean",
        "default": false,
        "description": "Page content as Markdown."
      },
      "screenshot": {
        "type": "boolean",
        "default": false,
        "description": "A screenshot of the page."
      },
      "images": {
        "type": "boolean",
        "default": false,
        "description": "Images found on the page."
      },
      "bytes": {
        "type": "boolean",
        "default": false,
        "description": "The original HTTP response body."
      },
      "parse": {
        "type": "boolean",
        "default": false,
        "description": "Fields extracted with custom rules or a prebuilt parser, returned as `parsed`."
      },
      "product": {
        "type": "boolean",
        "default": false,
        "description": "Product details such as name, price, and availability."
      },
      "highlights": {
        "type": "boolean",
        "default": false,
        "description": "Markdown excerpts relevant to `highlightsParams.query`."
      },
      "json": {
        "type": "boolean",
        "default": false,
        "description": "An object matching `jsonParams.schema`, extracted from the page text and its embedded data (JSON-LD, meta tags, framework state)."
      }
    },
    "additionalProperties": false,
    "description": "Outputs to return. Set at least one to `true`.",
    "not": {
      "allOf": [
        {
          "not": {
            "required": [
              "html"
            ],
            "properties": {
              "html": {
                "const": true
              }
            }
          }
        },
        {
          "not": {
            "required": [
              "markdown"
            ],
            "properties": {
              "markdown": {
                "const": true
              }
            }
          }
        },
        {
          "not": {
            "required": [
              "screenshot"
            ],
            "properties": {
              "screenshot": {
                "const": true
              }
            }
          }
        },
        {
          "not": {
            "required": [
              "images"
            ],
            "properties": {
              "images": {
                "const": true
              }
            }
          }
        },
        {
          "not": {
            "required": [
              "bytes"
            ],
            "properties": {
              "bytes": {
                "const": true
              }
            }
          }
        },
        {
          "not": {
            "required": [
              "parse"
            ],
            "properties": {
              "parse": {
                "const": true
              }
            }
          }
        },
        {
          "not": {
            "required": [
              "product"
            ],
            "properties": {
              "product": {
                "const": true
              }
            }
          }
        },
        {
          "not": {
            "required": [
              "highlights"
            ],
            "properties": {
              "highlights": {
                "const": true
              }
            }
          }
        },
        {
          "not": {
            "required": [
              "json"
            ],
            "properties": {
              "json": {
                "const": true
              }
            }
          }
        }
      ]
    }
  },
  "ScrapeSharedParams": {
    "type": "object",
    "properties": {
      "profile": {
        "$ref": "#/components/schemas/ScrapeProfile"
      },
      "country": {
        "type": "string",
        "description": "Proxy country as a two-letter code, such as `US`. Case-insensitive.",
        "pattern": "^[A-Za-z]{2}$",
        "examples": [
          "US"
        ]
      },
      "headers": {
        "type": "object",
        "additionalProperties": {
          "type": "string",
          "maxLength": 8192,
          "pattern": "^[^\\r\\n]*$"
        },
        "examples": [
          {
            "Accept-Language": "en-US"
          }
        ],
        "propertyNames": {
          "pattern": "^[!#$%&'*+.^_`|~0-9A-Za-z-]+$",
          "not": {
            "pattern": "^(?:[Hh][Oo][Ss][Tt]|[Cc][Oo][Nn][Tt][Ee][Nn][Tt]-[Ll][Ee][Nn][Gg][Tt][Hh]|[Cc][Oo][Nn][Nn][Ee][Cc][Tt][Ii][Oo][Nn]|[Kk][Ee][Ee][Pp]-[Aa][Ll][Ii][Vv][Ee]|[Tt][Rr][Aa][Nn][Ss][Ff][Ee][Rr]-[Ee][Nn][Cc][Oo][Dd][Ii][Nn][Gg]|[Uu][Pp][Gg][Rr][Aa][Dd][Ee]|[Pp][Rr][Oo][Xx][Yy]-[Aa][Uu][Tt][Hh][Ee][Nn][Tt][Ii][Cc][Aa][Tt][Ee]|[Pp][Rr][Oo][Xx][Yy]-[Aa][Uu][Tt][Hh][Oo][Rr][Ii][Zz][Aa][Tt][Ii][Oo][Nn]|[Pp][Rr][Oo][Xx][Yy]-[Cc][Oo][Nn][Nn][Ee][Cc][Tt][Ii][Oo][Nn]|[Tt][Ee]|[Tt][Rr][Aa][Ii][Ll][Ee][Rr]|[Ee][Xx][Pp][Ee][Cc][Tt])$"
          }
        },
        "description": "HTTP headers to send to the target site. Requests with headers skip the cache."
      },
      "viewport": {
        "type": "object",
        "properties": {
          "width": {
            "type": "integer",
            "minimum": 240,
            "maximum": 7680,
            "default": 1440,
            "description": "Browser viewport width in pixels."
          },
          "height": {
            "type": "integer",
            "minimum": 240,
            "maximum": 4320,
            "default": 900,
            "description": "Browser viewport height in pixels."
          }
        },
        "additionalProperties": false,
        "description": "Browser size in pixels. Omit for 1920 × 1080. When provided, missing dimensions default to 1440 × 900."
      },
      "theme": {
        "type": "string",
        "enum": [
          "light",
          "dark"
        ],
        "description": "Emulate a light or dark color scheme."
      },
      "dismissCookies": {
        "type": "boolean",
        "default": true,
        "description": "Accept cookie banners before actions and capture."
      },
      "dismissPopups": {
        "type": "boolean",
        "default": false,
        "description": "Close other popups before actions and capture."
      },
      "actions": {
        "type": "array",
        "items": {
          "$ref": "#/components/schemas/ScrapeAction"
        },
        "minItems": 1,
        "maxItems": 5,
        "description": "Browser steps run in order before capture. Requires a paid plan. Skips the cache."
      },
      "waitFor": {
        "anyOf": [
          {
            "type": "integer",
            "minimum": 0,
            "maximum": 30000
          },
          {
            "type": "string",
            "minLength": 1,
            "maxLength": 2048,
            "pattern": "\\S"
          }
        ],
        "description": "Milliseconds, or a CSS selector to wait for, after actions. Defaults to 500 (2000 with frames or XML).",
        "examples": [
          500,
          "#content"
        ]
      },
      "settleAnimations": {
        "type": "boolean",
        "description": "Wait for CSS animations to finish before capture. Defaults to `true` when `screenshot` is requested."
      },
      "mainContentOnly": {
        "type": "boolean",
        "default": false,
        "description": "Keep only the main content. Doesn't affect `screenshot`, `bytes`, or `product`."
      },
      "includeSelectors": {
        "type": "array",
        "items": {
          "type": "string",
          "minLength": 1,
          "maxLength": 2048,
          "pattern": "\\S"
        },
        "minItems": 1,
        "maxItems": 50,
        "uniqueItems": true,
        "description": "Keep only elements matching these CSS selectors."
      },
      "excludeSelectors": {
        "type": "array",
        "items": {
          "type": "string",
          "minLength": 1,
          "maxLength": 2048,
          "pattern": "\\S"
        },
        "minItems": 1,
        "maxItems": 50,
        "uniqueItems": true,
        "description": "Remove elements matching these CSS selectors. Overrides `includeSelectors`."
      },
      "includeFrames": {
        "type": "boolean",
        "default": false,
        "description": "Include iframe content in HTML and text outputs. Screenshots always show visible frames."
      },
      "parsers": {
        "type": "object",
        "properties": {
          "pdf": {
            "$ref": "#/components/schemas/ScrapePdfOptions"
          }
        },
        "additionalProperties": false,
        "description": "Document parsing options."
      }
    },
    "additionalProperties": false,
    "description": "Browser and content settings shared by all outputs."
  },
  "ScrapeMarkdownParams": {
    "type": "object",
    "properties": {
      "includeLinks": {
        "type": "boolean",
        "default": true,
        "description": "Keep link URLs in the Markdown (`html-conversion` only)."
      },
      "includeImages": {
        "type": "boolean",
        "default": false,
        "description": "Include images in the Markdown (`html-conversion` only)."
      },
      "inlineImages": {
        "type": "string",
        "enum": [
          "placeholder",
          "preserve"
        ],
        "default": "placeholder",
        "description": "How base64 images appear when `includeImages` is set (`html-conversion` only)."
      },
      "sourcePreference": {
        "type": "array",
        "items": {
          "type": "string",
          "enum": [
            "html-conversion",
            "markdown-direct"
          ]
        },
        "minItems": 1,
        "default": [
          "html-conversion",
          "markdown-direct"
        ],
        "uniqueItems": true,
        "description": "Markdown sources in order of preference: `html-conversion` converts the page HTML, `markdown-direct` uses Markdown the site publishes."
      }
    },
    "additionalProperties": false,
    "description": "Markdown options. Requires `formats.markdown`."
  },
  "ScrapeScreenshotParams": {
    "type": "object",
    "properties": {
      "area": {
        "anyOf": [
          {
            "type": "string",
            "enum": [
              "viewport",
              "fullPage"
            ],
            "x-stainless-variantName": "Page"
          },
          {
            "type": "object",
            "properties": {
              "selector": {
                "type": "string",
                "minLength": 1,
                "maxLength": 2048,
                "pattern": "\\S",
                "description": "CSS selector matching exactly one visible element."
              }
            },
            "required": [
              "selector"
            ],
            "additionalProperties": false,
            "x-stainless-variantName": "Element"
          },
          {
            "type": "object",
            "properties": {
              "x": {
                "type": "integer",
                "minimum": 0,
                "maximum": 100000,
                "description": "Left edge of the capture, in pixels from the document origin."
              },
              "y": {
                "type": "integer",
                "minimum": 0,
                "maximum": 100000,
                "description": "Top edge of the capture, in pixels from the document origin."
              },
              "width": {
                "type": "integer",
                "minimum": 1,
                "maximum": 7680,
                "description": "Width of the capture in pixels."
              },
              "height": {
                "type": "integer",
                "minimum": 1,
                "maximum": 100000,
                "description": "Height of the capture in pixels."
              }
            },
            "required": [
              "x",
              "y",
              "width",
              "height"
            ],
            "additionalProperties": false,
            "x-stainless-variantName": "Rectangle",
            "description": "Pixels from the document origin."
          }
        ],
        "default": "viewport",
        "description": "What to capture: `viewport`, `fullPage`, one element, or a rectangle. Max 40 megapixels."
      },
      "format": {
        "type": "string",
        "enum": [
          "png",
          "jpeg",
          "webp"
        ],
        "default": "png",
        "description": "Image format for the screenshot."
      }
    },
    "additionalProperties": false,
    "description": "Screenshot options. Requires formats.screenshot: true."
  },
  "ScrapeImageParams": {
    "type": "object",
    "properties": {
      "enrich": {
        "type": "array",
        "items": {
          "type": "string",
          "enum": [
            "dimensions",
            "classification",
            "file"
          ]
        },
        "maxItems": 3,
        "uniqueItems": true,
        "description": "Extra data per image: `dimensions`, `classification`, or a hosted `file` URL."
      },
      "dedupe": {
        "type": "string",
        "enum": [
          "none",
          "visual"
        ],
        "default": "none",
        "description": "Set `visual` to drop visual duplicates, keeping the largest copy."
      }
    },
    "additionalProperties": false,
    "description": "Image options. Requires formats.images: true."
  },
  "ScrapeParseParams": {
    "oneOf": [
      {
        "type": "object",
        "properties": {
          "type": {
            "type": "string",
            "enum": [
              "custom"
            ],
            "default": "custom",
            "const": "custom",
            "description": "Extract fields using custom CSS rules. This is the default when type is omitted."
          },
          "rules": {
            "$ref": "#/components/schemas/ScrapeParseRules"
          }
        },
        "required": [
          "rules"
        ],
        "additionalProperties": false,
        "x-stainless-variantName": "CustomParser"
      },
      {
        "type": "object",
        "properties": {
          "type": {
            "type": "string",
            "enum": [
              "prebuilt"
            ],
            "const": "prebuilt",
            "description": "Use a prebuilt parser instead of custom rules."
          },
          "parser": {
            "type": "string",
            "enum": [
              "google-maps",
              "google-maps-reviews",
              "google-play",
              "google-play-reviews",
              "app-store",
              "app-store-reviews",
              "g2-reviews",
              "instagram-profile",
              "instagram-post",
              "instagram-feed",
              "tiktok-profile",
              "tiktok-video",
              "tiktok-feed",
              "tiktok-comments",
              "tiktok-followers",
              "tiktok-following",
              "tiktok-user-search",
              "reddit-post",
              "reddit-search",
              "reddit-subreddit",
              "reddit-user",
              "yelp-search",
              "yelp-reviews",
              "tripadvisor-reviews",
              "emails",
              "phone-numbers",
              "links"
            ],
            "description": "google-maps parses Google Maps business data into data.results. Accepts Maps place, search, and internal data URLs. Uses a US exit and English labels regardless of hl or Accept-Language. google-maps-reviews returns the reviews of a place in data.reviews, in the same shape as the Serper reviews API (rating, date, isoDate, snippet, translatedSnippet, likes, user, media, response, link, id), plus language, guided ratings in details, and user.isLocalGuide; data also carries the place featureId, cid, and sort. sort and limit pick the order and count, and oldest is exact. It accepts Maps place, search, and ?cid= URLs, plus search.google.com/local/reviews URLs, so the google_maps_url and google_reviews_url fields of google-maps results work as input. An unknown place returns no reviews. google-play parses a Play Store app into data: details, developer contact, ratings, price, permissions, and data safety. google-play-reviews returns the 200 newest reviews of the app, with developer replies, in data.reviews. Both Play parsers accept app details URLs (play.google.com/store/apps/details?id=…); hl and gl set the language and storefront, defaulting to en and us. app-store parses an App Store app into data: details, developer, ratings, price, version, and screenshots. app-store-reviews returns up to the 500 newest reviews in data.reviews. Both App Store parsers accept app URLs (apps.apple.com/us/app/…/id…); the country in the path sets the storefront, defaulting to us. g2-reviews returns the 25 most recently published reviews of a G2 product in data.reviews (rating, title, likes, dislikes, problems_solved, reviewer role, company size, and industry), plus data.product. It accepts G2 product URLs (g2.com/products/…), follows renamed products, and keeps star-rating filters from the URL (filters[nps_score][]=1 to 5); other filters, sort orders, and pages are ignored. instagram-profile parses a public profile (instagram.com/{username}) into data: bio, links, follower and post counts, category, business address, similar_accounts, and latest_posts (up to the 12 posts at the top of the profile, newest first). Instagram lists pinned posts there ahead of newer ones, so posts with is_pinned true can be older; when Instagram shows only a rounded post count (32K), post_count is that rounded number and is_post_count_rounded is true. instagram-post parses a post or reel (/p/…, /reel/…) into data: caption, hashtags, mentions, like, comment, and view counts (like_count and view_count are null when the owner hides them), media URLs, tagged users, collaborators, location, and the top ~14 comments in data.comments. instagram-feed returns the top posts for a hashtag or keyword (/explore/tags/…, /popular/…) or the recent posts at a location (/explore/locations/{id}/…) in data.posts; keyword posts carry only the shortcode, owner, thumbnail, and views, plus the caption when Instagram shows it. All three Instagram parsers read public data without logging in, so private accounts return no posts and follower lists are unavailable. tiktok-profile parses a public profile (tiktok.com/@{username}) into data: nickname, bio, bio link, follower, following, like, and video counts, verified, private, and business flags, and business category; it does not list videos. tiktok-video parses a video or photo post (/@{username}/video/{id} or /@{username}/photo/{id}) into data: caption, hashtags, mentions, author, view, like, comment, share, save, and repost counts, duration, thumbnail, a video_url that downloads without cookies, image_urls for photo posts, music, location, and ad, paid-partnership, and AI-generated flags. tiktok-feed returns videos in the tiktok-video shape as data.videos: the latest 15 from a profile URL, the top 30 from a hashtag URL (/tag/{name}), or the top 12 from a search URL (/search?q={query}). tiktok-comments returns the first 20 comments of a video or photo post as data.comments: text, posted_at, like and reply counts, whether the author liked it, and the commenter. tiktok-followers and tiktok-following return up to 30 accounts of a profile as data.users, in the tiktok-profile shape. tiktok-user-search returns the top 10 accounts for a user search URL (/search/user?q={query}) as data.users: id, username, nickname, biography, avatar_url, sec_uid, follower_count, like_count, and is_verified. The TikTok parsers accept tiktok.com, www.tiktok.com, and m.tiktok.com URLs but not short links (vm.tiktok.com, vt.tiktok.com, tiktok.com/t/…). reddit-post parses a post (reddit.com/r/{subreddit}/comments/{id}, reddit.com/comments/{id}, or redd.it/{id}) into data.post: title, body as Markdown, type (text, link, image, gallery, or video), link_url, subreddit, author, flairs, score, upvote_ratio, comment and crosspost counts, NSFW, spoiler, locked, stickied, and archived flags, images (every gallery image in order), and video (an MP4 url plus an hls_url that carries the audio). data.comments holds the comment tree, each comment with id, author, body as Markdown, score, posted_at, depth, parent_id, url, is_submitter, is_deleted, and its replies; limit caps the total number of comments (default 100), filled shallowest first so whole conversations are kept, and data.has_more_comments says whether the thread has more. The sort query of the URL (best, top, new, controversial, old, qa) orders the comments. reddit-search returns search results for a search URL (reddit.com/search?q={query}, or reddit.com/r/{subreddit}/search?q={query} to search one subreddit). With type=link or no type it returns posts in the reddit-post shape as data.posts, ordered by the sort (relevance, hot, top, new, comments) and limited to the t time range (hour, day, week, month, year, all) of the URL; type=sr returns communities as data.communities (name, title, description, sidebar, subscriber_count, created_at, type, NSFW and quarantine flags, language, category, icon and banner URLs, and allowed post types); type=user returns accounts as data.users (username, display_name, bio, created_at, post and comment karma, avatar and banner URLs, and verified, employee, moderator, premium, and NSFW flags). limit caps the number of results (default 100), in the order Reddit returns them, and data.has_more says whether Reddit has more. reddit-subreddit reads a subreddit URL (reddit.com/r/{subreddit}, optionally followed by /hot, /new, /top, /rising, or /controversial, with t setting the time range of top and controversial, default day) into data.subreddit in the community shape of reddit-search, data.rules (name, description, applies_to, violation_reason, created_at), and data.posts in the reddit-post shape, ordered like the tab (default hot) and with stickied posts flagged; r/all and r/popular return posts with a null subreddit and rules. limit caps the posts (default 100) and data.has_more says whether Reddit has more. Private and quarantined subreddits return WEBSITE_ACCESS_ERROR. reddit-user reads a profile URL (reddit.com/user/{username} or reddit.com/u/{username}, optionally followed by /overview, /submitted, or /comments, with sort set to new, hot, top, or controversial and t setting the time range of top and controversial, default all) into data.user (id, username, display_name, bio, created_at, total, post, comment, awardee, and awarder karma, avatar and banner URLs, and verified, suspended, employee, moderator, premium, and NSFW flags), data.trophies (name, description, icon_url, granted_at, url), data.moderated_communities (name, title, url, subscriber_count, icon_url, is_nsfw), data.posts in the reddit-post shape, and data.comments, each with id, author, body as Markdown, score, posted_at, edited_at, url, subreddit, parent_id (null for a top-level comment), is_submitter, is_stickied, distinguished, award_count, and the post it was left on (id, title, url, author, is_nsfw). The overview tab returns both posts and comments; submitted returns null comments and comments returns null posts. limit caps the posts and comments together (default 100) and data.has_more says whether Reddit has more. Users who hide their activity return empty lists, and suspended accounts return their profile with null posts and comments. yelp-search accepts Yelp search URLs with find_desc and find_loc, reads start as the result offset, and returns up to 20 ranked organic businesses in data.businesses with total and pagination. yelp-reviews accepts a Yelp business URL (yelp.com/biz/{alias}), uses optional start for the offset, and always sorts newest first; unsupported sort and review filters are rejected, while tracking params are ignored. It returns up to 20 latest public reviews in data.reviews with business details and pagination.next_offset. Each review has rating, full text, updated_at, and author (id is the Yelp user id from the reviewer profile URL, url links to that profile, plus name, location, and review_count); owner replies and photos are not included. tripadvisor-reviews accepts a Tripadvisor hotel, restaurant, or attraction review URL (tripadvisor.com/Hotel_Review-g{geo}-d{id}-Reviews-….html, on any Tripadvisor country domain), reads -or{N}- in the path as the offset, and returns 20 reviews in data.reviews in the order Tripadvisor shows them, with data.location (id, name, type, url, review_count) and pagination.next_offset. Each review has id, url, title, full text, rating, language, published_at, visit_month, helpful_votes, subratings, photo_urls, owner_response (text, published_at, author_name), and author (id, username, name, url, contribution_count); an unknown location returns no reviews. emails accepts any page and returns its email addresses as data.emails ([{ email }]), read from mailto links, Cloudflare-protected addresses, and visible text. phone-numbers accepts any page and returns its valid phone numbers in E.164 as data.phone_numbers ([{ phone }]), read from tel links and visible text; numbers without a country code are read for the country of the site TLD, defaulting to US. links accepts any page and returns its unique http(s) links as data.links ([{ url, text }]), with absolute URLs; text falls back to aria-label or image alt and is null when a link has none. The emails parser reads the rendered page and respects content filters; the other prebuilt parsers read their data independently of DOM filters."
          },
          "sort": {
            "type": "string",
            "enum": [
              "newest",
              "oldest",
              "relevant",
              "highest",
              "lowest"
            ],
            "default": "newest",
            "description": "google-maps-reviews only. Order of data.reviews. newest, relevant, highest, and lowest follow Google; oldest returns the earliest reviews first, which Google itself does not offer."
          },
          "limit": {
            "type": "integer",
            "minimum": 1,
            "maximum": 1000,
            "default": 100,
            "description": "google-maps-reviews and reddit parsers only. Maximum number of reviews (google-maps-reviews, default 100), comments (reddit-post, default 100), or results (reddit-search, reddit-subreddit, and reddit-user, default 100) to return; maximum 1000."
          }
        },
        "required": [
          "type",
          "parser"
        ],
        "additionalProperties": false,
        "x-stainless-variantName": "PrebuiltParser"
      }
    ],
    "description": "Requires `formats.parse: true`; required when it is set."
  },
  "ScrapeProductParams": {
    "type": "object",
    "properties": {
      "dedupeImages": {
        "type": "boolean",
        "default": false,
        "description": "Drop visually duplicate product images, keeping the largest copy."
      },
      "useAIFallback": {
        "type": "boolean",
        "deprecated": true,
        "description": "Ignored. The AI fallback runs automatically."
      }
    },
    "additionalProperties": false,
    "description": "Product options. Requires formats.product: true."
  },
  "ScrapeHighlightsParams": {
    "type": "object",
    "properties": {
      "query": {
        "type": "string",
        "minLength": 1,
        "maxLength": 2000,
        "description": "The question or topic to find passages for."
      },
      "maxCharacters": {
        "type": "integer",
        "minimum": 100,
        "maximum": 20000,
        "default": 4000,
        "description": "Maximum combined length of returned passages."
      }
    },
    "required": [
      "query"
    ],
    "additionalProperties": false,
    "description": "Requires `formats.highlights: true`; required when it is set."
  },
  "ScrapeJsonParams": {
    "type": "object",
    "properties": {
      "schema": {
        "type": "object",
        "additionalProperties": true,
        "description": "JSON Schema (not an example object) for a top-level object, up to 50 KB. Use optional or nullable fields for missing facts.",
        "example": {
          "type": "object",
          "properties": {
            "name": {
              "type": "string",
              "description": "Product name."
            },
            "price": {
              "type": "number",
              "description": "Current price as a plain number."
            },
            "inStock": {
              "type": "boolean"
            }
          },
          "required": [
            "name"
          ],
          "additionalProperties": false
        }
      },
      "instructions": {
        "type": "string",
        "maxLength": 2000,
        "description": "Extra guidance, such as which facts to prefer or how to read a field."
      }
    },
    "required": [
      "schema"
    ],
    "additionalProperties": false,
    "description": "Requires `formats.json: true`; required when it is set."
  },
  "NewsSearchEntityByName": {
    "type": "object",
    "properties": {
      "type": {
        "type": "string",
        "enum": [
          "name"
        ],
        "description": "Use `name` to identify the company by name."
      },
      "name": {
        "type": "string",
        "minLength": 2,
        "maxLength": 200,
        "description": "Company name."
      }
    },
    "required": [
      "type",
      "name"
    ],
    "additionalProperties": false,
    "description": "Identify the company by name.",
    "title": "By Name"
  },
  "NewsSearchEntityByDomain": {
    "type": "object",
    "properties": {
      "type": {
        "type": "string",
        "enum": [
          "domain"
        ],
        "description": "Use `domain` to identify the company by website domain."
      },
      "domain": {
        "type": "string",
        "minLength": 1,
        "maxLength": 253,
        "description": "Company website domain, such as apple.com."
      }
    },
    "required": [
      "type",
      "domain"
    ],
    "additionalProperties": false,
    "description": "Identify the company by website domain.",
    "title": "By Domain"
  },
  "NewsSearchEntityByTicker": {
    "type": "object",
    "properties": {
      "type": {
        "type": "string",
        "enum": [
          "ticker"
        ],
        "description": "Use `ticker` to identify a publicly traded company."
      },
      "ticker": {
        "type": "string",
        "minLength": 1,
        "maxLength": 20,
        "pattern": "^[A-Za-z0-9.-]+$",
        "description": "Public-company ticker."
      },
      "exchange": {
        "type": "string",
        "enum": [
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
          "XETRA"
        ],
        "description": "Stock exchange the ticker trades on, used to disambiguate tickers listed on multiple exchanges."
      }
    },
    "required": [
      "type",
      "ticker"
    ],
    "additionalProperties": false,
    "description": "Identify the company by stock ticker, optionally scoped to an exchange.",
    "title": "By Ticker"
  },
  "NewsSearchEntityByIsin": {
    "type": "object",
    "properties": {
      "type": {
        "type": "string",
        "enum": [
          "isin"
        ],
        "description": "Use `isin` to identify the company by its securities identifier."
      },
      "isin": {
        "type": "string",
        "pattern": "^[A-Za-z]{2}[A-Za-z0-9]{9}[0-9]$",
        "description": "International Securities Identification Number."
      }
    },
    "required": [
      "type",
      "isin"
    ],
    "additionalProperties": false,
    "description": "Identify the company by International Securities Identification Number.",
    "title": "By ISIN"
  },
  "WebScrapeWaitAction": {
    "type": "object",
    "properties": {
      "do": {
        "type": "string",
        "enum": [
          "wait"
        ],
        "description": "Use `wait` to pause for a fixed duration."
      },
      "timeMs": {
        "type": "integer",
        "minimum": 0,
        "maximum": 30000,
        "description": "Time to pause in milliseconds before the next action."
      }
    },
    "required": [
      "do",
      "timeMs"
    ],
    "additionalProperties": false,
    "description": "Pause for a fixed number of milliseconds before continuing to the next action.",
    "title": "Wait"
  },
  "WebScrapePerformAction": {
    "type": "object",
    "properties": {
      "do": {
        "type": "string",
        "enum": [
          "perform"
        ],
        "description": "Use `perform` for a plain-language browser instruction."
      },
      "action": {
        "type": "string",
        "minLength": 1,
        "maxLength": 500,
        "description": "One browser instruction, such as clicking a button or entering text."
      }
    },
    "required": [
      "do",
      "action"
    ],
    "additionalProperties": false,
    "description": "Resolve and perform one natural-language browser action.",
    "title": "Perform"
  },
  "WebScrapeScrollAction": {
    "type": "object",
    "properties": {
      "do": {
        "type": "string",
        "enum": [
          "scroll"
        ],
        "description": "Use `scroll` to move through the page or a container."
      },
      "direction": {
        "type": "string",
        "enum": [
          "up",
          "down",
          "left",
          "right"
        ],
        "description": "Direction to scroll. Defaults to down."
      },
      "amount": {
        "anyOf": [
          {
            "type": "integer",
            "minimum": 1,
            "maximum": 100000
          },
          {
            "type": "string",
            "enum": [
              "viewport",
              "max"
            ]
          }
        ],
        "description": "Pixels per scroll, one visible viewport, or the current scroll boundary. Defaults to viewport."
      },
      "container": {
        "type": "string",
        "minLength": 1,
        "maxLength": 2000,
        "description": "CSS selector for the first matching scroll container. Defaults to the page."
      },
      "maxScrolls": {
        "type": "integer",
        "minimum": 1,
        "maximum": 50,
        "description": "Maximum scroll iterations. Stops early when scrolling and scrollable extent stop changing. Defaults to 1."
      }
    },
    "required": [
      "do"
    ],
    "additionalProperties": false,
    "description": "Scroll the page or a selected scrollable container, waiting adaptively for content and dimensions to settle after each iteration.",
    "title": "Scroll"
  },
  "BrandRetrieveByDomainRequest": {
    "type": "object",
    "properties": {
      "force_language": {
        "allOf": [
          {
            "$ref": "#/components/schemas/SupportedLanguage"
          },
          {
            "type": [
              "string",
              "null"
            ]
          }
        ]
      },
      "maxSpeed": {
        "type": "boolean",
        "description": "Optional parameter to optimize the API call for maximum speed. When set to true, the API will skip time-consuming operations for faster response at the cost of less comprehensive data."
      },
      "maxAgeMs": {
        "type": "integer",
        "description": "Maximum age of cached brand data in ms. Defaults to 3 months; clamped to 0–1 year. `0` refreshes."
      },
      "timeoutOpts": {
        "$ref": "#/components/schemas/PartialTimeout"
      },
      "type": {
        "type": "string",
        "enum": [
          "by_domain"
        ],
        "description": "Discriminator for domain-based brand retrieval."
      },
      "domain": {
        "type": "string",
        "minLength": 3,
        "description": "Domain name to retrieve brand data for (e.g., 'stripe.com')."
      },
      "zdr": {
        "type": "string",
        "enum": [
          "enabled",
          "disabled"
        ],
        "description": "`enabled` disables request logs and traces and omits request and response content from usage logs. Brand data and hosted assets may still be stored. Returns 403 `ZDR_NOT_ENABLED` unless your organization has ZDR."
      },
      "tags": {
        "$ref": "#/components/schemas/RequestTags"
      },
      "policies": {
        "type": "array",
        "items": {
          "type": "string"
        },
        "description": "Access policy IDs to apply. A URL must pass every policy.",
        "example": [
          "pol_3f9c2a7e5b8d4c1f9a6e0b2d7c4f8a1e"
        ]
      }
    },
    "required": [
      "type",
      "domain"
    ],
    "additionalProperties": false,
    "title": "By domain",
    "description": "Retrieve brand data by domain. Cannot be combined with name, email, or ticker."
  },
  "BrandRetrieveByNameRequest": {
    "type": "object",
    "properties": {
      "force_language": {
        "allOf": [
          {
            "$ref": "#/components/schemas/SupportedLanguage"
          },
          {
            "type": [
              "string",
              "null"
            ]
          }
        ]
      },
      "maxSpeed": {
        "type": "boolean",
        "description": "Optional parameter to optimize the API call for maximum speed. When set to true, the API will skip time-consuming operations for faster response at the cost of less comprehensive data."
      },
      "maxAgeMs": {
        "type": "integer",
        "description": "Maximum age of cached brand data in ms. Defaults to 3 months; clamped to 0–1 year. `0` refreshes."
      },
      "timeoutOpts": {
        "$ref": "#/components/schemas/PartialTimeout"
      },
      "type": {
        "type": "string",
        "enum": [
          "by_name"
        ],
        "description": "Discriminator for name-based brand retrieval."
      },
      "name": {
        "type": "string",
        "minLength": 3,
        "maxLength": 30,
        "description": "Company name to retrieve brand data for (e.g., 'Apple Inc')."
      },
      "country_gl": {
        "allOf": [
          {
            "$ref": "#/components/schemas/CountryGL"
          },
          {
            "description": "Optional country code hint (GL parameter) to specify the country when looking up by company name."
          }
        ]
      },
      "zdr": {
        "type": "string",
        "enum": [
          "enabled",
          "disabled"
        ],
        "description": "`enabled` disables request logs and traces and omits request and response content from usage logs. Brand data and hosted assets may still be stored. Returns 403 `ZDR_NOT_ENABLED` unless your organization has ZDR."
      },
      "tags": {
        "$ref": "#/components/schemas/RequestTags"
      },
      "policies": {
        "type": "array",
        "items": {
          "type": "string"
        },
        "description": "Access policy IDs to apply. A URL must pass every policy.",
        "example": [
          "pol_3f9c2a7e5b8d4c1f9a6e0b2d7c4f8a1e"
        ]
      }
    },
    "required": [
      "type",
      "name"
    ],
    "additionalProperties": false,
    "title": "By name",
    "description": "Retrieve brand data by company name. Cannot be combined with domain, email, or ticker."
  },
  "BrandRetrieveByEmailRequest": {
    "type": "object",
    "properties": {
      "force_language": {
        "allOf": [
          {
            "$ref": "#/components/schemas/SupportedLanguage"
          },
          {
            "type": [
              "string",
              "null"
            ]
          }
        ]
      },
      "maxSpeed": {
        "type": "boolean",
        "description": "Optional parameter to optimize the API call for maximum speed. When set to true, the API will skip time-consuming operations for faster response at the cost of less comprehensive data."
      },
      "maxAgeMs": {
        "type": "integer",
        "description": "Maximum age of cached brand data in ms. Defaults to 3 months; clamped to 0–1 year. `0` refreshes."
      },
      "timeoutOpts": {
        "$ref": "#/components/schemas/PartialTimeout"
      },
      "type": {
        "type": "string",
        "enum": [
          "by_email"
        ],
        "description": "Discriminator for email-based brand retrieval."
      },
      "email": {
        "type": "string",
        "minLength": 1,
        "format": "email",
        "description": "Email address to retrieve brand data for (e.g., 'jane@stripe.com')."
      },
      "zdr": {
        "type": "string",
        "enum": [
          "enabled",
          "disabled"
        ],
        "description": "`enabled` disables request logs and traces and omits request and response content from usage logs. Brand data and hosted assets may still be stored. Returns 403 `ZDR_NOT_ENABLED` unless your organization has ZDR."
      },
      "tags": {
        "$ref": "#/components/schemas/RequestTags"
      },
      "policies": {
        "type": "array",
        "items": {
          "type": "string"
        },
        "description": "Access policy IDs to apply. A URL must pass every policy.",
        "example": [
          "pol_3f9c2a7e5b8d4c1f9a6e0b2d7c4f8a1e"
        ]
      }
    },
    "required": [
      "type",
      "email"
    ],
    "additionalProperties": false,
    "title": "By email",
    "description": "Retrieve brand data by email address. The domain is extracted from the email. Free and disposable email providers are rejected with 422. Cannot be combined with domain, name, or ticker."
  },
  "BrandRetrieveByTickerRequest": {
    "type": "object",
    "properties": {
      "force_language": {
        "allOf": [
          {
            "$ref": "#/components/schemas/SupportedLanguage"
          },
          {
            "type": [
              "string",
              "null"
            ]
          }
        ]
      },
      "maxSpeed": {
        "type": "boolean",
        "description": "Optional parameter to optimize the API call for maximum speed. When set to true, the API will skip time-consuming operations for faster response at the cost of less comprehensive data."
      },
      "maxAgeMs": {
        "type": "integer",
        "description": "Maximum age of cached brand data in ms. Defaults to 3 months; clamped to 0–1 year. `0` refreshes."
      },
      "timeoutOpts": {
        "$ref": "#/components/schemas/PartialTimeout"
      },
      "type": {
        "type": "string",
        "enum": [
          "by_ticker"
        ],
        "description": "Discriminator for ticker-based brand retrieval."
      },
      "ticker": {
        "type": "string",
        "minLength": 1,
        "maxLength": 15,
        "pattern": "^[A-Za-z0-9.]+$",
        "description": "Stock ticker symbol to retrieve brand data for (e.g., 'AAPL')."
      },
      "ticker_exchange": {
        "allOf": [
          {
            "$ref": "#/components/schemas/StockExchange"
          },
          {
            "description": "Optional stock exchange for the ticker. Defaults to NASDAQ if not specified."
          }
        ]
      },
      "zdr": {
        "type": "string",
        "enum": [
          "enabled",
          "disabled"
        ],
        "description": "`enabled` disables request logs and traces and omits request and response content from usage logs. Brand data and hosted assets may still be stored. Returns 403 `ZDR_NOT_ENABLED` unless your organization has ZDR."
      },
      "tags": {
        "$ref": "#/components/schemas/RequestTags"
      },
      "policies": {
        "type": "array",
        "items": {
          "type": "string"
        },
        "description": "Access policy IDs to apply. A URL must pass every policy.",
        "example": [
          "pol_3f9c2a7e5b8d4c1f9a6e0b2d7c4f8a1e"
        ]
      }
    },
    "required": [
      "type",
      "ticker"
    ],
    "additionalProperties": false,
    "title": "By stock",
    "description": "Retrieve brand data by stock ticker. Cannot be combined with domain, name, or email."
  },
  "BrandRetrieveByDirectUrlRequest": {
    "type": "object",
    "properties": {
      "type": {
        "type": "string",
        "enum": [
          "by_direct_url"
        ],
        "description": "Discriminator for direct-URL-based brand retrieval."
      },
      "direct_url": {
        "type": "string",
        "format": "uri",
        "description": "Full http(s) URL to fetch brand data from (e.g., 'https://stripe.com/enterprise'). Only this URL is fetched — not the entire internet."
      },
      "timeoutOpts": {
        "$ref": "#/components/schemas/PartialTimeout"
      },
      "zdr": {
        "type": "string",
        "enum": [
          "enabled",
          "disabled"
        ],
        "description": "`enabled` disables request logs and traces and omits request and response content from usage logs. Brand data and hosted assets may still be stored. Returns 403 `ZDR_NOT_ENABLED` unless your organization has ZDR."
      },
      "tags": {
        "$ref": "#/components/schemas/RequestTags"
      },
      "policies": {
        "type": "array",
        "items": {
          "type": "string"
        },
        "description": "Access policy IDs to apply. A URL must pass every policy.",
        "example": [
          "pol_3f9c2a7e5b8d4c1f9a6e0b2d7c4f8a1e"
        ]
      }
    },
    "required": [
      "type",
      "direct_url"
    ],
    "additionalProperties": false,
    "title": "By direct URL",
    "description": "Retrieve brand data from this exact URL. Cross-site enrichment and other lookup identifiers are excluded."
  },
  "BrandRetrieveFromTransactionRequest": {
    "type": "object",
    "properties": {
      "type": {
        "type": "string",
        "enum": [
          "by_transaction"
        ],
        "description": "Discriminator for transaction-based brand retrieval."
      },
      "transaction_info": {
        "type": "string",
        "minLength": 3,
        "maxLength": 500,
        "description": "Transaction information to identify the brand."
      },
      "force_language": {
        "allOf": [
          {
            "$ref": "#/components/schemas/SupportedLanguage"
          },
          {
            "type": [
              "string",
              "null"
            ]
          }
        ]
      },
      "maxSpeed": {
        "type": "boolean",
        "description": "Optional parameter to optimize the API call for maximum speed. When set to true, the API will skip time-consuming operations for faster response at the cost of less comprehensive data."
      },
      "timeoutOpts": {
        "$ref": "#/components/schemas/PartialTimeout"
      },
      "country_gl": {
        "allOf": [
          {
            "$ref": "#/components/schemas/CountryGL"
          },
          {
            "description": "Optional country code hint (GL parameter) to specify the country when identifying a transaction."
          }
        ]
      },
      "city": {
        "type": "string",
        "description": "Optional city name to prioritize when searching for the brand."
      },
      "mcc": {
        "anyOf": [
          {
            "type": "string"
          },
          {
            "type": "number"
          }
        ],
        "description": "Optional Merchant Category Code (MCC) to help identify the business category or industry."
      },
      "phone": {
        "anyOf": [
          {
            "type": "string"
          },
          {
            "type": "number"
          }
        ],
        "description": "Optional phone number from the transaction to help verify brand match."
      },
      "high_confidence_only": {
        "type": "boolean",
        "description": "When set to true, the API performs additional verification to ensure the identified brand matches the transaction with high confidence."
      },
      "zdr": {
        "type": "string",
        "enum": [
          "enabled",
          "disabled"
        ],
        "description": "`enabled` disables request logs and traces and omits request and response content from usage logs. Brand data and hosted assets may still be stored. Returns 403 `ZDR_NOT_ENABLED` unless your organization has ZDR."
      },
      "tags": {
        "$ref": "#/components/schemas/RequestTags"
      },
      "policies": {
        "type": "array",
        "items": {
          "type": "string"
        },
        "description": "Access policy IDs to apply. A URL must pass every policy.",
        "example": [
          "pol_3f9c2a7e5b8d4c1f9a6e0b2d7c4f8a1e"
        ]
      }
    },
    "required": [
      "type",
      "transaction_info"
    ],
    "additionalProperties": false,
    "title": "By transaction",
    "description": "Identify brand data from a transaction descriptor. Cannot be combined with domain, name, email, or ticker."
  },
  "UtilityPrefetchDomainIdentifier": {
    "type": "object",
    "properties": {
      "domain": {
        "type": "string",
        "minLength": 3,
        "description": "Domain, e.g. `stripe.com`."
      }
    },
    "required": [
      "domain"
    ],
    "additionalProperties": false,
    "title": "By domain",
    "description": "Prefetch by domain."
  },
  "UtilityPrefetchEmailIdentifier": {
    "type": "object",
    "properties": {
      "email": {
        "type": "string",
        "minLength": 1,
        "format": "email",
        "description": "Email address to prefetch data for. The domain will be extracted from the email. Free email providers (gmail.com, yahoo.com, etc.) and disposable email addresses are not allowed."
      }
    },
    "required": [
      "email"
    ],
    "additionalProperties": false,
    "title": "By email",
    "description": "Prefetch by email. The domain will be extracted and validated."
  },
  "MonitorsMode": {
    "type": "string",
    "enum": [
      "web"
    ],
    "description": "Always `web`. Optional.",
    "title": "Monitor mode"
  },
  "MonitorsTarget": {
    "oneOf": [
      {
        "$ref": "#/components/schemas/MonitorsPageTarget"
      },
      {
        "$ref": "#/components/schemas/MonitorsSitemapTarget"
      },
      {
        "allOf": [
          {
            "$ref": "#/components/schemas/MonitorsExtractTarget"
          },
          {
            "description": "Track relevant pages selected by `schema` and `instructions`; refresh the page set periodically."
          }
        ]
      },
      {
        "$ref": "#/components/schemas/MonitorsSearchTarget"
      }
    ],
    "discriminator": {
      "propertyName": "type",
      "mapping": {
        "page": "#/components/schemas/MonitorsPageTarget",
        "sitemap": "#/components/schemas/MonitorsSitemapTarget",
        "extract": "#/components/schemas/MonitorsExtractTarget",
        "search": "#/components/schemas/MonitorsSearchTarget"
      }
    },
    "description": "What to watch: a page, a sitemap, data extracted from a site, or web search results."
  },
  "MonitorsChangeDetection": {
    "oneOf": [
      {
        "$ref": "#/components/schemas/MonitorsExactChangeDetection"
      },
      {
        "$ref": "#/components/schemas/MonitorsSemanticChangeDetection"
      }
    ],
    "discriminator": {
      "propertyName": "type",
      "mapping": {
        "exact": "#/components/schemas/MonitorsExactChangeDetection",
        "semantic": "#/components/schemas/MonitorsSemanticChangeDetection"
      }
    },
    "description": "How changes are judged. Defaults to `semantic` for extract and search targets and page targets with `instructions`, otherwise `exact`."
  },
  "MonitorsSchedule": {
    "oneOf": [
      {
        "$ref": "#/components/schemas/MonitorsIntervalSchedule"
      }
    ],
    "discriminator": {
      "propertyName": "type",
      "mapping": {
        "interval": "#/components/schemas/MonitorsIntervalSchedule"
      }
    },
    "description": "How often the monitor runs. Defaults to once a day."
  },
  "MonitorsNullableWebhookConfig": {
    "description": "Webhook destination and delivery settings. Null means no webhook is configured.",
    "anyOf": [
      {
        "allOf": [
          {
            "$ref": "#/components/schemas/MonitorsWebhookConfig"
          }
        ]
      },
      {
        "type": "null"
      }
    ]
  },
  "BatchUnifiedScrapeData": {
    "type": "object",
    "properties": {
      "urls": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "url": {
              "type": "string",
              "minLength": 1,
              "description": "Page URL to scrape.",
              "example": "https://example.com/products/anvil"
            },
            "itemId": {
              "type": "string",
              "minLength": 1,
              "maxLength": 200,
              "description": "Your ID for this page, returned with its result. The same URL can use different IDs.",
              "example": "sku-1"
            },
            "meta": {
              "type": "object",
              "additionalProperties": {},
              "description": "Custom JSON returned unchanged with this page result."
            }
          },
          "required": [
            "url"
          ],
          "additionalProperties": false,
          "description": "A page to scrape, with optional data for matching results."
        },
        "minItems": 1,
        "maxItems": 100000,
        "description": "Pages to scrape. Maximum 100000."
      },
      "formats": {
        "$ref": "#/components/schemas/ScrapeFormats"
      },
      "sharedParams": {
        "$ref": "#/components/schemas/ScrapeSharedParams"
      },
      "markdownParams": {
        "$ref": "#/components/schemas/ScrapeMarkdownParams"
      },
      "screenshotParams": {
        "$ref": "#/components/schemas/ScrapeScreenshotParams"
      },
      "imageParams": {
        "$ref": "#/components/schemas/ScrapeImageParams"
      },
      "parseParams": {
        "$ref": "#/components/schemas/ScrapeParseParams"
      },
      "productParams": {
        "$ref": "#/components/schemas/ScrapeProductParams"
      },
      "highlightsParams": {
        "$ref": "#/components/schemas/ScrapeHighlightsParams"
      },
      "jsonParams": {
        "$ref": "#/components/schemas/ScrapeJsonParams"
      },
      "maxAgeMs": {
        "type": "integer",
        "minimum": 0,
        "maximum": 31536000000,
        "default": 259200000,
        "description": "Maximum age of a cached output, in milliseconds. `0` fetches fresh. Defaults to 3 days (259200000 ms). Maximum: 1 year (31536000000 ms)."
      },
      "zdr": {
        "type": "string",
        "enum": [
          "disabled"
        ],
        "default": "disabled",
        "description": "Batches persist their results. Only disabled is supported; enabled returns ZDR_NOT_SUPPORTED."
      },
      "timeoutOpts": {
        "$ref": "#/components/schemas/ScrapeTimeout",
        "description": "Deadline for each page, using the same behavior and defaults as POST /web/scrape."
      },
      "tags": {
        "$ref": "#/components/schemas/RequestTags"
      }
    },
    "required": [
      "urls",
      "formats"
    ],
    "additionalProperties": false,
    "title": "Scrape Anything",
    "description": "Use the same formats and parameters as POST /web/scrape, replacing url with urls. Options apply to every page."
  },
  "BatchUnifiedCrawlData": {
    "type": "object",
    "properties": {
      "source": {
        "oneOf": [
          {
            "type": "object",
            "properties": {
              "type": {
                "type": "string",
                "enum": [
                  "start_url"
                ],
                "description": "Start from one page."
              },
              "url": {
                "type": "string",
                "minLength": 1,
                "description": "Page where crawling begins. A URL without a scheme is read as https://.",
                "example": "https://example.com/docs"
              },
              "controls": {
                "type": "object",
                "properties": {
                  "maxUrls": {
                    "type": "integer",
                    "minimum": 1,
                    "maximum": 100000,
                    "default": 100,
                    "description": "Maximum pages to fetch. Unused reserved credits are refunded. Maximum 100000."
                  },
                  "maxDepth": {
                    "type": "integer",
                    "minimum": 0,
                    "maximum": 50,
                    "description": "Maximum link depth. Source pages are depth 0. No limit when omitted."
                  },
                  "followSubdomains": {
                    "type": "boolean",
                    "default": false,
                    "description": "Follow links to subdomains."
                  },
                  "regex": {
                    "type": "string",
                    "maxLength": 256,
                    "description": "Regex pattern for URLs to include. The `start_url` itself is always included.",
                    "example": "^https://example\\.com/docs/"
                  },
                  "excludeRegex": {
                    "type": "string",
                    "maxLength": 256,
                    "description": "Regex pattern for URLs to exclude, even when they match `regex`. The `start_url` itself is always included.",
                    "example": "/tag/|/author/"
                  },
                  "languages": {
                    "anyOf": [
                      {
                        "type": "string",
                        "enum": [
                          "same_as_start_url"
                        ]
                      },
                      {
                        "type": "array",
                        "items": {
                          "type": "string",
                          "enum": [
                            "am",
                            "ar",
                            "az",
                            "be",
                            "bg",
                            "bn",
                            "ca",
                            "ceb",
                            "cs",
                            "cy",
                            "da",
                            "de",
                            "el",
                            "en",
                            "es",
                            "et",
                            "eu",
                            "fa",
                            "fi",
                            "fr",
                            "gu",
                            "ha",
                            "haw",
                            "he",
                            "hi",
                            "hr",
                            "hu",
                            "hy",
                            "id",
                            "is",
                            "it",
                            "ja",
                            "ka",
                            "kk",
                            "kn",
                            "ko",
                            "ku",
                            "ky",
                            "lo",
                            "lt",
                            "lv",
                            "mk",
                            "ml",
                            "mn",
                            "mr",
                            "ms",
                            "ne",
                            "nl",
                            "no",
                            "or",
                            "pa",
                            "pl",
                            "ps",
                            "pt",
                            "ro",
                            "ru",
                            "sk",
                            "sl",
                            "so",
                            "sq",
                            "sr",
                            "sv",
                            "sw",
                            "ta",
                            "te",
                            "th",
                            "tl",
                            "tr",
                            "uk",
                            "ur",
                            "uz",
                            "vi",
                            "yo",
                            "zh"
                          ]
                        },
                        "minItems": 1
                      }
                    ],
                    "description": "Only follow pages in these languages, or `same_as_start_url`; all languages when omitted.",
                    "example": "same_as_start_url"
                  }
                },
                "default": {
                  "maxUrls": 100,
                  "followSubdomains": false
                },
                "additionalProperties": false,
                "description": "Limits and filters for page discovery."
              }
            },
            "required": [
              "type",
              "url"
            ],
            "additionalProperties": false,
            "description": "Discover pages by following links from one URL.",
            "title": "Start URL"
          },
          {
            "type": "object",
            "properties": {
              "type": {
                "type": "string",
                "enum": [
                  "sitemap"
                ],
                "description": "Scrape the URLs in the domain's sitemap."
              },
              "domain": {
                "type": "string",
                "minLength": 3,
                "description": "Domain whose sitemap lists the pages to scrape. A full URL is reduced to its domain.",
                "example": "example.com"
              },
              "controls": {
                "type": "object",
                "properties": {
                  "maxUrls": {
                    "type": "integer",
                    "minimum": 1,
                    "maximum": 100000,
                    "default": 100,
                    "description": "Maximum pages to fetch. Unused reserved credits are refunded. Maximum 100000."
                  },
                  "regex": {
                    "type": "string",
                    "maxLength": 256,
                    "description": "Regex pattern; only sitemap URLs matching it are scraped.",
                    "example": "^https://example\\.com/docs/"
                  },
                  "excludeRegex": {
                    "type": "string",
                    "maxLength": 256,
                    "description": "Regex pattern; sitemap URLs matching it are not scraped, even when they match `regex`.",
                    "example": "/tag/|/author/"
                  }
                },
                "default": {
                  "maxUrls": 100
                },
                "additionalProperties": false,
                "description": "Limits and filters for the sitemap URLs. A sitemap batch scrapes exactly those URLs and never follows links off them, so there is no crawl depth here."
              }
            },
            "required": [
              "type",
              "domain"
            ],
            "additionalProperties": false,
            "description": "Scrape the pages listed in a domain's sitemap. Links on those pages are not followed.",
            "title": "Sitemap"
          }
        ],
        "discriminator": {
          "propertyName": "type"
        },
        "title": "Crawl source",
        "description": "How to find pages to crawl."
      },
      "formats": {
        "$ref": "#/components/schemas/ScrapeFormats"
      },
      "sharedParams": {
        "$ref": "#/components/schemas/ScrapeSharedParams"
      },
      "markdownParams": {
        "$ref": "#/components/schemas/ScrapeMarkdownParams"
      },
      "screenshotParams": {
        "$ref": "#/components/schemas/ScrapeScreenshotParams"
      },
      "imageParams": {
        "$ref": "#/components/schemas/ScrapeImageParams"
      },
      "parseParams": {
        "$ref": "#/components/schemas/ScrapeParseParams"
      },
      "productParams": {
        "$ref": "#/components/schemas/ScrapeProductParams"
      },
      "highlightsParams": {
        "$ref": "#/components/schemas/ScrapeHighlightsParams"
      },
      "jsonParams": {
        "$ref": "#/components/schemas/ScrapeJsonParams"
      },
      "maxAgeMs": {
        "type": "integer",
        "minimum": 0,
        "maximum": 31536000000,
        "default": 259200000,
        "description": "Maximum age of a cached output, in milliseconds. `0` fetches fresh. Defaults to 3 days (259200000 ms). Maximum: 1 year (31536000000 ms)."
      },
      "zdr": {
        "type": "string",
        "enum": [
          "disabled"
        ],
        "default": "disabled",
        "description": "Batches persist their results. Only disabled is supported; enabled returns ZDR_NOT_SUPPORTED."
      },
      "timeoutOpts": {
        "$ref": "#/components/schemas/ScrapeTimeout",
        "description": "Deadline for each page, using the same behavior and defaults as POST /web/scrape."
      },
      "tags": {
        "$ref": "#/components/schemas/RequestTags"
      }
    },
    "required": [
      "source",
      "formats"
    ],
    "additionalProperties": false,
    "title": "Crawl with Scrape Anything",
    "description": "Use the same formats and parameters as POST /web/scrape, replacing url with source. Options apply to every page."
  },
  "WebhookRetry": {
    "type": "object",
    "properties": {
      "delays_seconds": {
        "type": "array",
        "items": {
          "type": "integer",
          "minimum": 1,
          "maximum": 86400
        },
        "maxItems": 10,
        "description": "Retry delays in seconds, totaling at most 72 hours. Use [] to disable automatic retries.",
        "example": [
          30,
          300,
          3600
        ]
      }
    },
    "additionalProperties": false,
    "description": "Webhook retry settings. Use {} for the default schedule.",
    "example": {
      "delays_seconds": [
        10,
        60,
        300,
        1800,
        7200,
        21600,
        57600
      ]
    }
  },
  "ScrapeProfile": {
    "oneOf": [
      {
        "type": "object",
        "properties": {
          "type": {
            "type": "string",
            "enum": [
              "existing"
            ],
            "const": "existing",
            "description": "Reuse a saved browser profile."
          },
          "profileId": {
            "type": "string",
            "pattern": "^prof_[a-f0-9]{32}$",
            "description": "The ID returned in profile.id by an earlier scrape."
          }
        },
        "required": [
          "type",
          "profileId"
        ],
        "additionalProperties": false,
        "x-stainless-variantName": "Existing"
      },
      {
        "type": "object",
        "properties": {
          "type": {
            "type": "string",
            "enum": [
              "new"
            ],
            "const": "new",
            "description": "Sign in and create a browser profile."
          },
          "identifier": {
            "type": "string",
            "minLength": 1,
            "maxLength": 1024,
            "description": "Username or email for the target website."
          },
          "password": {
            "type": "string",
            "minLength": 1,
            "maxLength": 4096,
            "description": "Password used to sign in. It is never stored in the profile.",
            "writeOnly": true
          },
          "description": {
            "type": "string",
            "minLength": 1,
            "maxLength": 500,
            "description": "Optional label shown when listing profiles with `GET /org/browser/profiles`."
          }
        },
        "required": [
          "type",
          "identifier",
          "password"
        ],
        "additionalProperties": false,
        "x-stainless-variantName": "New"
      }
    ],
    "discriminator": {
      "propertyName": "type"
    },
    "description": "Create or reuse an authenticated browser profile. Requires a paid plan and an HTTPS target. Profiles persist session state, bypass shared caches, and cannot be combined with ZDR, custom headers, raw bytes, or prebuilt parsers."
  },
  "ScrapeAction": {
    "oneOf": [
      {
        "type": "object",
        "properties": {
          "type": {
            "type": "string",
            "enum": [
              "perform"
            ],
            "description": "Use `perform` for a plain-language browser instruction."
          },
          "action": {
            "type": "string",
            "minLength": 1,
            "maxLength": 500,
            "description": "One browser instruction, such as clicking a button or entering text.",
            "examples": [
              "Click the product details tab"
            ]
          }
        },
        "required": [
          "type",
          "action"
        ],
        "additionalProperties": false,
        "x-stainless-variantName": "Perform"
      },
      {
        "type": "object",
        "properties": {
          "type": {
            "type": "string",
            "enum": [
              "scroll"
            ],
            "description": "Use `scroll` to move through the page or a container."
          },
          "direction": {
            "type": "string",
            "enum": [
              "down",
              "up",
              "left",
              "right"
            ],
            "default": "down",
            "description": "Direction to scroll."
          },
          "amount": {
            "anyOf": [
              {
                "type": "integer",
                "minimum": 1,
                "maximum": 100000
              },
              {
                "type": "string",
                "enum": [
                  "viewport",
                  "max"
                ]
              }
            ],
            "default": "viewport",
            "description": "Distance per scroll: pixels, one `viewport`, or `max` to reach the end."
          },
          "selector": {
            "type": "string",
            "minLength": 1,
            "maxLength": 2000,
            "pattern": "\\S",
            "description": "Scroll this container. Omit to scroll the page."
          },
          "maxScrolls": {
            "type": "integer",
            "minimum": 1,
            "maximum": 50,
            "default": 1,
            "description": "Maximum number of scroll steps for this action."
          }
        },
        "required": [
          "type"
        ],
        "additionalProperties": false,
        "x-stainless-variantName": "Scroll"
      },
      {
        "type": "object",
        "properties": {
          "type": {
            "type": "string",
            "enum": [
              "wait"
            ],
            "description": "Use `wait` to pause for a fixed duration."
          },
          "milliseconds": {
            "type": "integer",
            "minimum": 0,
            "maximum": 30000,
            "description": "Time to pause in milliseconds before the next action."
          }
        },
        "required": [
          "type",
          "milliseconds"
        ],
        "additionalProperties": false,
        "x-stainless-variantName": "Wait"
      },
      {
        "type": "object",
        "properties": {
          "type": {
            "type": "string",
            "enum": [
              "waitFor"
            ],
            "description": "Use `waitFor` to wait for a matching element."
          },
          "selector": {
            "type": "string",
            "minLength": 1,
            "maxLength": 2048,
            "pattern": "\\S",
            "description": "CSS selector to wait for before continuing."
          }
        },
        "required": [
          "type",
          "selector"
        ],
        "additionalProperties": false,
        "x-stainless-variantName": "WaitFor"
      }
    ],
    "discriminator": {
      "propertyName": "type"
    },
    "title": "Browser action"
  },
  "ScrapePdfOptions": {
    "type": "object",
    "properties": {
      "startPage": {
        "type": "integer",
        "minimum": 1,
        "description": "First page to parse, starting at 1."
      },
      "endPage": {
        "type": "integer",
        "minimum": 1,
        "description": "Last page to parse. Must be at least `startPage`."
      },
      "ocr": {
        "type": "string",
        "enum": [
          "off",
          "auto"
        ],
        "default": "off",
        "description": "Set `auto` to read scanned pages with OCR."
      },
      "includeNumberedPages": {
        "type": "boolean",
        "default": false,
        "description": "Start each page in the Markdown with a `<!-- page N -->` line using its original 1-based page number; these responses are never served from cache."
      }
    },
    "additionalProperties": false,
    "description": "PDF page range and OCR."
  },
  "ScrapeParseRules": {
    "type": "object",
    "additionalProperties": {
      "anyOf": [
        {
          "type": "string",
          "minLength": 1,
          "maxLength": 2048
        },
        {
          "type": "object",
          "properties": {
            "selector": {
              "type": "string",
              "minLength": 1,
              "maxLength": 2048,
              "description": "CSS selector to match within the current page or parent rule."
            },
            "type": {
              "type": "string",
              "enum": [
                "item",
                "list"
              ],
              "description": "Return the first match with `item` or all matches with `list`."
            },
            "output": {
              "description": "Return text, HTML, an attribute such as `@href`, or nested field rules. Defaults to text.",
              "anyOf": [
                {
                  "type": "string",
                  "enum": [
                    "text",
                    "html"
                  ]
                },
                {
                  "type": "string",
                  "pattern": "^@.*$"
                },
                {
                  "$ref": "#/components/schemas/ScrapeParseRules"
                }
              ]
            }
          },
          "required": [
            "selector"
          ],
          "additionalProperties": false
        }
      ]
    },
    "description": "Field names mapped to CSS selectors (`h1`, `a@href`) or rule objects. Max 100 fields, 5 levels.",
    "minProperties": 1,
    "examples": [
      {
        "title": "h1",
        "links": {
          "selector": "a",
          "type": "list",
          "output": "@href"
        }
      }
    ]
  },
  "MonitorsPageTarget": {
    "type": "object",
    "properties": {
      "type": {
        "type": "string",
        "enum": [
          "page"
        ],
        "description": "Use `page` to watch one web page."
      },
      "url": {
        "type": "string",
        "format": "uri",
        "description": "Public HTTP(S) page URL to monitor.",
        "example": "https://acme.com/pricing"
      },
      "instructions": {
        "type": "string",
        "minLength": 1,
        "maxLength": 2000,
        "description": "Plain-language goal describing which page changes matter. When provided without change_detection, semantic detection is inferred.",
        "example": "Report pricing or plan availability changes. Ignore counters, timestamps, testimonials, and navigation."
      },
      "normalize_whitespace": {
        "type": "boolean",
        "default": true,
        "description": "Normalize whitespace before comparing or analyzing text."
      },
      "include_selectors": {
        "type": "array",
        "items": {
          "type": "string",
          "minLength": 1,
          "maxLength": 2048
        },
        "maxItems": 50,
        "description": "Monitor these CSS-selected regions. Empty or omitted uses main content. Changes create a new baseline.",
        "example": [
          "#attraction-details"
        ]
      },
      "exclude_selectors": {
        "type": "array",
        "items": {
          "type": "string",
          "minLength": 1,
          "maxLength": 2048
        },
        "maxItems": 50,
        "description": "Remove matching regions after inclusions. Changes create a new baseline.",
        "example": [
          ".carousel",
          "[id^=\"TA_\"]"
        ]
      },
      "actions": {
        "type": [
          "array",
          "null"
        ],
        "items": {
          "$ref": "#/components/schemas/WebScrapeAction"
        },
        "maxItems": 5,
        "description": "Optional browser actions executed in array order after the page loads, before content is captured, on every run. Requires a paid plan. Maximum: 5 actions. Changes create a new baseline."
      }
    },
    "required": [
      "type",
      "url"
    ],
    "additionalProperties": false,
    "description": "Watch a single web page. Exact detection reports visible-text diffs; semantic detection judges confirmed stable diffs against `instructions`.",
    "title": "Page target"
  },
  "MonitorsSitemapTarget": {
    "type": "object",
    "properties": {
      "type": {
        "type": "string",
        "enum": [
          "sitemap"
        ],
        "description": "Use `sitemap` to watch a site for added or removed URLs."
      },
      "url": {
        "type": "string",
        "format": "uri",
        "description": "Sitemap URL to monitor.",
        "example": "https://acme.com/sitemap.xml"
      },
      "include": {
        "type": "array",
        "items": {
          "type": "string",
          "minLength": 1,
          "maxLength": 200
        },
        "maxItems": 50,
        "description": "URL path patterns to include (max 50).",
        "example": [
          "/blog/*",
          "/pricing*"
        ]
      },
      "exclude": {
        "type": "array",
        "items": {
          "type": "string",
          "minLength": 1,
          "maxLength": 200
        },
        "maxItems": 50,
        "description": "URL path patterns to exclude (max 50).",
        "example": [
          "/legal/*",
          "/privacy"
        ]
      },
      "max_urls": {
        "type": "integer",
        "minimum": 1,
        "maximum": 10000,
        "default": 5000,
        "description": "Maximum number of sitemap URLs to track (capped at 10,000)."
      }
    },
    "required": [
      "type",
      "url"
    ],
    "additionalProperties": false,
    "description": "Watch a site’s URL inventory for confirmed additions and removals.",
    "title": "Sitemap target"
  },
  "MonitorsExtractTarget": {
    "type": "object",
    "properties": {
      "type": {
        "type": "string",
        "enum": [
          "extract"
        ],
        "description": "Use `extract` to watch structured data across selected pages."
      },
      "url": {
        "type": "string",
        "format": "uri",
        "description": "Root URL to extract structured data from.",
        "example": "https://acme.com"
      },
      "schema": {
        "type": "object",
        "additionalProperties": {},
        "description": "JSON Schema for page selection and the baseline snapshot. Changes return diffs and evidence.",
        "example": {
          "type": "object",
          "properties": {
            "plans": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "name": {
                    "type": "string"
                  },
                  "price": {
                    "type": "string"
                  }
                }
              }
            }
          }
        }
      },
      "instructions": {
        "type": "string",
        "minLength": 1,
        "maxLength": 2000,
        "description": "Natural-language instructions guiding which pages and facts to track and which changes to report.",
        "example": "Extract every pricing plan with its monthly price and included limits."
      },
      "max_pages": {
        "type": "integer",
        "minimum": 1,
        "maximum": 50,
        "default": 10,
        "description": "Maximum number of pages to track."
      },
      "max_depth": {
        "type": "integer",
        "minimum": 0,
        "maximum": 10,
        "description": "Optional maximum link depth from the starting URL (0 = only the starting page)."
      },
      "follow_subdomains": {
        "type": "boolean",
        "default": false,
        "description": "Allow page discovery on subdomains of the target site."
      }
    },
    "required": [
      "type",
      "url",
      "instructions"
    ],
    "additionalProperties": false,
    "title": "Extract target"
  },
  "MonitorsSearchTarget": {
    "type": "object",
    "properties": {
      "type": {
        "type": "string",
        "enum": [
          "search"
        ],
        "description": "Use `search` to watch the whole web for new results about a topic."
      },
      "query": {
        "type": "string",
        "minLength": 1,
        "maxLength": 500,
        "description": "Web search query to run on every check. Supports operators such as `site:`, `-site:`, and quoted phrases.",
        "example": "Acme Corp acquisition"
      },
      "instructions": {
        "type": "string",
        "minLength": 1,
        "maxLength": 2000,
        "description": "Plain-language description of which new results matter. Defaults to the query.",
        "example": "Alert me when Acme announces an acquisition or a new product. Ignore opinion pieces."
      }
    },
    "required": [
      "type",
      "query"
    ],
    "additionalProperties": false,
    "description": "Search the web on every run and report results not seen before, listed in the change’s `matched_urls` and `evidence`. Semantic detection reports only results describing a new development that matches `instructions`; exact detection reports every new result.",
    "title": "Search target"
  },
  "MonitorsExactChangeDetection": {
    "type": "object",
    "properties": {
      "type": {
        "type": "string",
        "enum": [
          "exact"
        ],
        "description": "Use `exact` to compare visible text, sitemap URLs, or search results."
      }
    },
    "required": [
      "type"
    ],
    "additionalProperties": false,
    "description": "Detect exact changes. For page targets, this means visible text diffs. For sitemap targets, this means URL additions and removals. For search targets, this means every new result.",
    "title": "Exact"
  },
  "MonitorsSemanticChangeDetection": {
    "type": "object",
    "properties": {
      "type": {
        "type": "string",
        "enum": [
          "semantic"
        ],
        "description": "Use `semantic` to judge changes against the target instructions."
      },
      "confidence_threshold": {
        "type": "number",
        "minimum": 0,
        "maximum": 1,
        "default": 0.75,
        "description": "Minimum confidence required to report a meaningful change, from 0 to 1."
      }
    },
    "required": [
      "type"
    ],
    "additionalProperties": false,
    "description": "Detect meaningful content changes using the target’s instructions and optional schema.",
    "title": "Semantic"
  },
  "MonitorsIntervalSchedule": {
    "type": "object",
    "properties": {
      "type": {
        "type": "string",
        "enum": [
          "interval"
        ],
        "description": "Use `interval` to run on a repeating schedule."
      },
      "frequency": {
        "type": "integer",
        "minimum": 1,
        "maximum": 525600,
        "description": "Number of units between runs. The resulting interval (frequency × unit) must be at least 10 minutes and at most 1 year (e.g. minimum 10 when unit is minutes; maximum 365 when unit is days).",
        "example": 6
      },
      "unit": {
        "$ref": "#/components/schemas/MonitorsScheduleUnit"
      }
    },
    "required": [
      "type",
      "frequency",
      "unit"
    ],
    "additionalProperties": false,
    "description": "Run the monitor on a fixed interval defined by a frequency and a unit, e.g. every 6 hours or every 2 days. The total interval (frequency × unit) must be between 10 minutes and 1 year.",
    "title": "Interval"
  },
  "MonitorsWebhookConfig": {
    "type": "object",
    "properties": {
      "url": {
        "type": "string",
        "format": "uri",
        "description": "Public HTTP(S) URL that receives events. Slack and GovSlack URLs get formatted messages.",
        "example": "https://example.com/webhook"
      },
      "events": {
        "type": "array",
        "items": {
          "type": "string",
          "enum": [
            "change.detected",
            "run.completed"
          ]
        },
        "minItems": 1,
        "maxItems": 2,
        "uniqueItems": true,
        "description": "Events to deliver. Defaults to `change.detected`; `run.completed` also includes unchanged runs.",
        "example": [
          "change.detected",
          "run.completed"
        ]
      },
      "retry": {
        "$ref": "#/components/schemas/WebhookRetry"
      },
      "secret": {
        "type": "string",
        "readOnly": true,
        "description": "API-generated signing secret. Visible only with full access or `monitors:write` permission.",
        "example": "whsec_8f3a…"
      }
    },
    "required": [
      "url"
    ],
    "additionalProperties": false
  },
  "MonitorsScheduleUnit": {
    "type": "string",
    "enum": [
      "minutes",
      "hours",
      "days"
    ],
    "description": "Time unit used with `frequency` to set the run interval.",
    "example": "hours"
  }
};
