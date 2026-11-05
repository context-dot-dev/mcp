import assert from "node:assert/strict";
import { test } from "node:test";
import { COMPONENT_SCHEMAS, ENDPOINTS } from "../context-endpoints";
import { MCP_DESCRIPTION_REPLACEMENTS, replaceDescription } from "./schema-descriptions";

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

test("batch result pages are described by the MCP response limit, not the API's 8 MB", () => {
  const replaced = replaceDescription(
    "Records per page. Defaults to 25. A page can close early so its payload stays under ~8 MB; rely on next_cursor rather than counting records.",
  );
  assert.doesNotMatch(replaced!, /8 MB/);
  assert.match(replaced!, /next_cursor/);
});
