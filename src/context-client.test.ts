import assert from "node:assert/strict";
import { createServer } from "node:http";
import { after, before, test } from "node:test";
import { ENDPOINTS, type Endpoint } from "../context-endpoints";
import { callContextApi } from "./context-client";
import { selectEndpoints } from "./toolset";

type CapturedRequest = {
  method: string;
  url: string;
  authorization?: string;
  contentType?: string;
  userAgent?: string;
  contextAgent?: string;
  body: Buffer;
};

const captured: CapturedRequest[] = [];
let apiBase = "";
let connectionsToDrop = 0;
const upstream = createServer((request, response) => {
  const chunks: Buffer[] = [];
  request.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
  request.on("end", () => {
    const body = Buffer.concat(chunks);
    captured.push({
      method: request.method ?? "",
      url: request.url ?? "",
      authorization: request.headers.authorization,
      contentType: request.headers["content-type"],
      userAgent: request.headers["user-agent"],
      contextAgent: request.headers["x-context-agent"] as string | undefined,
      body,
    });

    if (connectionsToDrop > 0) {
      connectionsToDrop -= 1;
      request.socket.destroy();
      return;
    }
    if (request.url?.includes("cut-off")) {
      response.writeHead(200, { "content-type": "application/json", "content-length": "100" });
      response.write("{");
      response.socket?.end();
      return;
    }

    if (request.url?.includes("force-error")) {
      response.writeHead(401, { "content-type": "application/json" });
      response.end(
        JSON.stringify({
          message: "Invalid key",
          error_code: "AUTHENTICATION_FAILED",
        })
      );
      return;
    }

    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify({ ok: true }));
  });
});

before(async () => {
  await new Promise<void>((resolve) =>
    upstream.listen(0, "127.0.0.1", resolve)
  );
  const address = upstream.address();
  assert.ok(address && typeof address === "object");
  apiBase = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  await new Promise<void>((resolve, reject) =>
    upstream.close((cause) => (cause ? reject(cause) : resolve()))
  );
});

function endpoint(overrides: Partial<Endpoint>): Endpoint {
  return {
    name: "test",
    title: "Test",
    method: "GET",
    path: "/test/{id}",
    parameters: [],
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: true,
    },
    ...overrides,
  };
}

test("serializes path, repeated arrays, and nested query objects", async () => {
  captured.length = 0;
  await callContextApi({
    apiBase,
    endpoint: endpoint({
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
        {
          name: "selectors",
          in: "query",
          required: false,
          schema: { type: "array", items: { type: "string" } },
        },
        {
          name: "headers",
          in: "query",
          required: false,
          schema: { type: "object" },
        },
        {
          name: "pdf",
          in: "query",
          required: false,
          schema: { type: "object" },
        },
      ],
    }),
    args: {
      id: "a/b",
      selectors: ["main", "article"],
      headers: { "X-Custom": "hello" },
      pdf: { start: 2, end: 4 },
    },
    credential: { apiKey: "ctxt_secret_test" },
  });

  assert.equal(captured.length, 1);
  const request = captured[0]!;
  assert.equal(request.authorization, "Bearer ctxt_secret_test");
  const url = new URL(request.url, apiBase);
  assert.equal(url.pathname, "/test/a%2Fb");
  assert.deepEqual(url.searchParams.getAll("selectors"), ["main", "article"]);
  assert.equal(url.searchParams.get("headers[X-Custom]"), "hello");
  assert.equal(url.searchParams.get("pdf[start]"), "2");
  assert.equal(url.searchParams.get("pdf[end]"), "4");
});

