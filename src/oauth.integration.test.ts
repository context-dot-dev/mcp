import assert from "node:assert/strict";
import { spawn, type ChildProcess } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, test } from "node:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { EncryptJWT } from "jose";
import { NodeOAuthClientProvider } from "mcp-use/auth/node";

const encryptionKey = crypto.getRandomValues(new Uint8Array(32));
const authorizationRequests: URL[] = [];
const tokenRequests: URLSearchParams[] = [];
const upstreamAuthorizationHeaders: string[] = [];
let authorizationServerBase = "";
let mcpBase = "";
let upstreamBase = "";
let mcpProcess: ChildProcess;

async function getOpenPort(): Promise<number> {
  const server = createServer();
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert.ok(address && typeof address === "object");
  const { port } = address;
  await new Promise<void>((resolve, reject) =>
    server.close((cause) => (cause ? reject(cause) : resolve()))
  );
  return port;
}

async function waitForHealth(url: string): Promise<void> {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }
  throw new Error(`Timed out waiting for ${url}`);
}

async function issueAccessToken(
  audience = `${mcpBase}/mcp`
): Promise<string> {
  return new EncryptJWT({
    context_api_key: "ctxt_secret_embedded_test",
    email: "oauth-user@example.com",
    scope: "api.read api.write",
  })
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .setIssuer(authorizationServerBase)
    .setAudience(audience)
    .setSubject("oauth-user-1")
    .setIssuedAt()
    .setExpirationTime("5m")
    .encrypt(encryptionKey);
}

async function readBody(request: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString();
}

function redirect(
  response: ServerResponse,
  location: string
): void {
  response.writeHead(302, { location });
  response.end();
}

const authorizationServer = createServer(async (request, response) => {
  const requestUrl = new URL(request.url ?? "/", authorizationServerBase);
  if (request.method === "GET" && requestUrl.pathname === "/oauth2/authorize") {
    authorizationRequests.push(requestUrl);
    const callback = new URL(requestUrl.searchParams.get("redirect_uri")!);
    callback.searchParams.set("code", "local-authorization-code");
    const state = requestUrl.searchParams.get("state");
    if (state) callback.searchParams.set("state", state);
    redirect(response, callback.toString());
    return;
  }
  if (request.method === "POST" && requestUrl.pathname === "/oauth2/token") {
    const params = new URLSearchParams(await readBody(request));
    tokenRequests.push(params);
    const accessToken = await issueAccessToken();
    response.writeHead(200, { "content-type": "application/json" });
    response.end(
      JSON.stringify({
        access_token: accessToken,
        token_type: "Bearer",
        expires_in: 300,
        scope: "api.read api.write",
      })
    );
    return;
  }
  response.writeHead(404).end();
});

const upstream = createServer(async (request, response) => {
  await readBody(request);
  upstreamAuthorizationHeaders.push(request.headers.authorization ?? "");
  response.writeHead(200, { "content-type": "application/json" });
  response.end(JSON.stringify({ ok: true }));
});

