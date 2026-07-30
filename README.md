# Context MCP Server

A remote MCP server for the [Context API](https://context.dev): parsing, web scraping, crawling, extraction, search, brand and product intelligence, people lookup, screenshots, and monitors.

The default deployment exposes 29 focused tools so clients can select tools reliably without loading the full API schema. Set `CONTEXT_MCP_TOOLSET=full` to expose all 69 tools.

## Connect

The MCP endpoint is:

```text
https://<your-domain>/mcp
```

For a public deployment, connect through OAuth. For local or private deployments without OAuth, send a Context API key in a header:

```text
Authorization: Bearer ctxt_secret_...
```

`x-api-key` is also accepted. API keys are never accepted in query parameters because URLs commonly leak into logs, browser history, and analytics.

## Default tools

| Group | Tools |
| --- | --- |
| Parse | `parse-document` |
| Scrape and crawl | `web-scrape-markdown`, `web-scrape-images`, `web-crawl`, `web-screenshot` |
| Extract and search | `web-extract`, `web-search`, `web-competitors` |
| Brand and products | `get-brand`, `brand-retrieve`, `web-styleguide`, `brand-ai-query`, `brand-ai-product`, `brand-ai-products` |
| People | `people-retrieve` |
| Monitors | create, list, retrieve, update, delete, run, change history, usage, limits, and webhook-secret rotation |

`get-brand` includes a visual brand-card widget. All API tools are generated from Context's OpenAPI document and retain their request validation and read/write safety annotations.

Tool responses are capped at 40,000 characters by default to stay within hosted-client limits. Oversized structured responses include `_context_mcp.truncated=true`. Narrow the request when possible; private deployments can change `CONTEXT_MCP_MAX_RESPONSE_CHARS` or set it to `0` for no cap.

To expose every generated endpoint, including HTML, sitemap, fonts, industry classification, unified brand retrieval, and WebDB operations:

```bash
CONTEXT_MCP_TOOLSET=full npm start
```

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

Claude's two connector callback URLs and loopback HTTP callbacks are allowed by default. Add another trusted HTTPS client origin only when needed:

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
