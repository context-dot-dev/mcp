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

async function registerClient(
  clientName: string,
  redirectUris: unknown[]
): Promise<{ status: number; payload: Record<string, unknown> }> {
  const response = await fetch(`${mcpBase}/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      client_name: clientName,
      redirect_uris: redirectUris,
    }),
  });
  const payload = (await response
    .json()
    .catch(() => ({}))) as Record<string, unknown>;
  return { status: response.status, payload };
}

function authorizeUrl(
  clientId: string,
  redirectUri: string,
  extra: Record<string, string> = {}
): string {
  return `${mcpBase}/authorize?${new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    code_challenge: "local-code-challenge",
    code_challenge_method: "S256",
    ...extra,
  })}`;
}

test("registers any client and binds authorization to its redirect set", async () => {
  const claude = await registerClient("Claude", [
    "https://claude.ai/api/mcp/auth_callback",
    "https://claude.com/api/mcp/auth_callback",
  ]);
  assert.equal(claude.status, 201);
  assert.match(String(claude.payload.client_id), /^ctxc_/);
  assert.equal(claude.payload.token_endpoint_auth_method, "none");
  assert.equal(claude.payload.client_secret, undefined);
  assert.deepEqual(claude.payload.redirect_uris, [
    "https://claude.ai/api/mcp/auth_callback",
    "https://claude.com/api/mcp/auth_callback",
  ]);

  // Domains outside the trusted list register too: the signed client_id, not
  // an allowlist, is what scopes where authorization codes may be delivered.
  const unlisted = await registerClient("Unlisted client", [
    "https://mcp-client.example/oauth/callback",
    "http://127.0.0.1:33418/callback",
    "zed://oauth/callback",
  ]);
  assert.equal(unlisted.status, 201);
  const unlistedClientId = String(unlisted.payload.client_id);
  assert.match(unlistedClientId, /^ctxc_/);

  const boundAuthorize = await fetch(
    authorizeUrl(unlistedClientId, "https://mcp-client.example/oauth/callback"),
    { redirect: "manual" }
  );
  assert.equal(boundAuthorize.status, 302);

  const loopbackPortVariance = await fetch(
    authorizeUrl(unlistedClientId, "http://127.0.0.1:49152/callback"),
    { redirect: "manual" }
  );
  assert.equal(loopbackPortVariance.status, 302);

  const unboundAuthorize = await fetch(
    authorizeUrl(unlistedClientId, "https://other.example/oauth/callback"),
    { redirect: "manual" }
  );
  assert.equal(unboundAuthorize.status, 400);

  const tamperedClientId =
    unlistedClientId.slice(0, -2) +
    (unlistedClientId.endsWith("aa") ? "bb" : "aa");
  const tamperedAuthorize = await fetch(
    authorizeUrl(tamperedClientId, "https://mcp-client.example/oauth/callback"),
    { redirect: "manual" }
  );
  assert.equal(tamperedAuthorize.status, 400);

  for (const redirectUris of [
    [],
    ["javascript:alert(1)"],
    ["data:text/html,x"],
    ["http://claude.ai/api/mcp/auth_callback"],
    ["not a url"],
    [42],
    Array.from({ length: 11 }, (_, i) => `https://ok.example/cb/${i}`),
  ]) {
    const rejected = await registerClient("Bad registration", redirectUris);
    assert.equal(rejected.status, 400, JSON.stringify(redirectUris));
  }
});

