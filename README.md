# Context Brand Intelligence MCP Server

An MCP server for **[Context](https://context.dev)** — the web-context API for software and AI agents — wrapping Context's **Brand Intelligence** endpoint (real API, live data).

Give it a domain and it returns a Context-branded **brand card**: logo, brand color palette, slogan, description, social profiles, industry classification and key company links.

## Tool

| Tool | Context API | Returns |
|------|-------------|---------|
| `get-brand` | `GET /v1/brand/retrieve?domain=` | A visual brand card (logo, colors, slogan, description, socials, industry, links) |

## Auth

Set your Context API key in the environment (never commit it):

```bash
export CONTEXT_API_KEY=ctxt_secret_...
```

The server calls `https://api.context.dev/v1/brand/retrieve` with `Authorization: Bearer $CONTEXT_API_KEY`. Each lookup consumes Context credits.

## Run

```bash
npm install
npm run dev      # local inspector
npm run build
npm start
```

## Deploy (Manufact)

```bash
npx -y @mcp-use/cli@latest deploy --yes --org <org-slug> --env CONTEXT_API_KEY=ctxt_secret_...
```
