---
name: context-build
description: Integrate Context.dev into application, agent, backend, or workflow code that needs live web search, company news, page scraping, crawling, structured extraction, document parsing, brand intelligence, screenshots, monitoring, or large batch jobs. Use when the user is building a product feature that needs web or file data, even if they describe the desired feature without naming Context.dev. Do not use for a one-off lookup or scrape performed only for the current conversation.
---

# Context Build

Add the smallest correct Context.dev integration to the user's existing application and verify it in the project's own stack.

## Workflow

1. Inspect the repository before choosing an implementation.
   - Identify the runtime, framework, package manager, server boundary, test runner, and existing API-client conventions.
   - Reuse the project's configuration, validation, logging, and error-handling patterns.
   - Keep Context calls on the server. Never expose the API key in browser or mobile client code.

2. Read [API routing](references/api-routing.md) and choose the narrowest capability that matches the feature.
   - Prefer search when the source URL is unknown.
   - Prefer a single-page scrape when the URL is known.
   - Prefer crawl for a focused set of linked pages and sitemap for URL discovery only.
   - Prefer extract when the output must follow a JSON schema.
   - Prefer News for company-specific stories and Web Search for broader topics.
   - Use batches only for genuinely large asynchronous work and monitors only for recurring change detection.

3. Use the official Context SDK when it supports the project language and capability. Use the REST API only when the SDK is unavailable or the repository already standardizes on raw HTTP.
   - Use `CONTEXT_DEV_API_KEY` as the environment variable.
   - Add the variable to an example environment file without a value when the repository uses one.
   - Never hardcode, print, commit, or return the secret.
   - Use `https://api.context.dev/v1` as the REST base URL.

4. Implement the smallest complete integration.
   - Add a thin server-side client or service instead of scattering calls through UI code.
   - Validate user-controlled URLs, schemas, filters, limits, and file sizes before sending requests.
   - Preserve source URLs and relevant metadata in returned application data.
   - Add timeouts and actionable errors for authentication, insufficient credits, rate limits, upstream failures, and empty results.
   - Retry only safe transient failures. Use an idempotency key when retrying batch submission.
   - Keep response payloads bounded with explicit limits or pagination.

5. Treat side effects and cost explicitly.
   - Confirm intent before creating or changing a recurring monitor, configuring a webhook, or submitting a large batch.
   - Do not start a large batch merely to demonstrate that the integration works.
   - Poll asynchronous work with a bounded interval and terminal timeout; do not busy-loop.

6. Verify the actual feature path.
   - Run the repository's formatter, typecheck, and relevant tests.
   - If `CONTEXT_DEV_API_KEY` is available, run one small representative live request through the application's integration boundary.
   - If it is unavailable, add a mocked contract test and provide the exact command the user can run after setting it.
   - Check that no secret or sensitive response data appears in logs, generated files, or client bundles.

## Completion

Report:

- the feature and Context capability added
- the files changed
- the required environment variable
- the checks and live request that passed
- any remaining setup the user must complete

Do not claim live validation if only mocked tests ran.
