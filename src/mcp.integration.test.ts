import assert from "node:assert/strict";
import { spawn, type ChildProcess } from "node:child_process";
import { createServer } from "node:http";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { after, before, test } from "node:test";
import { AjvJsonSchemaValidator } from "@modelcontextprotocol/sdk/validation/ajv";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { CORE_TOOL_NAMES } from "./toolset";

type CapturedRequest = {
  method: string;
  url: string;
  body: Buffer;
  idempotencyKey?: string;
  authorization?: string;
  contextAgent?: string;
  socketPort?: number;
};

const captured: CapturedRequest[] = [];
let upstreamBase = "";
let mcpBase = "";
let mcpProcess: ChildProcess;

function batchResponse(method: string, requestUrl: string, requestBody: Buffer) {
  const path = new URL(requestUrl, "http://context.test").pathname;
  const args =
    path === "/web/search" ||
    path === "/web/scrape" ||
    path === "/web/crawl"
      ? JSON.parse(requestBody.toString())
      : {};
  if (path === "/web/search" && args.query === "compact empty") {
    return { status: 200, body: { results: [], request_id: "req_empty" } };
  }
  if (path === "/web/search" && args.query === "compact response") {
    return {
      status: 200,
      body: {
        query: args.query,
        request_id: "req_search",
        cache_metadata: { status: "hit", age_ms: 42 },
        results: [
          {
            url: "https://example.test/one",
            title: "One",
            description: "Snippet",
            relevance: "high",
            markdown: { markdown: null, code: "NOT_REQUESTED" },
            highlights: {
              highlights: [
                "x".repeat(1187) + "😀" + "Evidence ".repeat(600),
                "Later passage",
              ],
              code: "SUCCESS",
            },
          },
          {
            url: "https://example.test/two",
            title: "Two",
            description: "Fallback snippet",
            markdown: { markdown: null, code: "NOT_REQUESTED" },
            highlights: {
              highlights: null,
              code: "TIMEOUT",
              message: "Page timed out",
            },
          },
          {
            url: "https://example.test/three",
            title: "Three",
            description: "No matching passage",
            highlights: { highlights: [], code: "SUCCESS" },
          },
        ],
      },
    };
  }
  if (path === "/web/scrape" && args.url === "https://example.test/compact") {
    return {
      status: 200,
      body: {
        url: args.url,
        request_id: "req_scrape",
        cache_metadata: { status: "miss", age_ms: 0 },
        metadata: {
          title: "Evidence page",
          description: "Page description",
          canonicalUrl: args.url,
          headings: [{ level: 1, text: "Navigation" }],
          openGraph: { title: "Evidence page" },
          additionalMeta: { viewport: "width=device-width" },
        },
        html: { requested: false, success: null, data: null },
        markdown: {
          requested: true,
          success: true,
          data: "Page evidence 😀 ".repeat(600),
        },
        highlights: { requested: true, success: true, data: [] },
        json: {
          requested: true,
          success: true,
          data: {
            requested: false,
            debug: "keep",
            nested: null,
            text: "x".repeat(4500),
          },
        },
        parsed: {
          requested: true,
          success: false,
          data: null,
          error: "Selector not found",
        },
        screenshot: {
          requested: true,
          success: true,
          data: "data:image/png;base64,aGVsbG8=",
        },
      },
    };
  }
  if (path === "/web/crawl" && args.url === "https://example.test/compact") {
    const result = (path: string, markdown: string, crawlDepth: number) => ({
      markdown,
      metadata: {
        sourceUrl: `https://example.test/${path}`,
        finalUrl: `https://example.test/${path}`,
        title: path,
        description: `${path} page`,
        language: "en",
        headings: [{ level: 1, text: path }],
        openGraph: { title: path },
        jsonLd: [{ "@type": "WebPage" }],
        url: `https://example.test/${path}`,
        crawlDepth,
        statusCode: 200,
        success: true,
      },
    });
    return {
      status: 200,
      body: {
        results: [
          result("docs", "Documentation ".repeat(900), 0),
          result("api", "API reference ".repeat(1_000), 1),
        ],
        metadata: {
          numUrls: 2,
          maxCrawlDepth: 1,
          numSucceeded: 2,
          numFailed: 0,
          numSkipped: 0,
        },
        cache_metadata: { status: "miss", age_ms: 0 },
        request_id: "req_crawl",
      },
    };
  }
  if (method === "POST" && path === "/web/scrape") {
    const args = JSON.parse(requestBody.toString());
    if (args.url === "https://example.test/feedback-error") {
      return {
        status: 500,
        body: {
          message: "Unexpected scrape failure",
          request_id: "4f2c1a1e-1111-4222-8333-444455556666",
        },
      };
    }
  }
  if (method === "POST" && path === "/feedback") {
    return { status: 200, body: { feedback_id: "feedback_local_test" } };
  }
  if (method === "GET" && path === "/org/logs") {
    return {
      status: 200,
      body: {
        data: [
          {
            request_id: "4f2c1a1e-1111-4222-8333-444455556666",
            path: "/v1/web/scrape/markdown",
            status_code: 500,
            error_code: "WEBSITE_ACCESS_ERROR",
          },
        ],
        page: 1,
        limit: 10,
        has_more: false,
        request_id: "8d13e8f0-1111-4222-8333-444455556666",
      },
    };
  }
  if (method === "GET" && path === "/org/usage") {
    return {
      status: 200,
      body: {
        credits_remaining: 41250,
        period: { start: "2026-09-14T07:01:00.000Z", credits_used: 8750 },
        next_refill: { at: "2026-10-14T07:01:00.000Z", credits: 50000 },
        auto_topup: {
          enabled: false,
          credits_used_this_period: 0,
          monthly_budget_credits: null,
        },
        request_id: "ad13e8f0-1111-4222-8333-444455556666",
      },
    };
  }
  if (method === "GET" && path === "/org/usage/history") {
    return {
      status: 200,
      body: {
        data: [
          {
            start: "2026-10-03T00:00:00.000Z",
            credits_used: 50,
            request_count: 12,
            groups: [
              { value: "/v1/web/scrape", credits_used: 50, request_count: 12 },
            ],
          },
        ],
        total_credits_used: 50,
        total_request_count: 12,
        interval: "day",
        from: "2026-10-03T00:00:00.000Z",
        to: "2026-10-04T00:00:00.000Z",
        request_id: "bd13e8f0-1111-4222-8333-444455556666",
      },
    };
  }
  if (method === "GET" && path.startsWith("/org/logs/")) {
    return {
      status: 200,
      body: {
        data: {
          request_id: path.slice("/org/logs/".length),
          path: "/v1/web/scrape/markdown",
          status_code: 500,
          input: { query: { url: "https://example.test" }, body: {} },
          response: { error_code: "WEBSITE_ACCESS_ERROR" },
        },
        request_id: "9d13e8f0-1111-4222-8333-444455556666",
      },
    };
  }
  if (method === "POST" && path === "/brand/retrieve") {
    const args = JSON.parse(requestBody.toString());
    if (args.domain === "feedback-error.test") {
      return {
        status: 500,
        body: {
          message: "Unexpected brand failure",
          request_id: "5f2c1a1e-1111-4222-8333-444455556666",
        },
      };
    }
    if (args.domain === "concurrency-exceeded.test") {
      return {
        status: 429,
        body: {
          message: "Organization concurrency limit exceeded.",
          request_id: "req_concurrency_limit",
          error_code: "RATE_LIMITED",
          error_data: {
            is_authenticated: true,
            limit_type: "concurrency",
            limit: 2,
            remaining: 0,
            retry_after_seconds: 31,
            credits_charged: 0,
          },
          key_metadata: { credits_consumed: 0, credits_remaining: 48 },
        },
      };
    }
    if (args.domain === "usage-exceeded.test" || args.domain === "new-usage-exceeded.test") {
      return {
        status: args.domain === "new-usage-exceeded.test" ? 402 : 401,
        body: {
          message: "To get more credits immediately, subscribe at https://www.context.dev/dashboard/subscription",
          request_id: "req_credit_limit",
          ...(args.domain === "new-usage-exceeded.test" ? { error_data: { is_authenticated: true, credits_remaining: 0, credits_required: 10, is_credits_required_estimated: true, credits_charged: 0, should_retry: false, retry_condition: "sufficient_credits", next_refill_at: "2026-11-01T07:01:00.000Z", next_refill_credits: 1000, info_url: "https://context.dev/dashboard/subscription" } } : {}),
          error_code: "USAGE_EXCEEDED",
          key_metadata: { credits_consumed: 0, credits_remaining: 0 },
        },
      };
    }
    return {
      status: 200,
      body: {
        brand: {
          domain: "https://example.test/path",
          title: "Example",
          logos: [
            { type: "logo", url: "javascript:alert(1)" },
            {
              type: "icon",
              url: "https://media.brand.dev/example/icon.png",
            },
          ],
          colors: [
            { hex: "url(https://attacker.test/pixel)" },
            { hex: "#2564EA", name: "Blue" },
          ],
          socials: [
            { type: "x", url: "javascript:alert(1)" },
            { type: "linkedin", url: "https://linkedin.com/company/example" },
          ],
          links: {
            pricing: "https://example.test/pricing",
            contact: "data:text/html,unsafe",
          },
        },
        key_metadata: { credits_remaining: 100 },
        request_id: "6f2c1a1e-1111-4222-8333-444455556666",
      },
    };
  }
  if (method === "POST" && path === "/news/search") {
    return {
      status: 200,
      body: {
        data: [
          {
            id: "story_demo",
            title: "Example company announcement",
            url: "https://news.example.test/story",
          },
        ],
        has_more: false,
        next_cursor: null,
      },
    };
  }
  if (method === "POST" && path === "/batch/submit") {
    return {
      status: 202,
      body: {
        id: "batch_demo",
        status: "queued",
        mode: "scrape",
        format: "markdown",
      },
    };
  }
  if (method === "GET" && path === "/batch/list") {
    return {
      status: 200,
      body: {
        data: [{ id: "batch_demo", status: "completed" }],
        has_more: false,
        next_cursor: null,
      },
    };
  }
  if (method === "GET" && path.endsWith("/results")) {
    return {
      status: 200,
      body: {
        data: [
          {
            url: "https://example.test/docs",
            status: "success",
            markdown: "# Documentation",
          },
        ],
        has_more: false,
        next_cursor: null,
      },
    };
  }
  if (method === "GET" && path.startsWith("/batch/")) {
    return {
      status: 200,
      body: {
        id: "batch/a",
        status: "completed",
        progress: { succeeded: 1, failed: 0, pending: 0 },
      },
    };
  }
  if (method === "POST" && path.endsWith("/cancel")) {
    return {
      status: 202,
      body: { id: "batch/a", status: "cancelling" },
    };
  }
  if (method === "DELETE" && path.startsWith("/batch/")) {
    return {
      status: 200,
      body: { id: "batch/a", deleted: true },
    };
  }
  return { status: 200, body: { ok: true } };
}

