import assert from "node:assert/strict";
import test from "node:test";
import type { Endpoint } from "../context-endpoints";
import { callContextApi } from "./context-client";
import { acquireApiKeySlot, rememberConcurrencyLimit } from "./api-key-concurrency";

const apiBase = "https://api.context.test/v1";
const endpoint: Endpoint = {
  name: "test",
  title: "Test",
  method: "GET",
  path: "/test",
  parameters: [],
  annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: true },
};

type FakeApi = { maxRunning: number; rejected: number; calls: number };

function installFakeApi(limit: number | undefined, mode = "concurrency"): FakeApi {
  const stats: FakeApi = { maxRunning: 0, rejected: 0, calls: 0 };
  let running = 0;
  const rateLimitHeaders = (remaining: number): Record<string, string> =>
    limit === undefined
      ? {}
      : {
          "X-RateLimit-Limit": String(limit),
          "X-RateLimit-Remaining": String(remaining),
          ...(mode === "concurrency" ? { "X-RateLimit-Mode": "concurrency" } : {}),
        };
  globalThis.fetch = async () => {
    stats.calls += 1;
    if (limit !== undefined && mode === "concurrency" && running >= limit) {
      stats.rejected += 1;
      return new Response(
        JSON.stringify({ message: "Organization concurrency limit exceeded", error_code: "RATE_LIMITED" }),
        { status: 429, headers: { "Retry-After": "0", ...rateLimitHeaders(0) } },
      );
    }
    running += 1;
    stats.maxRunning = Math.max(stats.maxRunning, running);
    await new Promise((resolve) => setTimeout(resolve, 40));
    running -= 1;
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: rateLimitHeaders(limit === undefined ? 0 : limit - running),
    });
  };
  return stats;
}

function callInParallel(apiKey: string, count: number) {
  return Promise.all(
    Array.from({ length: count }, () =>
      callContextApi({ apiBase, endpoint, args: {}, credential: { apiKey } }),
    ),
  );
}

test("parallel calls on a key with a known concurrency limit wait instead of hitting 429", async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });
  const api = installFakeApi(1);
  await callInParallel("known-limit-key", 1);
  const results = await callInParallel("known-limit-key", 4);
  assert.equal(results.filter((result) => result.isError).length, 0);
  assert.equal(api.rejected, 0);
  assert.equal(api.maxRunning, 1);
});

test("the first 429 teaches the limit so the rest of the burst queues", async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });
  const api = installFakeApi(2);
  const results = await callInParallel("unknown-limit-key", 6);
  assert.equal(results.filter((result) => result.isError).length, 0);
  assert.equal(api.maxRunning, 2);
  assert.ok(api.rejected <= 4, `rejected ${api.rejected} calls`);
  const rejectedBeforeSecondBurst = api.rejected;
  await callInParallel("unknown-limit-key", 6);
  assert.equal(api.rejected, rejectedBeforeSecondBurst);
});

test("different API keys do not wait on each other", async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });
  const api = installFakeApi(1);
  await Promise.all([callInParallel("first-key", 1), callInParallel("second-key", 1)]);
  api.maxRunning = 0;
  let running = 0;
  const countingFetch = globalThis.fetch;
  globalThis.fetch = async (...args) => {
    running += 1;
    api.maxRunning = Math.max(api.maxRunning, running);
    const response = await countingFetch(...args);
    running -= 1;
    return response;
  };
  await Promise.all([callInParallel("first-key", 1), callInParallel("second-key", 1)]);
  assert.equal(api.maxRunning, 2);
});

test("per-minute rate limits do not serialize calls", async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });
  const api = installFakeApi(60, "per-minute");
  await callInParallel("per-minute-key", 1);
  await callInParallel("per-minute-key", 4);
  assert.equal(api.maxRunning, 4);
});

test("a queued call goes out once its wait deadline passes", async () => {
  rememberConcurrencyLimit(
    "deadline-key",
    new Headers({ "X-RateLimit-Mode": "concurrency", "X-RateLimit-Limit": "1" }),
  );
  const releaseFirst = await acquireApiKeySlot("deadline-key", Date.now() + 1_000);
  const started = Date.now();
  const releaseSecond = await acquireApiKeySlot("deadline-key", Date.now() + 50);
  assert.ok(Date.now() - started >= 45);
  releaseFirst();
  releaseSecond();
  const releaseThird = await acquireApiKeySlot("deadline-key", Date.now() + 1_000);
  releaseThird();
});

test("a failed request frees its slot for the next call", async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });
  installFakeApi(1);
  await callInParallel("network-error-key", 1);
  globalThis.fetch = async () => { throw new Error("socket hang up"); };
  const [failed] = await callInParallel("network-error-key", 1);
  assert.equal(failed!.isError, true);
  installFakeApi(1);
  const started = Date.now();
  const [succeeded] = await callInParallel("network-error-key", 1);
  assert.equal(succeeded!.isError, undefined);
  assert.ok(Date.now() - started < 1_000);
});