before(async () => {
  await new Promise<void>((resolve) =>
    authorizationServer.listen(0, "127.0.0.1", resolve)
  );
  const authorizationAddress = authorizationServer.address();
  assert.ok(authorizationAddress && typeof authorizationAddress === "object");
  authorizationServerBase = `http://127.0.0.1:${authorizationAddress.port}`;

  await new Promise<void>((resolve) =>
    upstream.listen(0, "127.0.0.1", resolve)
  );
  const upstreamAddress = upstream.address();
  assert.ok(upstreamAddress && typeof upstreamAddress === "object");
  upstreamBase = `http://127.0.0.1:${upstreamAddress.port}`;

  const mcpPort = await getOpenPort();
  mcpBase = `http://localhost:${mcpPort}`;
  mcpProcess = spawn(process.execPath, ["dist/index.js"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      PORT: String(mcpPort),
      MCP_URL: mcpBase,
      CONTEXT_API_BASE: upstreamBase,
      CONTEXT_OAUTH_CLIENT_ID: "context-mcp-fixed",
      CONTEXT_OAUTH_CLIENT_SECRET: "context-mcp-secret",
      CONTEXT_OAUTH_TOKEN_ENCRYPTION_KEY:
        Buffer.from(encryptionKey).toString("base64url"),
      CONTEXT_OAUTH_ISSUER: authorizationServerBase,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  await waitForHealth(`${mcpBase}/health`);
});

after(async () => {
  mcpProcess.kill("SIGTERM");
  await new Promise<void>((resolve) => {
    if (mcpProcess.exitCode !== null) {
      resolve();
      return;
    }
    mcpProcess.once("exit", () => resolve());
  });
  await Promise.all(
    [authorizationServer, upstream].map(
      (server) =>
        new Promise<void>((resolve, reject) =>
          server.close((cause) => (cause ? reject(cause) : resolve()))
        )
    )
  );
});

test("publishes protected-resource metadata and challenges unauthenticated MCP clients", async () => {
  const metadataResponse = await fetch(
    `${mcpBase}/.well-known/oauth-protected-resource/mcp`
  );
  assert.equal(metadataResponse.status, 200);
  assert.deepEqual(await metadataResponse.json(), {
    resource: `${mcpBase}/mcp`,
    authorization_servers: [mcpBase],
    scopes_supported: ["api.read", "api.write"],
    bearer_methods_supported: ["header"],
  });

  const unauthorized = await fetch(`${mcpBase}/mcp`, {
    method: "POST",
    headers: {
      accept: "application/json, text/event-stream",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2025-06-18",
        capabilities: {},
        clientInfo: { name: "unauthorized-test", version: "1.0.0" },
      },
    }),
  });
  assert.equal(unauthorized.status, 401);
  assert.match(
    unauthorized.headers.get("www-authenticate") ?? "",
    /oauth-protected-resource/
  );

  const staleToken = await fetch(`${mcpBase}/mcp`, {
    method: "POST",
    headers: {
      authorization: "Bearer expired.oauth.token",
      accept: "application/json, text/event-stream",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 2,
      method: "initialize",
      params: {
        protocolVersion: "2025-06-18",
        capabilities: {},
        clientInfo: { name: "stale-token-test", version: "1.0.0" },
      },
    }),
  });
  assert.equal(staleToken.status, 401);
  assert.match(
    staleToken.headers.get("www-authenticate") ?? "",
    /oauth-protected-resource/
  );
});

test("limits dynamic registration and authorization redirects", async () => {
  const allowedRegistration = await fetch(`${mcpBase}/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      client_name: "Claude",
      redirect_uris: [
        "https://claude.ai/api/mcp/auth_callback",
        "https://claude.com/api/mcp/auth_callback",
      ],
    }),
  });
  assert.equal(allowedRegistration.status, 201);
  const registrationPayload = await allowedRegistration.json() as {
    client_id: string;
    token_endpoint_auth_method: string;
    client_secret?: string;
  };
  assert.equal(registrationPayload.client_id, "context-mcp-fixed");
  assert.equal(registrationPayload.token_endpoint_auth_method, "none");
  assert.equal(registrationPayload.client_secret, undefined);

  const allowedCursorRegistration = await fetch(`${mcpBase}/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      client_name: "Cursor",
      redirect_uris: [
        "cursor://anysphere.cursor-mcp/oauth/callback",
        "https://www.cursor.com/agents/mcp/oauth/callback",
        "http://localhost:8787/callback",
      ],
    }),
  });
  assert.equal(allowedCursorRegistration.status, 201);

  const allowedInspectorRegistration = await fetch(`${mcpBase}/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      client_name: "mcp-use Inspector",
      redirect_uris: [
        "https://inspector.manufact.com/inspector/oauth/callback",
        "https://manufact.com/cloud/oauth/callback",
        "https://cloud.manufact.com/oauth/callback",
      ],
    }),
  });
  assert.equal(allowedInspectorRegistration.status, 201);

  const allowedWildcardRegistration = await fetch(`${mcpBase}/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      client_name: "Wildcard clients",
      redirect_uris: [
        "https://claude.ai/api/organizations/custom-connectors/oauth/callback",
        "https://api.claude.com/api/mcp/auth_callback",
        "https://chatgpt.com/connector/oauth/some-connector-id",
        "https://platform.openai.com/mcp/oauth/callback",
        "https://preview.manufact.com/oauth/callback",
      ],
    }),
  });
  assert.equal(allowedWildcardRegistration.status, 201);

  const allowedOtherClientRegistration = await fetch(`${mcpBase}/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      client_name: "Other MCP clients",
      redirect_uris: [
        "https://vscode.dev/redirect",
        "https://insiders.vscode.dev/redirect",
        "http://127.0.0.1:33418",
        "https://localhost:7777/oauth/callback",
        "vscode://saoudrizwan.claude-dev/mcp/callback",
        "warp://mcp/oauth/callback",
        "https://callback.mistral.ai/v1/integrations_auth/oauth2_callback",
        "https://global.consent.azure-apim.net/redirect/context",
        "https://vertexaisearch.cloud.google.com/oauth-redirect",
        "https://oauth.n8n.cloud/oauth2/callback",
        "https://app.mcpjam.com/oauth/callback",
      ],
    }),
  });
  assert.equal(allowedOtherClientRegistration.status, 201);

  for (const redirectUri of [
    "https://attacker.example/callback",
    "https://claude.ai.attacker.example/callback",
    "https://notclaude.ai/callback",
    "http://claude.ai/api/mcp/auth_callback",
    "https://google.com/oauth-redirect",
    "https://accounts.google.com/oauth-redirect",
  ]) {
    const rejectedRegistration = await fetch(`${mcpBase}/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ redirect_uris: [redirectUri] }),
    });
    assert.equal(
      rejectedRegistration.status,
      400,
      `expected ${redirectUri} to be rejected`
    );
  }

  const rejectedAuthorization = await fetch(
    `${mcpBase}/authorize?${new URLSearchParams({
      client_id: "dynamic-client",
      redirect_uri: "https://attacker.example/callback",
      response_type: "code",
      code_challenge: "challenge",
      code_challenge_method: "S256",
    })}`,
    { redirect: "manual" }
  );
  assert.equal(rejectedAuthorization.status, 400);
});

