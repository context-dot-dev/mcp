import assert from "node:assert/strict";
import { spawn, type ChildProcess } from "node:child_process";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { after, before, test } from "node:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { EncryptJWT } from "jose";

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

test("publishes protected-resource metadata and rejects unauthenticated MCP calls", async () => {
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

  const rejectedRegistration = await fetch(`${mcpBase}/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      redirect_uris: ["https://attacker.example/callback"],
    }),
  });
  assert.equal(rejectedRegistration.status, 400);

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
  assert.equal(tools.length, 29);
  assert.ok(
    Buffer.byteLength(JSON.stringify(tools)) < 85_000,
    "recommended tool catalog exceeds the release budget"
  );
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

  assert.deepEqual(upstreamAuthorizationHeaders.slice(-2), [
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
      method: "tools/list",
      params: {},
    }),
  });
  assert.equal(rejectedToken.status, 401);
});
