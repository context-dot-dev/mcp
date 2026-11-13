# Develop Context MCP

[← Back to the README](../README.md)

## Requirements

- Node.js 22.12 or later and npm. Node.js 20.19+ on the 20.x line is also supported.
- A Context.dev API key only if you want to make live API calls.

```bash
npm ci
npm run dev
```

The server listens at `http://localhost:3000/mcp`. Without a key or OAuth configuration, tool calls require a caller-supplied API key. For a private local development server, set `CONTEXT_API_KEY` in your environment before starting it. Do not expose a server with a fallback key to untrusted callers.

You can copy [`.env.example`](../.env.example) as a configuration reference. Export the variables in your shell or configure them in your deployment platform; do not assume a `.env` file is loaded by every start command.

## Build and test

```bash
npm run build
npm test
```

`npm test` builds the server and runs the test suite. Integration tests start fake Context and OAuth services on loopback addresses; they do not need production credentials or call the production API or database.

To run the built server:

```bash
npm start
```

To test against your own fake API, set `CONTEXT_API_BASE` to its base URL, for example `http://127.0.0.1:4000`.

## Regenerate API schemas

Download the public OpenAPI specification, inspect it, and pass its path to the generator:

```bash
curl -fsSL https://docs.context.dev/openapi.json -o /tmp/context-openapi.json
npm run generate:endpoints -- /tmp/context-openapi.json context-endpoints.ts
npm test
```

Review the generated diff before committing. The checked-in snapshot may differ from the latest public API specification. The generator's no-argument default targets a sibling checkout used by Context maintainers; contributors should pass an explicit path as above.

## Repository map

| Path | Purpose |
| --- | --- |
| `index.ts` | MCP server, transport, OAuth routes, and tool registration |
| `src/auth.ts`, `src/dcr.ts` | Authentication and dynamic client registration |
| `src/context-client.ts` | Context API calls and response handling |
| `src/toolset.ts` | Published tool catalog and profiles |
| `context-endpoints.ts` | Generated API request schemas |
| `scripts/generate-context-endpoints.ts` | OpenAPI schema generator |
| `resources/` | Interactive brand card and styles |
| `src/*.test.ts` | Unit and integration tests |

See [deployment](deployment.md) for OAuth configuration and [tool behavior](tools.md) for response formats, limits, and error handling.
