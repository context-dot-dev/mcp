import assert from "node:assert/strict";
import { test } from "node:test";
import { contextApiError } from "./feedback";

function message(errorCode: string): string {
  const result = contextApiError(
    "web-scrape",
    `Context API error [${errorCode}]`,
    errorCode,
  );
  const first = result.content[0];
  assert.equal(first?.type, "text");
  return first.text;
}

test("gives agents bounded retry guidance for stable API errors", () => {
  assert.match(message("INPUT_VALIDATION_ERROR"), /Retry: no/);
  assert.match(message("INTERNAL_ERROR"), /Retry: at most once/);
  assert.match(message("BATCH_NOT_COMPLETED"), /Retry: later/);
  assert.match(message("USAGE_EXCEEDED"), /Do not retry until credits/);
});