test("labels the upstream consent request with the connecting client", async () => {
  const labeledRedirects: Array<[string, string]> = [
    ["https://www.cursor.com/agents/mcp/oauth/callback", "cursor"],
    ["https://chatgpt.com/connector/oauth/some-connector-id", "chatgpt"],
    ["https://insiders.vscode.dev/redirect", "vscode"],
    ["http://127.0.0.1:33418/callback", "local"],
  ];
  for (const [redirectUri, expectedClient] of labeledRedirects) {
    const authorizeResponse = await fetch(
      `${mcpBase}/authorize?${new URLSearchParams({
        client_id: "dynamic-client",
        redirect_uri: redirectUri,
        response_type: "code",
        code_challenge: "local-code-challenge",
        code_challenge_method: "S256",
      })}`,
      { redirect: "manual" }
    );
    assert.equal(authorizeResponse.status, 302, redirectUri);
    const upstreamLocation = new URL(
      authorizeResponse.headers.get("location")!
    );
    assert.equal(
      upstreamLocation.searchParams.get("mcp_client"),
      expectedClient,
      redirectUri
    );
  }
});

test("an MCP client discovers OAuth, reconnects, and calls get-brand", async (t) => {
  const providerDirectory = await mkdtemp(join(tmpdir(), "context-mcp-oauth-"));
  let authorizationUrl: string | undefined;
  const provider = await NodeOAuthClientProvider.create(`${mcpBase}/mcp`, {
    baseDir: providerDirectory,
    authTimeoutMs: 5_000,
    openBrowser: (url) => {
      authorizationUrl = url;
    },
  });
  t.after(async () => {
    provider.dispose();
    await rm(providerDirectory, { recursive: true, force: true });
  });

  const initialClient = new Client({
    name: "manufact-auth-regression-test",
    version: "1.0.0",
  });
  const initialTransport = new StreamableHTTPClientTransport(
    new URL(`${mcpBase}/mcp`),
    { authProvider: provider }
  );
  await assert.rejects(initialClient.connect(initialTransport), /401|Unauthorized/);
  assert.ok(authorizationUrl);

  const authorizeResponse = await fetch(authorizationUrl, {
    redirect: "manual",
  });
  assert.equal(authorizeResponse.status, 302);
  const browserCookie = authorizeResponse.headers.get("set-cookie");
  assert.ok(browserCookie);

  const upstreamAuthorizeResponse = await fetch(
    authorizeResponse.headers.get("location")!,
    { redirect: "manual" }
  );
  assert.equal(upstreamAuthorizeResponse.status, 302);
  const callbackResponse = await fetch(
    upstreamAuthorizeResponse.headers.get("location")!,
    {
      redirect: "manual",
      headers: { cookie: browserCookie.split(";")[0] },
    }
  );
  assert.equal(callbackResponse.status, 302);
  const clientCallback = callbackResponse.headers.get("location");
  assert.ok(clientCallback);
  const callbackCompletion = await fetch(clientCallback);
  assert.equal(callbackCompletion.status, 200);

  const authorizationCode = await provider.getAuthorizationCode();
  await initialTransport.finishAuth(authorizationCode);
  const tokenRequest = tokenRequests.at(-1)!;
  assert.equal(tokenRequest.get("client_id"), "context-mcp-fixed");
  assert.equal(tokenRequest.get("redirect_uri"), `${mcpBase}/oauth/callback`);
  assert.match(
    tokenRequest.get("code_verifier") ?? "",
    /^[A-Za-z0-9._~-]{43,128}$/
  );

  const authenticatedClient = new Client({
    name: "manufact-auth-regression-test",
    version: "1.0.0",
  });
  await authenticatedClient.connect(
    new StreamableHTTPClientTransport(new URL(`${mcpBase}/mcp`), {
      authProvider: provider,
    })
  );
  const callsBeforeBrand = upstreamAuthorizationHeaders.length;
  const brandResult = await authenticatedClient.callTool({
    name: "get-brand",
    arguments: { domain: "stripe.com" },
  });
  assert.equal(brandResult.isError, undefined);
  assert.equal(upstreamAuthorizationHeaders.length, callsBeforeBrand + 1);
  assert.equal(
    upstreamAuthorizationHeaders.at(-1),
    "Bearer ctxt_secret_embedded_test"
  );
  await authenticatedClient.close();
});

