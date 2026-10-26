import type { JsonSchema } from "../context-endpoints";
import { toGrammarSafePattern } from "./openapi-schema";

// tools/list is resent on every model turn by eager-loading clients, so the
// published schema is a looser, smaller view of the validator's schema. Calls
// are still validated and repaired against the full schema; every transform
// here may only widen what the published schema accepts.
export function compactPublishedSchema(schema: JsonSchema): JsonSchema {
  const compactedChildren = compactChildren(schema);
  const withoutNoise = dropValidationNoise(compactedChildren);
  const merged = mergeObjectUnion(withoutNoise);
  return shortenDescription(merged);
}

function compactChildren(schema: JsonSchema): JsonSchema {
  const compacted: JsonSchema = { ...schema };
  if (schema.properties) {
    compacted.properties = Object.fromEntries(
      Object.entries(schema.properties).map(([name, property]) => [
        name,
        compactPublishedSchema(property),
      ]),
    );
  }
  if (schema.items && !Array.isArray(schema.items)) {
    compacted.items = compactPublishedSchema(schema.items);
  }
  if (typeof schema.additionalProperties === "object") {
    compacted.additionalProperties = compactPublishedSchema(
      schema.additionalProperties,
    );
  }
  for (const key of ["anyOf", "oneOf", "allOf"] as const) {
    if (schema[key]) compacted[key] = schema[key].map(compactPublishedSchema);
  }
  return compacted;
}

const NON_BLANK_PATTERN = "^[\\s\\S]*\\S[\\s\\S]*$";
const NON_BLANK_PATTERNS = new Set([
  NON_BLANK_PATTERN,
  toGrammarSafePattern(NON_BLANK_PATTERN),
]);
const SHORTEST_PUBLISHED_MAX_LENGTH = 200;

function dropValidationNoise(schema: JsonSchema): JsonSchema {
  const {
    minimum,
    maximum,
    minLength,
    maxLength,
    pattern,
    ...rest
  } = schema;
  const isMinimumMeaningful =
    minimum !== undefined && minimum !== Number.MIN_SAFE_INTEGER;
  const isMaximumMeaningful =
    maximum !== undefined && maximum !== Number.MAX_SAFE_INTEGER;
  const isMinLengthMeaningful = minLength !== undefined && minLength > 1;
  const isMaxLengthMeaningful =
    maxLength !== undefined && maxLength < SHORTEST_PUBLISHED_MAX_LENGTH;
  const isPatternMeaningful =
    pattern !== undefined && !NON_BLANK_PATTERNS.has(pattern);
  return {
    ...rest,
    ...(isMinimumMeaningful ? { minimum } : {}),
    ...(isMaximumMeaningful ? { maximum } : {}),
    ...(isMinLengthMeaningful ? { minLength } : {}),
    ...(isMaxLengthMeaningful ? { maxLength } : {}),
    ...(isPatternMeaningful ? { pattern } : {}),
  };
}

// Unions of objects repeat every shared property once per variant. One object
// with the union of their properties is a superset and a fraction of the size.
function mergeObjectUnion(schema: JsonSchema): JsonSchema {
  if (!schema.anyOf || schema.anyOf.length < 2) return schema;
  const variants = flattenUnion(schema.anyOf);
  if (!variants.every(isObjectSchema)) return schema;
  const { anyOf: _variants, description, ...rest } = schema;
  const variantSummary = summarizeVariants(variants);
  const mergedDescription = [description, variantSummary]
    .filter(Boolean)
    .join(" ");
  return {
    ...mergeObjects(variants),
    ...rest,
    ...(mergedDescription ? { description: mergedDescription } : {}),
  };
}

function summarizeVariants(variants: JsonSchema[]): string | undefined {
  const firstSentences = [
    ...new Set(
      variants.flatMap((variant) =>
        variant.description ? [readFirstSentence(variant.description)] : [],
      ),
    ),
  ];
  if (firstSentences.length < 2) return undefined;
  return `One of: ${firstSentences.join(" | ")}`;
}

function readFirstSentence(text: string): string {
  return /^.+?[.!?](?=\s|$)/s.exec(text)?.[0] ?? text;
}

function flattenUnion(variants: JsonSchema[]): JsonSchema[] {
  return variants.flatMap((variant) =>
    variant.anyOf && !variant.properties ? flattenUnion(variant.anyOf) : [variant],
  );
}

function isObjectSchema(schema: JsonSchema): boolean {
  return schema.type === "object" && !schema.anyOf && !schema.oneOf;
}

function mergeObjects(variants: JsonSchema[]): JsonSchema {
  const propertyNames = [
    ...new Set(variants.flatMap((variant) => Object.keys(variant.properties ?? {}))),
  ];
  const properties = Object.fromEntries(
    propertyNames.map((name) => {
      const definitions = variants.flatMap((variant) => {
        const definition = variant.properties?.[name];
        return definition ? [definition] : [];
      });
      return [name, mergeDefinitions(definitions)];
    }),
  );
  const required = (variants[0].required ?? []).filter((name) =>
    variants.every((variant) => variant.required?.includes(name)),
  );
  const isClosed = variants.every(
    (variant) => variant.additionalProperties === false,
  );
  return {
    type: "object",
    properties,
    ...(required.length ? { required } : {}),
    ...(isClosed ? { additionalProperties: false } : {}),
  };
}

function mergeDefinitions(definitions: JsonSchema[]): JsonSchema {
  const distinct = [
    ...new Map(
      definitions.map((definition) => [JSON.stringify(definition), definition]),
    ).values(),
  ];
  if (distinct.length === 1) return distinct[0];
  const description = distinct.find((definition) => definition.description)
    ?.description;
  const constants = distinct.map(readConstant);
  const isDiscriminator = constants.every((value) => value !== undefined);
  if (isDiscriminator) {
    const values = [...new Set(constants)];
    return {
      type: typeof values[0],
      enum: values,
      description: describeDiscriminator(distinct, constants) ?? description,
    } as JsonSchema;
  }
  const merged = mergeObjectUnion({ anyOf: distinct });
  if (!merged.anyOf) {
    return { ...merged, description: merged.description ?? description };
  }
  const undescribedVariants = merged.anyOf.map(
    ({ description: _description, ...variant }) => variant,
  );
  return { anyOf: undescribedVariants, description };
}

// The merged enum would otherwise carry only the first variant's description,
// such as "Reuse a saved profile." for a type that also accepts `new`.
// Placeholder descriptions ("Use `new`.") say nothing the enum doesn't.
function describeDiscriminator(
  definitions: JsonSchema[],
  constants: unknown[],
): string | undefined {
  const described = definitions.flatMap((definition, index) =>
    definition.description && !/^Use `[^`]*`\.$/.test(definition.description)
      ? [{ value: constants[index], description: definition.description }]
      : [],
  );
  const descriptions = new Set(described.map(({ description }) => description));
  if (descriptions.size < 2) return undefined;
  return described
    .map(({ value, description }) => `\`${String(value)}\`: ${description}`)
    .join(" ");
}

function readConstant(schema: JsonSchema): unknown {
  if (schema.const !== undefined) return schema.const;
  if (schema.enum?.length === 1) return schema.enum[0];
  return undefined;
}

const DEFAULT_SENTENCE = /(?:^|(?<=[.!?])\s+)Defaults? to [^.]*\.(?=\s|$)/g;

function shortenDescription(schema: JsonSchema): JsonSchema {
  if (!schema.description) return schema;
  const shortened = schema.description.replace(DEFAULT_SENTENCE, "").trim();
  if (!shortened) return schema;
  return { ...schema, description: shortened };
}
