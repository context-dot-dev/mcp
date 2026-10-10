import { isDeepStrictEqual } from "node:util";
import type { JsonSchema } from "../context-endpoints";
import { repairToolSpecificArguments } from "./tool-argument-repairs";

// Models and MCP clients often send arguments in a near-miss shape: opencode
// with Qwen or Nemotron sends nested objects and arrays as JSON strings, some
// clients omit `arguments` for tools without parameters, and models trained on
// strict function calling fill unused optional fields with null or "". Strict
// validation rejects all of these, and the model usually repeats the same call.
// Repair only what the published schema makes unambiguous; anything else is
// left for normal validation to report.

function alternatives(schema: JsonSchema): JsonSchema[] {
  return [
    schema,
    ...[...(schema.anyOf ?? []), ...(schema.oneOf ?? []), ...(schema.allOf ?? [])]
      .flatMap(alternatives),
  ];
}

function hasType(schema: JsonSchema, type: string): boolean {
  return Array.isArray(schema.type)
    ? schema.type.includes(type)
    : schema.type === type;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// `{}` and other untyped leaves accept any value, so nothing in them is repaired.
function acceptsAnything(candidates: JsonSchema[]): boolean {
  return candidates.some(
    (c) =>
      c.type === undefined &&
      c.enum === undefined &&
      c.const === undefined &&
      c.anyOf === undefined &&
      c.oneOf === undefined &&
      c.allOf === undefined &&
      c.properties === undefined &&
      c.items === undefined,
  );
}

function acceptsNull(candidates: JsonSchema[]): boolean {
  return candidates.some(
    (c) =>
      hasType(c, "null") ||
      c.nullable === true ||
      c.const === null ||
      (c.enum?.includes(null) ?? false),
  );
}

function acceptsEmptyString(candidates: JsonSchema[]): boolean {
  return candidates.some((c) => {
    if (!hasType(c, "string")) return false;
    if (c.enum && !c.enum.includes("")) return false;
    if (c.const !== undefined && c.const !== "") return false;
    if ((c.minLength ?? 0) > 0) return false;
    if (c.pattern) {
      try {
        return new RegExp(c.pattern).test("");
      } catch {
        return true;
      }
    }
    return true;
  });
}

// `Url`, `monitorId`, `timeout_opts`, and `return_partial` all name a declared
// key or enum value with different casing or separators.
function normalizedName(name: string): string {
  return name.trim().toLowerCase().replace(/[-_\s]/g, "");
}

function stringEnumValues(candidates: JsonSchema[]): string[] {
  return [...new Set(candidates.flatMap((c) => [
    ...(c.enum ?? []).filter((v): v is string => typeof v === "string"),
    ...(typeof c.const === "string" ? [c.const] : []),
  ]))];
}

function repairString(value: string, candidates: JsonSchema[]): unknown {
  if (acceptsAnything(candidates)) return value;
  const enumValues = stringEnumValues(candidates);
  const acceptsFreeString = candidates.some(
    (c) => hasType(c, "string") && c.enum === undefined && c.const === undefined,
  );
  if (enumValues.length > 0 && !enumValues.includes(value) && !acceptsFreeString) {
    const matches = enumValues.filter(
      (option) => normalizedName(option) === normalizedName(value),
    );
    if (matches.length === 1) return matches[0];
  }
  if (candidates.some((c) => hasType(c, "string"))) return value;

  const trimmed = value.trim();
  const acceptsObject = candidates.some((c) => hasType(c, "object"));
  const acceptsArray = candidates.some((c) => hasType(c, "array"));
  if ((acceptsObject && trimmed.startsWith("{")) || (acceptsArray && trimmed.startsWith("["))) {
    try {
      const parsed: unknown = JSON.parse(trimmed);
      if (isPlainObject(parsed) && acceptsObject) return parsed;
      if (Array.isArray(parsed) && acceptsArray) return parsed;
    } catch {
      // Leave malformed JSON for validation to report.
    }
    return value;
  }
  if (
    candidates.some((c) => hasType(c, "number") || hasType(c, "integer")) &&
    /^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(trimmed)
  ) {
    return Number(trimmed);
  }
  if (candidates.some((c) => hasType(c, "boolean"))) {
    const lowered = trimmed.toLowerCase();
    if (lowered === "true") return true;
    if (lowered === "false") return false;
  }
  return value;
}

// In a union of objects such as `{ format: "html", options }` versus
// `{ format: "markdown", options }`, the value's discriminator picks the
// member; repair against that member alone so its own keys apply.
function matchingDiscriminator(
  members: JsonSchema[],
  value: Record<string, unknown>,
): JsonSchema[] {
  if (members.length < 2) return members;
  const matching = members.filter((member) =>
    Object.entries(member.properties ?? {}).every(([name, property]) => {
      const fixed =
        property.const ?? (property.enum?.length === 1 ? property.enum[0] : undefined);
      const actual = value[name];
      if (fixed === undefined || actual === undefined) return true;
      return typeof fixed === "string" && typeof actual === "string"
        ? normalizedName(fixed) === normalizedName(actual)
        : fixed === actual;
    }),
  );
  return matching.length > 0 ? matching : members;
}

function renameNearMissKeys(
  value: Record<string, unknown>,
  declaredNames: Set<string>,
): Record<string, unknown> {
  if (declaredNames.size === 0) return value;
  const findSameNames = (name: string, names: Iterable<string>) =>
    [...names].filter((other) => normalizedName(other) === normalizedName(name));
  const renamed: Record<string, unknown> = {};
  for (const [name, entry] of Object.entries(value)) {
    const declaredMatches = declaredNames.has(name) ? [name] : findSameNames(name, declaredNames);
    const declared = declaredMatches.length === 1 ? declaredMatches[0] : undefined;
    const isOnlySentSpelling =
      declared !== undefined && findSameNames(declared, Object.keys(value)).length === 1;
    const target = isOnlySentSpelling ? declared : name;
    renamed[target] = entry;
  }
  // Older tool versions took a flat timeoutMS; the current shape nests it.
  const legacyTimeout = ["timeoutMS", "timeoutMs", "timeout_ms"].find(
    (name) => typeof renamed[name] === "number",
  );
  if (
    legacyTimeout &&
    declaredNames.has("timeoutOpts") &&
    !declaredNames.has(legacyTimeout) &&
    renamed.timeoutOpts === undefined
  ) {
    const { [legacyTimeout]: milliseconds, ...rest } = renamed;
    return { ...rest, timeoutOpts: { milliseconds } };
  }
  return renamed;
}

// Out-of-range counts, limits, and durations (numResults: 5 against a minimum
// of 10) still say what the model wants; clamp them instead of failing. Number
// fields such as 0-1 thresholds are left alone because a value out of range
// there usually means a different scale.
function clampInteger(value: number, candidates: JsonSchema[]): number {
  const integer = candidates.find((c) => hasType(c, "integer"));
  if (!integer || !Number.isInteger(value)) return value;
  return Math.min(
    integer.maximum ?? Number.POSITIVE_INFINITY,
    Math.max(integer.minimum ?? Number.NEGATIVE_INFINITY, value),
  );
}

function mergedSchema(schemas: JsonSchema[]): JsonSchema | undefined {
  if (schemas.length === 0) return undefined;
  return schemas.length === 1 ? schemas[0] : { anyOf: schemas };
}

export function repairToolArgument(
  value: unknown,
  schema: JsonSchema,
  dropUnknownKeys = true,
): unknown {
  const candidates = alternatives(schema);
  const repaired =
    typeof value === "string" ? repairString(value, candidates) : value;

  if (Array.isArray(repaired)) {
    const itemSchema = mergedSchema(
      candidates.flatMap((c) => (c.items ? [c.items] : [])),
    );
    return itemSchema
      ? repaired.map((item) => repairToolArgument(item, itemSchema, dropUnknownKeys))
      : repaired;
  }

  if (typeof repaired === "number") return clampInteger(repaired, candidates);
  if (!isPlainObject(repaired)) return repaired;

  const allObjectCandidates = candidates.filter(
    (c) => hasType(c, "object") || c.properties !== undefined,
  );
  const objectCandidates = matchingDiscriminator(allObjectCandidates, repaired);
  // A key that another union member declares signals a conflicting choice
  // (`type: "batch"` with `monitor_id`); keep it so validation reports it.
  const declaredByAnyMember = new Set(
    allObjectCandidates.flatMap((c) => Object.keys(c.properties ?? {})),
  );
  const required = new Set(objectCandidates.flatMap((c) => c.required ?? []));
  // Unknown keys are already ignored at the top level. Inside closed objects
  // they fail validation instead: options from older schema versions
  // (`shouldParse`, `timeoutMS`), and discriminators such as `type` that
  // ChatGPT adds to union members. They can only fail, so ignore them here too.
  const objectMembers = objectCandidates;
  const isClosed =
    objectMembers.length > 0 &&
    objectMembers.every((c) => c.additionalProperties === false);
  const declaredNames = new Set(
    objectMembers.flatMap((c) => Object.keys(c.properties ?? {})),
  );
  const entries: Array<[string, unknown]> = [];
  for (const [name, property] of Object.entries(
    renameNearMissKeys(repaired, declaredNames),
  )) {
    if (
      dropUnknownKeys &&
      isClosed &&
      !declaredByAnyMember.has(name)
    ) {
      continue;
    }
    const propertySchema = mergedSchema(
      objectMembers.flatMap((c) => {
        const named = c.properties && Object.hasOwn(c.properties, name) ? c.properties[name] : undefined;
        if (named) return [named];
        return isPlainObject(c.additionalProperties)
          ? [c.additionalProperties as JsonSchema]
          : [];
      }),
    );
    if (!propertySchema) {
      entries.push([name, property]);
      continue;
    }
    const propertyCandidates = alternatives(propertySchema);
    const isUnsetPlaceholder =
      !required.has(name) &&
      !acceptsAnything(propertyCandidates) &&
      ((property === null && !acceptsNull(propertyCandidates)) ||
        (property === "" && !acceptsEmptyString(propertyCandidates)));
    if (isUnsetPlaceholder) continue;
    const repairedProperty = repairToolArgument(
      property,
      propertySchema,
      dropUnknownKeys,
    );
    // An options object that held only ignored keys is omitted, not sent empty.
    const emptiedByRepair =
      !required.has(name) &&
      isPlainObject(property) &&
      Object.keys(property).length > 0 &&
      isPlainObject(repairedProperty) &&
      Object.keys(repairedProperty).length === 0;
    if (!emptiedByRepair) entries.push([name, repairedProperty]);
  }
  return Object.fromEntries(entries);
}

// Models sometimes nest a top-level parameter inside an options object, for
// example `sharedParams: { formats, maxAgeMs }`. Move such keys back to the top
// level when the nested object does not declare them and the top level does.
function hoistMisplacedParameters(
  args: Record<string, unknown>,
  schema: JsonSchema,
): Record<string, unknown> {
  const topLevel = schema.properties ?? {};
  const hoisted: Record<string, unknown> = { ...args };
  for (const [name, value] of Object.entries(args)) {
    const nested = Object.hasOwn(topLevel, name) ? topLevel[name] : undefined;
    if (!nested || !isPlainObject(value)) continue;
    const members = alternatives(nested).filter(
      (c) => hasType(c, "object") || c.properties !== undefined,
    );
    // Open objects (maps, free-form JSON) may legitimately hold any key.
    if (
      members.length === 0 ||
      members.some((c) => c.additionalProperties !== false)
    ) {
      continue;
    }
    const declared = new Set(members.flatMap((c) => Object.keys(c.properties ?? {})));
    const remaining: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value)) {
      if (!declared.has(key) && Object.hasOwn(topLevel, key) && hoisted[key] === undefined) {
        hoisted[key] = entry;
      } else {
        remaining[key] = entry;
      }
    }
    hoisted[name] = remaining;
  }
  return hoisted;
}

