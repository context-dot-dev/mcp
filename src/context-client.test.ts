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

test("bounds oversized tool responses while preserving structured data", async () => {
  const originalLimit = process.env.CONTEXT_MCP_MAX_RESPONSE_CHARS;
  process.env.CONTEXT_MCP_MAX_RESPONSE_CHARS = "2000";
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        ok: true,
        markdown: "x".repeat(10_000),
        status: "complete",
      }),
      { status: 200, headers: { "content-type": "application/json" } }
    );

  try {
    const result = await callContextApi({
      apiBase: "https://api.context.test/v1",
      endpoint: endpoint({ path: "/web/scrape/markdown" }),
      args: {},
      credential: { apiKey: "ctxt_secret_test" },
    });
    const structured = result.structuredContent as Record<string, unknown>;
    assert.equal(
      (structured._context_mcp as Record<string, unknown>).truncated,
      true
    );
    assert.equal(structured.status, "complete");
    assert.ok(JSON.stringify(result).length < 6_000);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalLimit === undefined) {
      delete process.env.CONTEXT_MCP_MAX_RESPONSE_CHARS;
    } else {
      process.env.CONTEXT_MCP_MAX_RESPONSE_CHARS = originalLimit;
    }
  }
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

test("network failures suggest feedback without fabricating a request ID", async () => {
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
    assert.match(message, /always call submit-feedback once/);
    assert.doesNotMatch(message, /request_id:/);
  } finally {
    globalThis.fetch = originalFetch;
  }
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
