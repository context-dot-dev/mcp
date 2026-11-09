![Context MCP — Give your agents the internet. Live web search, scraping, and structured data through the Model Context Protocol.](docs/assets/context-mcp-hero.png)

# Context MCP server

**Give your AI assistant live web search, web scraping, and structured data.**

Context MCP is the official [Context.dev](https://www.context.dev) server for the **Model Context Protocol (MCP)**. Connect Claude, ChatGPT, Codex, Cursor, or another compatible AI client to search the web, read pages, research companies, parse documents, and monitor changes—all from a conversation.

[Get started](#connect-in-a-minute) · [Things to try](#things-to-try) · [Documentation](https://docs.context.dev/install-mcp) · [Tool reference](docs/tools.md) · [Contribute](CONTRIBUTING.md)

## Connect in a minute

**No clone, npm install, or local server needed.**

1. Add this remote MCP server to your AI client's MCP or connector settings:

   ```text
   https://mcp.context.dev/mcp
   ```

2. Sign in with your [Context.dev account](https://www.context.dev/signup) when prompted.
3. Start a conversation and try: **“Search the web for recent developments in battery recycling. Include source links.”**

Choose your client for the exact setup:

<details>
<summary><strong>Claude and ChatGPT</strong></summary>

Use the official [Claude connector](https://docs.context.dev/integrations/claude-connector) or [ChatGPT integration](https://docs.context.dev/integrations/chatgpt-plugin), then complete sign-in and enable Context in your conversation.

For a manual Claude connection, add a custom connector with the URL above. Client plans and workspace policies can affect connector availability.

</details>

<details>
<summary><strong>Claude Code</strong></summary>

```bash
claude mcp add --transport http --scope user context https://mcp.context.dev/mcp
```

Start Claude Code, run `/mcp`, select `context`, and finish sign-in in your browser.

</details>

<details>
<summary><strong>Codex</strong></summary>

```bash
codex mcp add context --url https://mcp.context.dev/mcp
```

Complete browser sign-in. If it does not start automatically, run:

```bash
codex mcp login context
```

</details>

<details>
<summary><strong>Cursor</strong></summary>

Add this entry to `.cursor/mcp.json` for your project, or `~/.cursor/mcp.json` for all projects. Keep any servers you already have.

```json
{
  "mcpServers": {
    "context": {
      "url": "https://mcp.context.dev/mcp"
    }
  }
}
```

Enable `context` in Cursor's MCP settings and complete sign-in. The [Context.dev Cursor plugin](https://docs.context.dev/integrations/cursor-plugin) is another installation option; choose one to avoid duplicate connections.

</details>

For **Gemini CLI, VS Code, OpenCode, and other clients**, see the [client setup guide](https://docs.context.dev/install-mcp). The server uses remote **Streamable HTTP** and supports OAuth or API key authentication.

## Things to try

Ask naturally. Your assistant chooses the appropriate tools.

| What you want | Try this prompt |
| --- | --- |
| Research with current sources | “Find recent research on sodium-ion batteries. Summarize the main findings and link to the sources.” |
| Read a website | “Read https://docs.context.dev/ and explain how to scrape a page.” |
| Extract structured data | “From this product page, extract the name, price, currency, and availability as JSON: [URL].” |
| Explore documentation | “Crawl this documentation section and summarize its authentication methods: [URL].” |
| Research a company | “Find recent news about Stripe and retrieve its brand colors and logo.” |
| Work with a document | “Convert this PDF to Markdown and summarize the key points.” |
| Track changes | “Create a monitor for this pricing page and tell me what changes: [URL].” |

Document parsing requires a client that can supply the file's bytes. Creating monitors or batches changes your Context account and can consume credits; review the proposed action before approving it.

## What can Context MCP do?

| Capability | Tools |
| --- | --- |
| **Search and answers** — find current sources and research a question | `web-search`, `web-answers` |
| **Read and extract** — turn pages into Markdown, HTML, screenshots, or structured JSON | `web-scrape` |
| **Map and crawl** — discover URLs and read linked pages | `web-map`, `web-crawl` |
| **Company news** — search a topic or a named company | `get-news-search` |
| **Brand and design** — retrieve logos, colors, company details, and design styles | `get-brand`, `brand-retrieve-unified`, `brand-search`, `web-styleguide` |
| **Companies and people** — find businesses and professional profiles | `company-search`, `people-search`, `people-enrich` |
| **Documents** — convert supplied files into Markdown | `parse-document` |
| **Batches and monitors** — process many URLs and track changes over time | Batch, monitor, and webhook tools |
| **Account tools** — inspect usage, debug requests, and manage website access policies | Usage, log, and access-policy tools |

See the [complete tool reference](docs/tools.md) for tool names, response formats, permissions, and limits.

## Frequently asked questions

### Is Context MCP free and open source?

This server's source code is available under the [MIT license](LICENSE). Calls to Context.dev use your account's credits and entitlements, including when you run this server yourself. See [current plans and pricing](https://www.context.dev/pricing).

### Do I need an API key?

Most supported clients connect through OAuth: sign in once in your browser. If your client cannot use OAuth, configure a private header instead:

```http
Authorization: Bearer YOUR_CONTEXT_API_KEY
```

`X-API-Key` also works. Keep the key in your client's secret configuration, outside committed files and prompts. Prefer headers over putting credentials in the server URL.

### Does this run the scraping engine on my computer?

No. This repository runs the MCP interface. Search, scraping, extraction, and other data operations are handled by the Context.dev API. Self-hosting changes where the MCP server runs; it still needs a Context account.

### Why does my client show fewer tools?

OpenCode and Kilo receive a smaller core catalog by default. To request the full catalog, use `https://mcp.context.dev/mcp?profile=full`. To explicitly request the core catalog, use `?profile=core`.

### How can I use less context in my agent?

Ask for focused results, relevant highlights, or compact responses. `web-search` and `web-scrape` accept `responseMode: "compact"`. Compact responses reduce returned content; they do not change API credit costs. See [response limits and compact mode](docs/tools.md).

### What if a connection or request fails?

Check that the URL includes `/mcp`, complete sign-in, and enable the server in your client. Reconnect if authentication has expired. If you run out of credits, check [usage and billing](https://www.context.dev/dashboard/subscription); reconnecting will not replenish credits. See the [setup and troubleshooting guide](https://docs.context.dev/install-mcp).

## Run locally or self-host

For contributors and teams that want to run their own MCP interface:

```bash
git clone https://github.com/context-dot-dev/mcp.git
cd mcp
npm ci
```

Then start it with a key stored in your environment:

```bash
export CONTEXT_API_KEY="YOUR_CONTEXT_API_KEY"
npm run dev
```

Use **Node.js 22.12 or later**. Connect to `http://localhost:3000/mcp`. A real API key sends requests to the Context.dev API and uses your account's credits. Keep a local server with a fallback API key private.

- [Development guide](docs/development.md) — setup, tests, and endpoint generation.
- [Deployment guide](docs/deployment.md) — OAuth, domains, and production configuration.
- [Contributing](CONTRIBUTING.md) — report a bug or propose a change.
- [Security policy](SECURITY.md) — report a vulnerability privately.

## Documentation and support

- [Context.dev documentation](https://docs.context.dev/) and [API reference](https://docs.context.dev/api-reference/web-scraping/scrape)
- [Agent quickstart](https://docs.context.dev/agent-quickstart.md) and [documentation index for AI tools](https://docs.context.dev/llms.txt)
- [GitHub issues](https://github.com/context-dot-dev/mcp/issues) for bugs and feature requests
- [Contact Context.dev](https://www.context.dev/contact) for account help

Built by [Context.dev](https://www.context.dev). Licensed under [MIT](LICENSE).