test("completes the authorization proxy flow without passing OAuth tokens upstream", async () => {
  const clientRedirect = "https://claude.ai/api/mcp/auth_callback";
  const authorizeResponse = await fetch(
    `${mcpBase}/authorize?${new URLSearchParams({
      client_id: "dynamic-client",
      redirect_uri: clientRedirect,
      response_type: "code",
      code_challenge: "local-code-challenge",
      code_challenge_method: "S256",
      state: "client-state",
      scope: "api.read api.write",
    })}`,
    { redirect: "manual" }
  );
  assert.equal(authorizeResponse.status, 302);
  const browserCookie = authorizeResponse.headers.get("set-cookie");
  assert.ok(browserCookie);
  const cookieHeader = browserCookie.split(";")[0];

  const upstreamAuthorizeResponse = await fetch(
    authorizeResponse.headers.get("location")!,
    { redirect: "manual" }
  );
  assert.equal(upstreamAuthorizeResponse.status, 302);

  const sharedLinkCallback = await fetch(
    upstreamAuthorizeResponse.headers.get("location")!,
    { redirect: "manual" }
  );
  assert.equal(sharedLinkCallback.status, 400);
  assert.equal(sharedLinkCallback.headers.get("location"), null);

  const authorizationRequest = authorizationRequests.at(-1)!;
  assert.equal(
    authorizationRequest.searchParams.get("client_id"),
    "context-mcp-fixed"
  );
  assert.equal(
    authorizationRequest.searchParams.get("redirect_uri"),
    `${mcpBase}/oauth/callback`
  );
  assert.equal(
    authorizationRequest.searchParams.get("audience"),
    `${mcpBase}/mcp`
  );
  assert.equal(
    authorizationRequest.searchParams.get("mcp_client"),
    "claude"
  );

  const callbackResponse = await fetch(
    upstreamAuthorizeResponse.headers.get("location")!,
    {
      redirect: "manual",
      headers: { cookie: cookieHeader },
    }
  );
  assert.equal(callbackResponse.status, 302);
  assert.match(
    callbackResponse.headers.get("set-cookie") ?? "",
    /Max-Age=0/
  );
  const finalRedirect = new URL(callbackResponse.headers.get("location")!);
  assert.equal(finalRedirect.origin + finalRedirect.pathname, clientRedirect);
  assert.equal(finalRedirect.searchParams.get("code"), "local-authorization-code");
  assert.equal(finalRedirect.searchParams.get("state"), "client-state");

  const tokenResponse = await fetch(`${mcpBase}/token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code: "local-authorization-code",
      code_verifier: "local-code-verifier",
      redirect_uri: clientRedirect,
    }),
  });
  assert.equal(tokenResponse.status, 200);
  const tokenPayload = await tokenResponse.json() as {
    access_token: string;
  };
  const tokenRequest = tokenRequests.at(-1)!;
  assert.equal(tokenRequest.get("client_id"), "context-mcp-fixed");
  assert.equal(tokenRequest.get("client_secret"), "context-mcp-secret");
  assert.equal(tokenRequest.get("redirect_uri"), `${mcpBase}/oauth/callback`);
  assert.equal(tokenRequest.get("code_verifier"), "local-code-verifier");

  const client = new Client({ name: "oauth-test", version: "1.0.0" });
  await client.connect(
    new StreamableHTTPClientTransport(new URL(`${mcpBase}/mcp`), {
      requestInit: {
        headers: { Authorization: `Bearer ${tokenPayload.access_token}` },
      },
    })
  );
  const { tools } = await client.listTools();
  assert.equal(tools.length, 34);
  const { resources } = await client.listResources();
  assert.equal(resources.length, 1);
  const resource = await client.readResource({
    uri: resources[0]!.uri,
  });
  assert.equal(resource.contents[0]?.uri, "ui://widget/context-brand.html");
  assert.match(resource.contents[0]?.mimeType ?? "", /^text\/html/);
  assert.match(
    "text" in resource.contents[0]! ? resource.contents[0].text : "",
    /<!doctype html>/i
  );
  assert.equal(
    (resource.contents[0]?._meta as { ui?: { domain?: string } } | undefined)
      ?.ui?.domain,
    "https://mcp.context.dev"
  );
  assert.equal(
    (tools.find((tool) => tool.name === "get-brand")?._meta as
      | Record<string, unknown>
      | undefined)?.["openai/widgetDomain"],
    "https://mcp.context.dev"
  );
  const { resourceTemplates } = await client.listResourceTemplates();
  assert.equal(resourceTemplates.length, 1);
  const toolCatalogBytes = Buffer.byteLength(JSON.stringify(tools));
  assert.ok(
    toolCatalogBytes < 130_000,
    `public tool catalog exceeds the release budget: ${toolCatalogBytes} bytes`
  );
  const brandResult = await client.callTool({
    name: "get-brand",
    arguments: { domain: "stripe.com" },
  });
  assert.equal(brandResult.isError, undefined);
  await client.callTool({
    name: "web-scrape-markdown",
    arguments: { url: "https://example.test" },
  });
  await client.callTool({
    name: "create-monitor",
    arguments: {
      name: "Local OAuth monitor",
      target: { type: "page", url: "https://example.test" },
    },
  });
  await client.close();

  assert.deepEqual(upstreamAuthorizationHeaders.slice(-3), [
    "Bearer ctxt_secret_embedded_test",
    "Bearer ctxt_secret_embedded_test",
    "Bearer ctxt_secret_embedded_test",
  ]);

  const wrongAudienceToken = await issueAccessToken(
    "https://attacker.example/mcp"
  );
  const rejectedToken = await fetch(`${mcpBase}/mcp`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${wrongAudienceToken}`,
      accept: "application/json, text/event-stream",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: {
        name: "web-scrape-markdown",
        arguments: { url: "https://example.test" },
      },
    }),
  });
  assert.equal(rejectedToken.status, 401);
});

