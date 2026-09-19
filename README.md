# Context MCP Server

A remote MCP server that gives AI agents reliable context from the live web, company news, and files: search, scraping, crawling, structured extraction, document parsing, brand intelligence, large batches, screenshots, and change monitoring.

The server exposes a curated 38-tool surface from the public [Context API](https://context.dev). Internal and legacy endpoints are never registered. Public endpoints that do not improve an agent workflow, such as cache prefetching, dedicated product extraction, and webhook-secret rotation, are intentionally omitted to keep tool selection clear.

## Connect

The MCP endpoint is:

```text
https://<your-domain>/mcp
```

Connect through OAuth, or send a Context API key in a header (works on both hosted and local deployments):

```text
Authorization: Bearer ctxt_secret_...
```

`x-api-key` is also accepted. The legacy `api_key` query parameter remains available for existing integrations, but OAuth or headers should be used for new connections because URLs commonly leak into logs, browser history, and analytics.

## Tools

| Group | Tools |
| --- | --- |
| Parse | `parse-document` |
| Scrape and crawl | `web-scrape-html`, `web-scrape-markdown`, `web-scrape-images`, `web-scrape-sitemap`, `web-crawl`, `web-screenshot` |
| Extract and search | `web-extract`, `web-search`, `web-answers`, `web-naics`, `web-sic` |
| Company news | `get-news-search` |
| Brand and design | `get-brand`, `brand-retrieve-unified`, `web-styleguide`, `web-fonts` |
| API debugging | `list-logs`, `get-log` |
| Batches | `submit-batch`, `list-batches`, `get-batch`, `get-batch-results`, `cancel-batch`, `delete-batch` |
| Monitors | `create-monitor`, `list-monitors`, `get-monitor`, `update-monitor`, `delete-monitor`, `run-monitor-now`, run and change history, and credit usage |

`get-brand` includes a visual brand card. Tool descriptions explain when each tool should be used, which adjacent tool to choose instead, whether work is synchronous or asynchronous, and what the result contains. API-backed tools retain the public OpenAPI request validation with MCP safety annotations audited for account state, open-web access, and destructive operations.

For one known page, use `web-scrape-markdown`. Use `get-news-search` for live or historical news about one company, identified by exactly one name, domain, ticker, or ISIN; use `web-search` for broader topics or when the source is unknown; use `web-answers` when the user wants a sourced JSON answer rather than ranked links. Use `web-crawl` for a focused multi-page request, and `submit-batch` for up to 25,000 URLs or a large asynchronous crawl. A batch returns an ID; poll `get-batch`, then page through `get-batch-results` after completion.

Tool responses are capped at 40,000 characters by default to stay within hosted-client limits. Oversized structured responses include `_context_mcp.truncated=true`. Narrow the request when possible; private deployments can change `CONTEXT_MCP_MAX_RESPONSE_CHARS` or set it to `0` for no cap.

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
