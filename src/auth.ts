import { createHash } from "node:crypto";
import { jwtDecrypt } from "jose";
import { oauthProxy, type EnhancedToolContext } from "mcp-use/server";
import type { ContextCredential } from "./context-client";

// OAuth access tokens are compact JWEs (dot-separated segments); Context API
// keys are opaque strings without dots. Dotted tokens must fail closed through
// JWE verification so an expired OAuth session still gets the 401 that
// triggers client re-authentication instead of being replayed as an API key.
function isOAuthTokenShaped(token: string): boolean {
  return token.includes(".");
}

function apiKeyAuthPayload(apiKey: string): Record<string, unknown> {
  const keyDigest = createHash("sha256").update(apiKey).digest("hex");
  return {
    sub: `api-key:${keyDigest.slice(0, 12)}`,
    context_api_key: apiKey,
    scope: "api.read api.write",
  };
}

const REQUIRED_OAUTH_ENVIRONMENT = [
  "CONTEXT_OAUTH_CLIENT_ID",
  "CONTEXT_OAUTH_CLIENT_SECRET",
  "CONTEXT_OAUTH_TOKEN_ENCRYPTION_KEY",
] as const;

function normalizeBaseUrl(value: string): string {
  return value.replace(/\/+$/, "");
}

function getMcpResourceUrl(): string {
  const baseUrl = normalizeBaseUrl(
    process.env.MCP_URL ?? "http://localhost:3000"
  );
  return `${baseUrl}/mcp`;
}

function getEncryptionKey(): Uint8Array {
  const encoded = process.env.CONTEXT_OAUTH_TOKEN_ENCRYPTION_KEY!;
  const key = Buffer.from(encoded, "base64url");
  if (key.byteLength !== 32) {
    throw new Error(
      "CONTEXT_OAUTH_TOKEN_ENCRYPTION_KEY must be a base64url-encoded 32-byte key"
    );
  }
  return key;
}

export function createOAuthProvider() {
  const configuredValues = REQUIRED_OAUTH_ENVIRONMENT.filter(
    (name) => process.env[name]
  );
  if (configuredValues.length === 0) {
    return undefined;
  }

  const missingValues = REQUIRED_OAUTH_ENVIRONMENT.filter(
    (name) => !process.env[name]
  );
  if (missingValues.length) {
    throw new Error(
      `Incomplete OAuth configuration. Missing: ${missingValues.join(", ")}`
    );
  }

  const issuer = normalizeBaseUrl(
    process.env.CONTEXT_OAUTH_ISSUER ?? "https://www.context.dev"
  );
  const audience = getMcpResourceUrl();
  const encryptionKey = getEncryptionKey();

  return oauthProxy({
    issuer,
    authEndpoint: `${issuer}/oauth2/authorize`,
    tokenEndpoint: `${issuer}/oauth2/token`,
    clientId: process.env.CONTEXT_OAUTH_CLIENT_ID!,
    clientSecret: process.env.CONTEXT_OAUTH_CLIENT_SECRET!,
    scopes: ["api.read", "api.write"],
    extraAuthorizeParams: { audience },
    verifyToken: async (token) => {
      if (!isOAuthTokenShaped(token)) {
        return { payload: apiKeyAuthPayload(token) };
      }
      const { payload } = await jwtDecrypt(token, encryptionKey, {
        issuer,
        audience,
        keyManagementAlgorithms: ["dir"],
        contentEncryptionAlgorithms: ["A256GCM"],
      });
      if (
        typeof payload.sub !== "string" ||
        typeof payload.context_api_key !== "string"
      ) {
        throw new Error("OAuth token is missing required Context claims");
      }
      return { payload: payload as Record<string, unknown> };
    },
    getUserInfo: (payload) => ({
      userId: String(payload.sub),
      email:
        typeof payload.email === "string" ? payload.email : undefined,
      name: typeof payload.name === "string" ? payload.name : undefined,
    }),
  });
}

export function resolveContextCredential(
  context: EnhancedToolContext | undefined
): ContextCredential | undefined {
  const oauthKey = context?.auth?.payload.context_api_key;
  if (typeof oauthKey === "string") {
    return {
      apiKey: oauthKey,
      scopes: context?.auth?.scopes,
    };
  }

  const authorization = context?.req?.header("authorization");
  const bearer =
    authorization && /^bearer\s+/i.test(authorization)
      ? authorization.replace(/^bearer\s+/i, "").trim()
      : undefined;
  const headerKey = context?.req?.header("x-api-key");
  const apiKey = bearer || headerKey;
  if (apiKey) {
    return { apiKey };
  }

  const configuredKey = process.env.CONTEXT_API_KEY;
  return configuredKey ? { apiKey: configuredKey } : undefined;
}

export const MISSING_CREDENTIAL_MESSAGE =
  "Connect your Context account with OAuth, or send a Context API key in the Authorization header.";
