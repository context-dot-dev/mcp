import assert from "node:assert/strict";
import { test } from "node:test";
import { withAuthorizationServerIssuer } from "./oauth-issuer";

const issuer = "https://mcp.context.dev";

test("identifies the authorization server in successful callbacks", () => {
  const redirect = new URL(
    withAuthorizationServerIssuer(
      "http://localhost:49152/oauth/callback?code=authorization-code&state=client-state",
      issuer,
    ),
  );

  assert.equal(redirect.searchParams.get("code"), "authorization-code");
  assert.equal(redirect.searchParams.get("state"), "client-state");
  assert.equal(redirect.searchParams.get("iss"), issuer);
});

test("identifies the authorization server in error callbacks", () => {
  const redirect = new URL(
    withAuthorizationServerIssuer(
      "http://localhost:49152/oauth/callback?error=access_denied&state=client-state&iss=https%3A%2F%2Fupstream.example",
      issuer,
    ),
  );

  assert.equal(redirect.searchParams.get("error"), "access_denied");
  assert.equal(redirect.searchParams.get("state"), "client-state");
  assert.equal(redirect.searchParams.get("iss"), issuer);
});
