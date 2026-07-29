import { createHash, createHmac, timingSafeEqual } from "node:crypto";

const COOKIE_TTL_SECONDS = 10 * 60;

function cookieName(state: string): string {
  const suffix = createHash("sha256").update(state).digest("hex").slice(0, 24);
  return `context_oauth_${suffix}`;
}

function cookieValue(state: string, secret: string): string {
  return createHmac("sha256", secret).update(state).digest("base64url");
}

function serializeCookie(
  name: string,
  value: string,
  maxAge: number,
  secure: boolean
): string {
  return `${name}=${value}; Max-Age=${maxAge}; Path=/oauth/callback; HttpOnly; SameSite=Lax${secure ? "; Secure" : ""}`;
}

function readCookie(cookieHeader: string | undefined, name: string): string | undefined {
  if (!cookieHeader) return undefined;
  for (const entry of cookieHeader.split(";")) {
    const separator = entry.indexOf("=");
    if (separator < 0 || entry.slice(0, separator).trim() !== name) continue;
    return entry.slice(separator + 1).trim();
  }
  return undefined;
}

export function createOAuthBrowserCookie(
  state: string,
  secret: string,
  secure: boolean
): string {
  return serializeCookie(
    cookieName(state),
    cookieValue(state, secret),
    COOKIE_TTL_SECONDS,
    secure
  );
}

export function clearOAuthBrowserCookie(
  state: string,
  secure: boolean
): string {
  return serializeCookie(cookieName(state), "", 0, secure);
}

export function hasValidOAuthBrowserCookie(
  state: string,
  secret: string,
  cookieHeader: string | undefined
): boolean {
  const actual = readCookie(cookieHeader, cookieName(state));
  if (!actual) return false;
  const expected = cookieValue(state, secret);
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);
  return (
    actualBuffer.byteLength === expectedBuffer.byteLength &&
    timingSafeEqual(actualBuffer, expectedBuffer)
  );
}
