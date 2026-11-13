import { isRegistrableRedirectUri } from "./dcr";

type OAuthRequestParameters = Record<string, unknown>;

interface NativeAuthorizationConfig {
  authEndpoint: string;
  callbackUri: string;
  clientId: string;
  audience: string;
}

type NativeAuthorizationResult =
  | { handled: false }
  | { handled: true; error: string }
  | { handled: true; location: string };

type NativeCallbackResult =
  | { handled: false }
  | { handled: true; error: string }
  | { handled: true; location: string };

interface OAuthCallbackTransaction {
  redirectUri: string;
  state?: string;
}

function isNativeRedirectUri(value: unknown): value is string {
  if (!isRegistrableRedirectUri(value)) return false;
  const protocol = new URL(value).protocol;
  return protocol !== "http:" && protocol !== "https:";
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function encodeCallbackTransaction(transaction: OAuthCallbackTransaction): string {
  return Buffer.from(JSON.stringify(transaction)).toString("base64url");
}

function decodeNativeCallbackTransaction(
  value: string | undefined,
): OAuthCallbackTransaction | undefined {
  if (!value) return undefined;
  try {
    const parsed = JSON.parse(
      Buffer.from(value, "base64url").toString("utf8"),
    ) as Record<string, unknown>;
    if (!isNativeRedirectUri(parsed.redirectUri)) return undefined;
    return {
      redirectUri: parsed.redirectUri,
      state: optionalString(parsed.state),
    };
  } catch {
    return undefined;
  }
}

export function createNativeAuthorizationRedirect(
  params: OAuthRequestParameters,
  config: NativeAuthorizationConfig,
): NativeAuthorizationResult {
  if (!isNativeRedirectUri(params.redirect_uri)) return { handled: false };
  const responseType = optionalString(params.response_type);
  const codeChallenge = optionalString(params.code_challenge);
  if (!optionalString(params.client_id) || !responseType || !codeChallenge) {
    return { handled: true, error: "Missing required parameters" };
  }

  const authUrl = new URL(config.authEndpoint);
  authUrl.searchParams.set("response_type", responseType);
  authUrl.searchParams.set("code_challenge", codeChallenge);
  authUrl.searchParams.set(
    "code_challenge_method",
    optionalString(params.code_challenge_method) ?? "S256",
  );
  const scope = optionalString(params.scope);
  if (scope) authUrl.searchParams.set("scope", scope);
  authUrl.searchParams.set("audience", config.audience);
  authUrl.searchParams.set("redirect_uri", config.callbackUri);
  authUrl.searchParams.set(
    "state",
    encodeCallbackTransaction({
      redirectUri: params.redirect_uri,
      state: optionalString(params.state),
    }),
  );
  authUrl.searchParams.set("client_id", config.clientId);
  return { handled: true, location: authUrl.toString() };
}

export function createNativeCallbackRedirect(
  query: Record<string, string>,
): NativeCallbackResult {
  const transaction = decodeNativeCallbackTransaction(query.state);
  if (!transaction) return { handled: false };
  const redirect = new URL(transaction.redirectUri);
  if (query.error) {
    redirect.searchParams.set("error", query.error);
    for (const name of ["error_description", "error_uri"] as const) {
      if (query[name]) redirect.searchParams.set(name, query[name]);
    }
  } else if (query.code) {
    redirect.searchParams.set("code", query.code);
  } else {
    return {
      handled: true,
      error: "Callback is missing both code and error",
    };
  }
  if (transaction.state) {
    redirect.searchParams.set("state", transaction.state);
  }
  return { handled: true, location: redirect.toString() };
}
