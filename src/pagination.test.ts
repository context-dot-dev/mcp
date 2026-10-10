import assert from "node:assert/strict";
import { test } from "node:test";
import { ENDPOINTS } from "../context-endpoints";
import { callContextApi } from "./context-client";

for (const repetitions of [2500, 5000]) {
  test(`every batch record remains reachable with ${repetitions * 13}-character pages`, async () => {
    const endpoint = ENDPOINTS.find(
      (entry) => entry.name === "get-batch-results",
    );
    assert.ok(endpoint);
    const originalFetch = globalThis.fetch;
    const originalLimit = process.env.CONTEXT_MCP_MAX_RESPONSE_CHARS;
    process.env.CONTEXT_MCP_MAX_RESPONSE_CHARS = "40000";
    const records = Array.from({ length: 43 }, (_, index) => ({
      url: `https://example.test/page-${index}`,
      markdown: `${index}: ${"page content ".repeat(repetitions)}`,
    }));
    globalThis.fetch = async (input) => {
      const url = new URL(String(input));
      const offset = Number(url.searchParams.get("cursor")?.split(":")[1] ?? 0);
      const limit = Number(url.searchParams.get("limit") ?? 25);
      const data = records.slice(offset, offset + limit);
      const nextOffset = offset + data.length;
      const hasMore = nextOffset < records.length;
      return Response.json({
        data,
        has_more: hasMore,
        next_cursor: hasMore ? `0:${nextOffset}` : null,
      });
    };

    try {
      const received: string[] = [];
      let cursor: string | null = null;
      for (let page = 0; page < records.length; page++) {
        const args: Record<string, unknown> = {
          batch_id: "batch_test",
          limit: 25,
          ...(cursor ? { cursor } : {}),
        };
        const originalArgs = structuredClone(args);
        const result = await callContextApi({
          apiBase: "https://api.context.test/v1",
          endpoint,
          args,
          credential: { apiKey: "ctxt_secret_test" },
        });
        assert.deepEqual(args, originalArgs);
        const textBlock = result.content[0];
        assert.ok(textBlock?.type === "text");
        const body = JSON.parse(textBlock.text) as {
          data: { url: string }[];
          has_more: boolean;
          next_cursor: string | null;
          _context_mcp?: { truncated: boolean };
        };
        if (repetitions === 2500) {
          const expectedRecords = records.filter((record) =>
            body.data.some((entry) => entry.url === record.url),
          );
          assert.deepEqual(body.data, expectedRecords);
        } else {
          assert.equal(body._context_mcp?.truncated, true);
        }
        received.push(...body.data.map((record) => record.url));
        if (!body.has_more) break;
        assert.ok(body.next_cursor);
        assert.notEqual(body.next_cursor, cursor);
        cursor = body.next_cursor;
      }
      assert.deepEqual(
        received,
        records.map((record) => record.url),
      );
    } finally {
      globalThis.fetch = originalFetch;
      if (originalLimit === undefined)
        delete process.env.CONTEXT_MCP_MAX_RESPONSE_CHARS;
      else process.env.CONTEXT_MCP_MAX_RESPONSE_CHARS = originalLimit;
    }
  });
}

for (const endpointName of ["get-batch-results", "list-monitors"]) {
  test(`fails safely when an oversized ${endpointName} page cannot shrink safely`, async () => {
    const endpoint = ENDPOINTS.find((entry) => entry.name === endpointName);
    assert.ok(endpoint);
    const originalFetch = globalThis.fetch;
    const originalLimit = process.env.CONTEXT_MCP_MAX_RESPONSE_CHARS;
    process.env.CONTEXT_MCP_MAX_RESPONSE_CHARS = "40000";
    globalThis.fetch = async () =>
      Response.json({
        data: [
          { markdown: "x".repeat(50000) },
          { url: "https://example.test/second" },
        ],
        has_more: true,
        next_cursor: "opaque-next-page",
      });
    try {
      const result = await callContextApi({
        apiBase: "https://api.context.test/v1",
        endpoint,
        args: { batch_id: "batch_test", limit: 1 },
        credential: { apiKey: "ctxt_secret_test" },
      });
      assert.equal(result.isError, true);
      assert.equal(result.structuredContent, undefined);
    } finally {
      globalThis.fetch = originalFetch;
      if (originalLimit === undefined)
        delete process.env.CONTEXT_MCP_MAX_RESPONSE_CHARS;
      else process.env.CONTEXT_MCP_MAX_RESPONSE_CHARS = originalLimit;
    }
  });
}