test("sends flattened JSON bodies and binary bodies", async () => {
  captured.length = 0;
  await callContextApi({
    apiBase,
    endpoint: endpoint({
      method: "POST",
      path: "/json",
      requestBody: {
        required: true,
        contentType: "application/json",
        binary: false,
        schema: {
          type: "object",
          properties: {
            name: { type: "string" },
            enabled: { type: "boolean" },
          },
        },
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        openWorldHint: true,
      },
    }),
    args: { name: "Monitor", enabled: true },
    credential: { apiKey: "key", scopes: ["api.write"] },
  });
  await callContextApi({
    apiBase,
    endpoint: endpoint({
      method: "POST",
      path: "/binary",
      requestBody: {
        required: true,
        contentType: "application/octet-stream",
        binary: true,
        schema: { type: "string", format: "binary" },
      },
    }),
    args: { fileBase64: Buffer.from("hello").toString("base64") },
    credential: { apiKey: "key" },
  });

  assert.deepEqual(JSON.parse(captured[0]!.body.toString()), {
    name: "Monitor",
    enabled: true,
  });
  assert.equal(captured[0]!.contentType, "application/json");
  assert.equal(captured[1]!.body.toString(), "hello");
  assert.equal(captured[1]!.contentType, "application/octet-stream");
});

test("returns MCP errors for upstream failures and missing scopes", async () => {
  const upstreamError = await callContextApi({
    apiBase,
    endpoint: endpoint({ path: "/force-error" }),
    args: {},
    credential: { apiKey: "bad" },
  });
  assert.equal(upstreamError.isError, true);
  assert.match(
    upstreamError.content[0]?.type === "text"
      ? upstreamError.content[0].text
      : "",
    /AUTHENTICATION_FAILED.*Invalid key/
  );

  const scopeError = await callContextApi({
    apiBase,
    endpoint: endpoint({
      method: "POST",
      path: "/write",
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        openWorldHint: true,
      },
    }),
    args: {},
    credential: { apiKey: "key", scopes: ["api.read"] },
  });
  assert.equal(scopeError.isError, true);
  assert.match(
    scopeError.content[0]?.type === "text"
      ? scopeError.content[0].text
      : "",
    /api\.write/
  );
});

test("preserves read-only scraping and requires write scope for browser instructions", async () => {
  captured.length = 0;
  const scrape = selectEndpoints(ENDPOINTS).find((tool) => tool.name === "web-scrape");
  assert.ok(scrape);
  const base = { url: "https://example.test", formats: { markdown: true } };
  for (const args of [
    base,
    { ...base, sharedParams: { actions: [{ type: "scroll" }, { type: "wait", milliseconds: 100 }] } },
  ]) {
    const result = await callContextApi({
      apiBase,
      endpoint: scrape,
      args,
      credential: { apiKey: "key", scopes: ["api.read"] },
    });
    assert.notEqual(result.isError, true);
  }
  assert.equal(captured.length, 2);

  const interactive = {
    ...base,
    sharedParams: { actions: [{ type: "perform", action: "Click the details tab" }] },
  };
  for (const args of [interactive, { body: interactive }]) {
    const denied = await callContextApi({
      apiBase,
      endpoint: scrape,
      args,
      credential: { apiKey: "key", scopes: ["api.read"] },
    });
    assert.equal(denied.isError, true);
    assert.equal(captured.length, 2);
  }
  const allowed = await callContextApi({
    apiBase,
    endpoint: scrape,
    args: interactive,
    credential: { apiKey: "key", scopes: ["api.read", "api.write"] },
  });
  assert.notEqual(allowed.isError, true);
  assert.equal(captured.length, 3);
  assert.deepEqual(JSON.parse(captured[2]!.body.toString()), interactive);
});

