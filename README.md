# Context MCP Server

An MCP server that exposes the **entire [Context](https://context.dev) API** — the web-context API for software and AI agents — to any MCP client (Claude, ChatGPT, Cursor, etc.). Real, live data.

**27 tools**: brand intelligence, web scraping, structured extraction, product extraction, web search, competitor discovery, NAICS/SIC classification, and a visual brand-card UI widget.

## Connect

The server speaks streamable HTTP MCP at the `/mcp` path of its deployed URL, e.g.:

```
https://<your-server>.run.mcp-use.com/mcp
```

**Claude (custom connector):** Settings → Connectors → Add custom connector, paste the `/mcp` URL. Or use a one-click link:

```
https://claude.ai/customize/connectors?modal=add-custom-connector&connectorName=Context&connectorUrl=https://<your-server>.run.mcp-use.com/mcp
```

**ChatGPT / Cursor / others:** add the same `/mcp` URL as an MCP server.

**Public chat:** if enabled on the deployment, a hosted chat UI is available at `/chat`.

## Auth — your Context API key

Every call needs a Context API key (get one at **[context.dev](https://context.dev)**). The server resolves it per request, in this order:

1. **URL query param** — append `?api_key=YOUR_KEY` to the MCP URL:
   `https://<your-server>.run.mcp-use.com/mcp?api_key=ctxt_secret_...`
   (lets each user bring their own key)
2. **Header** — `Authorization: Bearer YOUR_KEY` (or `x-api-key: YOUR_KEY`)
3. **Server env** — `CONTEXT_API_KEY` set on the deployment (shared/demo key fallback)

Each call consumes Context credits.

## Tools

| Group | Tools |
|-------|-------|
| **Brand (UI)** | `get-brand` — renders a Context-branded brand card (logo, colors, slogan, socials, industry, links) |
| **Brand** | `brand-retrieve`, `brand-retrieve-by-name`, `brand-retrieve-by-email`, `brand-retrieve-by-ticker`, `brand-retrieve-by-isin`, `brand-retrieve-simplified`, `brand-transaction-identifier` |
| **Web scraping** | `web-scrape-markdown`, `web-scrape-html`, `web-scrape-images`, `web-screenshot`, `web-scrape-sitemap`, `web-crawl` |
| **Extraction** | `web-extract` (structured data via JSON schema), `brand-ai-product`, `brand-ai-products`, `brand-ai-query` |
| **Discovery** | `web-search`, `web-competitors`, `web-styleguide`, `web-fonts` |
| **Classification** | `web-naics`, `web-sic` |
| **People / utility** | `people-retrieve`, `brand-prefetch`, `brand-prefetch-by-email` |

The tool set is generated from Context's OpenAPI spec (`context-endpoints.ts`); each tool maps 1:1 to a Context API endpoint.

## Run locally

```bash
npm install
echo "CONTEXT_API_KEY=ctxt_secret_..." > .env
npm run dev      # local MCP inspector
# or
npm run build && npm start
```

## Deploy (Manufact)

```bash
npx -y @mcp-use/cli@latest deploy --yes --org <org-slug> --env CONTEXT_API_KEY=ctxt_secret_...
```

The `CONTEXT_API_KEY` you pass becomes the server's fallback key. Users can still override it per request with `?api_key=` or an `Authorization: Bearer` header. Never commit your key — `.env` is gitignored.
