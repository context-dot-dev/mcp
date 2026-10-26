import assert from "node:assert/strict";
import { spawn, type ChildProcess } from "node:child_process";
import { createServer } from "node:http";
import { after, before, test } from "node:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

type Schema = Record<string, any>;
type PublishedTool = { name: string; inputSchema: Schema };
type UpstreamRequest = { method: string; url: string; body: unknown };
type Args = Record<string, unknown>;

// Lint findings that open PRs fix; each entry turns its check into a todo.
const KNOWN_LINT_GAPS: Readonly<Record<string, string>> = {
  "llama.cpp web-scrape": "expected after #67",
  "llama.cpp get-batch-results": "expected after #67",
  "llama.cpp list-webhook-deliveries": "expected after #67",
  "llama.cpp list-logs": "expected after #67",
};
const ARGUMENTS_WRAPPER_GAP =
  "unfixed: an all-optional call wrapped in {arguments} validates with the wrapper stripped and reaches the API empty";
const MISNAMED_KEY_GAP = "unfixed: a misnamed optional key is stripped and its value silently dropped";
// "tool mutation" pairs that still fail, keyed like the subtests.
const KNOWN_REPAIR_GAPS: Readonly<Record<string, string>> = {
  "web-scrape maxAgeMs as max_age_ms": MISNAMED_KEY_GAP,
  "web-map includeSubdomains as include_subdomains": MISNAMED_KEY_GAP,
  "web-crawl maxPages as max_pages": MISNAMED_KEY_GAP,
  "web-search numResults as num_results": MISNAMED_KEY_GAP,
  "web-answers mode as Mode": MISNAMED_KEY_GAP,
  "get-brand maxSpeed as max_speed": MISNAMED_KEY_GAP,
  "brand-search typoTolerance as typo_tolerance": MISNAMED_KEY_GAP,
  "web-styleguide arguments wrapper": ARGUMENTS_WRAPPER_GAP,
  "web-styleguide maxAgeMs as max_age_ms": MISNAMED_KEY_GAP,
  "web-styleguide maxAgeMs as MaxAgeMs": MISNAMED_KEY_GAP,
  "people-enrich arguments wrapper": ARGUMENTS_WRAPPER_GAP,
  "people-enrich zdr as Zdr": MISNAMED_KEY_GAP,
  "list-batches arguments wrapper": ARGUMENTS_WRAPPER_GAP,
  "parse-document includeLinks as include_links": MISNAMED_KEY_GAP,
  "parse-document includeLinks as IncludeLinks": MISNAMED_KEY_GAP,
  "create-monitor mode as Mode": MISNAMED_KEY_GAP,
  "list-monitors arguments wrapper": ARGUMENTS_WRAPPER_GAP,
  "list-monitors search_type as searchType": MISNAMED_KEY_GAP,
  "list-monitors search_type as Search_type": MISNAMED_KEY_GAP,
  "list-account-runs arguments wrapper": ARGUMENTS_WRAPPER_GAP,
  "list-account-runs status as Status": MISNAMED_KEY_GAP,
  "list-changes arguments wrapper": ARGUMENTS_WRAPPER_GAP,
  "list-changes target_type as targetType": MISNAMED_KEY_GAP,
  "list-changes target_type as Target_type": MISNAMED_KEY_GAP,
  "list-logs arguments wrapper": ARGUMENTS_WRAPPER_GAP,
  "list-logs status_code as statusCode": MISNAMED_KEY_GAP,
  "list-logs status_code as Status_code": MISNAMED_KEY_GAP,
  "get-usage-history arguments wrapper": ARGUMENTS_WRAPPER_GAP,
  "get-usage-history group_by as groupBy": MISNAMED_KEY_GAP,
  "get-usage-history interval as Interval": MISNAMED_KEY_GAP,
};

const captured: UpstreamRequest[] = [];
let mcpBase = "";
let upstreamBase = "";
let mcpProcess: ChildProcess;
let client: Client;
let tools: PublishedTool[] = [];

