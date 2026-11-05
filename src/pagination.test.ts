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
        const body = result.structuredContent as {
          data: { url: string }[];
          has_more: boolean;
          next_cursor: string | null;
        };
        if (repetitions === 2500) {
          const expectedRecords = records.filter((record) =>
            body.data.some((entry) => entry.url === record.url),
          );
          assert.deepEqual(body.data, expectedRecords);
        } else {
          assert.equal(
            result.structuredContent?._context_mcp &&
              (result.structuredContent._context_mcp as { truncated: boolean })
                .truncated,
            true,
          );
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
      if (endpointName === "list-monitors") {
        const message = result.content[0]?.type === "text" ? result.content[0].text : "";
        assert.match(message, /exceeds MCP client limits[\s\S]*Retry: no, not with the same arguments/);
      }
    } finally {
      globalThis.fetch = originalFetch;
      if (originalLimit === undefined)
        delete process.env.CONTEXT_MCP_MAX_RESPONSE_CHARS;
      else process.env.CONTEXT_MCP_MAX_RESPONSE_CHARS = originalLimit;
    }
  });
}

type PageBody = {
  data: Record<string, unknown>[];
  has_more: boolean;
  next_cursor: string | null;
  _context_mcp?: { truncated?: boolean };
};

function withResponseLimit(limit: string, fetchImpl: typeof fetch) {
  const originalFetch = globalThis.fetch;
  const originalLimit = process.env.CONTEXT_MCP_MAX_RESPONSE_CHARS;
  process.env.CONTEXT_MCP_MAX_RESPONSE_CHARS = limit;
  globalThis.fetch = fetchImpl;
  return () => {
    globalThis.fetch = originalFetch;
    if (originalLimit === undefined)
      delete process.env.CONTEXT_MCP_MAX_RESPONSE_CHARS;
    else process.env.CONTEXT_MCP_MAX_RESPONSE_CHARS = originalLimit;
  };
}

function findEndpoint(name: string) {
  const endpoint = ENDPOINTS.find((entry) => entry.name === name);
  assert.ok(endpoint);
  return endpoint;
}

for (const [endpointName, baseArgs] of [
  ["list-monitor-changes", { monitor_id: "mon_test", limit: 25 }],
  ["get-news-search", { query: "chip export rules", limit: 30 }],
] as const) {
  test(`${endpointName} pages that do not fit shrink to whole records and keep every record`, async () => {
    const endpoint = findEndpoint(endpointName);
    const records = Array.from({ length: 41 }, (_, index) => ({
      id: `rec_${index}`,
      diff: `${index}: ${"changed line ".repeat(300)}`,
    }));
    const upstreamLimits: number[] = [];
    const restore = withResponseLimit("40000", async (input, init) => {
      const url = new URL(String(input));
      const body = init?.body ? JSON.parse(String(init.body)) : {};
      const limit = Number(url.searchParams.get("limit") ?? body.limit ?? 25);
      const cursor = url.searchParams.get("cursor") ?? body.cursor ?? null;
      upstreamLimits.push(limit);
      const start = cursor ? records.findIndex((record) => record.id === cursor) + 1 : 0;
      const data = records.slice(start, start + limit);
      const hasMore = start + data.length < records.length;
      return Response.json({
        data,
        has_more: hasMore,
        next_cursor: hasMore ? data[data.length - 1]!.id : null,
      });
    });
    try {
      const received: string[] = [];
      let cursor: string | null = null;
      for (let page = 0; page < records.length; page++) {
        const args = { ...baseArgs, ...(cursor ? { cursor } : {}) };
        const result = await callContextApi({
          apiBase: "https://api.context.test/v1",
          endpoint,
          args,
          credential: { apiKey: "ctxt_secret_test" },
        });
        assert.equal(result.isError, undefined, JSON.stringify(result.content));
        const body = result.structuredContent as PageBody;
        assert.equal(body._context_mcp, undefined);
        if (body.has_more) assert.ok(body.data.length > 1);
        for (const record of body.data) {
          assert.deepEqual(record, records.find((entry) => entry.id === record.id));
        }
        received.push(...body.data.map((record) => String(record.id)));
        if (!body.has_more) break;
        cursor = body.next_cursor;
      }
      assert.deepEqual(received, records.map((record) => record.id));
      assert.ok(Math.max(...upstreamLimits) <= baseArgs.limit);
      assert.ok(upstreamLimits.length < records.length);
    } finally {
      restore();
    }
  });
}

