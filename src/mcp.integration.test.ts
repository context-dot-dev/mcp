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
};

const captured: CapturedRequest[] = [];
let upstreamBase = "";
let mcpBase = "";
let mcpProcess: ChildProcess;

const upstream = createServer((request, response) => {
  const chunks: Buffer[] = [];
  request.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
  request.on("end", () => {
    captured.push({
      method: request.method ?? "",
      url: request.url ?? "",
      body: Buffer.concat(chunks),
    });
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify({ ok: true }));
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
      CONTEXT_MCP_TOOLSET: "full",
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

test("lists the complete generated Context API with safety annotations", async () => {
  const client = await connectClient();
  const { tools } = await client.listTools();
  await client.close();

  assert.equal(tools.length, 69);
  const names = new Set(tools.map((tool) => tool.name));
  for (const requiredName of [
    "parse-document",
    "create-monitor",
    "list-monitors",
    "create-webdb-collection",
    "preview-webdb",
    "get-brand",
  ]) {
    assert.ok(names.has(requiredName), `missing ${requiredName}`);
  }

  const createMonitor = tools.find((tool) => tool.name === "create-monitor");
  assert.equal(createMonitor?.annotations?.readOnlyHint, false);
  assert.equal(createMonitor?.annotations?.destructiveHint, true);
  const webSearch = tools.find((tool) => tool.name === "web-search");
  assert.equal(webSearch?.annotations?.readOnlyHint, true);
  assert.equal(webSearch?.annotations?.destructiveHint, false);
});

test("executes nested queries, path operations, JSON bodies, and parse bytes", async () => {
  captured.length = 0;
  const client = await connectClient();

  await client.callTool({
    name: "web-scrape-markdown",
    arguments: {
      url: "https://example.test/page",
      headers: { "X-Custom": "hello" },
      pdf: { start: 2, end: 4 },
      includeSelectors: ["main", "article"],
    },
  });
  await client.callTool({
    name: "get-monitor",
    arguments: { monitor_id: "monitor/a" },
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
  await client.close();

  const markdownUrl = new URL(captured[0]!.url, upstreamBase);
  assert.equal(markdownUrl.searchParams.get("headers[X-Custom]"), "hello");
  assert.equal(markdownUrl.searchParams.get("pdf[start]"), "2");
  assert.deepEqual(markdownUrl.searchParams.getAll("includeSelectors"), [
    "main",
    "article",
  ]);
  assert.equal(captured[1]!.url, "/monitors/monitor%2Fa");
  assert.equal(captured[2]!.method, "POST");
  assert.deepEqual(JSON.parse(captured[2]!.body.toString()), {
    name: "Pricing monitor",
    target: {
      type: "page",
      url: "https://example.test/pricing",
    },
  });
  assert.equal(captured[3]!.body.toString(), "hello parser");
});
