import assert from "node:assert/strict";
import { test } from "node:test";
import { z } from "zod";
import { ENDPOINTS, type JsonSchema } from "../context-endpoints";
import { getAccountToolError } from "./account-error";
import { schemaToZod } from "./openapi-schema";
import { OUTPUT_SCHEMAS } from "./output-schemas";
import { selectEndpoints } from "./toolset";

const COMPACT_TEXT_TOOLS = new Set(["web-search", "web-scrape", "web-crawl"]);

test("every tool with only JSON object results declares an output schema", () => {
  const expected = selectEndpoints(ENDPOINTS)
    .map((endpoint) => endpoint.name)
    .filter((name) => !COMPACT_TEXT_TOOLS.has(name));
  assert.deepEqual(Object.keys(OUTPUT_SCHEMAS).sort(), expected.sort());
});

test("output schemas describe every field and accept errors and shortened results", () => {
  const accountError = getAccountToolError(
    {
      message: "Insufficient credits.",
      error_code: "USAGE_EXCEEDED",
      key_metadata: { credits_remaining: 0, credits_consumed: 0 },
      request_id: "req_credit_limit",
    },
    new Headers(),
  )?.structuredContent;
  assert.ok(accountError);
  const shortened = {
    request_id: "req_long",
    _context_mcp: { truncated: true, original_chars: 90_000 },
  };
  for (const [name, schema] of Object.entries(OUTPUT_SCHEMAS)) {
    assert.equal(schema.type, "object", name);
    assert.equal(hasRequiredFields(schema), false, name);
    for (const [field, property] of Object.entries(schema.properties ?? {})) {
      assert.ok(property.description?.trim(), `${name}.${field}`);
    }
    const validator = schemaToZod(schema, {});
    for (const result of [{}, accountError, shortened]) {
      assert.equal(validator.safeParse(result).success, true, `${name}: ${JSON.stringify(result)}`);
    }
    assert.notEqual(
      z.toJSONSchema(validator, { io: "output" }).additionalProperties,
      false,
      name,
    );
  }
});

function hasRequiredFields(schema: JsonSchema): boolean {
  return (
    Boolean(schema.required?.length) ||
    Object.values(schema.properties ?? {}).some(hasRequiredFields)
  );
}