function resultObject(result: Awaited<ReturnType<Client["callTool"]>>) {
  assert.ok(Array.isArray(result.content));
  const textBlock = result.content.find(
    (block: unknown): block is { type: "text"; text: string } =>
      !!block &&
      typeof block === "object" &&
      (block as { type?: unknown }).type === "text" &&
      typeof (block as { text?: unknown }).text === "string",
  );
  assert.ok(textBlock);
  return JSON.parse(textBlock.text) as Record<string, unknown>;
}

const upstream = createServer((request, response) => {
  const chunks: Buffer[] = [];
  request.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
  request.on("end", () => {
    const idempotencyHeader = request.headers["idempotency-key"];
    captured.push({
      method: request.method ?? "",
      url: request.url ?? "",
      body: Buffer.concat(chunks),
      idempotencyKey: Array.isArray(idempotencyHeader)
        ? idempotencyHeader[0]
        : idempotencyHeader,
      authorization: request.headers.authorization,
      contextAgent: request.headers["x-context-agent"] as string | undefined,
      socketPort: request.socket.remotePort,
    });
    const result = batchResponse(
      request.method ?? "",
      request.url ?? "",
      Buffer.concat(chunks),
    );
    if (result.status === 429) response.setHeader("Retry-After", "31");
    response.writeHead(result.status, { "content-type": "application/json" });
    response.end(JSON.stringify(result.body));
  });
});
// Like api.context.dev behind Cloudflare: keep-alive without a timeout hint.
upstream.keepAliveTimeout = 0;

async function getOpenPort(): Promise<number> {
  const server = createServer();
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert.ok(address && typeof address === "object");
  const { port } = address;
  await new Promise<void>((resolve, reject) =>
    server.close((cause) => (cause ? reject(cause) : resolve()))
  );
  return port;
}

async function waitForHealth(url: string): Promise<void> {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }
  throw new Error(`Timed out waiting for ${url}`);
}

before(async () => {
  await new Promise<void>((resolve) =>
    upstream.listen(0, "127.0.0.1", resolve)
  );
  const upstreamAddress = upstream.address();
  assert.ok(upstreamAddress && typeof upstreamAddress === "object");
  upstreamBase = `http://127.0.0.1:${upstreamAddress.port}`;

  const mcpPort = await getOpenPort();
  mcpBase = `http://localhost:${mcpPort}`;
  mcpProcess = spawn(process.execPath, ["dist/index.js"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      PORT: String(mcpPort),
      MCP_URL: mcpBase,
      CONTEXT_API_BASE: upstreamBase,
      CONTEXT_API_KEY: "ctxt_secret_local_test",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  await waitForHealth(`${mcpBase}/health`);
});

after(async () => {
  mcpProcess.kill("SIGTERM");
  await new Promise<void>((resolve) => {
    if (mcpProcess.exitCode !== null) {
      resolve();
      return;
    }
    mcpProcess.once("exit", () => resolve());
  });
  await new Promise<void>((resolve, reject) =>
    upstream.close((cause) => (cause ? reject(cause) : resolve()))
  );
});

async function connectClient(path = "/mcp", userAgent?: string): Promise<Client> {
  const client = new Client({ name: "context-test", version: "1.0.0" });
  await client.connect(
    new StreamableHTTPClientTransport(new URL(`${mcpBase}${path}`), {
      requestInit: userAgent ? { headers: { "User-Agent": userAgent } } : undefined,
    })
  );
  return client;
}

test("compact web responses preserve evidence and errors through the MCP protocol", async () => {
  const client = await connectClient();
  try {
    const { tools } = await client.listTools();
    for (const name of ["web-search", "web-scrape", "web-crawl"]) {
      const tool = tools.find((entry) => entry.name === name)!;
      assert.deepEqual(
        (tool.inputSchema.properties?.responseMode as { enum?: string[] })
          .enum,
        ["full", "compact"],
      );
      assert.match(
        (tool.inputSchema.properties?.responseMode as { description: string })
          .description,
        /compact/,
      );
      assert.match(tool.description!, /compact/);
    }
    assert.equal(
      tools.find((tool) => tool.name === "web-map")?.inputSchema.properties
        ?.responseMode,
      undefined,
    );

    const pairs = [];
    for (const [name, args] of [
      [
        "web-search",
        { query: "compact response", highlightsOptions: { enabled: true } },
      ],
      [
        "web-scrape",
        {
          url: "https://example.test/compact",
          formats: {
            markdown: true,
            highlights: true,
            json: true,
            parse: true,
            screenshot: true,
          },
          highlightsParams: { query: "evidence" },
          jsonParams: { schema: {} },
          parseParams: { rules: { title: "h1" } },
        },
      ],
    ] as const) {
      const original = await client.callTool({ name, arguments: args });
      const full = await client.callTool({
        name,
        arguments: { ...args, responseMode: "full" },
      });
      assert.deepEqual(full, original);
      const compact = await client.callTool({
        name,
        arguments: { ...args, responseMode: "compact" },
      });
      assert.equal(compact.isError, undefined);
      assert.equal(compact.structuredContent, undefined);
      assert.equal(
        JSON.parse(captured.at(-1)!.body.toString()).responseMode,
        undefined,
      );
      const data = resultObject(compact);
      assert.equal(
        data.request_id,
        name === "web-search" ? "req_search" : "req_scrape",
      );
      assert.equal(data.cache_metadata, undefined);
      const marker = data._context_mcp as {
        truncated: boolean;
        message: string;
      };
      assert.equal(marker.truncated, true);
      assert.match(marker.message, /responseMode/);
      assert.ok(
        JSON.stringify(compact).length < JSON.stringify(full).length * 0.65,
      );
      if (name === "web-search") {
        const results = data.results as Array<Record<string, unknown>>;
        assert.deepEqual(
          results.map((entry) => entry.url),
          [
            "https://example.test/one",
            "https://example.test/two",
            "https://example.test/three",
          ],
        );
        assert.equal(results[0].markdown, undefined);
        assert.equal(results[0].description, undefined);
        assert.ok((results[0].highlights as string[]).join("").length <= 1200);
        const excerpt = (results[0].highlights as string[]).join("");
        assert.equal(Buffer.from(excerpt).toString("utf8"), excerpt);
        assert.equal(
          (results[1].highlights as Record<string, unknown>).code,
          "TIMEOUT",
        );
        assert.equal(results[1].description, "Fallback snippet");
        assert.deepEqual(results[2].highlights, []);
      } else {
        assert.equal(data.html, undefined);
        assert.equal(
          (data.metadata as Record<string, unknown>).headings,
          undefined,
        );
        assert.equal(
          (data.metadata as Record<string, unknown>).title,
          "Evidence page",
        );
        assert.ok((data.markdown as string).length <= 4000);
        assert.deepEqual(data.highlights, []);
        assert.deepEqual(data.json, {
          requested: false,
          debug: "keep",
          nested: null,
          text: "x".repeat(4500),
        });
        assert.deepEqual(data.parsed, {
          success: false,
          data: null,
          error: "Selector not found",
        });
        assert.ok(Array.isArray(compact.content));
        assert.deepEqual(
          compact.content.find((block) => block.type === "image"),
          { type: "image", data: "aGVsbG8=", mimeType: "image/png" },
        );
      }
      pairs.push({ name, full, compact });
    }

    const empty = await client.callTool({
      name: "web-search",
      arguments: { query: "compact empty", responseMode: "compact" },
    });
    assert.deepEqual(resultObject(empty), {
      results: [],
      request_id: "req_empty",
    });
    const failure = await client.callTool({
      name: "web-scrape",
      arguments: {
        url: "https://example.test/feedback-error",
        formats: { markdown: true },
        responseMode: "compact",
      },
    });
    assert.equal(failure.isError, true);
    assert.match(
      JSON.stringify(failure),
      /4f2c1a1e-1111-4222-8333-444455556666/,
    );
    // An unknown responseMode falls back to the default full response.
    const unknownMode = await client.callTool({
      name: "web-search",
      arguments: { query: "compact response", responseMode: "tiny" },
    });
    assert.notEqual(unknownMode.isError, true);
    assert.ok(unknownMode.structuredContent);

    const directory = join(tmpdir(), "context-mcp-compact-evidence");
    await mkdir(directory, { recursive: true });
    await writeFile(
      join(directory, "responses.json"),
      JSON.stringify(pairs, null, 2),
    );
    console.log(`Compact response evidence: ${directory}/responses.json`);
  } finally {
    await client.close();
  }
});

test("compact crawl keeps each page while removing verbose page data", async () => {
  captured.length = 0;
  const client = await connectClient();
  try {
    const args = { url: "https://example.test/compact", maxPages: 2 };
    const original = await client.callTool({
      name: "web-crawl",
      arguments: args,
    });
    const full = await client.callTool({
      name: "web-crawl",
      arguments: { ...args, responseMode: "full" },
    });
    const compact = await client.callTool({
      name: "web-crawl",
      arguments: { ...args, responseMode: "compact" },
    });

    assert.deepEqual(full, original);
    assert.deepEqual(JSON.parse(captured.at(-1)!.body.toString()), args);
    const data = resultObject(compact);
    assert.equal(data.request_id, "req_crawl");
    assert.equal(data.cache_metadata, undefined);
    assert.deepEqual(data.metadata, {
      numUrls: 2,
      maxCrawlDepth: 1,
      numSucceeded: 2,
      numFailed: 0,
      numSkipped: 0,
    });
    const results = data.results as Array<Record<string, unknown>>;
    assert.equal(results.length, 2);
    for (const result of results) {
      assert.ok((result.markdown as string).length <= 4_000);
      const metadata = result.metadata as Record<string, unknown>;
      assert.equal(metadata.headings, undefined);
      assert.equal(metadata.openGraph, undefined);
      assert.equal(metadata.jsonLd, undefined);
      assert.equal(metadata.statusCode, 200);
      assert.equal(metadata.success, true);
    }
    assert.equal(
      (data._context_mcp as Record<string, unknown>).truncated,
      true,
    );
    assert.ok(
      JSON.stringify(compact).length < JSON.stringify(full).length * 0.4,
    );
  } finally {
    await client.close();
  }
});

test("serves the OpenAI domain verification token as plain text", async () => {
  const response = await fetch(
    `${mcpBase}/.well-known/openai-apps-challenge`,
  );

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/plain/);
  assert.equal(
    await response.text(),
    "-oywG7IJEF_oq8McQYi47HY0QDTdYn36eA_yi5bPysc",
  );
});

test("advertises every supported authentication path", async () => {
  const landingResponse = await fetch(`${mcpBase}/mcp`, {
    headers: { Accept: "text/html" },
  });
  const landingPage = await landingResponse.text();
  assert.equal(landingResponse.status, 200);
  assert.match(landingPage, /Authorization header/);
  assert.match(landingPage, /X-API-Key header/);
  assert.match(landingPage, /api_key URL parameter/);

  const initializeResponse = await fetch(`${mcpBase}/mcp`, {
    method: "POST",
    headers: {
      Accept: "application/json, text/event-stream",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2025-11-25",
        capabilities: {},
        clientInfo: { name: "auth-discovery-test", version: "1.0.0" },
      },
    }),
  });
  const initializePayload = await initializeResponse.json();
  assert.equal(initializeResponse.status, 200);
  assert.match(initializePayload.result.instructions, /Authorization: Bearer/);
  assert.match(initializePayload.result.instructions, /X-API-Key/);
  assert.match(initializePayload.result.instructions, /api_key/);
});

