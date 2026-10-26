import assert from "node:assert/strict";
import { test } from "node:test";
import { COMPONENT_SCHEMAS, ENDPOINTS } from "../context-endpoints";
import { MCP_DESCRIPTION_REPLACEMENTS } from "./schema-descriptions";

test("every description replacement still matches API text", () => {
  const apiDescriptions = collectDescriptions([ENDPOINTS, COMPONENT_SCHEMAS]);
  const staleReplacements = Object.keys(MCP_DESCRIPTION_REPLACEMENTS).filter(
    (description) => !apiDescriptions.has(description),
  );
  assert.deepEqual(staleReplacements, []);
});

function collectDescriptions(value: unknown): Set<string> {
  if (Array.isArray(value)) {
    return new Set(value.flatMap((entry) => [...collectDescriptions(entry)]));
  }
  if (!value || typeof value !== "object") return new Set();
  return new Set(
    Object.entries(value).flatMap(([name, entry]) =>
      name === "description" && typeof entry === "string"
        ? [entry]
        : [...collectDescriptions(entry)],
    ),
  );
}