test("accepts direct Context API keys at the MCP transport", async () => {
  const bearerClient = new Client({ name: "api-key-test", version: "1.0.0" });
  await bearerClient.connect(
    new StreamableHTTPClientTransport(new URL(`${mcpBase}/mcp`), {
      requestInit: {
        headers: { Authorization: "Bearer ctxt_direct_bearer_key" },
      },
    })
  );
  const { tools } = await bearerClient.listTools();
  assert.equal(tools.length, 34);
  await bearerClient.callTool({
    name: "web-scrape-markdown",
    arguments: { url: "https://example.test" },
  });
  await bearerClient.close();
  assert.equal(
    upstreamAuthorizationHeaders.at(-1),
    "Bearer ctxt_direct_bearer_key"
  );

  const headerClient = new Client({
    name: "api-key-header-test",
    version: "1.0.0",
  });
  await headerClient.connect(
    new StreamableHTTPClientTransport(new URL(`${mcpBase}/mcp`), {
      requestInit: { headers: { "x-api-key": "ctxt_x_api_key_header" } },
    })
  );
  await headerClient.callTool({
    name: "web-scrape-markdown",
    arguments: { url: "https://example.test" },
  });
  await headerClient.close();
  assert.equal(
    upstreamAuthorizationHeaders.at(-1),
    "Bearer ctxt_x_api_key_header"
  );

  const dottedToken = await fetch(`${mcpBase}/mcp`, {
    method: "POST",
    headers: {
      authorization: "Bearer looks.like.an.oauth.token",
      accept: "application/json, text/event-stream",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: {
        name: "web-scrape-markdown",
        arguments: { url: "https://example.test" },
      },
    }),
  });
  assert.equal(dottedToken.status, 401);
});
