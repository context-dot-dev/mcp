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

// llama.cpp-based backends only compile patterns that start with ^ and end
// with $. Pad unanchored ends with [\s\S]* so the match set is unchanged;
// patterns with alternation are left as they are, since padding them would
// need a group to keep the same meaning.
export function anchorPattern(pattern: string): string {
  if (pattern.includes("|")) return pattern;
  const startsAnchored = pattern.startsWith("^");
  const endsAnchored = pattern.endsWith("$") && !pattern.endsWith("\\$");
  if (startsAnchored && endsAnchored) return pattern;
  const body = pattern.slice(
    startsAnchored ? 1 : 0,
    endsAnchored ? -1 : undefined,
  );
  return `^${startsAnchored ? "" : "[\\s\\S]*"}${body}${endsAnchored ? "" : "[\\s\\S]*"}$`;
}

// Lists like the 239 country codes multiply tool definitions and exceed some
// providers' schema limits. Publish them as strings, accept any casing, and
// name the allowed values only when a value is rejected.
const LARGE_ENUM_SIZE = 30;

function enumKey(value: string): string {
  return value.trim().toLowerCase().replace(/[-_\s]/g, "");
}

function largeStringEnum(values: string[]): z.ZodTypeAny {
  const keys = values.map(enumKey);
  // Values whose keys collide (none today) only match exactly.
  const canonical = new Map(
    values
      .filter((_, index) => keys.indexOf(keys[index]!) === keys.lastIndexOf(keys[index]!))
      .map((value) => [enumKey(value), value]),
  );
  const allowed = new Set(values);
  return z
    .string()
    .overwrite((value) => (allowed.has(value) ? value : canonical.get(enumKey(value)) ?? value))
    .refine((value) => allowed.has(value), {
      message: `Expected one of: ${values.join(", ")}`,
    });
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
      // Zod publishes RegExp.source, which escapes "/"; clients that compile
      // the published pattern must see the spec's original string.
      const pattern = anchorPattern(schema.pattern);
      constrained = constrained
        .regex(new RegExp(pattern))
        .meta({ pattern });
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
    const referencedSchema = schemaToZod(
      resolveSchema(input, components),
      components,
      nextResolving
    );
    return input.description
      ? referencedSchema.describe(input.description)
      : referencedSchema;
  }

  if (input.const !== undefined) {
    const schema = z.literal(input.const as z.util.Literal);
    return input.description ? schema.describe(input.description) : schema;
  }
  if (input.enum?.length) {
    let schema: z.ZodTypeAny;
    if (input.enum.every((value) => typeof value === "string")) {
      schema = input.enum.length > LARGE_ENUM_SIZE
        ? largeStringEnum(input.enum as string[])
        : z.enum(input.enum as [string, ...string[]]);
    } else {
      const literals = input.enum.map((value) =>
        z.literal(value as z.util.Literal)
      );
      schema = literals.length === 1
        ? literals[0]!
        : z.union(
            literals as [
              z.ZodLiteral,
              z.ZodLiteral,
              ...z.ZodLiteral[],
            ]
          );
    }
    return input.description ? schema.describe(input.description) : schema;
  }
  if (input.oneOf?.length || input.anyOf?.length) {
    const schema = unionSchemaToZod(
      input.oneOf ?? input.anyOf ?? [],
      components,
      resolving
    );
    return input.description ? schema.describe(input.description) : schema;
  }
  if (input.allOf?.length) {
    const { allOf, ...base } = input;
    // A type-only part such as `{ type: ["string", "null"] }` next to a
    // `$ref` adds nothing to the intersection, but publishing it as `allOf`
    // breaks clients that only support a JSON Schema subset.
    const isTypeOnly = (part: JsonSchema) =>
      Object.keys(part).every((key) => key === "type" || key === "description");
    const parts = allOf.some((part) => !isTypeOnly(part))
      ? allOf.filter((part) => !isTypeOnly(part))
      : allOf;
    const [first, ...rest] = [base, ...parts]
      .map((part) => schemaToZod(part, components, resolving))
      .filter((part) => !(part instanceof z.ZodUnknown));
    const schema = rest.reduce<z.ZodTypeAny>(
      (combined, current) => z.intersection(combined, current),
      first ?? z.unknown()
    );
    return input.description ? schema.describe(input.description) : schema;
  }

  const types = Array.isArray(input.type)
    ? input.type
    : input.type
      ? [input.type]
      : [];
  const nonNullTypes = types.filter((type) => type !== "null");
  if (types.length > 0 && nonNullTypes.length === 0) {
    const schema = z.null();
    return input.description ? schema.describe(input.description) : schema;
  }
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
