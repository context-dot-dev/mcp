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
  const variantLabels = readVariantLabels(variants);
  const properties = Object.fromEntries(
    propertyNames.map((name) => {
      const definitions = variants.flatMap((variant, index) => {
        const definition = variant.properties?.[name];
        return definition ? [{ definition, label: variantLabels[index] }] : [];
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

// The discriminator is the property each variant pins to its own value, such
// as `type: "page"`; those values name the variants in merged descriptions.
function readVariantLabels(variants: JsonSchema[]): Array<string | undefined> {
  const discriminator = Object.keys(variants[0].properties ?? {}).find((name) => {
    const values = variants.map((variant) =>
      readConstant(variant.properties?.[name] ?? {}),
    );
    return (
      values.every((value) => value !== undefined) &&
      new Set(values).size === variants.length
    );
  });
  return variants.map((variant) =>
    discriminator === undefined
      ? undefined
      : String(readConstant(variant.properties![discriminator]!)),
  );
}

type LabeledDefinition = { definition: JsonSchema; label?: string };
type DefinitionGroup = { definition: JsonSchema; labels: Array<string | undefined> };

function mergeDefinitions(definitions: LabeledDefinition[]): JsonSchema {
  const distinct = groupDefinitions(definitions);
  if (distinct.length === 1) return distinct[0].definition;
  const description = describeAlternatives(distinct);
  const constants = distinct.map(({ definition }) => readConstant(definition));
  const isDiscriminator = constants.every((value) => value !== undefined);
  if (isDiscriminator) {
    const values = [...new Set(constants)];
    return { type: typeof values[0], enum: values, description } as JsonSchema;
  }
  const merged = mergeObjectUnion({
    anyOf: distinct.map(({ definition }) => definition),
  });
  if (!merged.anyOf) {
    return { ...merged, description: merged.description ?? description };
  }
  const undescribedVariants = [
    ...new Map(
      merged.anyOf.map(({ description: _description, ...variant }) => [
        JSON.stringify(variant),
        variant,
      ]),
    ).values(),
  ];
  return undescribedVariants.length === 1
    ? { ...undescribedVariants[0], description }
    : { anyOf: undescribedVariants, description };
}

function groupDefinitions(definitions: LabeledDefinition[]): DefinitionGroup[] {
  const groups = new Map<string, DefinitionGroup>();
  for (const { definition, label } of definitions) {
    const key = JSON.stringify(definition);
    const group = groups.get(key);
    groups.set(key, {
      definition,
      labels: [...(group?.labels ?? []), label],
    });
  }
  return [...groups.values()];
}

// A merged property keeps what it means in every variant, labeled by variant,
// instead of only the first variant's description.
function describeAlternatives(groups: DefinitionGroup[]): string | undefined {
  const descriptions = [
    ...new Set(
      groups.flatMap(({ definition }) =>
        definition.description ? [definition.description] : [],
      ),
    ),
  ];
  const isLabeled = groups.every(({ labels }) =>
    labels.every((label) => label !== undefined),
  );
  if (descriptions.length < 2 || !isLabeled) return descriptions[0];
  const labeledDescriptions = groups.flatMap(({ definition, labels }) => {
    if (!definition.description) return [];
    const names = labels.map((label) => `\`${label}\``);
    const isSelfLabeled = names.every((name) =>
      definition.description!.includes(name),
    );
    return [
      isSelfLabeled
        ? definition.description
        : `${names.join(", ")}: ${definition.description}`,
    ];
  });
  return [...new Set(labeledDescriptions)].join(" ");
}

function readConstant(schema: JsonSchema): unknown {
  if (schema.const !== undefined) return schema.const;
  if (schema.enum?.length === 1) return schema.enum[0];
  return undefined;
}

// A default sentence is dropped only when the schema publishes that default as
// a keyword. Conditional or relative defaults, such as "24 hours before `to`",
// have no keyword, and sentences that say more than the default are kept.
const DEFAULT_SENTENCE = /(?:^|(?<=[.!?])\s+)Defaults? to [^.;]*\.(?=\s|$)/g;

function shortenDescription(schema: JsonSchema): JsonSchema {
  if (!schema.description || schema.default === undefined) return schema;
  const shortened = schema.description.replace(DEFAULT_SENTENCE, "").trim();
  if (!shortened) return schema;
  return { ...schema, description: shortened };
}