test("rejects untrusted browser origins and allows known MCP clients", async () => {
  const payload = JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "2025-11-25",
      capabilities: {},
      clientInfo: { name: "origin-test", version: "1.0.0" },
    },
  });
  const requestHeaders = {
    Accept: "application/json, text/event-stream",
    "Content-Type": "application/json",
  };

  const rejected = await fetch(`${mcpBase}/mcp`, {
    method: "POST",
    headers: { ...requestHeaders, Origin: "https://attacker.example" },
    body: payload,
  });
  assert.equal(rejected.status, 403);
  assert.equal(
    (await rejected.json()).error.message,
    "Forbidden: invalid Origin header",
  );

  const accepted = await fetch(`${mcpBase}/mcp`, {
    method: "POST",
    headers: { ...requestHeaders, Origin: "https://chatgpt.com" },
    body: payload,
  });
  assert.equal(accepted.status, 200);
  assert.equal(
    accepted.headers.get("access-control-allow-origin"),
    "https://chatgpt.com",
  );
});

test("rejects malformed JSON-RPC requests with a protocol error", async () => {
  const response = await fetch(`${mcpBase}/mcp`, {
    method: "POST",
    headers: {
      Accept: "application/json, text/event-stream",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: 42 }),
  });
  const payload = await response.json();

  assert.equal(response.status, 400);
  assert.equal(payload.jsonrpc, "2.0");
  assert.equal(payload.error.code, -32700);
  assert.equal(payload.id, null);
});

test("does not allocate sessions for stream-capable clients", async () => {
  const responses = await Promise.all(
    Array.from({ length: 25 }, (_, index) =>
      fetch(`${mcpBase}/mcp`, {
        method: "POST",
        headers: {
          Accept: "application/json, text/event-stream",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: index + 1,
          method: "initialize",
          params: {
            protocolVersion: "2025-11-25",
            capabilities: {},
            clientInfo: { name: "stateless-test", version: "1.0.0" },
          },
        }),
      }),
    ),
  );

  for (const response of responses) {
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("mcp-session-id"), null);
    assert.match(response.headers.get("content-type") ?? "", /^application\/json/);
    const payload = await response.json();
    assert.equal(payload.result.serverInfo.name, "context");
  }
});

test("compresses MCP responses for clients that accept gzip", async () => {
  const listTools = (acceptEncoding: string) =>
    fetch(`${mcpBase}/mcp`, {
      method: "POST",
      headers: {
        Accept: "application/json, text/event-stream",
        "Accept-Encoding": acceptEncoding,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }),
    });

  const compressed = await listTools("gzip, deflate, br");
  assert.equal(compressed.headers.get("content-encoding"), "gzip");
  assert.equal((await compressed.json()).result.tools.length, 45);

  const uncompressed = await listTools("identity");
  assert.equal(uncompressed.headers.get("content-encoding"), null);
  assert.equal((await uncompressed.json()).result.tools.length, 45);

  const notification = await fetch(`${mcpBase}/mcp`, {
    method: "POST",
    headers: {
      Accept: "application/json, text/event-stream",
      "Accept-Encoding": "gzip",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }),
  });
  assert.equal(notification.status, 202);
  assert.equal(notification.headers.get("content-encoding"), null);
});

test("serves MCP at the bare server URL and declines idle event streams", async () => {
  const initialize = await fetch(`${mcpBase}/`, {
    method: "POST",
    headers: {
      Accept: "application/json, text/event-stream",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2025-11-25",
        capabilities: {},
        clientInfo: { name: "root-url-test", version: "1.0.0" },
      },
    }),
  });
  assert.equal(initialize.status, 200);
  assert.equal((await initialize.json()).result.serverInfo.name, "context");

  for (const path of ["/mcp", "/sse"]) {
    const stream = await fetch(`${mcpBase}${path}`, {
      headers: { Accept: "text/event-stream" },
    });
    assert.equal(stream.status, 405, path);
    assert.equal(stream.headers.get("allow"), "POST, DELETE");
  }
});

test("routes topic news and account-wide change listings", async () => {
  captured.length = 0;
  const client = await connectClient();
  const topicNews = await client.callTool({
    name: "get-news-search",
    arguments: { query: "DeFi OR Solana" },
  });
  const changes = await client.callTool({
    name: "list-monitor-changes",
    arguments: { tag: "launch", since: "2026-10-09T16:00:00Z" },
  });
  await client.close();

  assert.notEqual(topicNews.isError, true);
  assert.notEqual(changes.isError, true);
  assert.equal(captured.length, 2);
  assert.equal(captured[0]!.url, "/news/search");
  assert.deepEqual(JSON.parse(captured[0]!.body.toString()), {
    searchBy: { type: "natural_language", query: "DeFi OR Solana" },
  });
  const url = new URL(captured[1]!.url, "http://upstream");
  assert.equal(url.pathname, "/monitors/changes");
  assert.equal(url.searchParams.get("tag"), "launch");

  captured.length = 0;
  const routingClient = await connectClient();
  const scrapeSentToSearch = await routingClient.callTool({
    name: "web-search",
    arguments: { url: "https://example.test/page", formats: { markdown: true } },
  });
  const searchSentToScrape = await routingClient.callTool({
    name: "web-scrape",
    arguments: { query: "compact response", numResults: 20 },
  });
  await routingClient.close();
  assert.notEqual(scrapeSentToSearch.isError, true);
  assert.notEqual(searchSentToScrape.isError, true);
  assert.deepEqual(
    captured.map((request) => [request.url, JSON.parse(request.body.toString())]),
    [
      ["/web/scrape", { url: "https://example.test/page", formats: { markdown: true } }],
      ["/web/search", { query: "compact response", numResults: 20 }],
    ],
  );
});

test("sends calls that already validate unchanged and survives hostile bodies", async () => {
  captured.length = 0;
  const client = await connectClient();
  const valid = await client.callTool({
    name: "brand-retrieve-unified",
    arguments: { body: { type: "by_domain", domain: "stripe.com" }, name: "Stripe", Tags: 5 },
  });
  await client.close();
  assert.notEqual(valid.isError, true);
  assert.deepEqual(JSON.parse(captured.at(-1)!.body.toString()), {
    type: "by_domain",
    domain: "stripe.com",
  });

  const nested = `{"jsonrpc":"2.0","id":1,"method":"tools/list","junk":${"[".repeat(100000)}${"]".repeat(100000)}}`;
  const response = await fetch(`${mcpBase}/mcp`, {
    method: "POST",
    headers: {
      Accept: "application/json, text/event-stream",
      "Content-Type": "application/json",
    },
    body: nested,
  });
  assert.notEqual(response.status, 500);
});

test("keeps misnamed optional keys and wrapped arguments that would validate as empty", async () => {
  captured.length = 0;
  const client = await connectClient();
  const calls = [
    { name: "web-search", arguments: { query: "x", num_results: 20 } },
    {
      name: "create-monitor",
      arguments: {
        name: "Pricing monitor",
        Mode: "web",
        target: { type: "page", url: "https://example.test/pricing" },
      },
    },
    { name: "list-logs", arguments: { arguments: { status_code: 500, limit: 10 } } },
  ];
  for (const call of calls) {
    const result = await client.callTool(call);
    assert.notEqual(result.isError, true, call.name);
  }
  await client.close();

  const [search, monitor, logs] = captured;
  assert.equal(JSON.parse(search!.body.toString()).numResults, 20);
  assert.equal(JSON.parse(monitor!.body.toString()).mode, "web");
  const logsUrl = new URL(logs!.url, upstreamBase);
  assert.equal(logsUrl.pathname, "/org/logs");
  assert.equal(logsUrl.searchParams.get("status_code"), "500");
  assert.equal(logsUrl.searchParams.get("limit"), "10");
});

test("keeps the API-generated webhook secret out of monitor requests", async () => {
  captured.length = 0;
  const client = await connectClient();
  const { tools } = await client.listTools();
  for (const name of ["create-monitor", "update-monitor"]) {
    const properties = tools.find((tool) => tool.name === name)?.inputSchema
      .properties as Record<string, { anyOf?: Array<{ properties?: Record<string, unknown> }> }>;
    const webhook = properties.webhook?.anyOf?.find((variant) => variant.properties);
    assert.ok(webhook?.properties?.url, name);
    assert.equal(webhook?.properties?.secret, undefined, name);
  }
  const result = await client.callTool({
    name: "create-monitor",
    arguments: {
      name: "Pricing monitor",
      target: { type: "page", url: "https://example.test/pricing" },
      webhook: { url: "https://example.test/hook", secret: "whsec_guess" },
    },
  });
  await client.close();

  assert.notEqual(result.isError, true);
  assert.deepEqual(JSON.parse(captured.at(-1)!.body.toString()).webhook, {
    url: "https://example.test/hook",
  });
});

test("adds the hint once on the SSE path", async () => {
  const response = await fetch(`${mcpBase}/sse`, {
    method: "POST",
    headers: {
      Accept: "application/json, text/event-stream",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: { name: "web-map", arguments: {} },
    }),
  });
  const text = await response.text();
  assert.equal(text.split("web-map needs `domain`").length - 1, 1);
});

test("keeps tools removed from the list callable for cached clients", async () => {
  captured.length = 0;
  const client = await connectClient();
  const { tools } = await client.listTools();
  assert.equal(tools.some((tool) => tool.name === "web-scrape-markdown"), false);
  assert.equal(tools.some((tool) => "$schema" in tool.inputSchema), false);
  const result = await client.callTool({
    name: "web-scrape-markdown",
    arguments: { url: "https://example.test/legacy" },
  });
  await client.close();
  assert.notEqual(result.isError, true);
  assert.equal(captured.length, 1);
  assert.equal(
    new URL(captured[0]!.url, "http://upstream").pathname,
    "/web/scrape/markdown",
  );
});

