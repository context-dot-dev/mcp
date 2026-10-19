import { z } from "zod";
import { contextRequestId } from "./feedback";

const BILLING_INFORMATION_URL = "https://context.dev/dashboard/subscription";

export const accountErrorShape = {
  message: z.string().optional(),
  error_code: z.string().optional(),
  error_data: z.record(z.string(), z.unknown()).optional(),
  key_metadata: z.record(z.string(), z.unknown()).optional(),
  request_id: z.string().optional(),
};

export function getAccountToolError(payload: unknown, headers: Headers) {
  const body = getRecord(payload);
  const upstreamData = getRecord(body.error_data);
  const errorCode = body.error_code;
  const isCreditExhaustion = errorCode === "USAGE_EXCEEDED";
  const isEntitlementFailure = errorCode === "PAID_PLAN_REQUIRED";
  const isAccountLimit = errorCode === "MONITOR_LIMIT_EXCEEDED" || errorCode === "BATCH_LIMIT_EXCEEDED";
  const isConcurrencyLimit = errorCode === "RATE_LIMITED" && (
    upstreamData.limit_type === "concurrency" || headers.get("X-RateLimit-Mode") === "concurrency"
  );
  if (!isCreditExhaustion && !isEntitlementFailure && !isAccountLimit && !isConcurrencyLimit) return undefined;

  const metadata = getRecord(body.key_metadata);
  const requestId = contextRequestId(body, headers);
  const limit = getHeaderNumber(headers, "X-RateLimit-Limit");
  const remaining = getHeaderNumber(headers, "X-RateLimit-Remaining");
  const retryAfterSeconds = getHeaderNumber(headers, "Retry-After");
  const message = isCreditExhaustion
    ? `Context.dev could not execute this request because the account has insufficient credits. Authentication is valid. Retrying or reconnecting will not restore credits. Inspect the balance and next refill with get-usage (no credits charged). Retry once the balance covers this operation. Review billing settings: ${BILLING_INFORMATION_URL}`
    : isConcurrencyLimit
      ? `Organization concurrency limit exceeded. Authentication is valid. Wait for an in-flight request to finish and respect Retry-After, or review subscription limits: ${BILLING_INFORMATION_URL}`
    : isEntitlementFailure
      ? `The requested feature is unavailable with the account's current entitlement. Authentication is valid. Review subscription settings or retry without the paid feature: ${BILLING_INFORMATION_URL}`
      : `The account's ${errorCode === "BATCH_LIMIT_EXCEEDED" ? "concurrent batch" : "monitor"} limit has been reached. Retry after capacity becomes available. See account limit information: ${BILLING_INFORMATION_URL}`;
  const errorData = {
    ...upstreamData,
    is_authenticated: true,
    ...(isCreditExhaustion || isConcurrencyLimit ? {
      ...(typeof metadata.credits_remaining === "number" && upstreamData.credits_remaining === undefined
        ? { credits_remaining: metadata.credits_remaining } : {}),
      ...(typeof metadata.credits_consumed === "number" && upstreamData.credits_charged === undefined
        ? { credits_charged: metadata.credits_consumed } : {}),
    } : {}),
    ...(isConcurrencyLimit ? {
      limit_type: "concurrency",
      ...(limit !== undefined && upstreamData.limit === undefined ? { limit } : {}),
      ...(remaining !== undefined && upstreamData.remaining === undefined ? { remaining } : {}),
      ...(retryAfterSeconds !== undefined && upstreamData.retry_after_seconds === undefined
        ? { retry_after_seconds: retryAfterSeconds } : {}),
      recovery_options: ["wait_for_in_flight_requests", "increase_concurrency_limit"],
    } : {}),
    should_retry: false,
    retry_condition: isCreditExhaustion ? "sufficient_credits" : isConcurrencyLimit ? "available_concurrency" : isEntitlementFailure ? "required_entitlement" : "available_capacity",
    info_url: BILLING_INFORMATION_URL,
  };
  const structuredContent = {
    message,
    error_code: errorCode,
    error_data: errorData,
    ...(Object.keys(metadata).length ? { key_metadata: metadata } : {}),
    ...(requestId ? { request_id: requestId } : {}),
  };
  return {
    isError: true,
    content: [{ type: "text" as const, text: `${message}\n\n${JSON.stringify(structuredContent)}` }],
    structuredContent,
  };
}

function getHeaderNumber(headers: Headers, name: string): number | undefined {
  const raw = headers.get(name)?.trim();
  if (!raw) return undefined;
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 ? value : undefined;
}

function getRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}
