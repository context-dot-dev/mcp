import { z } from "zod";
import type { JsonSchema } from "../context-endpoints";

type SchemaComponents = Record<string, JsonSchema>;

function resolveSchema(
  schema: JsonSchema,
  components: SchemaComponents
): JsonSchema {
  if (!schema.$ref) {
    return schema;
  }

  const prefix = "#/components/schemas/";
  if (!schema.$ref.startsWith(prefix)) {
    return {};
  }

  return components[schema.$ref.slice(prefix.length)] ?? {};
}

function addStringConstraints(
  value: z.ZodString,
  schema: JsonSchema
): z.ZodString {
  let constrained = value;
  if (typeof schema.minLength === "number") {
    constrained = constrained.min(schema.minLength);
  }
  if (typeof schema.maxLength === "number") {
    constrained = constrained.max(schema.maxLength);
  }
  if (schema.pattern) {
    try {
      constrained = constrained.regex(new RegExp(schema.pattern));
    } catch {
      return constrained;
    }
  }
  return constrained;
}

function addNumberConstraints(
  value: z.ZodNumber,
  schema: JsonSchema
): z.ZodNumber {
  let constrained = value;
  if (typeof schema.minimum === "number") {
    constrained = constrained.min(schema.minimum);
  }
  if (typeof schema.maximum === "number") {
    constrained = constrained.max(schema.maximum);
  }
  return constrained;
}

function addArrayConstraints(
  value: z.ZodArray<z.ZodTypeAny>,
  schema: JsonSchema
): z.ZodArray<z.ZodTypeAny> {
  let constrained = value;
  if (typeof schema.minItems === "number") {
    constrained = constrained.min(schema.minItems);
  }
  if (typeof schema.maxItems === "number") {
    constrained = constrained.max(schema.maxItems);
  }
  return constrained;
}

function objectSchemaToZod(
  schema: JsonSchema,
  components: SchemaComponents,
  resolving: Set<string>
): z.ZodTypeAny {
  const required = new Set(schema.required ?? []);
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const [name, property] of Object.entries(schema.properties ?? {})) {
    let propertySchema = schemaToZod(property, components, resolving);
    if (property.description) {
      propertySchema = propertySchema.describe(property.description);
    }
    shape[name] = required.has(name)
      ? propertySchema
      : propertySchema.optional();
  }

  const object = z.object(shape);
  if (schema.additionalProperties === false) {
    return object.strict();
  }
  if (
    schema.additionalProperties &&
    typeof schema.additionalProperties === "object"
  ) {
    return object.catchall(
      schemaToZod(schema.additionalProperties, components, resolving)
    );
  }
  return object.passthrough();
}

function unionSchemaToZod(
  variants: JsonSchema[],
  components: SchemaComponents,
  resolving: Set<string>
): z.ZodTypeAny {
  const schemas = variants.map((variant) =>
    schemaToZod(variant, components, resolving)
  );
  if (schemas.length === 0) {
    return z.unknown();
  }
  if (schemas.length === 1) {
    return schemas[0]!;
  }
  return z.union(
    schemas as [z.ZodTypeAny, z.ZodTypeAny, ...z.ZodTypeAny[]]
  );
}

export function schemaToZod(
  input: JsonSchema,
  components: SchemaComponents,
  resolving: Set<string> = new Set()
): z.ZodTypeAny {
  if (input.$ref) {
    if (resolving.has(input.$ref)) {
      return z.unknown();
    }
    const nextResolving = new Set(resolving).add(input.$ref);
    return schemaToZod(
      resolveSchema(input, components),
      components,
      nextResolving
    );
  }

  if (input.const !== undefined) {
    return z.literal(input.const as z.util.Literal);
  }
  if (input.enum?.length) {
    if (input.enum.every((value) => typeof value === "string")) {
      return z.enum(input.enum as [string, ...string[]]);
    }
    const literals = input.enum.map((value) =>
      z.literal(value as z.util.Literal)
    );
    return literals.length === 1
      ? literals[0]!
      : z.union(
          literals as [
            z.ZodLiteral,
            z.ZodLiteral,
            ...z.ZodLiteral[],
          ]
        );
  }
  if (input.oneOf?.length || input.anyOf?.length) {
    return unionSchemaToZod(
      input.oneOf ?? input.anyOf ?? [],
      components,
      resolving
    );
  }
  if (input.allOf?.length) {
    const [first, ...rest] = input.allOf.map((part) =>
      schemaToZod(part, components, resolving)
    );
    return rest.reduce<z.ZodTypeAny>(
      (combined, current) => z.intersection(combined, current),
      first ?? z.unknown()
    );
  }

  const types = Array.isArray(input.type)
    ? input.type
    : input.type
      ? [input.type]
      : [];
  const nonNullTypes = types.filter((type) => type !== "null");
  let result: z.ZodTypeAny;

  if (nonNullTypes.length > 1) {
    result = unionSchemaToZod(
      nonNullTypes.map((type) => ({ ...input, type })),
      components,
      resolving
    );
  } else {
    switch (nonNullTypes[0]) {
      case "string":
        result = addStringConstraints(z.string(), input);
        break;
      case "integer":
        result = addNumberConstraints(z.number().int(), input);
        break;
      case "number":
        result = addNumberConstraints(z.number(), input);
        break;
      case "boolean":
        result = z.boolean();
        break;
      case "array":
        result = addArrayConstraints(
          z.array(
            input.items
              ? schemaToZod(input.items, components, resolving)
              : z.unknown()
          ),
          input
        );
        break;
      case "object":
        result = objectSchemaToZod(input, components, resolving);
        break;
      default:
        result = input.properties
          ? objectSchemaToZod(input, components, resolving)
          : z.unknown();
    }
  }

  if (
    input.nullable ||
    types.includes("null") ||
    input.enum?.includes(null)
  ) {
    result = result.nullable();
  }
  if (input.description) {
    result = result.describe(input.description);
  }
  return result;
}

export function resolveObjectSchema(
  input: JsonSchema,
  components: SchemaComponents
): JsonSchema | undefined {
  const schema = resolveSchema(input, components);
  const type = Array.isArray(schema.type)
    ? schema.type.find((entry) => entry !== "null")
    : schema.type;
  if (type === "object" || schema.properties) {
    return schema;
  }
  return undefined;
}