test("serves the same tool list to every client", async () => {
  const lists = [];
  for (let index = 0; index < 3; index += 1) {
    const client = await connectClient();
    lists.push((await client.listTools()).tools);
    await client.close();
  }

  assert.equal(lists[0]!.some((tool) => tool.name === "web-scrape-markdown"), false);
  assert.equal(lists[0]!.some((tool) => "$schema" in tool.inputSchema), false);
  assert.deepEqual(lists[1], lists[0]);
  assert.deepEqual(lists[2], lists[0]);
});

test("reuses the API connection across calls an agent spaces out", async () => {
  captured.length = 0;
  const client = await connectClient();
  const scrape = () =>
    client.callTool({
      name: "web-scrape",
      arguments: { url: "https://example.test", formats: { markdown: true } },
    });
  await scrape();
  await new Promise((resolve) => setTimeout(resolve, 4_500));
  await scrape();
  await client.close();

  assert.equal(captured.length, 2);
  assert.equal(captured[1]!.socketPort, captured[0]!.socketPort);
});

test("accepts a legacy query API key without OAuth", async () => {
  captured.length = 0;
  const client = new Client({
    name: "query-api-key-test",
    version: "1.0.0",
  });
  await client.connect(
    new StreamableHTTPClientTransport(
      new URL(`${mcpBase}/mcp?api_key=ctxt_query_without_oauth`),
    ),
  );
  await client.callTool({
    name: "web-scrape",
    arguments: {
      url: "https://example.test",
      formats: { markdown: true },
    },
  });
  await client.close();

  assert.equal(
    captured.at(-1)?.authorization,
    "Bearer ctxt_query_without_oauth",
  );

  const rootClient = new Client({ name: "root-query-key-test", version: "1.0.0" });
  await rootClient.connect(
    new StreamableHTTPClientTransport(
      new URL(`${mcpBase}/?api_key=ctxt_root_query_key`),
    ),
  );
  await rootClient.callTool({
    name: "web-scrape",
    arguments: { url: "https://example.test", formats: { markdown: true } },
  });
  await rootClient.close();
  assert.equal(captured.at(-1)?.authorization, "Bearer ctxt_root_query_key");
});

test("tags API requests with the connected MCP client", async () => {
  captured.length = 0;
  const client = new Client({ name: "context-test", version: "1.0.0" });
  await client.connect(
    new StreamableHTTPClientTransport(new URL(`${mcpBase}/mcp`), {
      requestInit: { headers: { "User-Agent": "openai-mcp/1.0.0" } },
    }),
  );
  await client.callTool({
    name: "web-scrape",
    arguments: { url: "https://example.test", formats: { markdown: true } },
  });
  await client.close();

  assert.equal(captured.at(-1)?.contextAgent, "openai-mcp/1.0.0");
});

test("lists the public Context API with safety annotations", async () => {
  const client = await connectClient();
  const { tools } = await client.listTools();
  await client.close();

  assert.equal(tools.length, 45);
  const missingPropertyDescriptions: string[] = [];
  const assertPropertiesDescribed = (
    schema: unknown,
    path: string,
  ): void => {
    if (!schema || typeof schema !== "object") return;
    const record = schema as Record<string, unknown>;
    const properties = (record.properties ?? {}) as Record<
      string,
      Record<string, unknown>
    >;
    for (const [name, property] of Object.entries(properties)) {
      const propertyPath = `${path}.${name}`;
      if (
        typeof property.description !== "string" ||
        property.description.trim().length === 0
      ) {
        missingPropertyDescriptions.push(propertyPath);
      }
      assertPropertiesDescribed(property, propertyPath);
    }
    for (const [name, value] of Object.entries(record)) {
      if (name === "properties") continue;
      if (Array.isArray(value)) {
        value.forEach((entry, index) =>
          assertPropertiesDescribed(entry, `${path}.${name}[${index}]`),
        );
      } else if (value && typeof value === "object") {
        assertPropertiesDescribed(value, `${path}.${name}`);
      }
    }
  };
  for (const tool of tools) {
    assert.ok(tool.title?.trim(), `${tool.name} is missing a title`);
    assert.ok(
      tool.description?.trim(),
      `${tool.name} is missing a description`,
    );
    assertPropertiesDescribed(tool.inputSchema, tool.name);
    for (const key of [
      "readOnlyHint",
      "destructiveHint",
      "idempotentHint",
      "openWorldHint",
    ] as const) {
      assert.equal(
        typeof tool.annotations?.[key],
        "boolean",
        `${tool.name}.${key}`,
      );
    }
  }
  assert.deepEqual(missingPropertyDescriptions, []);

  // Compact mode returns these results as text without structuredContent.
  const textResultTools = new Set(["web-search", "web-scrape", "web-crawl"]);
  const accountError = {
    message: "Insufficient credits.",
    error_code: "USAGE_EXCEEDED",
    error_data: { is_authenticated: true, should_retry: false },
    key_metadata: { credits_remaining: 0 },
    request_id: "req_credit_limit",
  };
  const shortenedResult = { _context_mcp: { truncated: true } };
  for (const tool of tools) {
    if (textResultTools.has(tool.name)) {
      assert.equal(tool.outputSchema, undefined, tool.name);
      continue;
    }
    assert.ok(tool.outputSchema, `${tool.name} is missing an output schema`);
    assert.equal("$schema" in tool.outputSchema, false, tool.name);
    const outputProperties = (tool.outputSchema.properties ?? {}) as Record<
      string,
      { description?: unknown }
    >;
    for (const [name, property] of Object.entries(outputProperties)) {
      assert.equal(typeof property.description, "string", `${tool.name} output ${name}`);
    }
    const validateOutput = new AjvJsonSchemaValidator().getValidator(tool.outputSchema);
    // get-brand builds its own result, which the response limit never shortens.
    const results = tool.name === "get-brand"
      ? [{}, accountError]
      : [{}, accountError, shortenedResult];
    for (const result of results) {
      assert.equal(validateOutput(result).valid, true, `${tool.name}: ${JSON.stringify(result)}`);
    }
  }
  const names = new Set(tools.map((tool) => tool.name));
  assert.deepEqual(tools.map((tool) => tool.name), [
    "web-scrape",
    "web-map",
    "web-crawl",
    "web-search",
    "web-answers",
    "brand-retrieve-unified",
    "get-brand",
    "brand-search",
    "web-styleguide",
    "company-search",
    "people-search",
    "people-enrich",
    "get-news-search",
    "parse-document",
    "submit-batch",
    "list-batches",
    "get-batch",
    "get-batch-results",
    "cancel-batch",
    "delete-batch",
    "create-monitor",
    "list-monitors",
    "get-monitor",
    "update-monitor",
    "delete-monitor",
    "get-monitor-limits",
    "list-monitor-credit-usage",
    "run-monitor-now",
    "list-monitor-runs",
    "get-monitor-run",
    "list-account-runs",
    "list-monitor-changes",
    "get-change",
    "list-changes",
    "rotate-monitor-webhook-secret",
    "list-webhook-deliveries",
    "get-webhook-delivery",
    "list-webhook-delivery-attempts",
    "retry-webhook-delivery",
    "list-logs",
    "get-log",
    "list-browser-profiles",
    "get-usage",
    "get-usage-history",
    "submit-feedback",
  ]);
  for (const privateName of [
    "utility-prefetch",
    "brand-prefetch",
    "brand-prefetch-by-email",
    "people-retrieve",
    "web-competitors",
    "brand-ai-query",
    "brand-ai-product",
    "brand-ai-products",
    "web-scrape-sitemap",
    "web-extract",
    "web-fonts",
    "web-naics",
    "web-sic",
    "create-webdb-collection",
    "preview-webdb",
    "web-scrape-html",
    "web-scrape-markdown",
    "web-scrape-images",
    "web-screenshot",
    "post-jobs-search",
    "post-company-funding",
    "post-admin-web-search",
  ]) {
    assert.equal(names.has(privateName), false, `exposed ${privateName}`);
  }

  const createMonitor = tools.find((tool) => tool.name === "create-monitor");
  assert.equal(createMonitor?.annotations?.readOnlyHint, false);
  assert.equal(createMonitor?.annotations?.destructiveHint, false);
  const parseDocument = tools.find((tool) => tool.name === "parse-document");
  assert.equal(parseDocument?.annotations?.readOnlyHint, false);
  assert.equal(parseDocument?.annotations?.destructiveHint, false);
  assert.equal(parseDocument?.annotations?.openWorldHint, false);
  assert.match(
    String(
      (parseDocument?.inputSchema.properties?.fileBase64 as { description?: string })
        ?.description,
    ),
    /Maximum decoded size: 50 MiB/,
  );
  const webSearch = tools.find((tool) => tool.name === "web-search");
  assert.equal(webSearch?.annotations?.readOnlyHint, true);
  assert.equal(webSearch?.annotations?.destructiveHint, false);
  assert.equal(webSearch?.annotations?.openWorldHint, true);
  const webAnswers = tools.find((tool) => tool.name === "web-answers");
  assert.equal(webAnswers?.annotations?.readOnlyHint, true);
  assert.equal(webAnswers?.annotations?.destructiveHint, false);
  assert.equal(webAnswers?.annotations?.openWorldHint, true);
  const answersProperties = (webAnswers?.inputSchema.properties ?? {}) as Record<
    string,
    Record<string, unknown>
  >;
  assert.deepEqual(webAnswers?.inputSchema.required, ["task"]);
  assert.equal(answersProperties.task?.type, "string");
  assert.equal(answersProperties.json_format?.type, "object");
  assert.match(
    String(answersProperties.json_format?.description),
    /not JSON Schema.*"answer"/,
  );
  assert.equal(answersProperties.mode?.type, "string");
  const newsSearch = tools.find((tool) => tool.name === "get-news-search");
  assert.equal(newsSearch?.annotations?.readOnlyHint, true);
  assert.equal(newsSearch?.annotations?.destructiveHint, false);
  assert.equal(newsSearch?.annotations?.openWorldHint, true);
  const newsProperties = (newsSearch?.inputSchema.properties ?? {}) as Record<
    string,
    Record<string, unknown>
  >;
  assert.equal(newsProperties.searchBy, undefined);
  assert.equal(newsProperties.query?.type, "string");
  assert.equal(newsProperties.companyName?.type, "string");
  assert.equal(newsProperties.domain?.type, "string");
  assert.equal(newsProperties.ticker?.type, "string");
  assert.equal(newsProperties.isin?.type, "string");
  assert.equal(newsProperties.filterBy?.type, "object");
  assert.equal(newsProperties.sortBy?.type, "string");
  assert.deepEqual(newsProperties.sortBy?.enum, ["newest", "relevance"]);
  const toolsWithRootCombinators = tools
    .filter((tool) =>
      ["oneOf", "anyOf", "allOf"].some((keyword) => keyword in tool.inputSchema),
    )
    .map((tool) => tool.name);
  assert.deepEqual(toolsWithRootCombinators, []);
  assert.equal(newsProperties.limit?.type, "integer");
  assert.equal(newsProperties.cursor?.type, undefined);
  assert.equal(newsProperties.cursor?.anyOf instanceof Array, true);
  assert.equal(newsProperties.tags?.type, "array");

  const webScrape = tools.find((tool) => tool.name === "web-scrape");
  assert.equal(webScrape?.annotations?.readOnlyHint, false);
  assert.equal(webScrape?.annotations?.destructiveHint, true);
  assert.equal(webScrape?.annotations?.openWorldHint, true);
  assert.deepEqual(webScrape?.inputSchema.required, ["url", "formats"]);
  const webScrapeProperties = (webScrape?.inputSchema.properties ?? {}) as Record<
    string,
    Record<string, unknown>
  >;
  const webScrapeFormats = (webScrapeProperties.formats?.properties ?? {}) as Record<
    string,
    unknown
  >;
  assert.deepEqual(Object.keys(webScrapeFormats), [
    "html",
    "markdown",
    "screenshot",
    "images",
    "bytes",
    "parse",
    "highlights",
    "json",
    "product",
  ]);
  for (const property of ["parseParams", "timeoutOpts", "zdr", "tags"]) {
    assert.ok(webScrapeProperties[property], `missing scrape option ${property}`);
  }
  const sharedProperties = webScrapeProperties.sharedParams?.properties as Record<
    string,
    unknown
  >;
  assert.ok(sharedProperties.headers);
  assert.ok(sharedProperties.actions);
  assert.ok(sharedProperties.parsers);

  const brand = tools.find((tool) => tool.name === "get-brand");
  assert.equal(brand?.annotations?.readOnlyHint, true);
  assert.equal(brand?.annotations?.destructiveHint, false);
  assert.equal(brand?.annotations?.openWorldHint, true);

  const submitBatch = tools.find((tool) => tool.name === "submit-batch");
  assert.equal(submitBatch?.annotations?.readOnlyHint, false);
  assert.equal(submitBatch?.annotations?.destructiveHint, false);
  const deleteBatch = tools.find((tool) => tool.name === "delete-batch");
  assert.equal(deleteBatch?.annotations?.destructiveHint, true);
  for (const name of ["delete-monitor", "cancel-batch", "delete-batch"]) {
    const tool = tools.find((candidate) => candidate.name === name);
    assert.equal(tool?.annotations?.idempotentHint, true, name);
  }
});