test("published schemas fit the Gemini function declaration subset", async (t) => {
  for (const tool of tools) {
    await checkTool(t, "gemini", tool, findGeminiViolations(tool.inputSchema));
  }
});

test("published schemas fit Anthropic and OpenAI function rules", async (t) => {
  for (const tool of tools) {
    await checkTool(t, "anthropic-openai", tool, findRootViolations(tool));
  }
});

test("published schemas convert to llama.cpp grammars", async (t) => {
  for (const tool of tools) {
    await checkTool(t, "llama.cpp", tool, findGrammarViolations(tool.inputSchema));
  }
});

test("model-mangled arguments reach the API as the valid call or are rejected with guidance", async (t) => {
  for (const tool of tools) {
    const baseline = await findAcceptedBaseline(tool);
    if (!baseline) {
      t.diagnostic(`${tool.name}: no generated arguments reached the API`);
      continue;
    }
    for (const mutation of mutateArguments(tool.inputSchema, baseline.args)) {
      const key = `${tool.name} ${mutation.name}`;
      const expected = mutation.expectedArgs
        ? await callTool(tool.name, mutation.expectedArgs)
        : baseline;
      await t.test(key, { todo: KNOWN_REPAIR_GAPS[key] }, async () => {
        const outcome = await callTool(tool.name, mutation.args);
        const isRejectedBeforeApi = outcome.isError && outcome.requests.length === 0;
        if (isRejectedBeforeApi) {
          assert.match(outcome.text, /Input validation error|Expected|Use |must/i);
          return;
        }
        assert.deepEqual(outcome.requests, expected.requests, JSON.stringify(mutation.args));
      });
    }
  }
});

async function checkTool(
  t: { test: (name: string, options: object, run: () => void) => Promise<unknown> },
  provider: string,
  tool: PublishedTool,
  violations: string[],
): Promise<void> {
  const todo = KNOWN_LINT_GAPS[`${provider} ${tool.name}`];
  await t.test(`${provider} ${tool.name}`, { todo }, () => {
    assert.deepEqual(violations, []);
  });
}

const GEMINI_UNSUPPORTED_KEYWORDS = [
  "$schema", "$ref", "$defs", "definitions", "$id", "const", "oneOf", "allOf",
  "not", "if", "then", "else", "patternProperties", "prefixItems",
  "dependentSchemas", "unevaluatedProperties",
];
const GEMINI_FORMATS = new Set(["enum", "date-time", "int32", "int64", "float", "double"]);

function findGeminiViolations(root: Schema): string[] {
  return collectSchemas(root).flatMap(({ path, schema }) => {
    const unsupported = GEMINI_UNSUPPORTED_KEYWORDS
      .filter((keyword) => keyword in schema)
      .map((keyword) => `${path}: ${keyword}`);
    const hasTypeArray = Array.isArray(schema.type);
    const hasUnsupportedFormat = schema.format !== undefined && !GEMINI_FORMATS.has(schema.format);
    const hasNonStringEnum = Array.isArray(schema.enum) &&
      schema.enum.some((value: unknown) => typeof value !== "string");
    return [
      ...unsupported,
      ...(hasTypeArray ? [`${path}: type array`] : []),
      ...(hasUnsupportedFormat ? [`${path}: format ${schema.format}`] : []),
      ...(hasNonStringEnum ? [`${path}: non-string enum`] : []),
    ];
  });
}

const TOOL_NAME_PATTERN = /^[a-zA-Z0-9_-]{1,64}$/;
const ROOT_COMBINATORS = ["anyOf", "oneOf", "allOf", "enum", "not"];

function findRootViolations(tool: PublishedTool): string[] {
  const combinators = ROOT_COMBINATORS.filter((keyword) => keyword in tool.inputSchema);
  return [
    ...(TOOL_NAME_PATTERN.test(tool.name) ? [] : ["name"]),
    ...(tool.inputSchema.type === "object" ? [] : ["root type"]),
    ...combinators.map((keyword) => `root ${keyword}`),
  ];
}

