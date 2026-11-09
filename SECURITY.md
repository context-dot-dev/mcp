# Security policy

## Report a vulnerability privately

Please do not post exploitable security issues or credentials in a public GitHub issue.

Email **hello@context.dev** with the subject **Context MCP security report**. Include the affected commit or version, a description of the impact, and a minimal reproduction with secrets and private data removed.

If a credential has been exposed, revoke or rotate it with its issuer. Deleting it from a file does not remove it from Git history, logs, or existing copies.

## Scope

Reports about this MCP server's authentication, OAuth flow, tool execution, or handling of sensitive data are welcome. Include whether the issue affects the hosted server, a self-hosted deployment, or both.

Use the latest `main` revision when checking whether an issue is still present. This repository does not maintain separate security release branches.