test("repairs bare answer property maps before forwarding valid calls", async () => {
  captured.length = 0;
  const client = await connectClient();
  try {
    const result = await client.callTool({
      name: "web-answers",
      arguments: {
        task: "Answer with sources",
        json_format: {
          answer: { type: "string", description: "Sourced answer" },
          sources: { type: "array", items: { type: "string" } },
        },
      },
    });
    assert.notEqual(result.isError, true);
    assert.deepEqual(JSON.parse(captured.at(-1)!.body.toString()).json_format, {
      answer: "",
      sources: [""],
    });
  } finally {
    await client.close();
  }
});

test("offers a smaller core profile without disabling cached tool calls", async () => {
  const client = await connectClient("/mcp?profile=core");
  const { tools } = await client.listTools();
  assert.deepEqual(
    tools.map((tool) => tool.name),
    [
      "web-scrape",
      "web-map",
      "web-crawl",
      "web-search",
      "web-answers",
      "get-brand",
      "get-news-search",
      "parse-document",
      "get-usage",
      "submit-feedback",
    ],
  );
  const catalogBytes = Buffer.byteLength(JSON.stringify(tools));
  assert.ok(
    catalogBytes < 40_000,
    `core tool catalog exceeds the release budget: ${catalogBytes} bytes`,
  );
  const scrapeProperties = tools.find((tool) => tool.name === "web-scrape")
    ?.inputSchema.properties as Record<string, Record<string, unknown>>;
  assert.equal(typeof scrapeProperties.url?.description, "string");
  const sharedProperties = scrapeProperties.sharedParams?.properties as Record<
    string,
    Record<string, unknown>
  >;
  assert.equal(sharedProperties.headers?.description, undefined);

  const cachedCall = await client.callTool({
    name: "get-usage-history",
    arguments: {},
  });
  assert.equal(cachedCall.isError, undefined);
  await client.close();
});

test("serves the core profile to agent CLIs without tool search unless they ask for the full catalog", async () => {
  const listToolCount = async (path: string, userAgent: string) => {
    const client = await connectClient(path, userAgent);
    const { tools } = await client.listTools();
    await client.close();
    return tools.length;
  };
  const coreToolCount = CORE_TOOL_NAMES.size;

  assert.equal(await listToolCount("/mcp", "opencode/1.18.35"), coreToolCount);
  assert.equal(await listToolCount("/mcp", "kilo/7.8.8"), coreToolCount);
  assert.ok((await listToolCount("/mcp?profile=full", "opencode/1.18.35")) > coreToolCount);
  assert.ok((await listToolCount("/mcp", "node")) > coreToolCount);
});

test("forwards all scrape formats, browser actions, CSS rules, and request controls", async () => {
  captured.length = 0;
  const client = await connectClient();
  const arguments_ = {
    url: "https://example.test/product",
    formats: {
      html: true,
      markdown: true,
      screenshot: true,
      images: true,
      bytes: true,
      parse: true,
      highlights: true,
      json: true,
      product: true,
    },
    sharedParams: {
      viewport: { width: 1440, height: 900 },
      mainContentOnly: true,
      includeSelectors: ["main"],
      headers: { "Accept-Language": "en-US" },
      actions: [
        { type: "perform", action: "Click the product details tab" },
        { type: "scroll", direction: "down", amount: "viewport" },
        { type: "wait", milliseconds: 100 },
        { type: "waitFor", selector: "#details" },
      ],
      parsers: { pdf: { startPage: 1, endPage: 2, ocr: "auto" } },
    },
    markdownParams: { includeLinks: true, includeImages: true },
    screenshotParams: { area: "fullPage", format: "webp" },
    imageParams: { enrich: ["dimensions"], dedupe: "visual" },
    parseParams: {
      rules: {
        title: "h1",
        products: {
          selector: ".product",
          type: "list",
          output: {
            name: "h2",
            link: { selector: "a", output: "@href" },
          },
        },
      },
    },
    highlightsParams: {
      query: "pricing and availability",
      maxCharacters: 2000,
    },
    jsonParams: {
      schema: {
        type: "object",
        properties: {
          price: { type: "number" },
          inStock: { type: "boolean" },
        },
      },
    },
    productParams: { dedupeImages: false },
    timeoutOpts: { milliseconds: 45000, behavior: "return-partial" },
    zdr: "enabled",
    tags: ["integration-test"],
    maxAgeMs: 0,
  };

  const result = await client.callTool({
    name: "web-scrape",
    arguments: arguments_,
  });
  await client.close();

  assert.equal(captured.length, 1);
  assert.equal(captured[0]!.method, "POST");
  assert.equal(captured[0]!.url, "/web/scrape");
  assert.deepEqual(JSON.parse(captured[0]!.body.toString()), arguments_);
  assert.deepEqual(resultObject(result), { ok: true });
});

test("repairs selector clicks and placeholder-filled browser actions", async () => {
  captured.length = 0;
  const client = await connectClient();
  const result = await client.callTool({
    name: "web-scrape",
    arguments: {
      url: "https://example.test/actions",
      formats: { markdown: true },
      sharedParams: {
        actions: [
          { type: "perform", action: "click", selector: ".burger" },
          { type: "click", selector: "#more" },
          {
            type: "scroll",
            direction: "down",
            amount: "viewport",
            selector: null,
            maxScrolls: null,
            action: null,
            milliseconds: null,
          },
        ],
      },
    },
  });
  await client.close();

  assert.deepEqual(resultObject(result), { ok: true });
  assert.deepEqual(JSON.parse(captured[0]!.body.toString()).sharedParams.actions, [
    { type: "perform", action: "Click the element matching the CSS selector `.burger`" },
    { type: "perform", action: "Click the element matching the CSS selector `#more`" },
    { type: "scroll", direction: "down", amount: "viewport" },
  ]);
});

test("repairs object and array arguments sent as JSON strings", async () => {
  captured.length = 0;
  const client = await connectClient();
  const result = await client.callTool({
    name: "web-scrape",
    arguments: {
      url: "https://example.test",
      formats: '{"markdown":true}',
      sharedParams: '{"includeSelectors":["main"]}',
      tags: '["opencode"]',
    },
  });
  const formatName = await client.callTool({
    name: "web-scrape",
    arguments: { url: "https://example.test/format-name", formats: ["markdown"] },
  });
  const rejected = await client.callTool({
    name: "web-scrape",
    arguments: { formats: { markdown: true } },
  });
  await client.close();

  assert.deepEqual(resultObject(result), { ok: true });
  assert.deepEqual(resultObject(formatName), { ok: true });
  assert.equal(rejected.isError, true);
  assert.equal(captured.length, 2);
  assert.deepEqual(JSON.parse(captured[0]!.body.toString()), {
    url: "https://example.test",
    formats: { markdown: true },
    sharedParams: { includeSelectors: ["main"] },
    tags: ["opencode"],
  });
  assert.deepEqual(JSON.parse(captured[1]!.body.toString()), {
    url: "https://example.test/format-name",
    formats: { markdown: true },
  });
});

test("maps URLs through the documented endpoint with query controls", async () => {
  captured.length = 0;
  const client = await connectClient();
  const result = await client.callTool({
    name: "web-map",
    arguments: {
      domain: "example.test",
      includeSubdomains: true,
      maxLinks: 50,
      urlRegex: "/docs/",
      search: "API documentation",
      headers: { "Accept-Language": "en-US" },
      timeoutOpts: { milliseconds: 30000, behavior: "return-partial" },
      zdr: "enabled",
      tags: ["map-test", "docs"],
    },
  });
  await client.close();

  assert.deepEqual(resultObject(result), { ok: true });
  assert.equal(captured.length, 1);
  assert.equal(captured[0]!.method, "GET");
  const url = new URL(captured[0]!.url, upstreamBase);
  assert.equal(url.pathname, "/web/urls");
  assert.equal(url.searchParams.get("domain"), "example.test");
  assert.equal(url.searchParams.get("includeSubdomains"), "true");
  assert.equal(url.searchParams.get("maxLinks"), "50");
  assert.equal(url.searchParams.get("urlRegex"), "/docs/");
  assert.equal(url.searchParams.get("search"), "API documentation");
  assert.equal(url.searchParams.get("headers[Accept-Language]"), "en-US");
  assert.equal(url.searchParams.get("timeoutOpts[milliseconds]"), "30000");
  assert.equal(url.searchParams.get("timeoutOpts[behavior]"), "return-partial");
  assert.equal(url.searchParams.get("zdr"), "enabled");
  assert.deepEqual(url.searchParams.getAll("tags"), ["map-test", "docs"]);
});

