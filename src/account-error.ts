import { z } from "zod";
import { contextRequestId } from "./feedback";

const BILLING_INFORMATION_URL = "https://docs.context.dev/account/billing";

export const accountErrorShape = {
  message: z.string().optional(),
  error_code: z.string().optional(),
  error_data: z.record(z.string(), z.unknown()).optional(),
  key_metadata: z.record(z.string(), z.unknown()).optional(),
  request_id: z.string().optional(),
};

export function getAccountToolError(payload: unknown, headers: Headers) {
  const body = getRecord(payload);
  const errorCode = body.error_code;
  const isCreditExhaustion = errorCode === "USAGE_EXCEEDED";
  const isEntitlementFailure = errorCode === "PAID_PLAN_REQUIRED";
  const isAccountLimit = errorCode === "MONITOR_LIMIT_EXCEEDED" || errorCode === "BATCH_LIMIT_EXCEEDED";
  if (!isCreditExhaustion && !isEntitlementFailure && !isAccountLimit) return undefined;

  const metadata = getRecord(body.key_metadata);
  const upstreamData = getRecord(body.error_data);
  const requestId = contextRequestId(body, headers);
  const message = isCreditExhaustion
    ? `Context.dev could not execute this request because the account has insufficient credits. Authentication is valid. Retrying or reconnecting will not restore credits. Inspect the balance and next refill with get-usage (no credits charged). Retry once the balance covers this operation. See credit and entitlement information: ${BILLING_INFORMATION_URL}`
    : isEntitlementFailure
      ? `The requested feature is unavailable with the account's current entitlement. Authentication is valid. Review entitlement information or retry without the paid feature: ${BILLING_INFORMATION_URL}`
      : `The account's ${errorCode === "BATCH_LIMIT_EXCEEDED" ? "concurrent batch" : "monitor"} limit has been reached. Retry after capacity becomes available. See account limit information: ${BILLING_INFORMATION_URL}`;
  const errorData = {
    ...upstreamData,
    is_authenticated: true,
    ...(isCreditExhaustion ? {
      ...(typeof metadata.credits_remaining === "number" && upstreamData.credits_remaining === undefined
        ? { credits_remaining: metadata.credits_remaining } : {}),
      ...(typeof metadata.credits_consumed === "number" && upstreamData.credits_charged === undefined
        ? { credits_charged: metadata.credits_consumed } : {}),
    } : {}),
    should_retry: false,
    retry_condition: isCreditExhaustion ? "sufficient_credits" : isEntitlementFailure ? "required_entitlement" : "available_capacity",
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

function getRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}
