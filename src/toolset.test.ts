import assert from "node:assert/strict";
import { test } from "node:test";
import { ENDPOINTS } from "../context-endpoints";
import { selectEndpoints } from "./toolset";

test("recommended toolset keeps primary API and monitor operations", () => {
  const selected = selectEndpoints(ENDPOINTS);
  const names = new Set(selected.map((endpoint) => endpoint.name));

  assert.equal(selected.length, 28);
  assert.ok(names.has("web-scrape-markdown"));
  assert.ok(names.has("create-monitor"));
  assert.ok(names.has("list-monitor-changes"));
  assert.equal(names.has("create-webdb-collection"), false);
  assert.equal(names.has("brand-retrieve-unified"), false);
});

test("full toolset exposes every generated API operation", () => {
  assert.equal(selectEndpoints(ENDPOINTS, "full").length, 68);
});