test("executes brand search and person enrichment", async () => {
  captured.length = 0;
  const client = await connectClient();
  const person = {
    email: "ada@example.test",
    name: { first: "Ada", last: "Lovelace" },
    company: { name: "Example", domain: "example.test" },
    social_urls: ["https://www.linkedin.com/in/ada-example/"],
    education: [{ institution: { name: "Example College" }, graduation_year: 2010 }],
    location: { city: "London", country: "GB" },
    timeoutOpts: { milliseconds: 30000, behavior: "return-partial" },
    zdr: "enabled",
    tags: ["enrichment-test"],
  };
  const cases = [
    {
      name: "brand-search",
      arguments: { query: "exam", queryBy: ["name", "domain"], autocomplete: true, typoTolerance: 1 },
    },
    { name: "people-enrich", arguments: person },
  ];
  for (const call of cases) {
    assert.deepEqual(resultObject(await client.callTool(call)), { ok: true });
  }
  await client.close();

  assert.equal(captured.length, 2);
  assert.equal(captured[0]!.method, "GET");
  const searchUrl = new URL(captured[0]!.url, upstreamBase);
  assert.equal(searchUrl.pathname, "/brand/search");
  assert.equal(searchUrl.searchParams.get("query"), "exam");
  assert.deepEqual(searchUrl.searchParams.getAll("queryBy"), ["name", "domain"]);
  assert.equal(searchUrl.searchParams.get("autocomplete"), "true");
  assert.equal(searchUrl.searchParams.get("typoTolerance"), "1");
  assert.equal(captured[1]!.method, "POST");
  assert.equal(captured[1]!.url, "/people/enrich");
  assert.deepEqual(JSON.parse(captured[1]!.body.toString()), person);
});

test("executes monitor limits, secret rotation, and webhook delivery operations", async () => {
  captured.length = 0;
  const client = await connectClient();
  const deliveryId = `whd_${"a".repeat(32)}`;
  const attemptCursor = `wha_${"b".repeat(32)}`;
  const filters = { type: "monitor", monitor_id: "mon_demo", run_id: "run_demo", status: "failed", limit: 10 };
  const cases = [
    { name: "get-monitor-limits", arguments: {} },
    { name: "rotate-monitor-webhook-secret", arguments: { monitor_id: "mon_demo" } },
    { name: "list-webhook-deliveries", arguments: { body: filters } },
    { name: "list-webhook-deliveries", arguments: { body: { type: "batch", batch_id: "batch_demo" } } },
    { name: "get-webhook-delivery", arguments: { delivery_id: deliveryId } },
    { name: "list-webhook-delivery-attempts", arguments: { delivery_id: deliveryId, limit: 10, cursor: attemptCursor } },
    { name: "retry-webhook-delivery", arguments: { delivery_id: deliveryId, "Idempotency-Key": "retry-test", force: true, tags: ["retry-test"] } },
  ];
  for (const call of cases) {
    assert.deepEqual(resultObject(await client.callTool(call)), { ok: true });
  }
  await client.close();

  assert.equal(captured.length, 7);
  assert.deepEqual(captured.map((request) => [request.method, new URL(request.url, upstreamBase).pathname]), [
    ["GET", "/monitors/limits"],
    ["POST", "/monitors/mon_demo/webhook/rotate-secret"],
    ["POST", "/webhooks/deliveries"],
    ["POST", "/webhooks/deliveries"],
    ["GET", `/webhooks/deliveries/${deliveryId}`],
    ["GET", `/webhooks/deliveries/${deliveryId}/attempts`],
    ["POST", `/webhooks/deliveries/${deliveryId}/retry`],
  ]);
  assert.deepEqual(JSON.parse(captured[2]!.body.toString()), filters);
  assert.deepEqual(JSON.parse(captured[3]!.body.toString()), { type: "batch", batch_id: "batch_demo" });
  const attemptsUrl = new URL(captured[5]!.url, upstreamBase);
  assert.equal(attemptsUrl.searchParams.get("limit"), "10");
  assert.equal(attemptsUrl.searchParams.get("cursor"), attemptCursor);
  assert.equal(captured[6]!.idempotencyKey, "retry-test");
  assert.deepEqual(JSON.parse(captured[6]!.body.toString()), { force: true, tags: ["retry-test"] });
});

test("rejects invalid new tool inputs before contacting the API", async () => {
  captured.length = 0;
  const client = await connectClient();
  for (const call of [
    { name: "web-map", arguments: { maxLinks: 100 } },
    { name: "list-webhook-deliveries", arguments: { body: { type: "batch", monitor_id: "mon_demo" } } },
    { name: "retry-webhook-delivery", arguments: { delivery_id: "invalid" } },
    { name: "web-scrape", arguments: { url: "https://example.test", formats: { markdown: true }, sharedParams: { actions: [{ type: "wait", milliseconds: "soon" }] } } },
  ]) {
    const result = await client.callTool(call);
    assert.equal(result.isError, true, call.name);
  }
  await client.close();
  assert.equal(captured.length, 0);
});

test("clamps out-of-range integer arguments to the published bounds", async () => {
  captured.length = 0;
  const client = await connectClient();
  const result = await client.callTool({
    name: "web-map",
    arguments: { domain: "example.test", maxLinks: 100001 },
  });
  await client.close();
  assert.notEqual(result.isError, true);
  assert.equal(captured.length, 1);
  const { tools } = await (async () => {
    const lister = await connectClient();
    try {
      return await lister.listTools();
    } finally {
      await lister.close();
    }
  })();
  const maxLinks = tools.find((tool) => tool.name === "web-map")?.inputSchema
    .properties?.maxLinks as { maximum?: number } | undefined;
  assert.equal(
    new URL(captured[0]!.url, "http://upstream").searchParams.get("maxLinks"),
    String(maxLinks?.maximum),
  );
});

test("publishes spec string patterns unescaped and still enforces them", async () => {
  captured.length = 0;
  const client = await connectClient();
  const { tools } = await client.listTools();
  const property = (tool: string, name: string) =>
    (tools.find((entry) => entry.name === tool)?.inputSchema.properties?.[
      name
    ] ?? {}) as Record<string, unknown>;

  assert.equal(property("web-scrape", "url").pattern, "^https?://.*$");
  assert.equal(property("list-logs", "path").pattern, "^/.*$");

  for (const call of [
    { name: "web-scrape", arguments: { url: "ftp://example.test", formats: { html: true } } },
    { name: "list-logs", arguments: { path: "web/scrape" } },
  ]) {
    const result = await client.callTool(call);
    assert.equal(result.isError, true, call.name);
  }
  await client.close();
  assert.equal(captured.length, 0);
});

test("lists and retrieves account logs through the MCP tools", async () => {
  captured.length = 0;
  const client = await connectClient();

  const listed = resultObject(
    await client.callTool({
      name: "list-logs",
      arguments: {
        errors_only: true,
        path: "/web/scrape/markdown",
        limit: 10,
      },
    }),
  );
  const logRequestId = (
    listed.data as Array<Record<string, unknown>>
  )[0]?.request_id;
  const detail = resultObject(
    await client.callTool({
      name: "get-log",
      arguments: { request_id: logRequestId },
    }),
  );
  await client.close();

  const listUrl = new URL(captured[0]!.url, upstreamBase);
  assert.equal(listUrl.pathname, "/org/logs");
  assert.equal(listUrl.searchParams.get("errors_only"), "true");
  assert.equal(listUrl.searchParams.get("path"), "/web/scrape/markdown");
  assert.equal(listUrl.searchParams.get("limit"), "10");
  assert.equal(captured[1]!.url, `/org/logs/${logRequestId}`);
  assert.equal(
    (detail.data as Record<string, unknown>).request_id,
    logRequestId,
  );
  assert.equal(listed.request_id, "8d13e8f0-1111-4222-8333-444455556666");
  assert.equal(detail.request_id, "9d13e8f0-1111-4222-8333-444455556666");
});

test("submits agent feedback about an affected request", async () => {
  captured.length = 0;
  const client = await connectClient();
  const feedback = {
    request_id: "3f1c2a6e-8b4d-4c1e-9f0a-2d7b5e6c8a91",
    category: "bug",
    note: "Markdown drops the plan comparison table; expected all 4 rows.",
    url: "https://stripe.com/pricing",
  };

  const result = await client.callTool({
    name: "submit-feedback",
    arguments: feedback,
  });
  const invalid = await client.callTool({
    name: "submit-feedback",
    arguments: { ...feedback, category: "feature_request" },
  });
  await client.close();

  assert.notEqual(result.isError, true);
  assert.equal(invalid.isError, true);
  assert.equal(captured.length, 1);
  assert.equal(captured[0]!.method, "POST");
  assert.equal(new URL(captured[0]!.url, upstreamBase).pathname, "/feedback");
  assert.deepEqual(JSON.parse(captured[0]!.body.toString()), feedback);
});

test("delivers actionable feedback guidance at initialization and discovery", async () => {
  const client = await connectClient();
  try {
    const instructions = client.getInstructions() ?? "";
    assert.ok(instructions.length < 2048);
    assert.match(instructions, /Prefer compact search and scrape results/);
    assert.match(instructions, /Report each distinct unexpected error/);
    assert.match(instructions, /wrong or incomplete successful data/);
    assert.match(instructions, /even after a workaround/);
    assert.match(instructions, /otherwise use a relevant public page or docs url/);
    assert.match(instructions, /Never invent or use an unrelated ID/);
    assert.match(instructions, /API keys, tokens, cookies, private content, personal data/);
    assert.match(instructions, /do not retry or report itself/);
    assert.match(
      instructions,
      /Expected validation, authentication, or credit-limit errors/,
    );
    assert.match(instructions, /On `USAGE_EXCEEDED`.*do not retry/);
    assert.match(instructions, /call `get-usage` once/);
    const { tools } = await client.listTools();
    const feedback = tools.find((tool) => tool.name === "submit-feedback");
    assert.match(feedback?.description ?? "", /Always use this when a tool or API behaves unexpectedly/);
    assert.match(feedback?.description ?? "", /wrong or incomplete successful results/);
    assert.match(feedback?.description ?? "", /Never use it for account limits working as intended: 402 USAGE_EXCEEDED \(or legacy 401\), 429 RATE_LIMITED, or 403 PAID_PLAN_REQUIRED/);
  } finally {
    await client.close();
  }
});