test("keeps the legacy shared-client path gated by the trusted-domain list", async () => {
  for (const redirectUri of [
    "https://claude.ai/api/mcp/auth_callback",
    "https://oauth.n8n.cloud/oauth2/callback",
    "https://global.consent.azure-apim.net/redirect/context",
    "https://europe-002.consent.azure-apim.net/redirect/context",
    "cursor://anysphere.cursor-mcp/oauth/callback",
  ]) {
    const trustedLegacyAuthorize = await fetch(
      authorizeUrl("dynamic-client", redirectUri),
      { redirect: "manual" }
    );
    assert.equal(trustedLegacyAuthorize.status, 302, redirectUri);
  }

  for (const redirectUri of [
    "https://attacker.example/callback",
    "https://claude.ai.attacker.example/callback",
    "https://notclaude.ai/callback",
    "http://claude.ai/api/mcp/auth_callback",
    // Multi-tenant platforms hand every customer a host under the apex, so
    // only the vendor-operated OAuth hosts are trusted.
    "https://attacker-workspace.app.n8n.cloud/webhook/steal",
    "https://attacker-instance.azure-apim.net/redirect/context",
    "com.attacker.app:/oauth/callback",
  ]) {
    const rejectedAuthorization = await fetch(
      authorizeUrl("dynamic-client", redirectUri),
      { redirect: "manual" }
    );
    assert.equal(rejectedAuthorization.status, 400, redirectUri);
  }
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
      authorizeUrl("dynamic-client", redirectUri),
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

    // Contract with brand-dev-webapp: the consent screen derives its client
    // labeling from the upstream `state`, a base64url JSON transaction whose
    // `redirectUri` is where the proxy callback forwards the authorization
    // code. If this shape changes (e.g. an mcp-use upgrade), the consent
    // screen degrades to generic unverified wording — update it in step.
    const upstreamState = upstreamLocation.searchParams.get("state")!;
    const transaction = JSON.parse(
      Buffer.from(upstreamState, "base64url").toString("utf8")
    ) as { redirectUri: string };
    assert.equal(transaction.redirectUri, redirectUri, redirectUri);
  }
});

