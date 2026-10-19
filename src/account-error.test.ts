import assert from "node:assert/strict";
import { test } from "node:test";
import { z } from "zod";
import { accountErrorShape, getAccountToolError } from "./account-error";

test("billing errors preserve known facts on both model-visible surfaces", () => {
  const errorData = {
    credits_remaining: 3,
    credits_required: 10,
    is_credits_required_estimated: true,
    credits_charged: 0,
    next_refill_at: "2026-11-01T07:01:00.000Z",
    next_refill_credits: 1000,
  };
  const result = getAccountToolError({
    message: "Subscribe at https://www.context.dev/dashboard/subscription",
    error_code: "USAGE_EXCEEDED",
    error_data: errorData,
    key_metadata: { credits_remaining: 0 },
  }, new Headers({ "x-request-id": "req_billing" }));

  assert.equal(result?.isError, true);
  assert.equal(result.structuredContent.request_id, "req_billing");
  assert.deepEqual(result.structuredContent.error_data, {
    ...errorData,
    is_authenticated: true,
    should_retry: false,
    retry_condition: "sufficient_credits",
    info_url: "https://context.dev/dashboard/subscription",
  });
  assert.deepEqual(
    JSON.parse(result.content[0]!.text.split("\n\n")[1]!),
    result.structuredContent,
  );
  assert.doesNotMatch(result.content[0]!.text, /subscribe|upgrade|checkout/i);
  assert.equal(z.object(accountErrorShape).safeParse(result.structuredContent).success, true);
  assert.equal("_meta" in result, false);
});

test("legacy billing errors do not invent balances, charges, costs, or refill dates", () => {
  const result = getAccountToolError({ error_code: "USAGE_EXCEEDED" }, new Headers());
  assert.deepEqual(result?.structuredContent.error_data, {
    is_authenticated: true,
    should_retry: false,
    retry_condition: "sufficient_credits",
    info_url: "https://context.dev/dashboard/subscription",
  });
});

test("concurrency failures preserve upstream details and support legacy rate-limit headers", () => {
  const headers = new Headers({
    "X-RateLimit-Mode": "concurrency",
    "X-RateLimit-Limit": "2",
    "X-RateLimit-Remaining": "0",
    "Retry-After": "1",
    "X-Request-Id": "req_concurrency",
  });
  const errorData = {
    limit_type: "concurrency",
    limit: 10,
    remaining: 0,
    retry_after_seconds: 2,
  };
  for (const hasStructuredData of [false, true]) {
    const result = getAccountToolError({
      error_code: "RATE_LIMITED",
      ...(hasStructuredData ? { error_data: errorData } : {}),
      key_metadata: { credits_remaining: 48, credits_consumed: 0 },
    }, headers);
    assert.equal(result?.isError, true);
    const data = result.structuredContent.error_data as Record<string, unknown>;
    assert.equal(data.limit_type, "concurrency");
    assert.equal(data.limit, hasStructuredData ? 10 : 2);
    assert.equal(data.retry_after_seconds, hasStructuredData ? 2 : 1);
    assert.equal(data.credits_charged, 0);
    assert.equal(data.credits_remaining, 48);
    assert.equal(data.retry_condition, "available_concurrency");
    assert.equal(data.should_retry, false);
    assert.equal(data.info_url, "https://context.dev/dashboard/subscription");
    assert.equal(result.structuredContent.request_id, "req_concurrency");
    assert.deepEqual(JSON.parse(result.content[0]!.text.split("\n\n")[1]!), result.structuredContent);
    assert.equal("_meta" in result, false);
    assert.equal(z.object(accountErrorShape).safeParse(result.structuredContent).success, true);
  }
});

test("legacy concurrency headers do not invent missing or malformed values", () => {
  const result = getAccountToolError({ error_code: "RATE_LIMITED" }, new Headers({
    "X-RateLimit-Mode": "concurrency",
    "X-RateLimit-Limit": "",
    "X-RateLimit-Remaining": "unknown",
    "Retry-After": "-1",
  }));
  const data = result?.structuredContent.error_data as Record<string, unknown>;
  for (const key of ["limit", "remaining", "retry_after_seconds", "credits_remaining", "credits_charged"]) {
    assert.equal(data[key], undefined);
  }
});

test("entitlement and account capacity failures remain distinct from credit exhaustion", () => {
  for (const [errorCode, retryCondition] of [
    ["PAID_PLAN_REQUIRED", "required_entitlement"],
    ["BATCH_LIMIT_EXCEEDED", "available_capacity"],
    ["MONITOR_LIMIT_EXCEEDED", "available_capacity"],
  ]) {
    const result = getAccountToolError({ error_code: errorCode }, new Headers());
    assert.equal(result?.isError, true);
    assert.equal(result.structuredContent.error_code, errorCode);
    assert.equal(result.structuredContent.error_data.retry_condition, retryCondition);
    assert.doesNotMatch(result.content[0]!.text, /insufficient credits|subscribe|upgrade|checkout/i);
  }
});

test("authentication failures, throttling, server errors, and successes use their existing paths", () => {
  for (const payload of [
    { error_code: "UNAUTHORIZED" },
    { error_code: "NOT_FOUND" },
    { error_code: "DISABLED" },
    { error_code: "INSUFFICIENT_PERMISSIONS" },
    { error_code: "RATE_LIMITED" },
    { error_code: "INTERNAL_ERROR" },
    { success: true },
    null,
  ]) {
    assert.equal(getAccountToolError(payload, new Headers()), undefined);
  }
});
