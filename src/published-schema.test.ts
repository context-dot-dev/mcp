import assert from "node:assert/strict";
import { test } from "node:test";
import { Ajv } from "ajv";
import { z } from "zod";
import { COMPONENT_SCHEMAS, ENDPOINTS, type JsonSchema } from "../context-endpoints";
import { schemaToZod } from "./openapi-schema";
import { compactPublishedSchema } from "./published-schema";

test("published schemas accept every sampled payload the validators accept", () => {
  const ajv = new Ajv({ strict: false, allErrors: false });
  const rejected: string[] = [];
  let acceptedCount = 0;
  for (const endpoint of ENDPOINTS) {
    const validator = createEndpointValidator(endpoint);
    const internalSchema = z.toJSONSchema(validator, { io: "input" }) as JsonSchema;
    const { $schema: _dialect, ...publishedSchema } = compactPublishedSchema(internalSchema);
    const isPublishedValid = ajv.compile(publishedSchema);
    const acceptedSamples = sampleValues(internalSchema).filter(
      (sample) => validator.safeParse(sample).success,
    );
    acceptedCount += acceptedSamples.length;
    for (const sample of acceptedSamples) {
      if (!isPublishedValid(sample)) {
        rejected.push(`${endpoint.name}: ${JSON.stringify(sample).slice(0, 300)}`);
      }
    }
  }
  assert.deepEqual(rejected, []);
  assert.ok(acceptedCount > ENDPOINTS.length * 3, `only ${acceptedCount} samples`);
});

test("object unions are published as one object with a variant summary", () => {
  const published = compactPublishedSchema({
    anyOf: [
      {
        type: "object",
        description: "Look up by domain. Extra detail.",
        properties: { domain: { type: "string", description: "Domain." } },
        required: ["domain"],
        additionalProperties: false,
      },
      {
        type: "object",
        description: "Look up by name.",
        properties: { name: { type: "string", description: "Name." } },
        required: ["name"],
        additionalProperties: false,
      },
    ],
  });
  assert.deepEqual(published, {
    type: "object",
    properties: {
      domain: { type: "string", description: "Domain." },
      name: { type: "string", description: "Name." },
    },
    additionalProperties: false,
    description: "One of: Look up by domain. | Look up by name.",
  });
});

test("drops default sentences and validator-only string limits", () => {
  const published = compactPublishedSchema({
    type: "string",
    minLength: 1,
    maxLength: 2048,
    pattern: "^[\\s\\S]*\\S[\\s\\S]*$",
    description: "Page size. Defaults to 25. Must be positive.",
  });
  assert.deepEqual(published, {
    type: "string",
    description: "Page size. Must be positive.",
  });
});

function createEndpointValidator(endpoint: (typeof ENDPOINTS)[number]): z.ZodTypeAny {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const parameter of endpoint.parameters) {
    if (parameter.in === "cookie") continue;
    const parameterSchema = schemaToZod(parameter.schema, COMPONENT_SCHEMAS);
    shape[parameter.name] = parameter.required ? parameterSchema : parameterSchema.optional();
  }
  if (endpoint.requestBody && !endpoint.requestBody.binary) {
    shape.body = schemaToZod(endpoint.requestBody.schema, COMPONENT_SCHEMAS);
  }
  return z.object(shape);
}

const MAX_SAMPLES_PER_SCHEMA = 40;
const STRING_CANDIDATES = [
  "https://example.com/page",
  "example.com",
  "2026-01-01T00:00:00Z",
  "2026-01-01",
  "AAPL",
  "a",
];

function sampleValues(schema: JsonSchema, depth = 0): unknown[] {
  if (depth > 8) return [];
  const variants = schema.anyOf ?? schema.oneOf;
  if (variants) {
    return variants.flatMap((variant) => sampleValues(variant, depth + 1)).slice(0, MAX_SAMPLES_PER_SCHEMA);
  }
  if (schema.const !== undefined) return [schema.const];
  if (schema.enum) return schema.enum;
  const type = Array.isArray(schema.type) ? schema.type[0] : schema.type;
  if (type === "object" || schema.properties) return sampleObjects(schema, depth);
  if (type === "array") {
    const itemSamples = schema.items ? sampleValues(schema.items, depth + 1) : ["a"];
    return [[], ...itemSamples.map((item) => [item])];
  }
  if (type === "string") return STRING_CANDIDATES;
  if (type === "integer" || type === "number") {
    return [schema.minimum ?? 1, schema.maximum ?? 1, 1, 10];
  }
  if (type === "boolean") return [true, false];
  if (type === "null") return [null];
  return ["a"];
}

function sampleObjects(schema: JsonSchema, depth: number): unknown[] {
  const propertySamples = Object.entries(schema.properties ?? {}).map(
    ([name, property]) => [name, sampleValues(property, depth + 1)] as const,
  );
  const required = new Set(schema.required ?? []);
  const minimal = Object.fromEntries(
    propertySamples
      .filter(([name, samples]) => required.has(name) && samples.length > 0)
      .map(([name, samples]) => [name, samples[0]]),
  );
  const full = Object.fromEntries(
    propertySamples
      .filter(([, samples]) => samples.length > 0)
      .map(([name, samples]) => [name, samples[0]]),
  );
  const variations = propertySamples.flatMap(([name, samples]) =>
    samples.slice(1).flatMap((sample) => [
      { ...minimal, [name]: sample },
      { ...full, [name]: sample },
    ]),
  );
  return [minimal, full, ...variations].slice(0, MAX_SAMPLES_PER_SCHEMA * 4);
}
