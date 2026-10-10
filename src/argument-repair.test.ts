import assert from "node:assert/strict";
import { test } from "node:test";
import type { JsonSchema } from "../context-endpoints";
import { repairToolArgument, repairToolArguments } from "./argument-repair";

const scrapeSchema: JsonSchema = {
  type: "object",
  properties: {
    url: { type: "string" },
    formats: {
      type: "object",
      properties: { markdown: { type: "boolean" } },
    },
    tags: { type: "array", items: { type: "string" } },
    sharedParams: {
      type: "object",
      properties: {
        actions: {
          type: "array",
          items: {
            type: "object",
            properties: { type: { type: "string" } },
          },
        },
      },
    },
    area: {
      anyOf: [
        { type: "string", enum: ["viewport", "fullPage"] },
        { type: "object", properties: { selector: { type: "string" } } },
      ],
    },
    headers: {
      type: "object",
      additionalProperties: {
        type: "object",
        properties: { value: { type: "string" } },
      },
    },
  },
};

test("parses JSON strings sent for object and array parameters", () => {
  assert.deepEqual(
    repairToolArgument(
      {
        url: "https://example.com",
        formats: '{"markdown":true}',
        tags: ' ["a", "b"] ',
      },
      scrapeSchema,
    ),
    {
      url: "https://example.com",
      formats: { markdown: true },
      tags: ["a", "b"],
    },
  );
});

test("repairs nested stringified values inside parsed objects", () => {
  assert.deepEqual(
    repairToolArgument(
      { sharedParams: '{"actions":"[{\\"type\\":\\"wait\\"}]"}' },
      scrapeSchema,
    ),
    { sharedParams: { actions: [{ type: "wait" }] } },
  );
  assert.deepEqual(
    repairToolArgument({ headers: { a: '{"value":"x"}' } }, scrapeSchema),
    { headers: { a: { value: "x" } } },
  );
});

test("leaves strings alone where the schema accepts a string", () => {
  const args = { url: '{"not":"a url"}', area: '{"selector":"main"}' };
  assert.deepEqual(repairToolArgument(args, scrapeSchema), args);
});

test("leaves values that cannot be repaired for validation to report", () => {
  for (const formats of ["markdown", "{not json", "[1]", "null"]) {
    assert.deepEqual(repairToolArgument({ formats }, scrapeSchema), { formats });
  }
  assert.deepEqual(repairToolArgument({ tags: '{"a":1}' }, scrapeSchema), {
    tags: '{"a":1}',
  });
});

const searchSchema: JsonSchema = {
  type: "object",
  properties: {
    query: { type: "string", minLength: 1 },
    numResults: { type: "integer", minimum: 10 },
    compact: { type: "boolean" },
    freshness: { type: "string", enum: ["last_week", "last_month"] },
    country: { type: "string", enum: ["us", "gb"] },
    label: { type: "string" },
    nullableNote: { type: ["string", "null"] },
    anything: {},
  },
  required: ["query"],
};

test("drops null and empty placeholders for unset optional parameters", () => {
  assert.deepEqual(
    repairToolArgument(
      { query: "x", numResults: null, freshness: "", country: null },
      searchSchema,
    ),
    { query: "x" },
  );
});

test("keeps placeholders the schema accepts or that are required", () => {
  const args = { query: null, label: "", nullableNote: null, anything: null };
  assert.deepEqual(repairToolArgument(args, searchSchema), args);
});

test("coerces numeric and boolean strings and enum casing", () => {
  assert.deepEqual(
    repairToolArgument(
      { query: "42", numResults: " 20 ", compact: "TRUE", country: "US" },
      searchSchema,
    ),
    { query: "42", numResults: 20, compact: true, country: "us" },
  );
  assert.deepEqual(repairToolArgument({ numResults: 5 }, searchSchema), {
    numResults: 10,
  });
  assert.deepEqual(
    repairToolArgument({ numResults: "ten", country: "usa" }, searchSchema),
    { numResults: "ten", country: "usa" },
  );
});

