import assert from "node:assert/strict";
import { createServer } from "node:http";
import { after, before, test } from "node:test";
import type { Endpoint } from "../context-endpoints";
import { callContextApi } from "./context-client";

type CapturedRequest = {
  method: string;
  url: string;
  authorization?: string;
  contentType?: string;
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