test("legacy and new billing errors reach both model surfaces without OAuth challenges", async () => {
  const responses: Response[] = [];
  const client = new Client({ name: "billing-test", version: "1.0.0" });
  await client.connect(new StreamableHTTPClientTransport(new URL(`${mcpBase}/mcp`), {
    fetch: async (url, init) => {
      const response = await fetch(url, init);
      responses.push(response);
      return response;
    },
  }));
  try {
    const { tools } = await client.listTools();
    const brandTool = tools.find((tool) => tool.name === "get-brand")!;
    const validateOutput = new AjvJsonSchemaValidator().getValidator(brandTool.outputSchema!);
    for (const domain of ["usage-exceeded.test", "new-usage-exceeded.test"]) {
      for (const name of ["get-brand", "brand-retrieve-unified"]) {
        const failed = await client.callTool({ name, arguments: { domain, ...(name === "brand-retrieve-unified" ? { type: "by_domain" } : {}) } });
        assert.equal(failed.isError, true);
        const details = failed.structuredContent as Record<string, unknown>;
        assert.equal(details.error_code, "USAGE_EXCEEDED");
        assert.equal(details.request_id, "req_credit_limit");
        const data = details.error_data as Record<string, unknown>;
        assert.equal(data.is_authenticated, true);
        assert.equal(data.credits_remaining, 0);
        assert.equal(data.credits_charged, 0);
        assert.equal(data.should_retry, false);
        assert.equal(data.info_url, "https://context.dev/dashboard/subscription");
        if (domain === "new-usage-exceeded.test") {
          assert.equal(data.credits_required, 10);
          assert.equal(data.next_refill_credits, 1000);
        } else {
          assert.equal(data.credits_required, undefined);
          assert.equal(data.next_refill_at, undefined);
        }
        const content = failed.content as Array<{ type: string; text?: string }>;
        const message = content.find((block) => block.type === "text")?.text ?? "";
        assert.deepEqual(JSON.parse(message.split("\n\n")[1]!), details);
        assert.match(message, /Authentication is valid/);
        assert.match(message, /https:\/\/context.dev\/dashboard\/subscription/);
        assert.doesNotMatch(message, /subscribe|upgrad|checkout/);
        assert.equal(failed._meta?.["mcp/www_authenticate"], undefined);
        assert.equal(validateOutput(details).valid, true);
      }
    }
    assert.equal(responses.some((response) => response.status === 401 || response.status === 402), false);
    assert.equal(responses.some((response) => response.headers.has("www-authenticate")), false);
  } finally {
    await client.close();
  }
});

test("concurrency errors reach both model surfaces and validate against the output schema", async () => {
  const client = await connectClient();
  try {
    const { tools } = await client.listTools();
    const brandTool = tools.find((tool) => tool.name === "get-brand")!;
    const validateOutput = new AjvJsonSchemaValidator().getValidator(brandTool.outputSchema!);
    for (const name of ["get-brand", "brand-retrieve-unified"]) {
      const result = await client.callTool({
        name,
        arguments: { domain: "concurrency-exceeded.test", ...(name === "brand-retrieve-unified" ? { type: "by_domain" } : {}) },
      });
      assert.equal(result.isError, true);
      const details = result.structuredContent as Record<string, unknown>;
      const data = details.error_data as Record<string, unknown>;
      assert.equal(details.error_code, "RATE_LIMITED");
      assert.equal(details.request_id, "req_concurrency_limit");
      assert.equal(data.limit_type, "concurrency");
      assert.equal(data.limit, 2);
      assert.equal(data.retry_after_seconds, 31);
      assert.equal(data.retry_condition, "available_concurrency");
      assert.equal(data.info_url, "https://context.dev/dashboard/subscription");
      const content = result.content as Array<{ type: string; text?: string }>;
      assert.deepEqual(JSON.parse(content[0]!.text!.split("\n\n")[1]!), details);
      assert.equal(validateOutput(details).valid, true);
      assert.equal(result._meta?.["mcp/www_authenticate"], undefined);
    }
  } finally {
    await client.close();
  }
});

test("API and brand errors guide a report using the affected request ID", async () => {
  const client = await connectClient();
  try {
    for (const scenario of [
      {
        name: "web-scrape",
        arguments: { url: "https://example.test/feedback-error", formats: { markdown: true } },
        requestId: "4f2c1a1e-1111-4222-8333-444455556666",
      },
      {
        name: "get-brand",
        arguments: { domain: "feedback-error.test" },
        requestId: "5f2c1a1e-1111-4222-8333-444455556666",
      },
    ]) {
      captured.length = 0;
      const failed = await client.callTool({ name: scenario.name, arguments: scenario.arguments });
      assert.equal(failed.isError, true);
      const content = failed.content as Array<{ type: string; text?: string }>;
      const message = content.find((block) => block.type === "text")?.text ?? "";
      assert.match(message, /always call submit-feedback once/);
      const requestId = /request_id: ([\w-]+)/.exec(message)?.[1];
      assert.equal(requestId, scenario.requestId);
      const reported = await client.callTool({
        name: "submit-feedback",
        arguments: {
          request_id: requestId,
          category: "bug",
          note: `${scenario.name}: expected a result for valid input; received an unexpected HTTP 500.`,
        },
      });
      assert.equal(resultObject(reported).feedback_id, "feedback_local_test");
      assert.equal(captured.length, 2);
      assert.equal(captured[1]!.url, "/feedback");
      assert.equal(JSON.parse(captured[1]!.body.toString()).request_id, scenario.requestId);
    }
  } finally {
    await client.close();
  }
});

test("translates the flat company-news contract to the public API request", async () => {
  captured.length = 0;
  const client = await connectClient();
  const result = await client.callTool({
    name: "get-news-search",
    arguments: {
      ticker: "AAPL",
      exchange: "NASDAQ",
      filterBy: {
        articleType: ["editorial", "press_release"],
        date: {
          from: 1_725_148_800_000,
          to: 1_725_235_200_000,
        },
      },
      sortBy: "newest",
      limit: 10,
      tags: ["mcp", "news"],
    },
  });
  await client.close();

  assert.equal(captured.length, 1);
  assert.equal(captured[0]!.method, "POST");
  const url = new URL(captured[0]!.url, upstreamBase);
  assert.equal(url.pathname, "/news/search");
  assert.equal(url.search, "");
  assert.deepEqual(JSON.parse(captured[0]!.body.toString()), {
    searchBy: {
      type: "entity",
      entity: {
        type: "ticker",
        ticker: "AAPL",
        exchange: "NASDAQ",
      },
    },
    filterBy: {
      articleType: ["editorial", "press_release"],
      date: {
        from: 1_725_148_800_000,
        to: 1_725_235_200_000,
      },
    },
    sortBy: { type: "newest" },
    limit: 10,
    tags: ["mcp", "news"],
  });
  assert.deepEqual(resultObject(result), {
    data: [
      {
        id: "story_demo",
        title: "Example company announcement",
        url: "https://news.example.test/story",
      },
    ],
    has_more: false,
    next_cursor: null,
  });
});

test("translates a natural-language news query and rejects mixing it with a company or newest sort", async () => {
  captured.length = 0;
  const client = await connectClient();
  const result = await client.callTool({
    name: "get-news-search",
    arguments: { query: "chip export restrictions to China", filterBy: { articleLanguage: ["en"] }, limit: 5 },
  });
  const withCompany = await client.callTool({
    name: "get-news-search",
    arguments: { query: "earnings", companyName: "Apple" },
  });
  const withNewest = await client.callTool({
    name: "get-news-search",
    arguments: { query: "earnings", sortBy: "newest" },
  });
  await client.close();

  assert.notEqual(result.isError, true);
  assert.equal(captured.length, 1);
  assert.equal(new URL(captured[0]!.url, upstreamBase).pathname, "/news/search");
  assert.deepEqual(JSON.parse(captured[0]!.body.toString()), {
    searchBy: { type: "natural_language", query: "chip export restrictions to China" },
    filterBy: { articleLanguage: ["en"] },
    limit: 5,
  });
  const errorText = (call: typeof withCompany) =>
    (call.content as Array<{ type: string; text?: string }>).find((block) => block.type === "text")?.text ?? "";
  assert.equal(withCompany.isError, true);
  assert.match(errorText(withCompany), /exactly one of query, companyName, domain, ticker, or isin/);
  assert.equal(withNewest.isError, true);
  assert.match(errorText(withNewest), /ordered by relevance/);
});

test("searches companies, people, and browser profiles through the public API", async () => {
  captured.length = 0;
  const client = await connectClient();
  const companies = await client.callTool({
    name: "company-search",
    arguments: {
      query: "Robotics companies",
      filters: { countries: ["DE"], employees_min: 50 },
    },
  });
  const people = await client.callTool({
    name: "people-search",
    arguments: { query: "VPs of sales", country: "United States", cursor: "page-2" },
  });
  const profiles = await client.callTool({
    name: "list-browser-profiles",
    arguments: { limit: 5 },
  });
  const missingQuery = await client.callTool({
    name: "company-search",
    arguments: { filters: { countries: ["DE"] } },
  });
  await client.close();

  assert.notEqual(companies.isError, true);
  assert.notEqual(people.isError, true);
  assert.notEqual(profiles.isError, true);
  assert.equal(missingQuery.isError, true);
  assert.match(
    (missingQuery.content as Array<{ type: string; text?: string }>)
      .map((block) => block.text ?? "")
      .join("\n"),
    /company-search needs `query`/,
  );
  assert.deepEqual(
    captured.map((request) => `${request.method} ${new URL(request.url, upstreamBase).pathname}`),
    ["POST /company/search", "POST /people/search", "GET /org/browser/profiles"],
  );
  assert.deepEqual(JSON.parse(captured[0]!.body.toString()), {
    query: "Robotics companies",
    filters: { countries: ["DE"], employees_min: 50 },
  });
  assert.deepEqual(JSON.parse(captured[1]!.body.toString()), {
    query: "VPs of sales",
    cursor: "page-2",
    filters: { countries: ["US"] },
  });
  assert.equal(new URL(captured[2]!.url, upstreamBase).searchParams.get("limit"), "5");
});