test("treats missing tool arguments as an empty object", () => {
  for (const value of [undefined, null, ""]) {
    assert.deepEqual(repairToolArguments(value, { type: "object" }), {});
  }
  assert.deepEqual(repairToolArguments('{"query":"x"}', searchSchema), {
    query: "x",
  });
});

test("matches keys and enum values that differ only in case or separators", () => {
  const schema: JsonSchema = {
    type: "object",
    properties: {
      monitor_id: { type: "string" },
      timeoutOpts: {
        type: "object",
        properties: {
          milliseconds: { type: "integer" },
          behavior: { type: "string", enum: ["fail", "return-partial"] },
        },
        additionalProperties: false,
      },
    },
  };
  assert.deepEqual(
    repairToolArguments(
      { monitorId: "mon_1", timeout_opts: { milliseconds: 5000, behavior: "return_partial" } },
      schema,
    ),
    { monitor_id: "mon_1", timeoutOpts: { milliseconds: 5000, behavior: "return-partial" } },
  );
  assert.deepEqual(repairToolArguments({ timeoutMS: 9000 }, schema), {
    timeoutOpts: { milliseconds: 9000 },
  });
});

test("leaves keys in open objects where they are", () => {
  const schema: JsonSchema = {
    type: "object",
    properties: {
      maxAgeMs: { type: "integer" },
      headers: {
        type: "object",
        properties: { accept: { type: "string" } },
        additionalProperties: { type: "string" },
      },
    },
  };
  const args = { headers: { accept: "text/html", maxAgeMs: "5" } };
  assert.deepEqual(repairToolArguments(args, schema), args);
});

test("repairs a union member chosen by its discriminator", () => {
  const schema: JsonSchema = {
    type: "object",
    properties: {
      data: {
        anyOf: [
          {
            type: "object",
            properties: {
              format: { type: "string", enum: ["markdown"] },
              options: {
                type: "object",
                properties: { includeHTML: { type: "boolean" }, country: { type: "string" } },
                additionalProperties: false,
              },
            },
            additionalProperties: false,
          },
          {
            type: "object",
            properties: {
              format: { type: "string", enum: ["html"] },
              options: {
                type: "object",
                properties: { country: { type: "string" } },
                additionalProperties: false,
              },
            },
            additionalProperties: false,
          },
        ],
      },
    },
  };
  assert.deepEqual(
    repairToolArguments(
      { data: { format: "HTML", options: { country: "ch", unknown: true } } },
      schema,
    ),
    { data: { format: "html", options: { country: "ch" } } },
  );
  // Inside the chosen member, the other member's options have no effect.
  assert.deepEqual(
    repairToolArguments(
      { data: { format: "html", options: { country: "ch", includeHTML: true } } },
      schema,
    ),
    { data: { format: "html", options: { country: "ch" } } },
  );
});

test("keeps a key another union member declares so the conflict is reported", () => {
  const schema: JsonSchema = {
    type: "object",
    properties: {
      body: {
        anyOf: [
          {
            type: "object",
            properties: { type: { type: "string", enum: ["batch"] }, batch_id: { type: "string" } },
            additionalProperties: false,
          },
          {
            type: "object",
            properties: { type: { type: "string", enum: ["monitor"] }, monitor_id: { type: "string" } },
            additionalProperties: false,
          },
        ],
      },
    },
  };
  assert.deepEqual(
    repairToolArguments({ body: { type: "batch", monitor_id: "mon_1", extra: 1 } }, schema),
    { body: { type: "batch", monitor_id: "mon_1" } },
  );
});

test("uses id for the one required identifier", () => {
  const schema: JsonSchema = {
    type: "object",
    properties: { batch_id: { type: "string" }, limit: { type: "integer" } },
    required: ["batch_id"],
  };
  assert.deepEqual(repairToolArguments({ id: "batch_1" }, schema), { batch_id: "batch_1" });
  assert.deepEqual(repairToolArguments({ id: "x", batch_id: "batch_1" }, schema), {
    id: "x",
    batch_id: "batch_1",
  });
});

