# Contributing to Context MCP

Thanks for helping improve Context MCP. Small fixes, clearer documentation, and reproducible bug reports are welcome.

## Report a bug or request a feature

[Open an issue](https://github.com/context-dot-dev/mcp/issues) with:

- What you expected and what happened.
- Your MCP client, server version or commit, and steps to reproduce.
- A minimal example and sanitized error output. Include a request ID when available.

Never include API keys, OAuth tokens, cookies, or private page/document content. Report vulnerabilities through the [security policy](SECURITY.md).

## Make a change

1. Fork the repository and create a branch for your change.
2. Follow the [development guide](docs/development.md) to install dependencies.
3. Keep the change focused. Add regression coverage when fixing behavior, and update relevant docs.
4. Run `npm test` for code changes. For documentation changes, check examples, links, and formatting.
5. Open a pull request explaining the problem, the resulting behavior, and how you checked it.

`context-endpoints.ts` is generated from the Context OpenAPI specification. Use the generator described in the development guide instead of editing generated schemas by hand.

Contributions are provided under the repository's [MIT license](LICENSE). Be considerate and keep discussions focused on improving the project.
