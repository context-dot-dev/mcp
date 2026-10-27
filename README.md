# Context MCP Server

A remote MCP server that gives AI agents reliable context from the live web, company news, and files: search, scraping, crawling, structured extraction, document parsing, brand intelligence, large batches, screenshots, and change monitoring.

The server exposes 45 tools: 44 operations in [API-reference sidebar order](https://docs.context.dev/api-reference/web-scraping/scrape), with the `get-brand` visual wrapper immediately after brand retrieval. Prefetch is intentionally excluded. Webhook event payload pages describe incoming notifications and are not callable tools. Request schemas are generated from the Context OpenAPI specification.

## Connect

The MCP endpoint is:

```text
https://<your-domain>/mcp
```

The bare server URL (`https://<your-domain>/`) also accepts MCP requests, for clients configured without the `/mcp` path. The server is stateless and sends no unsolicited messages, so a `GET` that asks for an event stream returns `405`, as the Streamable HTTP transport allows. When a client sends an expired or invalid OAuth token, the `401` challenge carries `error="invalid_token"` so the client refreshes the token instead of waiting for the user to sign in again.

Connect through OAuth, or send a Context API key in the `Authorization` header (works on both hosted and local deployments):

```text
Authorization: Bearer ctxt_secret_...
```

`X-API-Key: ctxt_secret_...` is also accepted. If a client cannot use OAuth or custom headers, put the key in the endpoint URL:

```text
https://<your-domain>/mcp?api_key=ctxt_secret_...
```

Prefer OAuth or headers because URLs can be saved in client configuration, logs, browser history, and analytics. Rotate a key if its URL is exposed.

## Tools

| Group | Tools |
| --- | --- |
| Scrape and crawl | `web-scrape`, `web-map`, `web-crawl` |
| Search and research | `web-search`, `web-answers` |
| Brand and design | `brand-retrieve-unified`, `get-brand`, `brand-search`, `web-styleguide` |
| Companies and people | `company-search`, `people-search`, `people-enrich` |
| News by topic or company | `get-news-search` |
| Parse | `parse-document` |
| Batches | `submit-batch`, `list-batches`, `get-batch`, `get-batch-results`, `cancel-batch`, `delete-batch` |
| Monitors | `create-monitor`, `list-monitors`, `get-monitor`, `update-monitor`, `delete-monitor`, `get-monitor-limits`, `list-monitor-credit-usage`, `run-monitor-now`, run and change history, `rotate-monitor-webhook-secret` |
| Webhook deliveries | `list-webhook-deliveries`, `get-webhook-delivery`, `list-webhook-delivery-attempts`, `retry-webhook-delivery` |
| API debugging | `list-logs`, `get-log` |
| Browser profiles | `list-browser-profiles` |
| Credit usage | `get-usage`, `get-usage-history` |
| Feedback | `submit-feedback` |

`get-brand` includes a visual brand card. Tool descriptions explain when each tool should be used, which adjacent tool to choose instead, whether work is synchronous or asynchronous, and what the result contains. API-backed tools retain the public OpenAPI request validation with MCP safety annotations audited for account state, open-web access, and destructive operations.

Every tool declares `idempotentHint`. Read-only tools, `parse-document`, `update-monitor`, and the cancel and delete tools are idempotent. Tools that create a batch, monitor, run, webhook secret, webhook attempt, or feedback record, and `web-scrape` with its browser actions, are not. Tools whose results are always JSON objects declare a compact `outputSchema`: top-level fields only, none required, extra fields allowed, so account-limit errors and shortened responses still validate. `web-search`, `web-scrape`, and `web-crawl` declare none, because compact mode returns text without `structuredContent`.

Agents are instructed to always call `submit-feedback` once per unexpected API issue, including incomplete or incorrect successful results, even when a retry or workaround succeeds. This guidance is sent in MCP initialization instructions, the feedback tool description, and API error responses (including `get-brand`). Account limits working as intended (402 `USAGE_EXCEEDED` (or legacy 401), 429 `RATE_LIMITED`, 403 `PAID_PLAN_REQUIRED`) instead tell agents not to report them and give the next step; error text also carries `credits_remaining`, `Retry-After`, and (on 429s) `X-RateLimit-Remaining`/`X-RateLimit-Limit` when the API returns them. Reports include expected versus actual behavior and the affected request ID, with a public page/docs URL as a fallback. Request IDs from response bodies or `X-Request-Id` headers are preserved for reporting. Reports must omit secrets and private data and respect user preferences and host permissions. A failed feedback submission must not trigger another feedback report or a retry loop. The shared guidance lives in `src/feedback.ts`.

Use `web-scrape` for one known page. It can return HTML, Markdown, screenshots, page images, original bytes, CSS-selected fields, focused highlights, schema-shaped JSON, and product data in one request. It also supports browser actions, browser profiles for pages behind a sign-in, prebuilt parsers, custom target headers, PDF parsing, `timeoutOpts`, `zdr`, and `tags`. Use `web-map` to map URLs through `/web/urls`. Use `get-news-search` for live or historical news, either a plain-language `query` (ordered by relevance) or one company identified by exactly one name, domain, ticker, or ISIN; use `web-search` for general web pages or when the source is unknown; use `web-answers` when the user wants a sourced JSON answer rather than ranked links. Use `company-search` or `people-search` to find companies or people from a plain-language description, `brand-search` to resolve a company the user already named, and `people-enrich` to match one known person. Use `web-crawl` for a focused multi-page request, and `submit-batch` for up to 100,000 URLs or a large asynchronous crawl. A batch returns an ID; poll `get-batch`, then page through `get-batch-results` after completion.

Scrape browser instructions (`perform` actions) and sign-ins that create a browser profile require the OAuth `api.write` scope. Captures that only read, scroll, or wait continue to work with `api.read`.

Tool arguments are repaired against the published input schema before validation, because models often send a near miss and then repeat it. Nested objects and arrays sent as JSON strings are parsed (opencode with Qwen or Nemotron does this). Missing `arguments` become `{}`. `null` or `""` in optional fields, unknown keys inside option objects, and parameters nested in the wrong object are dropped or moved. Numbers and booleans sent as strings are converted, enum values and keys that differ only in case or separators are matched, and out-of-range integers such as `numResults: 5` are clamped to the published bounds. Tool-specific repairs cover patterns seen in production: `web-scrape` defaults to Markdown and reads `format`, `["markdown"]`, or web-search style options; `web-answers` accepts `query` and a JSON Schema for the answer shape; `web-map` accepts a URL; `get-news-search` builds `searchBy` from a flat `query` or flat company identifiers; `company-search` and `people-search` move flat filters such as `country` or `min_employees` under `filters` and convert country names to two-letter codes; and `brand-retrieve-unified` builds its lookup object from flat company identifiers; a call that carries only another tool's input (a URL sent to `web-search`, a query sent to `web-scrape`, `list-monitor-changes` without a monitor) goes to that tool. Calls that already pass validation are sent unchanged, except that `web-scrape` requests the formats whose options it was given, as the API requires. Anything that still does not fit fails validation as before, with a short hint about the expected input; free-text topics sent to `get-news-search` go out as a natural-language `query` and are never guessed into company names. Published schemas omit `$schema` and `allOf`, enums with more than 30 values are published as strings and validated on the server, and patterns are anchored for clients that require it. API defaults are published as `default` keywords, and a "Defaults to" sentence is dropped only when its default keyword says the same; defaults that depend on other inputs stay in the description. Merged union properties describe each variant, and response-only (`readOnly`) fields such as a monitor webhook's generated `secret` are left out of input schemas. `src/schema-descriptions.ts` replaces API descriptions that repeat schema limits or describe query-string encoding, keyed by the API text, so a spec sync that changes that text restores the API wording.

Requests rejected with `429` are retried up to five times with backoff while the `Retry-After` delay fits within 30 seconds; they did no work, so the retry is safe. A Context API call that has not answered within 115 seconds is stopped with an actionable error before hosting proxies time out. Tools removed when scraping was consolidated (`web-scrape-markdown`, `web-scrape-html`, `web-scrape-images`, `web-scrape-sitemap`, `web-extract`, `web-screenshot`) remain callable for clients with cached tool lists but are not listed.

Tool responses are capped at 80,000 characters by default to stay within hosted-client limits. Oversized structured responses include `_context_mcp.truncated=true`. Narrow the request when possible; private deployments can change `CONTEXT_MCP_MAX_RESPONSE_CHARS` or set it to `0` for no cap.

For focused research, pass `responseMode: "compact"` to `web-search` or `web-scrape`. Compact mode returns one JSON text block instead of duplicating it in `structuredContent`, omits unused formats, cache metadata and verbose page metadata, and unwraps successful format data. URLs, titles, request IDs and extraction failures remain available. Empty successful Highlights remain an empty array. Other tools and the REST API are unchanged; omitting the parameter or using `"full"` preserves the existing response.

Compact HTML, Markdown and Highlights are limited to 1,200 characters per format per search result, or 4,000 per scrape format (shared across each Highlights array). Clipping adds an inline marker and `_context_mcp.truncated=true`. Prefer `highlightsOptions: { enabled: true, maxCharacters: 1200 }` for search, or `formats: { highlights: true }` with `highlightsParams: { query: "your question", maxCharacters: 4000 }` for scrape, so the API selects relevant excerpts within the budget. Compact mode itself does not change retrieval or credits. Use `responseMode: "full"` when you need longer text or page metadata. JSON, parsed fields, product data, bytes and images are not shortened by compact mode; the overall server limit still applies.

## Run locally

```bash
npm install
CONTEXT_API_KEY=ctxt_secret_local_test npm run dev
```

Use a non-production API base when testing request execution:

```bash
CONTEXT_API_BASE=http://127.0.0.1:4000 \
CONTEXT_API_KEY=ctxt_secret_local_test \
npm start
```

Regenerate tools after the Context OpenAPI document changes:

```bash
npm run generate:endpoints -- /absolute/path/to/openapispec.json context-endpoints.ts
```

Run the complete local verification suite:

```bash
npm test
```

The integration tests start local fake Context and OAuth services. They do not call the production API or database.

## OAuth deployment

Public deployments use OAuth Authorization Code with PKCE through the server's `/authorize`, `/token`, and `/register` endpoints. The upstream Context authorization server must expose:

```text
GET  /oauth2/authorize
POST /oauth2/token
```

The access token returned by Context is an encrypted JWE. It must contain `sub`, `scope`, and `context_api_key`, use `alg=dir` and `enc=A256GCM`, and be issued specifically for the public MCP resource URL. The MCP decrypts the token, validates issuer, audience, and expiry, then sends only the embedded Context key to the Context API. The OAuth token is never passed through as an API key.

Required deployment variables:

```text
MCP_URL=https://<your-domain>
CONTEXT_API_BASE=https://api.context.dev/v1
CONTEXT_OAUTH_ISSUER=https://www.context.dev
CONTEXT_OAUTH_CLIENT_ID=<registered-client-id>
CONTEXT_OAUTH_CLIENT_SECRET=<registered-client-secret>
CONTEXT_OAUTH_TOKEN_ENCRYPTION_KEY=<base64url-encoded-32-byte-key>
```

The Context web app authorization server uses the same client ID, client secret, encryption key, and issuer, plus:

```text
CONTEXT_OAUTH_REDIRECT_URI=https://<your-domain>/oauth/callback
CONTEXT_OAUTH_AUDIENCE=https://<your-domain>/mcp
```

Generate the encryption key once and store the same value in the MCP deployment and Context authorization server:

```bash
node -e 'console.log(require("node:crypto").randomBytes(32).toString("base64url"))'
```

Any MCP client can connect through open Dynamic Client Registration: `/register` returns a signed `client_id` that embeds the client's redirect URIs, and `/authorize` and `/token` only proceed toward a redirect target bound into that registration. Registrable redirect URIs are HTTPS callbacks on any domain, loopback HTTP (`localhost`, `127.0.0.1`, `[::1]` — any port per RFC 8252, since CLI clients such as Claude Code and Codex bind an ephemeral port per session), and private-use app schemes such as `cursor://`. The Context consent screen labels destinations it does not recognize as unverified and shows the user where the connection's access will be delivered.

Consent-screen branding is reserved for HTTPS callbacks on `claude.ai`, `claude.com`, `anthropic.com`, `chatgpt.com`, `openai.com`, `cursor.com`, `vscode.dev`, `mistral.ai`, `consent.azure-apim.net`, `cloud.google.com`, `oauth.n8n.cloud`, `mcpjam.com`, and `manufact.com` (any subdomain and path) and the `cursor://`, `vscode://`, and `warp://` schemes — see `client-display.ts` in the Context web app. Multi-tenant platforms are scoped to the vendor-operated OAuth host (`cloud.google.com`, `oauth.n8n.cloud`, `consent.azure-apim.net`) rather than the apex, since customers control endpoints on sibling subdomains.

Rotating `CONTEXT_OAUTH_TOKEN_ENCRYPTION_KEY` invalidates every issued `client_id` along with in-flight tokens. Clients receive `invalid_client` at the token endpoint and re-register automatically on their next connection.

Clients that registered before signed client_ids still hold the fixed shared client id; their redirects stay gated by the trusted-domain list above, plus any origin added via:

```text
MCP_OAUTH_ALLOWED_REDIRECT_ORIGINS=https://trusted-client.example
```

## Custom domain

1. Add the intended MCP hostname in the Manufact deployment's Domains page.
2. Copy the exact DNS record Manufact provides into the Context DNS provider.
3. Set `MCP_URL` to the final HTTPS origin, without `/mcp`.
4. Redeploy only after the DNS record and OAuth variables are ready.
5. Verify:

```bash
curl -fsS https://<your-domain>/health
curl -fsS https://<your-domain>/.well-known/oauth-protected-resource/mcp
curl -fsS https://<your-domain>/.well-known/oauth-authorization-server
```

Do not guess the DNS target; use the value shown by Manufact for this deployment.

## Claude connector

After the custom domain and OAuth flow are verified:

1. In Claude, open Settings, then Connectors, then Add custom connector.
2. Enter the public `https://<your-domain>/mcp` URL.
3. Complete Context OAuth and test both a read tool and a write tool.

Before directory submission, prepare a privacy policy, support contact, user-facing setup documentation, accurate tool annotations, a test account, and a stable production domain. Directory review should happen only after the full hosted OAuth flow is exercised from a fresh Claude account.

## Credit exhaustion and entitlements

`USAGE_EXCEEDED` from the upstream API is a tool execution error for both HTTP 402 and legacy HTTP 401. The MCP transport remains a normal SDK result with `isError: true`, structured details in `structuredContent`, and the same details plus an explanation in text `content`. Billing failures do not issue OAuth challenges, refresh tokens, or require reconnection. Genuine OAuth failures keep their normal recovery.

The additive `error_data` includes `is_authenticated`, `should_retry: false`, `retry_condition: "sufficient_credits"`, and `info_url`. Known balance, required credits and its estimate flag, charged credits, and refill timestamp/amount are retained; unknown account values are omitted. The existing request ID and credit metadata are retained when present. `get-usage` remains available at zero balance and costs no credits. Wait for sufficient credits before repeating the same operation; a refill may cover it. `403 PAID_PLAN_REQUIRED` describes a separate entitlement gate.

Concurrency `429 RATE_LIMITED` responses are also structured tool errors. They preserve upstream `error_data` or read known limits and delays from legacy concurrency headers, with `limit_type: "concurrency"`, `retry_condition: "available_concurrency"`, and recovery by waiting for in-flight requests or increasing the effective limit. Per-minute rate limits keep their existing response and retry behavior.

Recovery links to [subscription and billing settings](https://context.dev/dashboard/subscription). It does not automatically initiate checkout or direct the model to recommend a purchase. These fields describe account state; they do not force a model recommendation.