test("unwraps arguments nested one level too deep", () => {
  assert.deepEqual(
    repairToolArguments(
      { server: "context", tool: "web-search", arguments: { query: "x" } },
      searchSchema,
    ),
    { query: "x" },
  );
  assert.deepEqual(
    repairToolArguments(
      { description: "search", arguments: { search_term: "x" } },
      searchSchema,
      "web-search",
    ),
    { query: "x" },
  );
});

test("keeps unknown top-level properties for validation to strip", () => {
  assert.deepEqual(repairToolArgument({ extra: '{"a":1}' }, scrapeSchema), {
    extra: '{"a":1}',
  });
});

const closedSchema: JsonSchema = {
  type: "object",
  properties: {
    formats: {
      type: "object",
      properties: { markdown: { type: "boolean" } },
      additionalProperties: false,
    },
    maxAgeMs: { type: "integer" },
    sharedParams: {
      type: "object",
      properties: { mainContentOnly: { type: "boolean" } },
      additionalProperties: false,
    },
  },
};

test("moves misplaced top-level parameters and ignores unknown nested keys", () => {
  assert.deepEqual(
    repairToolArguments(
      {
        sharedParams: JSON.stringify({
          mainContentOnly: true,
          formats: { markdown: true, shouldParse: true },
          maxAgeMs: 0,
          responseMode: "compact",
        }),
      },
      closedSchema,
    ),
    {
      sharedParams: { mainContentOnly: true },
      formats: { markdown: true },
      maxAgeMs: 0,
    },
  );
});

const highlightsSchema: JsonSchema = {
  type: "object",
  properties: {
    highlightsParams: {
      type: "object",
      properties: { query: { type: "string" }, maxCount: { type: "integer" } },
    },
    urls: { type: "array", items: { type: "string" } },
  },
};

test("closes nested JSON strings that were cut off mid-value", () => {
  assert.deepEqual(
    repairToolArgument(
      { highlightsParams: '{"query": "brand color hex code logo purple blurple' },
      highlightsSchema,
    ),
    { highlightsParams: { query: "brand color hex code logo purple blurple" } },
  );
  assert.deepEqual(
    repairToolArgument({ urls: '["https://a.test", "https://b.test"' }, highlightsSchema),
    { urls: ["https://a.test", "https://b.test"] },
  );
});

test("leaves nested JSON strings cut off inside a key, number, or escape", () => {
  for (const highlightsParams of [
    '{"query": "brand", "max',
    '{"query": "brand", "maxCount": 1',
    '{"query": "brand",',
    '{"query": "brand\\',
    '{"query": "brand"}}',
  ]) {
    assert.deepEqual(repairToolArgument({ highlightsParams }, highlightsSchema), {
      highlightsParams,
    });
  }
});

const batchSchema: JsonSchema = {
  type: "object",
  properties: {
    input: {
      oneOf: [
        {
          type: "object",
          properties: {
            mode: { const: "scrape" },
            data: {
              type: "object",
              properties: {
                format: { type: "string" },
                urls: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: { url: { type: "string" } },
                  },
                },
              },
            },
          },
        },
        {
          type: "object",
          properties: { mode: { const: "crawl" }, url: { type: "string" } },
        },
      ],
    },
  },
};

test("unwraps a list sent as a single-key object", () => {
  const urls = [{ url: "https://example.com/a" }, { url: "https://example.com/b" }];
  assert.deepEqual(
    repairToolArgument(
      { input: { mode: "scrape", data: { format: "markdown", urls: { item: urls } } } },
      batchSchema,
    ),
    { input: { mode: "scrape", data: { format: "markdown", urls } } },
  );
  assert.deepEqual(
    repairToolArgument({ urls: { a: ["x"], b: ["y"] } }, highlightsSchema),
    { urls: { a: ["x"], b: ["y"] } },
  );
});
