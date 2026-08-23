# Context.dev API routing

Use the API reference linked for each capability before implementing request or response types. Paths below are relative to `https://api.context.dev/v1`.

## Choose a capability

| Need | Capability | REST route | Notes |
|---|---|---|---|
| Find current sources when the URL is unknown | Web Search | `POST /web/search` | Can return ranked results and optionally scrape their content. |
| Find company-specific coverage | News Search | `POST /news/search` | Requires exactly one company identifier: name, domain, ticker, or ISIN. |
| Read one known page | Markdown Scrape | `GET /web/scrape/markdown` | Default for summaries, RAG, and readable page content. |
| Inspect the DOM or raw markup | HTML Scrape | `GET /web/scrape/html` | Use only when HTML structure matters. |
| Discover images on one page | Image Scrape | `GET /web/scrape/images` | Returns image assets and metadata. |
| Discover URLs without fetching every body | Sitemap | `GET /web/scrape/sitemap` | Use `search` to rank URLs by topic when needed. |
| Read a focused set of linked pages now | Crawl | `POST /web/crawl` | Synchronous multi-page collection. |
| Return schema-shaped data | Extract | `POST /web/extract` | Provide an explicit JSON Schema and focused instructions. |
| Convert an uploaded file to Markdown | Parse | `POST /parse` | Send file bytes server-side and enforce the documented size limit. |
| Retrieve company and brand data | Brand Retrieve | `POST /brand/retrieve` | Supports domain, name, work email, ticker, ISIN, transaction descriptor, or direct URL lookups. |
| Reproduce a site's design system | Styleguide | `GET /web/styleguide` | Returns colors, typography, spacing, shadows, and related design cues. |
| Identify website typography | Fonts | `GET /web/fonts` | Use for font families, fallbacks, and usage. |
| Capture a rendered page | Screenshot | `GET /web/screenshot` | Use for visual QA and previews, not content extraction. |
| Classify a company by industry | NAICS or SIC | `GET /web/naics`, `GET /web/sic` | Use domain or company name. |
| Detect changes repeatedly | Monitors | `/monitors` routes | Creation starts an initial baseline and consumes credits. Webhooks can notify external systems. |
| Process many URLs asynchronously | Batches | `POST /batch/submit` | Supports up to 25,000 URLs. Follow with status and results routes. |

## Company news request

`POST /news/search` uses a structured body. Do not send the retired flat query-parameter shape.

```json
{
  "searchBy": {
    "type": "entity",
    "entity": {
      "type": "ticker",
      "ticker": "AAPL",
      "exchange": "NASDAQ"
    }
  },
  "filterBy": {
    "articleLanguage": ["en"],
    "articleType": ["editorial", "press_release"],
    "date": {
      "from": 1725148800000,
      "to": 1725235200000
    }
  },
  "sortBy": { "type": "newest" },
  "limit": 10
}
```

The `entity.type` discriminator determines the identifier field:

- `name` uses `name`
- `domain` uses `domain`
- `ticker` uses `ticker` and optionally `exchange`
- `isin` uses `isin`

## Asynchronous workflows

For a batch:

1. Submit with `POST /batch/submit` and a unique `Idempotency-Key`.
2. Read status with `GET /batch/{batch_id}`.
3. Page results with `GET /batch/{batch_id}/results` after completion.
4. Cancel only when explicitly requested with `POST /batch/{batch_id}/cancel`.

For monitoring:

1. Create with `POST /monitors` only after confirming the recurring schedule and target.
2. Read configuration with `GET /monitors/{monitor_id}`.
3. Read runs from `GET /monitors/{monitor_id}/runs` and changes from `GET /monitors/{monitor_id}/changes`.
4. Treat update, manual run, webhook configuration, and deletion as intentional side effects.

## Official references

- Documentation index: https://docs.context.dev/llms.txt
- Agent quickstart: https://docs.context.dev/agent-quickstart
- API reference: https://docs.context.dev/api-reference
- News search: https://docs.context.dev/api-reference/news/search
- Batch submission: https://docs.context.dev/api-reference/batches/submit
- Terms: https://www.context.dev/term
