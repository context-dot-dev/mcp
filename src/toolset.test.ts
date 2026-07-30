import assert from "node:assert/strict";
import { test } from "node:test";
import { ENDPOINTS } from "../context-endpoints";
import { selectEndpoints } from "./toolset";

test("toolset exposes only APIs listed in the public documentation", () => {
  const selected = selectEndpoints(ENDPOINTS);
  const names = new Set(selected.map((endpoint) => endpoint.name));

  assert.equal(selected.length, 31);
  assert.ok(names.has("web-scrape-html"));
  assert.ok(names.has("web-scrape-markdown"));
  assert.ok(names.has("web-scrape-sitemap"));
  assert.ok(names.has("brand-retrieve-unified"));
  assert.ok(names.has("web-fonts"));
  assert.ok(names.has("web-naics"));
  assert.ok(names.has("web-sic"));
  assert.ok(names.has("utility-prefetch"));
  assert.ok(names.has("create-monitor"));
  assert.ok(names.has("get-monitor-run"));
  assert.ok(names.has("list-monitor-changes"));
  assert.equal(names.has("create-webdb-collection"), false);
  assert.equal(names.has("people-retrieve"), false);
  assert.equal(names.has("web-competitors"), false);
  assert.equal(names.has("brand-ai-query"), false);
  assert.equal(names.has("brand-retrieve"), false);
  assert.equal(names.has("get-monitor-limits"), false);
});
