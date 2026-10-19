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
    info_url: "https://docs.context.dev/account/billing",
  });
  assert.deepEqual(
    JSON.parse(result.content[0]!.text.split("\n\n")[1]!),
    result.structuredContent,
  );
  assert.doesNotMatch(result.content[0]!.text, /dashboard|subscribe|upgrade|checkout/i);
  assert.equal(z.object(accountErrorShape).safeParse(result.structuredContent).success, true);
  assert.equal("_meta" in result, false);
});

test("legacy billing errors do not invent balances, charges, costs, or refill dates", () => {
  const result = getAccountToolError({ error_code: "USAGE_EXCEEDED" }, new Headers());
  assert.deepEqual(result?.structuredContent.error_data, {
    is_authenticated: true,
    should_retry: false,
    retry_condition: "sufficient_credits",
    info_url: "https://docs.context.dev/account/billing",
  });
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
