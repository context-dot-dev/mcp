import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DCR_CLIENT_ID_PREFIX,
  decodeDcrClientId,
  deriveDcrClientSigningKey,
  encodeDcrClientId,
  isDcrClientId,
  isRegistrableRedirectUri,
  redirectUriMatchesRegistration,
  registerDcrClient,
} from "./dcr";

const signingKey = deriveDcrClientSigningKey(
  crypto.getRandomValues(new Uint8Array(32)),
);

test("registration round-trips through the signed client_id", () => {
  const result = registerDcrClient(
    {
      client_name: "Windsurf",
      redirect_uris: [
        "https://windsurf.example/oauth/callback",
        "http://127.0.0.1:33418/callback",
        "windsurf://oauth/callback",
      ],
    },
    signingKey,
  );
  assert.ok(result.ok);
  assert.ok(result.clientId.startsWith(DCR_CLIENT_ID_PREFIX));
  assert.ok(isDcrClientId(result.clientId));

  const decoded = decodeDcrClientId(result.clientId, signingKey);
  assert.ok(decoded);
  assert.deepEqual(decoded.redirectUris, result.registration.redirectUris);
  assert.equal(decoded.clientName, "Windsurf");
});

test("identical registrations produce the same client_id", () => {
  const body = {
    client_name: "Claude",
    redirect_uris: ["https://claude.ai/api/mcp/auth_callback"],
  };
  const first = registerDcrClient(body, signingKey);
  const second = registerDcrClient(body, signingKey);
  assert.ok(first.ok);
  assert.ok(second.ok);
  assert.equal(first.clientId, second.clientId);
});

test("rejects unusable redirect URI sets at registration", () => {
  const rejected: unknown[][] = [
    [],
    ["javascript:alert(1)"],
    ["data:text/html,x"],
    ["file:///etc/passwd"],
    ["http://claude.ai/api/mcp/auth_callback"],
    ["not a url"],
    [42],
    ["https://ok.example/cb", "about:blank"],
    Array.from({ length: 11 }, (_, i) => `https://ok.example/cb/${i}`),
  ];
  for (const redirectUris of rejected) {
    const result = registerDcrClient(
      { redirect_uris: redirectUris },
      signingKey,
    );
    assert.equal(result.ok, false, JSON.stringify(redirectUris));
  }
});

test("accepts HTTPS anywhere, loopback HTTP, and app schemes", () => {
  for (const uri of [
    "https://previously-blocked.example/oauth/callback",
    "https://localhost:7777/oauth/callback",
    "http://localhost:8787/callback",
    "http://127.0.0.1:33418",
    "http://[::1]:9999/cb",
    "cursor://anysphere.cursor-mcp/oauth/callback",
    "zed://oauth/callback",
  ]) {
    assert.ok(isRegistrableRedirectUri(uri), uri);
  }
});

test("tampered or foreign client_ids do not decode", () => {
  const result = registerDcrClient(
    { redirect_uris: ["https://ok.example/cb"] },
    signingKey,
  );
  assert.ok(result.ok);

  const flipped =
    result.clientId.slice(0, -1) +
    (result.clientId.endsWith("A") ? "B" : "A");
  assert.equal(decodeDcrClientId(flipped, signingKey), null);

  const otherKey = deriveDcrClientSigningKey(
    crypto.getRandomValues(new Uint8Array(32)),
  );
  assert.equal(decodeDcrClientId(result.clientId, otherKey), null);

  const forgedPayload = Buffer.from(
    JSON.stringify({ v: 1, r: ["https://evil.example/cb"] }),
  ).toString("base64url");
  assert.equal(
    decodeDcrClientId(
      `${DCR_CLIENT_ID_PREFIX}${forgedPayload}.${forgedPayload}`,
      signingKey,
    ),
    null,
  );
  assert.equal(decodeDcrClientId(`${DCR_CLIENT_ID_PREFIX}x`, signingKey), null);
});

test("payloads that skip registration validation do not decode", () => {
  const signedButEmpty = encodeDcrClientId(
    { redirectUris: [] },
    signingKey,
  );
  assert.equal(decodeDcrClientId(signedButEmpty, signingKey), null);

  const signedButForbidden = encodeDcrClientId(
    { redirectUris: ["javascript:alert(1)"] },
    signingKey,
  );
  assert.equal(decodeDcrClientId(signedButForbidden, signingKey), null);
});

test("redirect matching is exact except for loopback ports", () => {
  const registration = {
    redirectUris: [
      "https://client.example/oauth/callback",
      "http://127.0.0.1:33418/callback",
      "http://localhost:8787/cb?flow=mcp",
    ],
  };
  assert.ok(
    redirectUriMatchesRegistration(
      "https://client.example/oauth/callback",
      registration,
    ),
  );
  assert.ok(
    !redirectUriMatchesRegistration(
      "https://client.example/oauth/callback/extra",
      registration,
    ),
  );
  assert.ok(
    !redirectUriMatchesRegistration(
      "https://sub.client.example/oauth/callback",
      registration,
    ),
  );

  assert.ok(
    redirectUriMatchesRegistration(
      "http://127.0.0.1:49152/callback",
      registration,
    ),
  );
  assert.ok(
    redirectUriMatchesRegistration(
      "http://localhost:60000/cb?flow=mcp",
      registration,
    ),
  );
  assert.ok(
    !redirectUriMatchesRegistration(
      "http://localhost:60000/cb?flow=other",
      registration,
    ),
  );
  assert.ok(
    !redirectUriMatchesRegistration(
      "http://192.168.1.10:33418/callback",
      registration,
    ),
  );
  assert.ok(
    !redirectUriMatchesRegistration(
      "http://127.0.0.1:49152/other",
      registration,
    ),
  );
});

test("client names are trimmed of control characters and length-capped", () => {
  const result = registerDcrClient(
    {
      client_name: `  Evil\u0000\u001fName ${"x".repeat(200)}`,
      redirect_uris: ["https://ok.example/cb"],
    },
    signingKey,
  );
  assert.ok(result.ok);
  const name = result.registration.clientName!;
  assert.ok(!/[\u0000-\u001f\u007f]/.test(name));
  assert.ok(name.length <= 64);
  assert.ok(name.startsWith("Evil"));
});