test("accepts every company identifier and legacy news-search calls", async () => {
  captured.length = 0;
  const scenarios = [
    {
      arguments: { companyName: "Apple" },
      entity: { type: "name", name: "Apple" },
    },
    {
      arguments: { domain: "apple.com", sortBy: "relevance" },
      entity: { type: "domain", domain: "apple.com" },
      sortBy: { type: "relevance" },
    },
    {
      arguments: { isin: "US0378331005" },
      entity: { type: "isin", isin: "US0378331005" },
    },
    {
      arguments: {
        searchBy: {
          type: "entity",
          entity: { type: "ticker", ticker: "AAPL", exchange: "NASDAQ" },
        },
        sortBy: { type: "newest" },
      },
      entity: { type: "ticker", ticker: "AAPL", exchange: "NASDAQ" },
      sortBy: { type: "newest" },
    },
    {
      arguments: { searchBy: { type: "domain", domain: "example.com" }, sortBy: "newest" },
      entity: { type: "domain", domain: "example.com" },
      sortBy: { type: "newest" },
    },
  ];
  const client = await connectClient();
  for (const scenario of scenarios) {
    const result = await client.callTool({
      name: "get-news-search",
      arguments: scenario.arguments,
    });
    assert.notEqual(result.isError, true);
  }
  const missingIdentity = await client.callTool({
    name: "get-news-search",
    arguments: {},
  });
  const ambiguousIdentity = await client.callTool({
    name: "get-news-search",
    arguments: { companyName: "Apple", domain: "apple.com" },
  });
  await client.close();

  assert.equal(missingIdentity.isError, true);
  assert.equal(ambiguousIdentity.isError, true);
  assert.equal(captured.length, scenarios.length);
  scenarios.forEach((scenario, index) => {
    assert.deepEqual(JSON.parse(captured[index]!.body.toString()), {
      searchBy: { type: "entity", entity: scenario.entity },
      ...(scenario.sortBy ? { sortBy: scenario.sortBy } : {}),
    });
  });
});

test("executes the complete batch lifecycle with headers, bodies, paths, and queries", async () => {
  captured.length = 0;
  const client = await connectClient();

  const submitResult = await client.callTool({
    name: "submit-batch",
    arguments: {
      "Idempotency-Key": "mcp-batch-demo-1",
      input: {
        mode: "scrape",
        data: {
          format: "markdown",
          urls: [
            {
              url: "https://example.test/docs",
              itemId: "docs",
              meta: { source: "integration-test" },
            },
          ],
          options: { useMainContentOnly: true },
        },
      },
      tags: ["mcp", "test"],
    },
  });
  const listResult = await client.callTool({
    name: "list-batches",
    arguments: { status: "completed", limit: 10, tags: "mcp,test" },
  });
  const statusResult = await client.callTool({
    name: "get-batch",
    arguments: { batch_id: "batch/a" },
  });
  const resultsResult = await client.callTool({
    name: "get-batch-results",
    arguments: { batch_id: "batch/a", limit: 25, cursor: "25:0" },
  });
  const cancelResult = await client.callTool({
    name: "cancel-batch",
    arguments: { batch_id: "batch/a" },
  });
  const deleteResult = await client.callTool({
    name: "delete-batch",
    arguments: { batch_id: "batch/a" },
  });
  await client.close();

  assert.equal(captured[0]!.method, "POST");
  assert.equal(captured[0]!.url, "/batch/submit");
  assert.equal(captured[0]!.idempotencyKey, "mcp-batch-demo-1");
  assert.deepEqual(JSON.parse(captured[0]!.body.toString()), {
    input: {
      mode: "scrape",
      data: {
        format: "markdown",
        urls: [
          {
            url: "https://example.test/docs",
            itemId: "docs",
            meta: { source: "integration-test" },
          },
        ],
        options: { useMainContentOnly: true },
      },
    },
    tags: ["mcp", "test"],
  });

  const listUrl = new URL(captured[1]!.url, upstreamBase);
  assert.equal(listUrl.pathname, "/batch/list");
  assert.equal(listUrl.searchParams.get("status"), "completed");
  assert.equal(listUrl.searchParams.get("limit"), "10");
  assert.equal(listUrl.searchParams.get("tags"), "mcp,test");
  assert.equal(captured[2]!.url, "/batch/batch%2Fa");

  const resultsUrl = new URL(captured[3]!.url, upstreamBase);
  assert.equal(resultsUrl.pathname, "/batch/batch%2Fa/results");
  assert.equal(resultsUrl.searchParams.get("limit"), "25");
  assert.equal(resultsUrl.searchParams.get("cursor"), "25:0");
  assert.equal(captured[4]!.method, "POST");
  assert.equal(captured[4]!.url, "/batch/batch%2Fa/cancel");
  assert.equal(captured[5]!.method, "DELETE");
  assert.equal(captured[5]!.url, "/batch/batch%2Fa");

  assert.deepEqual(resultObject(submitResult), {
    id: "batch_demo",
    status: "queued",
    mode: "scrape",
    format: "markdown",
  });
  assert.deepEqual(resultObject(listResult), {
    data: [{ id: "batch_demo", status: "completed" }],
    has_more: false,
    next_cursor: null,
  });
  assert.deepEqual(resultObject(statusResult), {
    id: "batch/a",
    status: "completed",
    progress: { succeeded: 1, failed: 0, pending: 0 },
  });
  assert.deepEqual(resultObject(resultsResult), {
    data: [
      {
        url: "https://example.test/docs",
        status: "success",
        markdown: "# Documentation",
      },
    ],
    has_more: false,
    next_cursor: null,
  });
  assert.deepEqual(resultObject(cancelResult), {
    id: "batch/a",
    status: "cancelling",
  });
  assert.deepEqual(resultObject(deleteResult), {
    id: "batch/a",
    deleted: true,
  });
});

test("accepts every documented batch submission mode", async () => {
  captured.length = 0;
  const client = await connectClient();
  const inputs = [
    {
      mode: "scrape",
      data: {
        format: "markdown",
        urls: [{ url: "https://example.test/markdown" }],
      },
    },
    {
      mode: "scrape",
      data: {
        format: "html",
        urls: [{ url: "https://example.test/html" }],
      },
    },
    {
      mode: "crawl",
      data: {
        format: "markdown",
        source: {
          type: "start_url",
          url: "https://example.test/docs",
          controls: { maxUrls: 100, maxDepth: 3 },
        },
      },
    },
    {
      mode: "crawl",
      data: {
        format: "html",
        source: {
          type: "sitemap",
          domain: "example.test",
          controls: { maxUrls: 100 },
        },
      },
    },
  ];

  for (const input of inputs) {
    await client.callTool({
      name: "submit-batch",
      arguments: { input },
    });
  }
  await client.close();

  assert.equal(captured.length, inputs.length);
  assert.deepEqual(
    captured.map((request) => JSON.parse(request.body.toString()).input),
    inputs,
  );
});

test("executes path operations, JSON bodies, and parse bytes", async () => {
  captured.length = 0;
  const client = await connectClient();

  await client.callTool({
    name: "web-scrape",
    arguments: {
      url: "https://example.test/page",
      formats: { markdown: true },
      sharedParams: { includeSelectors: ["main", "article"] },
    },
  });
  await client.callTool({
    name: "get-monitor",
    arguments: { monitor_id: "monitor/a" },
  });
  await client.callTool({
    name: "get-monitor-run",
    arguments: { monitor_id: "monitor/a", run_id: "run/b" },
  });
  await client.callTool({
    name: "create-monitor",
    arguments: {
      name: "Pricing monitor",
      target: {
        type: "page",
        url: "https://example.test/pricing",
      },
    },
  });
  await client.callTool({
    name: "parse-document",
    arguments: {
      extension: "txt",
      fileBase64: Buffer.from("hello parser").toString("base64"),
    },
  });
  const brandCardResult = await client.callTool({
    name: "get-brand",
    arguments: {
      domain: "https://example.test/path",
      maxSpeed: true,
    },
  });
  const rawBrandResult = await client.callTool({
    name: "brand-retrieve-unified",
    arguments: {
      body: {
        type: "by_domain",
        domain: "example.test",
      },
    },
  });
  await client.close();

  assert.equal(captured[0]!.method, "POST");
  assert.equal(captured[0]!.url, "/web/scrape");
  assert.deepEqual(JSON.parse(captured[0]!.body.toString()), {
    url: "https://example.test/page",
    formats: { markdown: true },
    sharedParams: { includeSelectors: ["main", "article"] },
  });
  assert.equal(captured[1]!.url, "/monitors/monitor%2Fa");
  assert.equal(captured[2]!.url, "/monitors/monitor%2Fa/runs/run%2Fb");
  assert.equal(captured[3]!.method, "POST");
  assert.deepEqual(JSON.parse(captured[3]!.body.toString()), {
    name: "Pricing monitor",
    target: {
      type: "page",
      url: "https://example.test/pricing",
    },
  });
  assert.equal(captured[4]!.body.toString(), "hello parser");
  assert.equal(captured[5]!.method, "POST");
  assert.equal(captured[5]!.url, "/brand/retrieve");
  assert.deepEqual(JSON.parse(captured[5]!.body.toString()), {
    type: "by_domain",
    domain: "example.test",
    maxSpeed: true,
  });
  assert.equal(captured[6]!.method, "POST");
  assert.equal(captured[6]!.url, "/brand/retrieve");
  assert.deepEqual(JSON.parse(captured[6]!.body.toString()), {
    type: "by_domain",
    domain: "example.test",
  });
  const brandCard = brandCardResult.structuredContent as {
    brand: Record<string, unknown>;
  };
  assert.ok(
    (brandCardResult.content as Array<{ type: string; text?: string }>).some(
      (block) => block.type === "text" &&
        block.text?.includes("request_id: 6f2c1a1e-1111-4222-8333-444455556666"),
    ),
    "brand cards must retain the affected request ID for quality feedback",
  );
  const brandCardText = (
    brandCardResult.content as Array<{ type: string; text?: string }>
  )
    .map((block) => block.text ?? "")
    .join("\n");
  assert.ok(
    brandCardText.includes(JSON.stringify({ brand: brandCard.brand })),
    "clients that only read text must still receive the full brand",
  );
  assert.equal(brandCard.brand.domain, "example.test");
  assert.equal(
    brandCard.brand.logo,
    "https://media.brand.dev/example/icon.png",
  );
  assert.deepEqual(brandCard.brand.colors, [
    { hex: "#2564EA", name: "Blue" },
  ]);
  assert.deepEqual(brandCard.brand.socials, [
    {
      type: "linkedin",
      url: "https://linkedin.com/company/example",
    },
  ]);
  assert.deepEqual(brandCard.brand.links, [
    { label: "Pricing", url: "https://example.test/pricing" },
  ]);
  assert.equal("creditsRemaining" in brandCard.brand, false);
  assert.equal("key_metadata" in resultObject(rawBrandResult), false);
});

test("reads credit usage and history through the MCP tools", async () => {
  captured.length = 0;
  const client = await connectClient();

  const usage = resultObject(
    await client.callTool({ name: "get-usage", arguments: {} }),
  );
  const history = resultObject(
    await client.callTool({
      name: "get-usage-history",
      arguments: { interval: "day", group_by: "path" },
    }),
  );
  await client.close();

  assert.equal(captured[0]!.url, "/org/usage");
  const historyUrl = new URL(captured[1]!.url, upstreamBase);
  assert.equal(historyUrl.pathname, "/org/usage/history");
  assert.equal(historyUrl.searchParams.get("interval"), "day");
  assert.equal(historyUrl.searchParams.get("group_by"), "path");
  assert.equal(usage.credits_remaining, 41250);
  assert.equal(history.total_credits_used, 50);
});