test("get-batch pages result files whole and never cuts a signed URL", async () => {
  const endpoint = findEndpoint("get-batch");
  const files = Array.from({ length: 400 }, (_, index) => ({
    url: `https://storage.googleapis.com/context-dev-batches/batches/batch_test/output/part-${index}.ndjson.gz?GoogleAccessId=gcs-accessor%40project.iam.gserviceaccount.com&Expires=1799999999&Signature=${"a".repeat(430)}`,
    items: 50,
    bytes: 120_000,
  }));
  const batch = {
    id: "batch_test",
    status: "completed",
    progress: { succeeded: 20_000, failed: 0, pending: 0 },
    results: { expires_at: "2026-11-06T00:00:00.000Z", files },
  };
  const restore = withResponseLimit("80000", async () => Response.json(batch));
  try {
    const received: string[] = [];
    let offset: number | null = 0;
    let pages = 0;
    while (offset !== null) {
      const result = await callContextApi({
        apiBase: "https://api.context.test/v1",
        endpoint,
        args: { batch_id: "batch_test", filesOffset: offset },
        credential: { apiKey: "ctxt_secret_test" },
      });
      const body = result.structuredContent as {
        results: {
          files: { url: string }[];
          files_total: number;
          files_offset: number;
          files_next_offset: number | null;
        };
        _context_mcp?: unknown;
      };
      assert.equal(body._context_mcp, undefined);
      assert.ok(JSON.stringify(body).length <= 80_000);
      assert.equal(body.results.files_total, 400);
      assert.equal(body.results.files_offset, offset);
      if (body.results.files_next_offset !== null) {
        assert.equal(body.results.files.length, 100);
      }
      for (const [index, file] of body.results.files.entries()) {
        assert.deepEqual(file, files[offset + index]);
      }
      received.push(...body.results.files.map((file) => file.url));
      offset = body.results.files_next_offset;
      pages += 1;
    }
    assert.deepEqual(received, files.map((file) => file.url));
    assert.equal(pages, 4);

    const oversized = await callContextApi({
      apiBase: "https://api.context.test/v1",
      endpoint,
      args: { batch_id: "batch_test", filesLimit: 400 },
      credential: { apiKey: "ctxt_secret_test" },
    });
    const oversizedBody = oversized.structuredContent as {
      results: { files: { url: string }[]; files_next_offset: number | null };
      _context_mcp?: unknown;
    };
    assert.equal(oversizedBody._context_mcp, undefined);
    assert.ok(JSON.stringify(oversizedBody).length <= 80_000);
    assert.ok(oversizedBody.results.files.length > 100);
    assert.deepEqual(oversizedBody.results.files, files.slice(0, oversizedBody.results.files.length));
    assert.equal(oversizedBody.results.files_next_offset, oversizedBody.results.files.length);

    const limited = await callContextApi({
      apiBase: "https://api.context.test/v1",
      endpoint,
      args: { batch_id: "batch_test", filesOffset: 390, filesLimit: 5 },
      credential: { apiKey: "ctxt_secret_test" },
    });
    const limitedResults = (limited.structuredContent as { results: Record<string, unknown> }).results;
    assert.deepEqual(limitedResults.files, files.slice(390, 395));
    assert.equal(limitedResults.files_next_offset, 395);
  } finally {
    restore();
  }
});

test("get-batch adds file paging fields without shortening a small manifest", async () => {
  const endpoint = findEndpoint("get-batch");
  const files = [{ url: "https://example.test/part-0", items: 1, bytes: 10 }];
  const restore = withResponseLimit("80000", async () =>
    Response.json({ id: "batch_small", results: { expires_at: "x", files } }),
  );
  try {
    const result = await callContextApi({
      apiBase: "https://api.context.test/v1",
      endpoint,
      args: { batch_id: "batch_small" },
      credential: { apiKey: "ctxt_secret_test" },
    });
    assert.deepEqual(result.structuredContent, {
      id: "batch_small",
      results: {
        expires_at: "x",
        files,
        files_total: 1,
        files_offset: 0,
        files_next_offset: null,
      },
    });
  } finally {
    restore();
  }
});

test("web-crawl keeps whole pages and names the pages it dropped", async () => {
  const endpoint = findEndpoint("web-crawl");
  const results = Array.from({ length: 50 }, (_, index) => ({
    url: `https://example.test/docs/page-${index}`,
    markdown: `# Page ${index}\n\n${"body text ".repeat(800)}`,
    metadata: { statusCode: 200, crawlDepth: 1 },
  }));
  const restore = withResponseLimit("40000", async () =>
    Response.json({
      results,
      metadata: { numUrls: 50, numSucceeded: 50, numFailed: 0 },
    }),
  );
  try {
    const result = await callContextApi({
      apiBase: "https://api.context.test/v1",
      endpoint,
      args: { url: "https://example.test/docs", maxPages: 50 },
      credential: { apiKey: "ctxt_secret_test" },
    });
    const body = result.structuredContent as {
      results: { url: string }[];
      metadata: { numSucceeded: number };
      _context_mcp: { truncated: boolean; omitted_urls: string[] };
    };
    assert.ok(JSON.stringify(body).length <= 40_000);
    assert.equal(body._context_mcp.truncated, true);
    assert.ok(body.results.length > 1);
    for (const [index, page] of body.results.entries()) {
      assert.deepEqual(page, results[index]);
    }
    assert.deepEqual(
      body._context_mcp.omitted_urls,
      results.slice(body.results.length).map((page) => page.url),
    );
    assert.equal(body.metadata.numSucceeded, 50);
  } finally {
    restore();
  }
});

test("compact change lists omit diffs, excerpts, evidence, and URL lists", async () => {
  const endpoint = findEndpoint("list-monitor-changes");
  const change = {
    id: "chg_1",
    title: "Pricing changed",
    summary: "Price went up",
    diff: "- $10\n+ $12",
    before_text_excerpt: "$10",
    after_text_excerpt: "$12",
    evidence: [{ before: "$10", after: "$12" }],
    added_urls: ["https://example.test/new"],
    added_url_count: 1,
    matched_urls: [],
    matched_url_count: 0,
  };
  const restore = withResponseLimit("80000", async () =>
    Response.json({ data: [change], has_more: false, next_cursor: null }),
  );
  try {
    const call = (responseMode?: string) =>
      callContextApi({
        apiBase: "https://api.context.test/v1",
        endpoint,
        args: { monitor_id: "mon_test", ...(responseMode && { responseMode }) },
        credential: { apiKey: "ctxt_secret_test" },
      });
    const compact = (await call("compact")).structuredContent as PageBody;
    assert.deepEqual(compact.data, [
      {
        id: "chg_1",
        title: "Pricing changed",
        summary: "Price went up",
        added_url_count: 1,
        matched_url_count: 0,
      },
    ]);
    const full = (await call()).structuredContent as PageBody;
    assert.deepEqual(full.data, [change]);
  } finally {
    restore();
  }
});
