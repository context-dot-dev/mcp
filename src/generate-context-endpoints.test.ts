import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import type { JsonSchema } from "../context-endpoints";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));
const legacy = JSON.parse(
  readFileSync(new URL("../scripts/legacy-batch-data.json", import.meta.url), "utf8"),
) as Record<string, { title: string; description: string; variants: JsonSchema[] }>;

const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });
const mode = (name: string) => ({ type: "string", enum: [name] });

const documentedInput = {
  oneOf: [
    { type: "object", properties: { mode: mode("scrape"), data: ref("BatchUnifiedScrapeData") } },
    { type: "object", properties: { mode: mode("crawl"), data: ref("BatchUnifiedCrawlData") } },
  ],
};

// The legacy variants reference BrowserCountryCode, so a second endpoint uses it.
function fixtureSpec(batchInput: unknown, { countryEndpoint = true } = {}) {
  return {
    openapi: "3.1.0",
    info: { title: "Fixture", version: "1.0.0" },
    paths: {
      "/batch/submit": {
        post: {
          operationId: "submitBatch",
          requestBody: {
            required: true,
            content: { "application/json": { schema: ref("BatchSubmitRequest") } },
          },
        },
      },
      ...(countryEndpoint
        ? {
            "/web/search": {
              post: {
                operationId: "searchWeb",
                parameters: [{ name: "country", in: "query", schema: ref("BrowserCountryCode") }],
              },
            },
          }
        : {}),
    },
    components: {
      schemas: {
        BatchSubmitRequest: { type: "object", properties: { input: batchInput } },
        BatchUnifiedScrapeData: { type: "object", title: "Scrape Anything" },
        BatchUnifiedCrawlData: { type: "object", title: "Crawl with Scrape Anything" },
        BrowserCountryCode: { type: "string" },
      },
    },
  };
}

async function generate(spec: unknown): Promise<Record<string, JsonSchema>> {
  const directory = mkdtempSync(join(tmpdir(), "context-endpoints-"));
  try {
    const specPath = join(directory, "openapi.json");
    const outputPath = join(directory, "context-endpoints.ts");
    writeFileSync(specPath, JSON.stringify(spec));
    execFileSync(
      process.execPath,
      ["--import", "tsx", "scripts/generate-context-endpoints.ts", specPath, outputPath],
      { cwd: repoRoot, stdio: "pipe" },
    );
    const generated = (await import(pathToFileURL(outputPath).href)) as {
      COMPONENT_SCHEMAS: Record<string, JsonSchema>;
    };
    return generated.COMPONENT_SCHEMAS;
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

function dataOf(schemas: Record<string, JsonSchema>, position: number) {
  return schemas.BatchSubmitRequest?.properties?.input?.oneOf?.[position]?.properties?.data;
}

test("adds the legacy batch inputs beside the documented Scrape Anything ones", async () => {
  const schemas = await generate(fixtureSpec(documentedInput));
  const scrape = dataOf(schemas, 0);
  const crawl = dataOf(schemas, 1);

  assert.deepEqual(scrape?.oneOf, [...legacy.scrape.variants, ref("BatchUnifiedScrapeData")]);
  assert.deepEqual(crawl?.oneOf, [...legacy.crawl.variants, ref("BatchUnifiedCrawlData")]);
  assert.equal(scrape?.title, legacy.scrape.title);
  assert.equal(crawl?.description, legacy.crawl.description);
  assert.deepEqual(Object.keys(schemas).slice(0, 3), [
    "BatchUnifiedScrapeData",
    "BatchUnifiedCrawlData",
    "BatchSubmitRequest",
  ]);
});

test("leaves batch data alone when the spec already offers several shapes", async () => {
  const several = { oneOf: [ref("BatchUnifiedScrapeData"), ref("BatchUnifiedCrawlData")] };
  const input = {
    oneOf: [
      { type: "object", properties: { mode: mode("scrape"), data: several } },
      { type: "object", properties: { mode: mode("crawl"), data: ref("BatchUnifiedCrawlData") } },
    ],
  };
  const schemas = await generate(fixtureSpec(input));

  assert.deepEqual(dataOf(schemas, 0), several);
  assert.equal(dataOf(schemas, 1)?.oneOf?.length, legacy.crawl.variants.length + 1);
});

test("fails instead of dropping the legacy inputs when the batch request changes", async () => {
  const failure = (spec: unknown, message: RegExp) =>
    assert.rejects(generate(spec), (error) =>
      message.test(String((error as { stderr?: Buffer }).stderr)),
    );

  await failure(fixtureSpec({ type: "object" }), /no longer a oneOf/);
  await failure(
    fixtureSpec(documentedInput, { countryEndpoint: false }),
    /BrowserCountryCode, which no endpoint uses any more/,
  );
});