// `{ id }` for a tool whose only required identifier is, say, `batch_id`.
function renameGenericId(value: unknown, schema: JsonSchema): unknown {
  if (!isPlainObject(value) || value.id === undefined) return value;
  const declared = schema.properties ?? {};
  if (Object.hasOwn(declared, "id")) return value;
  const ids = (schema.required ?? []).filter((name) => name.endsWith("_id"));
  if (ids.length !== 1 || value[ids[0]!] !== undefined) return value;
  const { id, ...rest } = value;
  return { ...rest, [ids[0]!]: id };
}

// Some clients wrap the real arguments one level too deep, for example
// `{ server, tool, arguments: {...} }`.
function unwrapArguments(value: unknown, schema: JsonSchema): unknown {
  if (!isPlainObject(value)) return value;
  const declared = schema.properties ?? {};
  const wrapperKey = ["arguments", "args", "params", "parameters"].find(
    (key) => !Object.hasOwn(declared, key) && isPlainObject(value[key]),
  );
  if (!wrapperKey) return value;
  const inner = value[wrapperKey] as Record<string, unknown>;
  const outerHasDeclared = Object.keys(value).some((key) => Object.hasOwn(declared, key));
  return outerHasDeclared ? value : inner;
}

export function repairToolArguments(
  value: unknown,
  schema: JsonSchema,
  toolName = "",
): unknown {
  // Tools without parameters are often called with no arguments at all.
  if (value === undefined || value === null || value === "") return {};
  const parsed = repairToolArgument(
    renameGenericId(unwrapArguments(value, schema), schema),
    schema,
    false,
  );
  if (!isPlainObject(parsed)) return parsed;
  const relocated = repairToolSpecificArguments(
    toolName,
    hoistMisplacedParameters(parsed, schema),
  );
  return repairToolArgument(relocated, schema);
}

// Validation strips undeclared keys, so `max_pages` or an `{ arguments }`
// wrapper on an all-optional tool would validate and silently lose its value.
export function restoreUndeclaredKeys(value: unknown, schema: JsonSchema): unknown {
  if (!isPlainObject(value)) return value;
  const declaredNames = new Set(Object.keys(schema.properties ?? {}));
  const hasUndeclaredKey = Object.keys(value).some((key) => !declaredNames.has(key));
  if (!hasUndeclaredKey) return value;
  const unwrapped = unwrapArguments(value, schema);
  const restored = isPlainObject(unwrapped)
    ? renameNearMissKeys(unwrapped, declaredNames)
    : unwrapped;
  return isDeepStrictEqual(restored, value) ? value : restored;
}
