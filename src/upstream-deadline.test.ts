import assert from "node:assert/strict";
import test, { type TestContext } from "node:test";
import type { Endpoint } from "../context-endpoints";
import { callContextApi, requestDeadlineMs } from "./context-client";

const apiBase = "https://api.context.test/v1";
const endpoint: Endpoint = {
  name: "web-scrape",
  title: "Scrape",
  method: "POST",
  path: "/web/scrape",
  parameters: [],
  requestBody: { required: true, contentType: "application/json", schema: { type: "object" }, binary: false },
  annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: true },
};

function resultText(result: Awaited<ReturnType<typeof callContextApi>>): string {
  return result.content[0]?.type === "text" ? result.content[0].text : "";
}

// Stands in for an upstream that never answers: the call ends only when the
// deadline signal aborts it. The signal itself fires after 5 ms so the test
// does not wait for the real deadline.
function installHangingFetch(t: TestContext): { timeoutMs: number[] } {
  const originalFetch = globalThis.fetch;
  const originalTimeout = AbortSignal.timeout;
  t.after(() => {
    globalThis.fetch = originalFetch;
    AbortSignal.timeout = originalTimeout;
  });
  const seen = { timeoutMs: [] as number[] };
  const now = Date.now();
  t.mock.method(Date, "now", () => now);
  AbortSignal.timeout = (milliseconds: number) => {
    seen.timeoutMs.push(milliseconds);
    const controller = new AbortController();
    setTimeout(
      () => controller.abort(new DOMException("The operation was aborted due to timeout", "TimeoutError")),
      5,
    );
    return controller.signal;
  };
  globalThis.fetch = (_url, init) =>
    new Promise((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => reject(init.signal?.reason));
    });
  return seen;
}

test("the upstream deadline follows timeoutOpts.milliseconds plus the overhead, capped at 100 seconds", () => {
  assert.equal(requestDeadlineMs({}), 100_000);
  assert.equal(requestDeadlineMs({ timeoutOpts: { milliseconds: 20_000, behavior: "return-partial" } }), 30_000);
  assert.equal(requestDeadlineMs({ body: { timeoutOpts: { milliseconds: 25_000 } } }), 35_000);
  assert.equal(requestDeadlineMs({ timeoutOpts: { milliseconds: 120_000 } }), 100_000);
  assert.equal(requestDeadlineMs({ timeoutOpts: { milliseconds: "20000" } }), 100_000);
});

test("a fetch that never resolves ends at the request's own deadline with a structured error", async (t) => {
  const seen = installHangingFetch(t);
  const result = await callContextApi({
    apiBase,
    endpoint,
    args: { url: "https://example.com", timeoutOpts: { milliseconds: 20_000, behavior: "return-partial" } },
    credential: { apiKey: "ctxt_secret_test" },
  });
  assert.deepEqual(seen.timeoutMs, [30_000]);
  assert.equal(result.isError, true);
  const text = resultText(result);
  assert.match(text, /^Context API did not respond within 30 seconds/);
  assert.match(text, /may still finish and bill this request/);
  assert.match(text, /no request_id is available/);
  assert.match(text, /timeoutOpts\.milliseconds of at most 90000/);
});

test("a request without timeoutOpts or asking for more than the hosted path delivers waits 100 seconds", async (t) => {
  const seen = installHangingFetch(t);
  const [plain, long] = await Promise.all([
    callContextApi({ apiBase, endpoint, args: { url: "https://example.com" }, credential: { apiKey: "ctxt_secret_test" } }),
    callContextApi({
      apiBase,
      endpoint,
      args: { url: "https://example.com", timeoutOpts: { milliseconds: 120_000 } },
      credential: { apiKey: "ctxt_secret_test" },
    }),
  ]);
  assert.deepEqual(seen.timeoutMs, [100_000, 100_000]);
  assert.match(resultText(plain), /^Context API did not respond within 100 seconds/);
  assert.match(resultText(long), /^Context API did not respond within 100 seconds/);
});

test("an error response whose body lacks request_id reports the X-Request-Id header", async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });
  globalThis.fetch = async () =>
    new Response(JSON.stringify({ message: "Upstream failed", error_code: "INTERNAL_ERROR" }), {
      status: 500,
      headers: { "content-type": "application/json", "x-request-id": "req_header_only" },
    });
  const result = await callContextApi({
    apiBase, endpoint, args: { url: "https://example.com" }, credential: { apiKey: "ctxt_secret_test" },
  });
  assert.equal(result.isError, true);
  assert.match(resultText(result), /request_id: req_header_only/);
});

test("a success whose body lacks request_id carries the X-Request-Id header", async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });
  globalThis.fetch = async () =>
    new Response(JSON.stringify({ url: "https://example.com", markdown: { success: true, data: "# Hi" } }), {
      status: 200,
      headers: { "content-type": "application/json", "x-request-id": "req_header_ok" },
    });
  const result = await callContextApi({
    apiBase, endpoint, args: { url: "https://example.com" }, credential: { apiKey: "ctxt_secret_test" },
  });
  assert.equal(result.isError, undefined);
  assert.equal((result.structuredContent as { request_id?: string }).request_id, "req_header_ok");
});