async function withBoundedResponse(
  payload: Record<string, unknown>,
  endpointOverrides: Partial<Endpoint>,
  args: Record<string, unknown> = {},
) {
  const originalLimit = process.env.CONTEXT_MCP_MAX_RESPONSE_CHARS;
  process.env.CONTEXT_MCP_MAX_RESPONSE_CHARS = "2000";
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response(JSON.stringify(payload), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  try {
    return await callContextApi({
      apiBase: "https://api.context.test/v1",
      endpoint: endpoint(endpointOverrides),
      args,
      credential: { apiKey: "ctxt_secret_test" },
    });
  } finally {
    globalThis.fetch = originalFetch;
    if (originalLimit === undefined) {
      delete process.env.CONTEXT_MCP_MAX_RESPONSE_CHARS;
    } else {
      process.env.CONTEXT_MCP_MAX_RESPONSE_CHARS = originalLimit;
    }
  }
}

test("bounds oversized tool responses while preserving structured data", async () => {
  const result = await withBoundedResponse(
    { ok: true, markdown: "word ".repeat(2_000), status: "complete" },
    { path: "/web/scrape/markdown" },
  );
  const structured = result.structuredContent as Record<string, unknown>;
  assert.equal(
    (structured._context_mcp as Record<string, unknown>).truncated,
    true
  );
  assert.equal(structured.status, "complete");
  const markdown = String(structured.markdown);
  assert.ok(markdown.startsWith("word word "));
  assert.ok(markdown.endsWith("\n\n[truncated by Context MCP]"));
  assert.ok(JSON.stringify(result).length < 6_000);
});

test("omits an oversized base64 value whole instead of cutting it", async () => {
  const result = await withBoundedResponse(
    {
      markdown: "A short page.",
      bytes: {
        requested: true,
        success: true,
        data: { contentType: "application/pdf", base64: "JVBE".repeat(2_500) },
      },
      request_id: "req_bytes",
    },
    { name: "web-scrape", path: "/web/scrape" },
    { url: "https://example.test/file.pdf", formats: { bytes: true } },
  );
  const structured = result.structuredContent as Record<string, unknown>;
  const bytes = structured.bytes as Record<string, unknown>;
  assert.deepEqual(bytes, {
    requested: true,
    success: true,
    data: {
      contentType: "application/pdf",
      base64: null,
      omitted_reason:
        "exceeds MCP response budget (10000 characters); request a byte Range, a smaller file, or use the REST API",
    },
  });
  assert.equal(structured.markdown, "A short page.");
  assert.equal(structured.request_id, "req_bytes");
  assert.equal(
    (structured._context_mcp as Record<string, unknown>).truncated,
    true,
  );
  assert.ok(!JSON.stringify(result).includes("[truncated by Context MCP]"));
});

test("omits an oversized base64 value in compact scrape responses", async () => {
  const result = await withBoundedResponse(
    {
      bytes: {
        requested: true,
        success: true,
        data: { contentType: "image/webp", base64: "UklG".repeat(2_500) },
      },
    },
    { name: "web-scrape", path: "/web/scrape" },
    { url: "https://example.test/a.webp", formats: { bytes: true }, responseMode: "compact" },
  );
  const textBlock = result.content.find((block) => block.type === "text");
  assert.ok(textBlock && textBlock.type === "text");
  const compact = JSON.parse(textBlock.text) as Record<string, unknown>;
  const bytes = compact.bytes as Record<string, unknown>;
  assert.equal(bytes.contentType, "image/webp");
  assert.equal(bytes.base64, null);
  assert.match(String(bytes.omitted_reason), /^exceeds MCP response budget \(10000 characters\)/);
  assert.ok(!textBlock.text.includes("[truncated by Context MCP]"));
});

test("keeps later array entries when one token does not fit", async () => {
  const result = await withBoundedResponse(
    {
      images: [
        "https://example.test/a.png",
        `data:image/png;base64,${"iVBO".repeat(1_000)}`,
        "https://example.test/c.png",
      ],
      status: "complete",
    },
    { path: "/web/scrape" },
  );
  const structured = result.structuredContent as Record<string, unknown>;
  assert.deepEqual(structured.images, [
    "https://example.test/a.png",
    null,
    "https://example.test/c.png",
  ]);
  assert.equal(structured.status, "complete");
  assert.equal(
    (structured._context_mcp as Record<string, unknown>).truncated,
    true,
  );
  assert.ok(!JSON.stringify(result).includes("[truncated by Context MCP]"));
});

test("stops a long token array at the budget instead of null-filling it", async () => {
  const urls = Array.from(
    { length: 2_000 },
    (_, index) => `https://example.test/page-${index}.html`,
  );
  const result = await withBoundedResponse(
    { urls, status: "complete" },
    { path: "/web/urls" },
  );
  const structured = result.structuredContent as Record<string, unknown>;
  const kept = structured.urls as unknown[];
  assert.ok(kept.length > 10 && kept.length < urls.length);
  assert.deepEqual(kept, urls.slice(0, kept.length));
  assert.equal(structured.status, "complete");
  assert.ok(JSON.stringify(result).length < 6_000);
});

test("stops a long token object at the budget instead of null-filling it", async () => {
  const fields = Object.fromEntries(
    Array.from({ length: 300 }, (_, index) => [`f${index}`, `tok-${index}`]),
  );
  const result = await withBoundedResponse(fields, { path: "/brand/retrieve" });
  const structured = result.structuredContent as Record<string, unknown>;
  const values = Object.values(structured);
  assert.ok(values.length > 10 && values.length < 300);
  assert.ok(values.filter((value) => value === null).length <= 1);
  assert.ok(JSON.stringify(result).length < 6_000);
});

test("omits an oversized data URL whole and keeps its siblings", async () => {
  const result = await withBoundedResponse(
    {
      name: "Acme",
      logo: `data:image/svg+xml;base64,${"PHN2".repeat(1_000)}`,
      colors: ["#112233"],
    },
    { path: "/brand/retrieve" },
  );
  const structured = result.structuredContent as Record<string, unknown>;
  assert.equal(structured.name, "Acme");
  assert.deepEqual(structured.colors, ["#112233"]);
  assert.equal(structured.logo, null);
  assert.match(String(structured.omitted_reason), /^exceeds MCP response budget \(4026 characters\)/);
  assert.ok(!JSON.stringify(result).includes("[truncated by Context MCP]"));
});

test("returns unified screenshots as MCP image content", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        screenshot: {
          requested: true,
          success: true,
          data: "data:image/webp;base64,aGVsbG8=",
        },
        request_id: "req_screenshot",
      }),
      { status: 200, headers: { "content-type": "application/json" } },
    );

  try {
    const result = await callContextApi({
      apiBase: "https://api.context.test/v1",
      endpoint: endpoint({ name: "web-scrape", path: "/web/scrape" }),
      args: { url: "https://example.test", formats: { screenshot: true } },
      credential: { apiKey: "ctxt_secret_test" },
    });
    const imageBlock = result.content.find((block) => block.type === "image");
    assert.deepEqual(imageBlock, {
      type: "image",
      data: "aGVsbG8=",
      mimeType: "image/webp",
    });
    assert.deepEqual(result.structuredContent, {
      screenshot: {
        requested: true,
        success: true,
        data: null,
        delivery: "Returned as MCP image content.",
      },
      request_id: "req_screenshot",
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("preserves request IDs while removing private response metadata", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        ok: true,
        data: [{ id: "batch_result_needed_by_the_client" }],
        key_metadata: { credits_remaining: 100 },
        request_id: "req_internal",
        trace_id: "trace_internal",
        debug: { upstream: "private" },
      }),
      { status: 200, headers: { "content-type": "application/json" } },
    );

  try {
    const result = await callContextApi({
      apiBase: "https://api.context.test/v1",
      endpoint: endpoint({ path: "/test" }),
      args: {},
      credential: { apiKey: "ctxt_secret_test" },
    });
    assert.deepEqual(result.structuredContent, {
      ok: true,
      data: [{ id: "batch_result_needed_by_the_client" }],
      request_id: "req_internal",
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("compacts the text mirror without changing structured responses", async () => {
  const originalFetch = globalThis.fetch;
  const expected = {
    ok: true,
    nested: { values: [1, 2, 3] },
    request_id: "req_compact_text",
  };
  globalThis.fetch = async () => Response.json(expected);

  try {
    const result = await callContextApi({
      apiBase: "https://api.context.test/v1",
      endpoint: endpoint({ path: "/test" }),
      args: {},
      credential: { apiKey: "ctxt_secret_test" },
    });
    assert.deepEqual(result, {
      content: [{ type: "text", text: JSON.stringify(expected) }],
      structuredContent: expected,
      _meta: { mimeType: "application/json" },
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("includes request IDs in upstream API errors", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        message: "Invalid key",
        error_code: "AUTHENTICATION_FAILED",
        request_id: "req_failed",
      }),
      { status: 401, headers: { "content-type": "application/json" } },
    );

  try {
    const result = await callContextApi({
      apiBase: "https://api.context.test/v1",
      endpoint: endpoint({ path: "/test" }),
      args: {},
      credential: { apiKey: "invalid" },
    });
    assert.equal(result.isError, true);
    assert.match(
      result.content[0]?.type === "text" ? result.content[0].text : "",
      /request_id: req_failed/,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("renders field-level validation issues from array error messages", async () => {
  const originalFetch = globalThis.fetch;
  try {
    for (const scenario of [
      {
        payload: {
          message: [{ code: "custom", path: ["highlightsParams"], message: "Set formats.highlights to true to use highlightsParams" }],
          error_code: "INPUT_VALIDATION_ERROR",
          key_metadata: { credits_consumed: 0, credits_remaining: 4970 },
        },
        expected: "Context API 400 [INPUT_VALIDATION_ERROR]: highlightsParams: Set formats.highlights to true to use highlightsParams (request_id: req_validation; credits_remaining: 4970)",
      },
      {
        payload: {
          message: [{ code: "custom", message: "schema must describe a top-level JSON object. Wrap arrays or scalar values in an object property.", path: ["jsonParams", "schema"] }],
          error_code: "INPUT_VALIDATION_ERROR",
          key_metadata: { credits_consumed: 0, credits_remaining: 4970 },
        },
        expected: "Context API 400 [INPUT_VALIDATION_ERROR]: jsonParams.schema: schema must describe a top-level JSON object. Wrap arrays or scalar values in an object property. (request_id: req_validation; credits_remaining: 4970)",
      },
      {
        payload: {
          message: [
            { origin: "array", code: "too_big", maximum: 10, inclusive: true, path: ["includeDomains"], message: "Too big: expected array to have <=10 items" },
            { code: "invalid_format", path: ["urls", 2], message: "Invalid URL" },
            { code: "custom", path: [], message: "Provide url or urls" },
            { code: "custom", message: "Request body is required" },
          ],
          error_code: "INPUT_VALIDATION_ERROR",
        },
        expected: "Context API 400 [INPUT_VALIDATION_ERROR]: includeDomains: Too big: expected array to have <=10 items; urls.2: Invalid URL; Provide url or urls; Request body is required (request_id: req_validation)",
      },
      {
        payload: { message: ["url is required", "formats must not be empty"] },
        expected: "Context API 400: url is required; formats must not be empty (request_id: req_validation)",
      },
      {
        payload: { error: [{ path: ["url"], message: "Invalid URL" }], error_code: "INPUT_VALIDATION_ERROR" },
        expected: "Context API 400 [INPUT_VALIDATION_ERROR]: url: Invalid URL (request_id: req_validation)",
      },
      {
        payload: { message: [{ code: "custom" }], error: "Bad request" },
        expected: "Context API 400: Bad request (request_id: req_validation)",
      },
    ]) {
      globalThis.fetch = async () => new Response(JSON.stringify(scenario.payload), {
        status: 400,
        headers: { "x-request-id": "req_validation" },
      });
      const result = await callContextApi({
        apiBase,
        endpoint: endpoint({ path: "/test" }),
        args: {},
        credential: { apiKey: "key" },
      });
      assert.equal(result.isError, true);
      const message = result.content[0]?.type === "text" ? result.content[0].text : "";
      assert.equal(message.split("\n\n")[0], scenario.expected);
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("account limits show limit details and the next step instead of a feedback nudge", async () => {
  const originalFetch = globalThis.fetch;
  const accountLimitGuidance =
    "This is an account limit working as intended; do not call submit-feedback.";
  try {
    for (const scenario of [
      {
        status: 429,
        headers: new Headers({
          "retry-after": "37",
          "x-ratelimit-limit": "10",
          "x-ratelimit-remaining": "0",
          "x-ratelimit-reset": "1790000000",
          "x-request-id": "req_limit",
        }),
        payload: {
          message: "API rate limit exceeded: 10 request units are allowed per minute and this request uses 1. Retry in 37 seconds.",
          error_code: "RATE_LIMITED",
          key_metadata: { credits_consumed: 0, credits_remaining: 48 },
        },
        expected: "Context API 429 [RATE_LIMITED]: API rate limit exceeded: 10 request units are allowed per minute and this request uses 1. Retry in 37 seconds. (request_id: req_limit; Retry-After: 37; X-RateLimit-Remaining: 0; X-RateLimit-Limit: 10; credits_remaining: 48)\n\n" +
          `${accountLimitGuidance} Wait for the Retry-After window before retrying, and make fewer parallel calls.`,
      },
    ]) {
      globalThis.fetch = async () => new Response(JSON.stringify(scenario.payload), {
        status: scenario.status,
        headers: scenario.headers,
      });
      const result = await callContextApi({
        apiBase,
        endpoint: endpoint({ path: "/test" }),
        args: {},
        credential: { apiKey: "key" },
      });
      assert.equal(result.isError, true);
      const message = result.content[0]?.type === "text" ? result.content[0].text : "";
      assert.equal(message, scenario.expected);
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("short rate-limit waits are retried before reporting an error", async () => {
  const originalFetch = globalThis.fetch;
  let calls = 0;
  try {
    globalThis.fetch = async () => {
      calls += 1;
      return calls < 3
        ? new Response(
            JSON.stringify({
              message: "Organization concurrency limit exceeded: 1 requests can run at once.",
              error_code: "RATE_LIMITED",
            }),
            { status: 429, headers: { "retry-after": "0" } },
          )
        : new Response(JSON.stringify({ ok: true }), { status: 200 });
    };
    const result = await callContextApi({
      apiBase,
      endpoint: endpoint({ path: "/test" }),
      args: {},
      credential: { apiKey: "key" },
    });
    assert.equal(calls, 3);
    assert.equal(result.isError, undefined);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("rate-limit retries back off and stop after a few attempts", async () => {
  const originalFetch = globalThis.fetch;
  const callTimes: number[] = [];
  try {
    globalThis.fetch = async () => {
      callTimes.push(Date.now());
      return new Response(
        JSON.stringify({ message: "Concurrency limit", error_code: "RATE_LIMITED" }),
        { status: 429, headers: { "retry-after": "" } },
      );
    };
    const result = await callContextApi({
      apiBase,
      endpoint: endpoint({ path: "/test" }),
      args: {},
      credential: { apiKey: "key" },
    });
    assert.equal(result.isError, true);
    assert.ok(callTimes.length <= 6, `called ${callTimes.length} times`);
    for (let index = 1; index < callTimes.length; index += 1) {
      assert.ok(callTimes[index]! - callTimes[index - 1]! >= 450);
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("browser actions need the write scope on every tool that accepts them", async () => {
  captured.length = 0;
  const readOnlyCredential = { apiKey: "key", scopes: ["api.read"] };
  const extract = endpoint({
    name: "web-extract",
    method: "POST",
    path: "/web/extract",
    requestBody: {
      required: true,
      schema: { type: "object" },
      contentType: "application/json",
      binary: false,
    },
  });
  const perform = await callContextApi({
    apiBase,
    endpoint: extract,
    args: { url: "https://a.test", actions: [{ do: "perform", action: "Click buy" }] },
    credential: readOnlyCredential,
  });
  assert.equal(perform.isError, true);
  assert.match(JSON.stringify(perform), /api\.write/);
  const waitOnly = await callContextApi({
    apiBase,
    endpoint: extract,
    args: { url: "https://a.test", actions: [{ do: "wait", timeMs: 100 }] },
    credential: readOnlyCredential,
  });
  assert.notEqual(waitOnly.isError, true);
  assert.equal(captured.length, 1);
});

test("signing in with a new browser profile needs the write scope", async () => {
  captured.length = 0;
  const readOnlyCredential = { apiKey: "key", scopes: ["api.read"] };
  const scrape = endpoint({
    name: "web-scrape",
    method: "POST",
    path: "/web/scrape",
    requestBody: {
      required: true,
      schema: { type: "object" },
      contentType: "application/json",
      binary: false,
    },
  });
  const signIn = await callContextApi({
    apiBase,
    endpoint: scrape,
    args: {
      url: "https://a.test/account",
      sharedParams: {
        profile: { type: "new", identifier: "user@a.test", password: "secret" },
      },
    },
    credential: readOnlyCredential,
  });
  assert.equal(signIn.isError, true);
  assert.match(JSON.stringify(signIn), /api\.write/);
  const wrappedSignIn = await callContextApi({
    apiBase,
    endpoint: scrape,
    args: {
      body: {
        url: "https://a.test/account",
        sharedParams: {
          profile: { type: "new", identifier: "user@a.test", password: "secret" },
        },
      },
    },
    credential: readOnlyCredential,
  });
  assert.equal(wrappedSignIn.isError, true);
  assert.match(JSON.stringify(wrappedSignIn), /api\.write/);
  const reuse = await callContextApi({
    apiBase,
    endpoint: scrape,
    args: {
      url: "https://a.test/account",
      sharedParams: {
        profile: { type: "existing", profileId: `prof_${"0".repeat(32)}` },
      },
    },
    credential: readOnlyCredential,
  });
  assert.notEqual(reuse.isError, true);
  assert.equal(captured.length, 1);
});

test("API errors give bounded retry guidance and show rate-limit counters only on 429", async () => {
  const originalFetch = globalThis.fetch;
  try {
    for (const scenario of [
      {
        status: 401,
        headers: new Headers({ "x-ratelimit-limit": "10", "x-ratelimit-remaining": "9", "x-request-id": "req_other" }),
        payload: { message: "Invalid key", error_code: "AUTHENTICATION_FAILED", key_metadata: { credits_remaining: 12 } },
        expected: "Context API 401 [AUTHENTICATION_FAILED]: Invalid key (request_id: req_other; credits_remaining: 12)",
        expectedGuidance: /Retry: no/,
      },
      {
        status: 503,
        headers: new Headers({ "retry-after": "1", "x-ratelimit-limit": "10", "x-ratelimit-remaining": "9", "x-request-id": "req_other" }),
        payload: { message: "Document parsing is at capacity. Please retry shortly.", error_code: "INTERNAL_ERROR" },
        expected: "Context API 503 [INTERNAL_ERROR]: Document parsing is at capacity. Please retry shortly. (request_id: req_other; Retry-After: 1)",
        expectedGuidance: /Retry: at most once/,
      },
    ]) {
      globalThis.fetch = async () => new Response(JSON.stringify(scenario.payload), {
        status: scenario.status,
        headers: scenario.headers,
      });
      const result = await callContextApi({
        apiBase,
        endpoint: endpoint({ path: "/test" }),
        args: {},
        credential: { apiKey: "key" },
      });
      const message = result.content[0]?.type === "text" ? result.content[0].text : "";
      const [firstLine, guidance] = message.split("\n\n");
      assert.equal(firstLine, scenario.expected);
      assert.match(guidance ?? "", scenario.expectedGuidance);
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("forwards the calling MCP client in a header-safe X-Context-Agent", async () => {
  captured.length = 0;
  const call = (clientUserAgent?: string) =>
    callContextApi({
      apiBase,
      endpoint: endpoint({ path: "/test/1" }),
      args: {},
      credential: { apiKey: "ctxt_test" },
      clientUserAgent,
    });

  await call("Claude-User");
  await call("Cursor ✨/1.2");
  await call();

  assert.deepEqual(
    captured.map(({ userAgent, contextAgent }) => [userAgent, contextAgent]),
    [
      ["ContextDev-MCP/1.0", "Claude-User"],
      ["ContextDev-MCP/1.0", "Cursor /1.2"],
      ["ContextDev-MCP/1.0", undefined],
    ],
  );
});

test("prompts feedback for API failures with body IDs, header IDs, or no ID", async () => {
  const originalFetch = globalThis.fetch;
  try {
    for (const scenario of [
      { payload: { message: "Failed", request_id: "body-id" }, header: "header-id", expected: "body-id" },
      { payload: { message: "Failed" }, header: "header-id", expected: "header-id" },
      { payload: { message: "Failed" }, header: undefined, expected: undefined },
    ]) {
      globalThis.fetch = async () => new Response(JSON.stringify(scenario.payload), {
        status: 500,
        headers: scenario.header ? { "x-request-id": scenario.header } : {},
      });
      const result = await callContextApi({
        apiBase,
        endpoint: endpoint({ path: "/test" }),
        args: {},
        credential: { apiKey: "key" },
      });
      assert.equal(result.isError, true);
      const message = result.content[0]?.type === "text" ? result.content[0].text : "";
      assert.match(message, /always call submit-feedback once/);
      assert.match(message, /expected versus actual/);
      assert.match(message, /public page\/docs url if no ID/);
      assert.match(message, /Never invent an ID or include secrets\/private data/);
      if (scenario.expected) {
        assert.ok(message.includes(`request_id: ${scenario.expected}`));
      } else {
        assert.doesNotMatch(message, /request_id:/);
      }
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("retains header request IDs on successful responses for quality feedback", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ markdown: "# Incomplete" }), {
    headers: { "x-request-id": "header-success-id" },
  });
  try {
    const result = await callContextApi({
      apiBase,
      endpoint: endpoint({ path: "/test" }),
      args: {},
      credential: { apiKey: "key" },
    });
    assert.notEqual(result.isError, true);
    assert.deepEqual(result.structuredContent, {
      markdown: "# Incomplete",
      request_id: "header-success-id",
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("network failures give bounded retry guidance without fabricating a request ID", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error("Connection reset"); };
  try {
    const result = await callContextApi({
      apiBase,
      endpoint: endpoint({ path: "/test" }),
      args: {},
      credential: { apiKey: "key" },
    });
    assert.equal(result.isError, true);
    const message = result.content[0]?.type === "text" ? result.content[0].text : "";
    assert.match(message, /Connection reset/);
    assert.match(message, /Retry: at most once/);
    assert.doesNotMatch(message, /always call submit-feedback/);
    assert.doesNotMatch(message, /request_id:/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("retries a connection dropped before the response once, but never a response cut off mid-body", async () => {
  const call = (path: string) =>
    callContextApi({
      apiBase,
      endpoint: endpoint({
        method: "POST",
        path,
        requestBody: {
          required: true,
          contentType: "application/json",
          binary: false,
          schema: { type: "object" },
        },
      }),
      args: { query: "resend me" },
      credential: { apiKey: "key" },
    });
  const message = (result: Awaited<ReturnType<typeof call>>) =>
    result.content[0]?.type === "text" ? result.content[0].text : "";

  captured.length = 0;
  connectionsToDrop = 1;
  const recovered = await call("/test");
  assert.equal(recovered.isError, undefined);
  assert.equal(captured.length, 2);
  assert.equal(captured[1]!.body.toString(), captured[0]!.body.toString());

  captured.length = 0;
  connectionsToDrop = 2;
  const dropped = message(await call("/test"));
  assert.equal(captured.length, 2);
  assert.match(dropped, /Failed to reach Context API: fetch failed \((UND_ERR_SOCKET|ECONNRESET)\)/);
  assert.match(dropped, /Retry: at most once/);

  captured.length = 0;
  const cutOff = message(await call("/cut-off"));
  assert.equal(captured.length, 1);
  assert.match(cutOff, /Failed to reach Context API: terminated/);
});

test("feedback failures stop recursive reporting for HTTP and network errors", async () => {
  const originalFetch = globalThis.fetch;
  try {
    for (const networkFailure of [false, true]) {
      globalThis.fetch = async () => {
        if (networkFailure) throw new Error("Connection reset");
        return new Response(JSON.stringify({ message: "Unavailable" }), { status: 503 });
      };
      const result = await callContextApi({
        apiBase,
        endpoint: endpoint({ name: "submit-feedback", path: "/feedback" }),
        args: {},
        credential: { apiKey: "key" },
      });
      assert.equal(result.isError, true);
      const message = result.content[0]?.type === "text" ? result.content[0].text : "";
      assert.match(message, /Do not call submit-feedback to report its own failure/);
      assert.match(message, /tell the user feedback could not be submitted/);
      assert.doesNotMatch(message, /always call submit-feedback/);
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});
