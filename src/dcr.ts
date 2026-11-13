import { createHmac, timingSafeEqual } from "node:crypto";

// Dynamic Client Registration without server-side storage: the client_id IS
// the registration. `ctxc_<base64url payload>.<base64url HMAC>` embeds the
// redirect URI set (and display name) signed with a key derived from the
// OAuth token encryption key, so any instance can validate a registration
// without a database and there is nothing for a registration flood to fill.
// Registration is open to any client; the upstream consent screen derives its
// labeling from the authorization code's true destination, so unrecognized
// destinations render as unverified rather than this server gating them.

export interface DcrClientRegistration {
  redirectUris: string[];
  clientName?: string;
}

export type DcrRegistrationResult =
  | { ok: true; clientId: string; registration: DcrClientRegistration }
  | { ok: false; error: string; errorDescription: string };

export const DCR_CLIENT_ID_PREFIX = "ctxc_";
const SIGNING_KEY_CONTEXT = "context-mcp-dcr-client-registration-v1";
const MAX_REDIRECT_URIS = 10;
const MAX_REDIRECT_URI_LENGTH = 512;
const MAX_CLIENT_NAME_LENGTH = 64;
const MAX_CLIENT_ID_LENGTH = 4096;
const BASE64URL_SEGMENT = /^[A-Za-z0-9_-]+$/;
const LOOPBACK_HOSTNAMES = new Set(["localhost", "127.0.0.1", "[::1]"]);
// Schemes that would hand the authorization response to active content or the
// local filesystem instead of an application's redirect handler.
const FORBIDDEN_REDIRECT_SCHEMES = new Set([
  "javascript:",
  "data:",
  "blob:",
  "file:",
  "about:",
  "vbscript:",
]);

export function deriveDcrClientSigningKey(encryptionKey: Uint8Array): Buffer {
  return createHmac("sha256", encryptionKey)
    .update(SIGNING_KEY_CONTEXT)
    .digest();
}

function isLoopbackHttpUrl(url: URL): boolean {
  return (
    (url.protocol === "http:" || url.protocol === "https:") &&
    LOOPBACK_HOSTNAMES.has(url.hostname)
  );
}

// Any HTTPS callback, loopback HTTP per RFC 8252, or a private-use app scheme.
export function isRegistrableRedirectUri(value: unknown): value is string {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.length > MAX_REDIRECT_URI_LENGTH
  ) {
    return false;
  }
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  if (FORBIDDEN_REDIRECT_SCHEMES.has(url.protocol)) return false;
  if (url.protocol === "https:") return true;
  if (url.protocol === "http:") return LOOPBACK_HOSTNAMES.has(url.hostname);
  return true;
}

function sanitizeClientName(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const cleaned = value
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .trim()
    .slice(0, MAX_CLIENT_NAME_LENGTH);
  return cleaned || undefined;
}

export function registerDcrClient(
  body: Record<string, unknown>,
  signingKey: Buffer,
): DcrRegistrationResult {
  const redirectUris = Array.isArray(body.redirect_uris)
    ? body.redirect_uris
    : [];
  if (redirectUris.length === 0 || redirectUris.length > MAX_REDIRECT_URIS) {
    return {
      ok: false,
      error: "invalid_redirect_uri",
      errorDescription: `redirect_uris must list between 1 and ${MAX_REDIRECT_URIS} URIs`,
    };
  }
  if (!redirectUris.every(isRegistrableRedirectUri)) {
    return {
      ok: false,
      error: "invalid_redirect_uri",
      errorDescription:
        "redirect_uris must be HTTPS, loopback HTTP, or a private-use app scheme",
    };
  }
  const registration: DcrClientRegistration = {
    redirectUris,
    clientName: sanitizeClientName(body.client_name),
  };
  const clientId = encodeDcrClientId(registration, signingKey);
  if (clientId.length > MAX_CLIENT_ID_LENGTH) {
    return {
      ok: false,
      error: "invalid_client_metadata",
      errorDescription: "The combined redirect_uris are too long to register",
    };
  }
  return { ok: true, clientId, registration };
}

export function encodeDcrClientId(
  registration: DcrClientRegistration,
  signingKey: Buffer,
): string {
  const payload = Buffer.from(
    JSON.stringify({
      v: 1,
      r: registration.redirectUris,
      ...(registration.clientName ? { n: registration.clientName } : {}),
    }),
  );
  const signature = createHmac("sha256", signingKey).update(payload).digest();
  return `${DCR_CLIENT_ID_PREFIX}${payload.toString("base64url")}.${signature.toString("base64url")}`;
}

export function isDcrClientId(value: unknown): value is string {
  return typeof value === "string" && value.startsWith(DCR_CLIENT_ID_PREFIX);
}

export function decodeDcrClientId(
  clientId: string,
  signingKey: Buffer,
): DcrClientRegistration | null {
  if (!isDcrClientId(clientId) || clientId.length > MAX_CLIENT_ID_LENGTH) {
    return null;
  }
  const segments = clientId.slice(DCR_CLIENT_ID_PREFIX.length).split(".");
  if (
    segments.length !== 2 ||
    !segments.every((segment) => BASE64URL_SEGMENT.test(segment))
  ) {
    return null;
  }
  const payload = Buffer.from(segments[0]!, "base64url");
  const signature = Buffer.from(segments[1]!, "base64url");
  const expected = createHmac("sha256", signingKey).update(payload).digest();
  if (
    signature.byteLength !== expected.byteLength ||
    !timingSafeEqual(signature, expected)
  ) {
    return null;
  }
  try {
    const parsed = JSON.parse(payload.toString("utf8"));
    if (
      parsed?.v !== 1 ||
      !Array.isArray(parsed.r) ||
      parsed.r.length === 0 ||
      !parsed.r.every(isRegistrableRedirectUri)
    ) {
      return null;
    }
    return {
      redirectUris: parsed.r,
      clientName: typeof parsed.n === "string" ? parsed.n : undefined,
    };
  } catch {
    return null;
  }
}

export function redirectUriMatchesRegistration(
  redirectUri: string,
  registration: DcrClientRegistration,
): boolean {
  if (registration.redirectUris.includes(redirectUri)) return true;
  let requested: URL;
  try {
    requested = new URL(redirectUri);
  } catch {
    return false;
  }
  if (!isLoopbackHttpUrl(requested)) return false;
  // RFC 8252 §7.3: loopback clients bind an ephemeral port per flow, so the
  // port is the one component of a registered loopback URI allowed to vary.
  return registration.redirectUris.some((registered) => {
    let candidate: URL;
    try {
      candidate = new URL(registered);
    } catch {
      return false;
    }
    return (
      isLoopbackHttpUrl(candidate) &&
      candidate.protocol === requested.protocol &&
      candidate.hostname === requested.hostname &&
      candidate.pathname === requested.pathname &&
      candidate.search === requested.search
    );
  });
}
