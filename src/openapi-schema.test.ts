import assert from "node:assert/strict";
import { test } from "node:test";
import { z } from "zod";
import { ENDPOINTS, COMPONENT_SCHEMAS } from "../context-endpoints";
import {
  anchorPattern,
  resolveObjectSchema,
  schemaToZod,
  toGrammarSafePattern,
} from "./openapi-schema";

test("keeps object fields and their validation alongside allOf constraints", () => {
  const news = ENDPOINTS.find((endpoint) => endpoint.name === "get-news-search");
  assert.ok(news?.requestBody);
  const body = resolveObjectSchema(news.requestBody.schema, COMPONENT_SCHEMAS);
  assert.ok(body?.properties?.filterBy);
  const filters = schemaToZod(body.properties.filterBy, COMPONENT_SCHEMAS);
  const schema = z.toJSONSchema(filters);

  assert.equal(schema.type, "object");
  assert.ok(schema.properties?.sourceDomain);
  assert.ok(schema.properties?.date);
  assert.equal(filters.safeParse({ sourceDomain: ["example.test"] }).success, true);
  assert.equal(filters.safeParse({ sourceDomain: [] }).success, false);
  assert.equal(filters.safeParse({ sourceCountry: ["invalid-country"] }).success, false);
});

test("batch inputs keep legacy formats and accept Scrape Anything at the 100,000-page limit", () => {
  const input = COMPONENT_SCHEMAS.BatchSubmitRequest.properties?.input;
  const scrapeVariants = input?.oneOf?.[0]?.properties?.data?.oneOf;
  const crawlVariants = input?.oneOf?.[1]?.properties?.data?.oneOf;

  assert.deepEqual(scrapeVariants?.[0]?.properties?.format?.enum, ["markdown"]);
  assert.equal(scrapeVariants?.length, 3);
  assert.equal(crawlVariants?.length, 3);
  assert.equal(scrapeVariants?.[2]?.$ref, "#/components/schemas/BatchUnifiedScrapeData");
  assert.equal(crawlVariants?.[2]?.$ref, "#/components/schemas/BatchUnifiedCrawlData");
  for (const variant of scrapeVariants?.slice(0, 2) ?? []) {
    assert.equal(variant.properties?.urls?.maxItems, 100_000);
  }
  assert.equal(COMPONENT_SCHEMAS.BatchUnifiedScrapeData.properties?.urls?.maxItems, 100_000);
  for (const variant of crawlVariants?.slice(0, 2) ?? []) {
    for (const source of variant.properties?.source?.oneOf ?? []) {
      assert.equal(source.properties?.controls?.properties?.maxUrls?.maximum, 100_000);
    }
  }
  const batch = schemaToZod(COMPONENT_SCHEMAS.BatchSubmitRequest, COMPONENT_SCHEMAS);
  const urls = [{ url: "https://example.com" }];
  assert.equal(batch.safeParse({ input: { mode: "scrape", data: { format: "markdown", urls } } }).success, true);
  assert.equal(batch.safeParse({ input: { mode: "scrape", data: { formats: { markdown: true }, urls } } }).success, true);
  assert.equal(batch.safeParse({ input: { mode: "scrape", data: { urls } } }).success, false);
  assert.equal(batch.safeParse({ input: { mode: "crawl", data: {
    formats: { markdown: true },
    source: { type: "start_url", url: "https://example.com" },
  } } }).success, true);
});

test("validates both sibling fields and structural allOf branches", () => {
  const schema = schemaToZod({
    type: "object",
    properties: { name: { type: "string", minLength: 1 } },
    required: ["name"],
    allOf: [{
      type: "object",
      properties: { count: { type: "integer", minimum: 1 } },
      required: ["count"],
    }],
  }, {});

  assert.deepEqual(schema.parse({ name: "Example", count: 2 }), { name: "Example", count: 2 });
  assert.equal(schema.safeParse({ count: 2 }).success, false);
  assert.equal(schema.safeParse({ name: "Example", count: 0 }).success, false);
});

test("publishes shorthand regex classes in a form llama.cpp grammars accept", () => {
  const cases = [
    ["^https?://[\\s\\S]*$", "^https?://.*$"],
    ["\\S", "^.*[^ \\t\\n\\r].*$"],
    ["^\\d+:\\d+$", "^[0-9]+:[0-9]+$"],
    ["^[\\w-]+$", "^[A-Za-z0-9_-]+$"],
    ["^\\/", "^/.*$"],
    ["^[^\\r\\n]*$", "^[^\\r\\n]*$"],
    ["^a\\\\d\\.$", "^a\\\\d\\.$"],
  ];
  for (const [pattern, published] of cases) {
    assert.equal(toGrammarSafePattern(anchorPattern(pattern!)), published, pattern);
  }

  const blank = schemaToZod({ type: "string", pattern: "\\S" }, {});
  assert.equal(z.toJSONSchema(blank).pattern, "^.*[^ \\t\\n\\r].*$");
  assert.equal(blank.safeParse("\n a").success, true);
  assert.equal(blank.safeParse(" \n ").success, false);
});

test("a null-only type accepts only null", () => {
  const schema = schemaToZod({ anyOf: [{ type: "object", properties: {} }, { type: "null" }] }, {});
  assert.equal(schema.safeParse(null).success, true);
  assert.equal(schema.safeParse("anything").success, false);
});
