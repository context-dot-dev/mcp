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
