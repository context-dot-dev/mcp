import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { EncryptJWT } from "jose";
import { createOAuthProvider, resolveContextCredential } from "./auth";

const originalEnvironment = {
  clientId: process.env.CONTEXT_OAUTH_CLIENT_ID,
  clientSecret: process.env.CONTEXT_OAUTH_CLIENT_SECRET,
  tokenKey: process.env.CONTEXT_OAUTH_TOKEN_ENCRYPTION_KEY,
  issuer: process.env.CONTEXT_OAUTH_ISSUER,
  mcpUrl: process.env.MCP_URL,
};

afterEach(() => {
  const entries = {
    CONTEXT_OAUTH_CLIENT_ID: originalEnvironment.clientId,
    CONTEXT_OAUTH_CLIENT_SECRET: originalEnvironment.clientSecret,
    CONTEXT_OAUTH_TOKEN_ENCRYPTION_KEY: originalEnvironment.tokenKey,
    CONTEXT_OAUTH_ISSUER: originalEnvironment.issuer,
    MCP_URL: originalEnvironment.mcpUrl,
  };
  for (const [name, value] of Object.entries(entries)) {
    if (value === undefined) {
      delete process.env[name];
    } else {
      process.env[name] = value;
    }
  }
});

test("OAuth remains disabled when no OAuth environment is configured", () => {
  delete process.env.CONTEXT_OAUTH_CLIENT_ID;
  delete process.env.CONTEXT_OAUTH_CLIENT_SECRET;
  delete process.env.CONTEXT_OAUTH_TOKEN_ENCRYPTION_KEY;
  assert.equal(createOAuthProvider(), undefined);
});

test("OAuth rejects partial configuration", () => {
  process.env.CONTEXT_OAUTH_CLIENT_ID = "client";
  delete process.env.CONTEXT_OAUTH_CLIENT_SECRET;
  delete process.env.CONTEXT_OAUTH_TOKEN_ENCRYPTION_KEY;
  assert.throws(createOAuthProvider, /Incomplete OAuth configuration/);
});

test("OAuth decrypts a Context MCP token and rejects the wrong audience", async () => {
  const key = crypto.getRandomValues(new Uint8Array(32));
  process.env.CONTEXT_OAUTH_CLIENT_ID = "context-mcp";
  process.env.CONTEXT_OAUTH_CLIENT_SECRET = "secret";
  process.env.CONTEXT_OAUTH_TOKEN_ENCRYPTION_KEY =
    Buffer.from(key).toString("base64url");
  process.env.CONTEXT_OAUTH_ISSUER = "https://www.context.test";
  process.env.MCP_URL = "https://mcp.context.test";

  const provider = createOAuthProvider();
  assert.ok(provider);

  const token = await new EncryptJWT({
    context_api_key: "ctxt_secret_test",
    email: "user@example.com",
    scope: "api.read",
  })
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .setIssuer("https://www.context.test")
    .setAudience("https://mcp.context.test/mcp")
    .setSubject("user-1")
    .setIssuedAt()
    .setExpirationTime("5m")
    .encrypt(key);

  const verified = await provider.verifyToken(token);
  assert.equal(verified.payload.context_api_key, "ctxt_secret_test");
  assert.equal(verified.payload.sub, "user-1");

  const wrongAudienceToken = await new EncryptJWT({
    context_api_key: "ctxt_secret_test",
    scope: "api.read",
  })
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .setIssuer("https://www.context.test")
    .setAudience("https://attacker.example/mcp")
    .setSubject("user-1")
    .setIssuedAt()
    .setExpirationTime("5m")
    .encrypt(key);

  await assert.rejects(
    provider.verifyToken(wrongAudienceToken),
    (error: unknown) => {
      assert.ok(error instanceof Error);
      assert.equal(error.message, "Invalid or expired OAuth access token");
      assert.equal("payload" in error, false);
      assert.equal(JSON.stringify(error).includes("ctxt_secret_test"), false);
      return true;
    },
  );

  const expiredToken = await new EncryptJWT({
    context_api_key: "ctxt_secret_expired_test",
    scope: "api.read",
  })
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .setIssuer("https://www.context.test")
    .setAudience("https://mcp.context.test/mcp")
    .setSubject("user-1")
    .setIssuedAt(1)
    .setExpirationTime(2)
    .encrypt(key);

  await assert.rejects(provider.verifyToken(expiredToken), (error: unknown) => {
    assert.ok(error instanceof Error);
    assert.equal(error.message, "Invalid or expired OAuth access token");
    assert.equal("payload" in error, false);
    assert.equal(
      JSON.stringify(error).includes("ctxt_secret_expired_test"),
      false,
    );
    return true;
  });
});

test("request headers override a private deployment fallback key", () => {
  const originalKey = process.env.CONTEXT_API_KEY;
  process.env.CONTEXT_API_KEY = "ctxt_secret_fallback";
  const context = {
    req: {
      header: (name: string) =>
        name.toLowerCase() === "authorization"
          ? "Bearer ctxt_secret_request"
          : undefined,
    },
  };

  try {
    assert.equal(
      resolveContextCredential(context as never)?.apiKey,
      "ctxt_secret_request"
    );
  } finally {
    if (originalKey === undefined) {
      delete process.env.CONTEXT_API_KEY;
    } else {
      process.env.CONTEXT_API_KEY = originalKey;
    }
  }
});
