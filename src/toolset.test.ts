import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { ENDPOINTS } from "../context-endpoints";
import { selectEndpoints } from "./toolset";

test("toolset exposes the curated public API surface", () => {
  const selected = selectEndpoints(ENDPOINTS);
  const names = new Set(selected.map((endpoint) => endpoint.name));

  assert.equal(selected.length, 33);
  assert.ok(names.has("web-scrape-html"));
  assert.ok(names.has("web-scrape-markdown"));
  assert.ok(names.has("web-scrape-sitemap"));
  assert.ok(names.has("brand-retrieve-unified"));
  assert.ok(names.has("web-fonts"));
  assert.ok(names.has("web-naics"));
  assert.ok(names.has("web-sic"));
  assert.ok(names.has("create-monitor"));
  assert.ok(names.has("get-monitor-run"));
  assert.ok(names.has("list-monitor-changes"));
  assert.ok(names.has("submit-batch"));
  assert.ok(names.has("list-batches"));
  assert.ok(names.has("get-batch"));
  assert.ok(names.has("get-batch-results"));
  assert.ok(names.has("cancel-batch"));
  assert.ok(names.has("delete-batch"));
  assert.equal(names.has("brand-ai-product"), false);
  assert.equal(names.has("brand-ai-products"), false);
  assert.equal(names.has("utility-prefetch"), false);
  assert.equal(names.has("rotate-monitor-webhook-secret"), false);
  assert.equal(names.has("create-webdb-collection"), false);
  assert.equal(names.has("people-retrieve"), false);
  assert.equal(names.has("web-competitors"), false);
  assert.equal(names.has("brand-ai-query"), false);
  assert.equal(names.has("brand-retrieve"), false);
  assert.equal(names.has("get-monitor-limits"), false);
  for (const endpoint of selected) {
    assert.equal(
      endpoint.parameters.some((parameter) => parameter.name === "headers"),
      false,
      endpoint.name,
    );
  }
});

test("tool descriptions route agents between overlapping workflows", () => {
  const tools = new Map(
    selectEndpoints(ENDPOINTS).map((endpoint) => [endpoint.name, endpoint]),
  );

  assert.match(
    tools.get("web-scrape-markdown")?.description ?? "",
    /web-search.*web-crawl.*submit-batch/i,
  );
  assert.match(
    tools.get("submit-batch")?.description ?? "",
    /25,000.*get-batch.*get-batch-results/i,
  );
  assert.match(
    tools.get("create-monitor")?.description ?? "",
    /recurring.*not a one-time scrape/i,
  );
  assert.match(
    tools.get("brand-retrieve-unified")?.description ?? "",
    /get-brand.*raw structured data/i,
  );

  assert.deepEqual(tools.get("submit-batch")?.annotations, {
    readOnlyHint: false,
    destructiveHint: false,
    openWorldHint: true,
  });
  assert.deepEqual(tools.get("delete-batch")?.annotations, {
    readOnlyHint: false,
    destructiveHint: true,
    openWorldHint: false,
  });
  assert.deepEqual(tools.get("list-batches")?.annotations, {
    readOnlyHint: true,
    destructiveHint: false,
    openWorldHint: false,
  });
});

test("every public tool has annotations that match its most privileged behavior", () => {
  const interactiveExternalTools = new Set([
    "web-scrape-html",
    "web-scrape-markdown",
    "web-scrape-images",
  ]);
  const readOnlyExternalTools = new Set([
    "web-scrape-sitemap",
    "web-crawl",
    "web-extract",
    "web-search",
    "brand-retrieve-unified",
    "web-styleguide",
    "web-fonts",
    "web-screenshot",
    "web-naics",
    "web-sic",
  ]);
  const additiveExternalTools = new Set(["create-monitor", "submit-batch"]);
  const destructiveExternalTools = new Set([
    "run-monitor-now",
    "update-monitor",
  ]);
  const destructivePrivateTools = new Set([
    "delete-monitor",
    "cancel-batch",
    "delete-batch",
  ]);

  for (const tool of selectEndpoints(ENDPOINTS)) {
    const expected = interactiveExternalTools.has(tool.name)
      ? {
          readOnlyHint: false,
          destructiveHint: true,
          openWorldHint: true,
        }
      : readOnlyExternalTools.has(tool.name)
        ? {
            readOnlyHint: true,
            destructiveHint: false,
            openWorldHint: true,
          }
        : additiveExternalTools.has(tool.name)
          ? {
              readOnlyHint: false,
              destructiveHint: false,
              openWorldHint: true,
            }
        : destructiveExternalTools.has(tool.name)
        ? {
            readOnlyHint: false,
            destructiveHint: true,
            openWorldHint: true,
          }
        : destructivePrivateTools.has(tool.name)
          ? {
              readOnlyHint: false,
              destructiveHint: true,
              openWorldHint: false,
            }
          : {
              readOnlyHint: true,
              destructiveHint: false,
              openWorldHint: false,
            };
    assert.deepEqual(tool.annotations, expected, tool.name);
  }
});

test("submission annotations and justifications match the published tools", () => {
  const submission = JSON.parse(
    readFileSync(
      new URL("../chatgpt-app-submission.json", import.meta.url),
      "utf8",
    ),
  ) as {
    tools: Record<
      string,
      {
        annotations: Record<string, unknown>;
        justifications: Record<string, unknown>;
      }
    >;
  };
  const publishedAnnotations = new Map(
    selectEndpoints(ENDPOINTS).map((tool) => [tool.name, tool.annotations]),
  );
  publishedAnnotations.set("get-brand", {
    readOnlyHint: true,
    destructiveHint: false,
    openWorldHint: true,
  });

  assert.deepEqual(
    new Set(Object.keys(submission.tools)),
    new Set(publishedAnnotations.keys()),
  );
  for (const [name, annotations] of publishedAnnotations) {
    const submittedTool = submission.tools[name];
    assert.ok(submittedTool, `missing submission metadata for ${name}`);
    assert.deepEqual(submittedTool.annotations, annotations, name);
    for (const key of [
      "read_only_justification",
      "destructive_justification",
      "open_world_justification",
    ]) {
      assert.equal(
        typeof submittedTool.justifications[key],
        "string",
        `${name}.${key}`,
      );
      assert.ok(
        (submittedTool.justifications[key] as string).trim().length > 0,
        `${name}.${key}`,
      );
    }
  }
});