const LARGE_ENUM_SIZE = 30;
// Escapes GBNF's parse_char understands, plus regex punctuation that the
// converter unescapes into literals before it reaches the grammar.
const GRAMMAR_CLASS_ESCAPE = /^\\(?:[trn\\"\[\]]|x[0-9a-fA-F]{2}|u[0-9a-fA-F]{4})/;
const GRAMMAR_LITERAL_ESCAPE = /^\\(?:[trn\\"\[\]^$.()|{}*+?]|x[0-9a-fA-F]{2}|u[0-9a-fA-F]{4})/;
const LLAMA_FORMATS = new Set(["date", "time", "date-time", "uuid"]);

function findGrammarViolations(root: Schema): string[] {
  return collectSchemas(root).flatMap(({ path, schema }) => {
    const patternProblem = typeof schema.pattern === "string"
      ? findPatternProblem(schema.pattern)
      : undefined;
    const hasUnsupportedFormat = schema.format !== undefined && !LLAMA_FORMATS.has(schema.format);
    const hasLargeEnum = Array.isArray(schema.enum) && schema.enum.length > LARGE_ENUM_SIZE;
    return [
      ...(patternProblem ? [`${path}: pattern ${schema.pattern} ${patternProblem}`] : []),
      ...(hasUnsupportedFormat ? [`${path}: format ${schema.format}`] : []),
      ...(hasLargeEnum ? [`${path}: enum of ${schema.enum.length}`] : []),
    ];
  });
}

function findPatternProblem(pattern: string): string | undefined {
  const isAnchored = pattern.startsWith("^") && pattern.endsWith("$") && !pattern.endsWith("\\$");
  if (!isAnchored) return "is not anchored";
  if (pattern.includes("(?")) return "uses group syntax";
  let isInClass = false;
  for (let index = 0; index < pattern.length; index += 1) {
    const rest = pattern.slice(index);
    if (rest.startsWith("\\")) {
      const escape = (isInClass ? GRAMMAR_CLASS_ESCAPE : GRAMMAR_LITERAL_ESCAPE).exec(rest);
      if (!escape) return `has escape ${rest.slice(0, 2)}`;
      index += escape[0].length - 1;
    } else if (rest.startsWith("[")) {
      isInClass = true;
    } else if (rest.startsWith("]")) {
      isInClass = false;
    }
  }
  return undefined;
}

function collectSchemas(schema: unknown, path = "$"): Array<{ path: string; schema: Schema }> {
  if (!schema || typeof schema !== "object" || Array.isArray(schema)) return [];
  const node = schema as Schema;
  const properties = Object.entries(node.properties ?? {}).flatMap(([name, child]) =>
    collectSchemas(child, `${path}.${name}`)
  );
  const branches = ["anyOf", "oneOf", "allOf"].flatMap((keyword) =>
    (node[keyword] ?? []).flatMap((child: unknown, index: number) =>
      collectSchemas(child, `${path}/${keyword}[${index}]`)
    )
  );
  const items = collectSchemas(node.items, `${path}[]`);
  const additional = collectSchemas(node.additionalProperties, `${path}{}`);
  return [{ path, schema: node }, ...properties, ...branches, ...items, ...additional];
}

type Mutation = { name: string; args: unknown; expectedArgs?: Args };

function mutateArguments(schema: Schema, args: Args): Mutation[] {
  const properties: Record<string, Schema> = schema.properties ?? {};
  const required = new Set<string>(schema.required ?? []);
  const entries = Object.entries(args);
  const replaceValue = (key: string, value: unknown) => ({ ...args, [key]: value });
  const renameKey = (key: string, renamed: string) =>
    Object.fromEntries(entries.map(([name, value]) => [name === key ? renamed : name, value]));

  const stringified = entries
    .filter(([, value]) => value !== null && typeof value === "object")
    .map(([key, value]) => ({ name: `${key} as JSON string`, args: replaceValue(key, JSON.stringify(value)) }));
  const scalarStrings = entries
    .filter(([, value]) => typeof value === "number" || typeof value === "boolean")
    .map(([key, value]) => ({ name: `${key} as string`, args: replaceValue(key, String(value)) }));
  const singleValues = entries
    .filter(([, value]) => Array.isArray(value) && value.length === 1)
    .map(([key, value]) => ({ name: `${key} as single value`, args: replaceValue(key, (value as unknown[])[0]) }));
  const upperCaseEnums = entries
    .filter(([key, value]) => typeof value === "string" && properties[key]?.enum && value !== value.toUpperCase())
    .map(([key, value]) => ({ name: `${key} enum upper case`, args: replaceValue(key, (value as string).toUpperCase()) }));
  const caseSwappedKeys = entries
    .map(([key]) => ({ key, renamed: swapKeyCase(key) }))
    .filter(({ key, renamed }) => renamed !== key && !(renamed in properties))
    .map(({ key, renamed }) => ({ name: `${key} as ${renamed}`, args: renameKey(key, renamed) }))
    .slice(0, 1);
  const capitalizedKeys = entries
    .map(([key]) => ({ key, renamed: key[0]!.toUpperCase() + key.slice(1) }))
    .filter(({ key, renamed }) => renamed !== key && !(renamed in properties))
    .map(({ key, renamed }) => ({ name: `${key} as ${renamed}`, args: renameKey(key, renamed) }))
    .slice(0, 1);
  const optionalKeys = Object.keys(properties).filter((key) => !required.has(key) && !(key in args));
  const nullPlaceholders = optionalKeys
    .filter((key) => !acceptsType(properties[key]!, "null"))
    .map((key) => ({ name: `${key} null`, args: replaceValue(key, null) }))
    .slice(0, 1);
  const emptyStringPlaceholders = optionalKeys
    .filter((key) => !acceptsType(properties[key]!, "string"))
    .map((key) => ({ name: `${key} empty string`, args: replaceValue(key, "") }))
    .slice(0, 1);
  const outOfRange = optionalKeys
    .filter((key) => properties[key]?.type === "integer" && typeof properties[key]?.maximum === "number")
    .map((key) => ({
      name: `${key} above maximum`,
      args: replaceValue(key, properties[key]!.maximum + 1),
      expectedArgs: replaceValue(key, properties[key]!.maximum),
    }));

  return [
    { name: "arguments wrapper", args: { arguments: args } },
    { name: "unknown key", args: { ...args, unexpected_field: "x" } },
    ...stringified,
    ...scalarStrings,
    ...singleValues,
    ...upperCaseEnums,
    ...caseSwappedKeys,
    ...capitalizedKeys,
    ...nullPlaceholders,
    ...emptyStringPlaceholders,
    ...outOfRange,
  ];
}

function acceptsType(schema: Schema, type: string): boolean {
  const branches: Schema[] = schema.anyOf ?? [schema];
  return branches.some((branch) => branch.type === type || branch.type === undefined);
}

function swapKeyCase(key: string): string {
  return key.includes("_")
    ? key.replace(/_([a-z0-9])/g, (_, letter: string) => letter.toUpperCase())
    : key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

async function findAcceptedBaseline(tool: PublishedTool) {
  const candidates = [
    generateArguments(tool.inputSchema, true),
    generateArguments(tool.inputSchema, false),
  ].filter((args): args is Args => args !== undefined);
  for (const args of candidates) {
    const outcome = await callTool(tool.name, args);
    const isAccepted = outcome.requests.length > 0 && !outcome.isTimedOut;
    if (isAccepted) return { args, ...outcome };
  }
  return undefined;
}

const STATIC_SAMPLE_STRINGS = [
  "Example", "US", "@href",
  "/web/scrape", "12:34", "AAPL", "US0378331005", "E_TIMEOUT",
  `whd_${"a".repeat(32)}`, `wha_${"a".repeat(32)}`, "x",
];

function generateArguments(schema: Schema, shouldIncludeOptionalScalars: boolean): Args | undefined {
  const properties: Record<string, Schema> = schema.properties ?? {};
  const required = new Set<string>(schema.required ?? []);
  const isOptionalScalar = (property: Schema) =>
    ["boolean", "integer", "number"].includes(property.type) || Array.isArray(property.enum);
  const selected = Object.entries(properties).filter(([key, property]) =>
    required.has(key) || (shouldIncludeOptionalScalars && isOptionalScalar(property))
  );
  const generated = selected.map(([key, property]) => [key, generateValue(property)] as const);
  const isComplete = generated.every(([, value]) => value !== undefined);
  return isComplete ? Object.fromEntries(generated) : undefined;
}

function generateValue(schema: Schema): unknown {
  if (Array.isArray(schema.enum)) return schema.enum[0];
  if (Array.isArray(schema.anyOf)) {
    const nonNullBranches = schema.anyOf.filter((branch: Schema) => branch.type !== "null");
    return nonNullBranches.map(generateValue).find((value: unknown) => value !== undefined);
  }
  if (schema.type === "object") return generateArguments(schema, false);
  if (schema.type === "array") {
    const item = generateValue(schema.items ?? {});
    return item === undefined ? undefined : Array(Math.max(schema.minItems ?? 1, 1)).fill(item);
  }
  if (schema.type === "string") {
    const samples = ["example.test", `${upstreamBase}/page`, ...STATIC_SAMPLE_STRINGS];
    return samples.find((value) => fitsString(schema, value));
  }
  if (schema.type === "integer" || schema.type === "number") return schema.minimum ?? 1;
  if (schema.type === "boolean") return true;
  if (schema.type === "null") return null;
  return "x";
}

function fitsString(schema: Schema, value: string): boolean {
  const fitsLength = value.length >= (schema.minLength ?? 0) && value.length <= (schema.maxLength ?? Infinity);
  const fitsPattern = !schema.pattern || new RegExp(schema.pattern).test(value);
  return fitsLength && fitsPattern;
}

// Job tools poll until the mock's job finishes, which it never does.
const CALL_TIMEOUT_MS = 3_000;

async function callTool(name: string, args: unknown) {
  captured.length = 0;
  try {
    const result = await client.callTool({ name, arguments: args as Args }, undefined, {
      timeout: CALL_TIMEOUT_MS,
    });
    const content = Array.isArray(result.content) ? result.content : [];
    const text = content.map((block: { text?: string }) => block.text ?? "").join("\n");
    return { isError: result.isError === true, isTimedOut: false, text, requests: [...captured] };
  } catch (cause) {
    return { isError: true, isTimedOut: true, text: String(cause), requests: [...captured] };
  }
}

const upstream = createServer((request, response) => {
  const chunks: Buffer[] = [];
  request.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
  request.on("end", () => {
    const rawBody = Buffer.concat(chunks).toString();
    captured.push({
      method: request.method ?? "",
      url: request.url ?? "",
      body: parseBody(rawBody),
    });
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify({ ok: true }));
  });
});

function parseBody(rawBody: string): unknown {
  try {
    return rawBody ? JSON.parse(rawBody) : undefined;
  } catch {
    return rawBody;
  }
}

async function listenOnOpenPort(server: ReturnType<typeof createServer>): Promise<number> {
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert.ok(address && typeof address === "object");
  return address.port;
}

async function getOpenPort(): Promise<number> {
  const probe = createServer();
  const port = await listenOnOpenPort(probe);
  await new Promise((resolve) => probe.close(resolve));
  return port;
}

async function waitForHealth(url: string): Promise<void> {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    const isHealthy = await fetch(url).then((response) => response.ok, () => false);
    if (isHealthy) return;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

before(async () => {
  const upstreamPort = await listenOnOpenPort(upstream);
  upstreamBase = `http://127.0.0.1:${upstreamPort}`;
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
  client = new Client({ name: "provider-schema-test", version: "1.0.0" });
  await client.connect(new StreamableHTTPClientTransport(new URL(`${mcpBase}/mcp`)));
  tools = (await client.listTools()).tools as PublishedTool[];
});

after(async () => {
  await client?.close();
  mcpProcess.kill("SIGTERM");
  await new Promise<void>((resolve) => {
    if (mcpProcess.exitCode !== null) return resolve();
    mcpProcess.once("exit", () => resolve());
  });
  await new Promise((resolve) => upstream.close(resolve));
});
