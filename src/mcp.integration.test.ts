import assert from "node:assert/strict";
import { spawn, type ChildProcess } from "node:child_process";
import { createServer } from "node:http";
import { after, before, test } from "node:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

type CapturedRequest = {
  method: string;
  url: string;
  body: Buffer;
  idempotencyKey?: string;
  authorization?: string;
};

const captured: CapturedRequest[] = [];
let upstreamBase = "";
let mcpBase = "";
let mcpProcess: ChildProcess;

function batchResponse(method: string, requestUrl: string) {
  const path = new URL(requestUrl, "http://context.test").pathname;
  if (method === "POST" && path === "/brand/retrieve") {
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
    });
    const result = batchResponse(request.method ?? "", request.url ?? "");
    response.writeHead(result.status, { "content-type": "application/json" });
    response.end(JSON.stringify(result.body));
  });
});

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

async function connectClient(): Promise<Client> {
  const client = new Client({ name: "context-test", version: "1.0.0" });
  await client.connect(
    new StreamableHTTPClientTransport(new URL(`${mcpBase}/mcp`))
  );
  return client;
}

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
    name: "web-scrape-markdown",
    arguments: { url: "https://example.test" },
  });
  await client.close();

  assert.equal(
    captured.at(-1)?.authorization,
    "Bearer ctxt_query_without_oauth",
  );
});

test("lists the public Context API with safety annotations", async () => {
  const client = await connectClient();
  const { tools } = await client.listTools();
  await client.close();

  assert.equal(tools.length, 35);
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
  const names = new Set(tools.map((tool) => tool.name));
  for (const requiredName of [
    "parse-document",
    "web-scrape-html",
    "web-scrape-sitemap",
    "get-news-search",
    "brand-retrieve-unified",
    "web-fonts",
    "web-naics",
    "web-sic",
    "create-monitor",
    "list-monitors",
    "get-monitor-run",
    "submit-batch",
    "list-batches",
    "get-batch",
    "get-batch-results",
    "cancel-batch",
    "delete-batch",
    "get-brand",
  ]) {
    assert.ok(names.has(requiredName), `missing ${requiredName}`);
  }
  for (const privateName of [
    "people-retrieve",
    "web-competitors",
    "brand-ai-query",
    "brand-ai-product",
    "brand-ai-products",
    "utility-prefetch",
    "rotate-monitor-webhook-secret",
    "get-monitor-limits",
    "create-webdb-collection",
    "preview-webdb",
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
  const webSearch = tools.find((tool) => tool.name === "web-search");
  assert.equal(webSearch?.annotations?.readOnlyHint, true);
  assert.equal(webSearch?.annotations?.destructiveHint, false);
  assert.equal(webSearch?.annotations?.openWorldHint, true);
  const newsSearch = tools.find((tool) => tool.name === "get-news-search");
  assert.equal(newsSearch?.annotations?.readOnlyHint, true);
  assert.equal(newsSearch?.annotations?.destructiveHint, false);
  assert.equal(newsSearch?.annotations?.openWorldHint, true);
  const newsProperties = (newsSearch?.inputSchema.properties ?? {}) as Record<
    string,
    Record<string, unknown>
  >;
  assert.deepEqual(newsSearch?.inputSchema.required, ["searchBy"]);
  assert.equal(newsProperties.searchBy?.type, "object");
  assert.equal(newsProperties.filterBy?.type, "object");
  assert.equal(newsProperties.sortBy?.type, "object");
  assert.equal(newsProperties.limit?.type, "integer");
  assert.equal(newsProperties.cursor?.type, undefined);
  assert.equal(newsProperties.cursor?.anyOf instanceof Array, true);
  assert.equal(newsProperties.tags?.type, "array");

  const markdown = tools.find(
    (tool) => tool.name === "web-scrape-markdown",
  );
  assert.equal(markdown?.annotations?.readOnlyHint, false);
  assert.equal(markdown?.annotations?.destructiveHint, true);
  assert.equal(markdown?.annotations?.openWorldHint, true);

  const brand = tools.find((tool) => tool.name === "get-brand");
  assert.equal(brand?.annotations?.readOnlyHint, true);
  assert.equal(brand?.annotations?.destructiveHint, false);
  assert.equal(brand?.annotations?.openWorldHint, true);

  const submitBatch = tools.find((tool) => tool.name === "submit-batch");
  assert.equal(submitBatch?.annotations?.readOnlyHint, false);
  assert.equal(submitBatch?.annotations?.destructiveHint, false);
  const deleteBatch = tools.find((tool) => tool.name === "delete-batch");
  assert.equal(deleteBatch?.annotations?.destructiveHint, true);
});

test("searches company news with entity, source, date, and article filters", async () => {
  captured.length = 0;
  const client = await connectClient();
  const result = await client.callTool({
    name: "get-news-search",
    arguments: {
      searchBy: {
        type: "entity",
        entity: {
          type: "ticker",
          ticker: "AAPL",
          exchange: "NASDAQ",
        },
      },
      filterBy: {
        sourceDomain: ["reuters.com", "apple.com"],
        sourceCountry: ["us"],
        articleLanguage: ["en"],
        articleType: ["editorial", "press_release"],
        date: {
          from: 1_725_148_800_000,
          to: 1_725_235_200_000,
        },
      },
      sortBy: { type: "newest" },
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
      sourceDomain: ["reuters.com", "apple.com"],
      sourceCountry: ["us"],
      articleLanguage: ["en"],
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

test("executes nested queries, path operations, JSON bodies, and parse bytes", async () => {
  captured.length = 0;
  const client = await connectClient();

  await client.callTool({
    name: "web-scrape-markdown",
    arguments: {
      url: "https://example.test/page",
      pdf: { start: 2, end: 4 },
      includeSelectors: ["main", "article"],
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

  const markdownUrl = new URL(captured[0]!.url, upstreamBase);
  assert.equal(markdownUrl.searchParams.has("headers[X-Custom]"), false);
  assert.equal(markdownUrl.searchParams.get("pdf[start]"), "2");
  assert.deepEqual(markdownUrl.searchParams.getAll("includeSelectors"), [
    "main",
    "article",
  ]);
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
