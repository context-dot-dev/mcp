import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { ENDPOINTS } from "../context-endpoints";
import { selectEndpoints } from "./toolset";

test("toolset follows API reference order and excludes prefetch", () => {
  const selected = selectEndpoints([...ENDPOINTS].reverse());
  const names = new Set(selected.map((endpoint) => endpoint.name));

  assert.equal(selected.length, 39);
  assert.equal(names.size, selected.length);
  assert.deepEqual(
    selected.map((endpoint) => `${endpoint.method} ${endpoint.path}`),
    [
      "POST /web/scrape",
      "GET /web/urls",
      "POST /web/crawl",
      "POST /web/search",
      "POST /web/answers",
      "POST /brand/retrieve",
      "GET /brand/search",
      "GET /web/styleguide",
      "POST /people/enrich",
      "POST /news/search",
      "POST /parse",
      "POST /batch/submit",
      "GET /batch/list",
      "GET /batch/{batch_id}",
      "GET /batch/{batch_id}/results",
      "POST /batch/{batch_id}/cancel",
      "DELETE /batch/{batch_id}",
      "POST /monitors",
      "GET /monitors",
      "GET /monitors/{monitor_id}",
      "PATCH /monitors/{monitor_id}",
      "DELETE /monitors/{monitor_id}",
      "GET /monitors/limits",
      "GET /monitors/credit-usage",
      "POST /monitors/{monitor_id}/run",
      "GET /monitors/{monitor_id}/runs",
      "GET /monitors/{monitor_id}/runs/{run_id}",
      "GET /monitors/runs",
      "GET /monitors/{monitor_id}/changes",
      "GET /monitors/changes/{change_id}",
      "GET /monitors/changes",
      "POST /monitors/{monitor_id}/webhook/rotate-secret",
      "POST /webhooks/deliveries",
      "GET /webhooks/deliveries/{delivery_id}",
      "GET /webhooks/deliveries/{delivery_id}/attempts",
      "POST /webhooks/deliveries/{delivery_id}/retry",
      "GET /logs",
      "GET /logs/{request_id}",
      "POST /feedback",
    ],
  );
  for (const removedName of [
    "utility-prefetch",
    "brand-prefetch",
    "brand-prefetch-by-email",
    "web-scrape-sitemap",
    "web-extract",
    "web-fonts",
    "web-naics",
    "web-sic",
  ]) {
    assert.equal(names.has(removedName), false, removedName);
  }
});

test("tool descriptions route agents between overlapping workflows", () => {
  const tools = new Map(
    selectEndpoints(ENDPOINTS).map((endpoint) => [endpoint.name, endpoint]),
  );

  assert.match(
    tools.get("web-scrape")?.description ?? "",
    /HTML.*Markdown.*screenshot.*images.*highlights.*JSON.*product/i,
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
  assert.match(
    tools.get("web-answers")?.description ?? "",
    /web-search.*web-scrape.*jsonParams/i,
  );
  assert.match(
    tools.get("web-search")?.description ?? "",
    /web-answers.*JSON answer/i,
  );
  assert.match(
    tools.get("get-news-search")?.description ?? "",
    /exactly one.*web-search.*broader topics/i,
  );
  assert.match(
    tools.get("list-logs")?.description ?? "",
    /errors_only.*request_id.*get-log/i,
  );
  assert.match(
    tools.get("submit-feedback")?.description ?? "",
    /category.*note.*request_id.*feedback_id/i,
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
  assert.deepEqual(tools.get("list-logs")?.annotations, {
    readOnlyHint: true,
    destructiveHint: false,
    openWorldHint: false,
  });
});

test("every public tool has annotations that match its most privileged behavior", () => {
  const readOnlyExternalTools = new Set([
    "web-map",
    "web-crawl",
    "web-search",
    "web-answers",
    "get-news-search",
    "brand-retrieve-unified",
    "brand-search",
    "web-styleguide",
    "people-enrich",
  ]);
  const additiveExternalTools = new Set([
    "create-monitor",
    "submit-batch",
    "retry-webhook-delivery",
  ]);
  const destructiveExternalTools = new Set([
    "web-scrape",
    "run-monitor-now",
    "update-monitor",
  ]);
  const additivePrivateTools = new Set(["parse-document", "submit-feedback"]);
  const destructivePrivateTools = new Set([
    "delete-monitor",
    "cancel-batch",
    "delete-batch",
    "rotate-monitor-webhook-secret",
  ]);

  for (const tool of selectEndpoints(ENDPOINTS)) {
    const expected = readOnlyExternalTools.has(tool.name)
      ? {
          readOnlyHint: true,
          destructiveHint: false,
          openWorldHint: true,
        }
      : additivePrivateTools.has(tool.name)
        ? {
            readOnlyHint: false,
            destructiveHint: false,
            openWorldHint: false,
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
    $schema: string;
    schema_version: number;
    test_cases: unknown[];
    negative_test_cases: unknown[];
    tools: Record<
      string,
      {
        annotations: Record<string, unknown>;
        justifications: Record<string, unknown>;
      }
    >;
  };
  assert.equal(
    submission.$schema,
    "https://developers.openai.com/apps-sdk/schemas/chatgpt-app-submission.v1.json",
  );
  assert.equal(submission.schema_version, 1);
  assert.equal(submission.test_cases.length, 5);
  assert.equal(submission.negative_test_cases.length, 3);
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