test("completes the proxy flow for a registration-bound client on an unlisted domain", async () => {
  const clientRedirect = "https://mcp-client.example/oauth/callback";
  const registration = await registerClient("Unlisted flow client", [
    clientRedirect,
  ]);
  assert.equal(registration.status, 201);
  const clientId = String(registration.payload.client_id);

  const authorizeResponse = await fetch(
    authorizeUrl(clientId, clientRedirect, {
      state: "unlisted-client-state",
      scope: "api.read api.write",
    }),
    { redirect: "manual" }
  );
  assert.equal(authorizeResponse.status, 302);
  const browserCookie = authorizeResponse.headers.get("set-cookie");
  assert.ok(browserCookie);
  const upstreamLocation = new URL(authorizeResponse.headers.get("location")!);
  assert.equal(upstreamLocation.searchParams.get("mcp_client"), "mcp-client");
  const upstreamState = upstreamLocation.searchParams.get("state")!;
  const transaction = JSON.parse(
    Buffer.from(upstreamState, "base64url").toString("utf8")
  ) as { redirectUri: string };
  assert.equal(transaction.redirectUri, clientRedirect);

  const upstreamAuthorizeResponse = await fetch(upstreamLocation, {
    redirect: "manual",
  });
  assert.equal(upstreamAuthorizeResponse.status, 302);
  const callbackResponse = await fetch(
    upstreamAuthorizeResponse.headers.get("location")!,
    {
      redirect: "manual",
      headers: { cookie: browserCookie.split(";")[0] },
    }
  );
  assert.equal(callbackResponse.status, 302);
  const finalRedirect = new URL(callbackResponse.headers.get("location")!);
  assert.equal(finalRedirect.origin + finalRedirect.pathname, clientRedirect);
  assert.equal(
    finalRedirect.searchParams.get("code"),
    "local-authorization-code"
  );
  assert.equal(
    finalRedirect.searchParams.get("state"),
    "unlisted-client-state"
  );
  assert.equal(finalRedirect.searchParams.get("iss"), mcpBase);

  const tokenResponse = await fetch(`${mcpBase}/token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code: "local-authorization-code",
      code_verifier: "local-code-verifier",
      redirect_uri: clientRedirect,
      client_id: clientId,
    }),
  });
  assert.equal(tokenResponse.status, 200);
  const upstreamTokenRequest = tokenRequests.at(-1)!;
  assert.equal(upstreamTokenRequest.get("client_id"), "context-mcp-fixed");
  assert.equal(
    upstreamTokenRequest.get("redirect_uri"),
    `${mcpBase}/oauth/callback`
  );
  // The registration-binding middleware parses the form body before the proxy
  // handler parses it again; these assertions fail if that ever stops being
  // safe and the grant reaches the authorization server stripped.
  assert.equal(upstreamTokenRequest.get("grant_type"), "authorization_code");
  assert.equal(upstreamTokenRequest.get("code"), "local-authorization-code");
  assert.equal(upstreamTokenRequest.get("code_verifier"), "local-code-verifier");
});

test("completes the proxy flow for a registered native app callback", async () => {
  const clientRedirect = "com.xai.grok:/oauth/callback";
  const registration = await registerClient("Grok mobile", [clientRedirect]);
  assert.equal(registration.status, 201);

  const authorizeResponse = await fetch(
    authorizeUrl(String(registration.payload.client_id), clientRedirect, {
      state: "native-client-state",
      scope: "api.read api.write",
    }),
    { redirect: "manual" },
  );
  assert.equal(authorizeResponse.status, 302);
  const browserCookie = authorizeResponse.headers.get("set-cookie");
  assert.ok(browserCookie);
  const upstreamLocation = new URL(authorizeResponse.headers.get("location")!);
  assert.equal(
    upstreamLocation.searchParams.get("redirect_uri"),
    `${mcpBase}/oauth/callback`,
  );

  const upstreamAuthorizeResponse = await fetch(upstreamLocation, {
    redirect: "manual",
  });
  assert.equal(upstreamAuthorizeResponse.status, 302);
  const callbackResponse = await fetch(
    upstreamAuthorizeResponse.headers.get("location")!,
    {
      redirect: "manual",
      headers: { cookie: browserCookie.split(";")[0] },
    },
  );
  assert.equal(callbackResponse.status, 302);
  const finalRedirect = new URL(callbackResponse.headers.get("location")!);
  assert.equal(
    `${finalRedirect.protocol}${finalRedirect.pathname}`,
    "com.xai.grok:/oauth/callback",
  );
  assert.equal(
    finalRedirect.searchParams.get("code"),
    "local-authorization-code",
  );
  assert.equal(finalRedirect.searchParams.get("state"), "native-client-state");
  assert.equal(finalRedirect.searchParams.get("iss"), mcpBase);
});

test("enforces the registration binding at the token endpoint", async () => {
  const registration = await registerClient("Token binding client", [
    "https://token-binding.example/oauth/callback",
  ]);
  assert.equal(registration.status, 201);
  const clientId = String(registration.payload.client_id);

  const mismatchedRedirect = await fetch(`${mcpBase}/token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code: "local-authorization-code",
      code_verifier: "local-code-verifier",
      redirect_uri: "https://other.example/oauth/callback",
      client_id: clientId,
    }),
  });
  assert.equal(mismatchedRedirect.status, 400);
  const mismatchPayload = (await mismatchedRedirect.json()) as {
    error: string;
  };
  assert.equal(mismatchPayload.error, "invalid_grant");

  const forgedClientId =
    clientId.slice(0, -2) + (clientId.endsWith("aa") ? "bb" : "aa");
  const forgedClient = await fetch(`${mcpBase}/token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code: "local-authorization-code",
      code_verifier: "local-code-verifier",
      redirect_uri: "https://token-binding.example/oauth/callback",
      client_id: forgedClientId,
    }),
  });
  assert.equal(forgedClient.status, 401);
  const forgedPayload = (await forgedClient.json()) as { error: string };
  assert.equal(forgedPayload.error, "invalid_client");
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
  assert.match(
    new URL(authorizationUrl).searchParams.get("client_id") ?? "",
    /^ctxc_/
  );

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
  assert.equal(finalRedirect.searchParams.get("iss"), mcpBase);

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
  assert.equal(tools.length, 37);
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
  const resourceMetadata = resource.contents[0]?._meta as
    | {
        ui?: { csp?: { resourceDomains?: string[] } };
        "openai/widgetCSP"?: { resource_domains?: string[] };
      }
    | undefined;
  const resourceDomains =
    resourceMetadata?.ui?.csp?.resourceDomains ??
    resourceMetadata?.["openai/widgetCSP"]?.resource_domains ??
    [];
  assert.ok(resourceDomains.includes("https://media.brand.dev"));
  assert.equal(resourceDomains.some((domain) => domain.includes("*")), false);
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
    toolCatalogBytes < 145_000,
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
  assert.equal(tools.length, 37);
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

  const queryClient = new Client({
    name: "api-key-query-test",
    version: "1.0.0",
  });
  await queryClient.connect(
    new StreamableHTTPClientTransport(
      new URL(`${mcpBase}/mcp?api_key=ctxt_query_api_key`),
    ),
  );
  await queryClient.callTool({
    name: "web-scrape-markdown",
    arguments: { url: "https://example.test" },
  });
  await queryClient.close();
  assert.equal(
    upstreamAuthorizationHeaders.at(-1),
    "Bearer ctxt_query_api_key",
  );

  const sseQueryClient = new Client({
    name: "api-key-query-sse-test",
    version: "1.0.0",
  });
  await sseQueryClient.connect(
    new StreamableHTTPClientTransport(
      new URL(`${mcpBase}/sse?api_key=ctxt_query_sse_api_key`),
    ),
  );
  await sseQueryClient.callTool({
    name: "web-scrape-markdown",
    arguments: { url: "https://example.test" },
  });
  await sseQueryClient.close();
  assert.equal(
    upstreamAuthorizationHeaders.at(-1),
    "Bearer ctxt_query_sse_api_key",
  );

  const explicitApiKeyHeaderClient = new Client({
    name: "api-key-header-precedence-test",
    version: "1.0.0",
  });
  await explicitApiKeyHeaderClient.connect(
    new StreamableHTTPClientTransport(
      new URL(`${mcpBase}/mcp?api_key=ctxt_ignored_query_key`),
      { requestInit: { headers: { "x-api-key": "ctxt_preferred_x_key" } } },
    ),
  );
  await explicitApiKeyHeaderClient.callTool({
    name: "web-scrape-markdown",
    arguments: { url: "https://example.test" },
  });
  await explicitApiKeyHeaderClient.close();
  assert.equal(
    upstreamAuthorizationHeaders.at(-1),
    "Bearer ctxt_preferred_x_key",
  );

  const explicitHeaderClient = new Client({
    name: "api-key-precedence-test",
    version: "1.0.0",
  });
  await explicitHeaderClient.connect(
    new StreamableHTTPClientTransport(
      new URL(`${mcpBase}/mcp?api_key=ctxt_ignored_query_key`),
      {
        requestInit: {
          headers: { Authorization: "Bearer ctxt_preferred_header_key" },
        },
      },
    ),
  );
  await explicitHeaderClient.callTool({
    name: "web-scrape-markdown",
    arguments: { url: "https://example.test" },
  });
  await explicitHeaderClient.close();
  assert.equal(
    upstreamAuthorizationHeaders.at(-1),
    "Bearer ctxt_preferred_header_key",
  );

  const emptyQueryKey = await fetch(`${mcpBase}/mcp?api_key=%20`, {
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
        protocolVersion: "2025-11-25",
        capabilities: {},
        clientInfo: { name: "empty-query-key-test", version: "1.0.0" },
      },
    }),
  });
  assert.equal(emptyQueryKey.status, 401);

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
