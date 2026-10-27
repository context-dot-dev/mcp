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

test("responses without a concurrency mode do not forget a learned limit", async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });
  installFakeApi(1);
  await callInParallel("mixed-limit-key", 1);
  installFakeApi(60, "per-minute");
  await callInParallel("mixed-limit-key", 1);
  const api = installFakeApi(1);
  await callInParallel("mixed-limit-key", 4);
  assert.equal(api.rejected, 0);
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

test("a timed-out call does not transfer a nonexistent slot to another waiter", async () => {
  rememberConcurrencyLimit(
    "timed-out-slot-key",
    new Headers({ "X-RateLimit-Mode": "concurrency", "X-RateLimit-Limit": "1" }),
  );
  const releaseFirst = await acquireApiKeySlot("timed-out-slot-key", Date.now() + 1_000);
  const releaseTimedOut = await acquireApiKeySlot("timed-out-slot-key", Date.now() + 20);
  let hasThirdSlot = false;
  const thirdSlot = acquireApiKeySlot("timed-out-slot-key", Date.now() + 1_000).then((release) => {
    hasThirdSlot = true;
    return release;
  });
  releaseTimedOut();
  await new Promise((resolve) => setTimeout(resolve, 30));
  assert.equal(hasThirdSlot, false);
  releaseFirst();
  const releaseThird = await thirdSlot;
  releaseThird();
});

test("an unknown burst drains to the learned limit before releasing waiters", async () => {
  const keyId = "learned-limit-key";
  const releaseFirst = await acquireApiKeySlot(keyId, Date.now() + 1_000);
  const releaseSecond = await acquireApiKeySlot(keyId, Date.now() + 1_000);
  const releaseThird = await acquireApiKeySlot(keyId, Date.now() + 1_000);
  rememberConcurrencyLimit(
    keyId,
    new Headers({ "X-RateLimit-Mode": "concurrency", "X-RateLimit-Limit": "1" }),
  );

  let hasFourthSlot = false;
  const fourthSlot = acquireApiKeySlot(keyId, Date.now() + 1_000).then((release) => {
    hasFourthSlot = true;
    return release;
  });
  releaseFirst();
  releaseSecond();
  await new Promise((resolve) => setTimeout(resolve, 10));
  assert.equal(hasFourthSlot, false);

  releaseThird();
  const releaseFourth = await fourthSlot;
  assert.equal(hasFourthSlot, true);
  releaseFourth();
});

test("concurrency 429s from another server instance keep retrying past the per-minute retry cap", async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    const headers = { "X-RateLimit-Mode": "concurrency", "X-RateLimit-Limit": "1" };
    return calls <= 6
      ? new Response(
          JSON.stringify({ message: "Organization concurrency limit exceeded", error_code: "RATE_LIMITED" }),
          { status: 429, headers: { ...headers, "Retry-After": "0" } },
        )
      : new Response(JSON.stringify({ ok: true }), { status: 200, headers });
  };
  const [result] = await callInParallel("other-instance-key", 1);
  assert.equal(result!.isError, undefined);
  assert.equal(calls, 7);
});

test("a timeout after a long wait for a concurrency slot blames the wait instead of the API", async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });
  let now = Date.now();
  t.mock.method(Date, "now", () => now);
  const concurrencyHeaders = { "X-RateLimit-Mode": "concurrency", "X-RateLimit-Limit": "1" };
  const timeOut = () =>
    Promise.reject(new DOMException("The operation was aborted due to timeout", "TimeoutError"));
  const message = (result: Awaited<ReturnType<typeof callContextApi>> | undefined) =>
    result?.content[0]?.type === "text" ? result.content[0].text : "";

  globalThis.fetch = timeOut;
  const [apiTimeout] = await callInParallel("slow-api-key", 1);
  assert.match(message(apiTimeout), /^Context API did not respond within 115 seconds/);

  let finishRunningCall!: (response: Response) => void;
  const runningCall = new Promise<Response>((resolve) => { finishRunningCall = resolve; });
  const upstream = [
    async () => new Response("{}", { headers: concurrencyHeaders }),
    () => runningCall,
    async () => {
      now += 20_000;
      return new Response(
        JSON.stringify({ message: "Organization concurrency limit exceeded", error_code: "RATE_LIMITED" }),
        { status: 429, headers: { ...concurrencyHeaders, "Retry-After": "0" } },
      );
    },
    timeOut,
  ];
  globalThis.fetch = () => upstream.shift()!();
  await callInParallel("slot-wait-key", 1);
  const running = callInParallel("slot-wait-key", 1);
  const queued = callInParallel("slot-wait-key", 1);
  now += 30_000;
  finishRunningCall(new Response("{}", { headers: concurrencyHeaders }));
  const [[ranResult], [queuedResult]] = await Promise.all([running, queued]);
  assert.equal(ranResult!.isError, undefined);
  const slotWaitTimeout = message(queuedResult);
  assert.match(
    slotWaitTimeout,
    /^Waited 50 seconds for one of this account's concurrent request slots, then Context API did not respond within the remaining 65 seconds/,
  );
  assert.match(slotWaitTimeout, /account limit working as intended; do not call submit-feedback/);
  assert.doesNotMatch(slotWaitTimeout, /always call submit-feedback/);
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
