import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { ENDPOINTS } from "../context-endpoints";
import { LEGACY_TOOL_ANNOTATIONS, selectEndpoints } from "./toolset";

test("toolset follows API reference order and excludes prefetch", () => {
  const selected = selectEndpoints([...ENDPOINTS].reverse());
  const names = new Set(selected.map((endpoint) => endpoint.name));

  assert.equal(selected.length, 44);
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
      "POST /company/search",
      "POST /people/search",
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
      "GET /org/logs",
      "GET /org/logs/{request_id}",
      "GET /org/browser/profiles",
      "GET /org/usage",
      "GET /org/usage/history",
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
    /100,000.*get-batch.*get-batch-results/i,
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
    /exactly one of: query.*companyName.*web-search/i,
  );
  assert.match(
    tools.get("company-search")?.description ?? "",
    /plain-language.*filters\.countries.*next_cursor.*brand-search.*people-search/i,
  );
  assert.match(
    tools.get("people-search")?.description ?? "",
    /plain-language.*filters\.countries.*next_cursor.*people-enrich.*company-search/i,
  );
  assert.match(
    tools.get("brand-search")?.description ?? "",
    /company-search/,
  );
  assert.match(
    tools.get("people-enrich")?.description ?? "",
    /people-search/,
  );
  assert.match(
    tools.get("list-browser-profiles")?.description ?? "",
    /web-scrape.*sharedParams\.profile.*existing/i,
  );
  assert.match(
    tools.get("list-logs")?.description ?? "",
    /errors_only.*request_id.*get-log/i,
  );
  assert.match(
    tools.get("get-usage")?.description ?? "",
    /refill.*get-usage-history/i,
  );
  assert.match(
    tools.get("get-usage-history")?.description ?? "",
    /group_by.*get-usage/i,
  );
  assert.match(
    tools.get("submit-feedback")?.description ?? "",
    /category.*note.*request_id.*feedback_id/i,
  );
  assert.match(
    tools.get("run-monitor-now")?.description ?? "",
    /409 MONITOR_PAUSED.*update-monitor.*superseded/,
  );
  assert.match(
    tools.get("update-monitor")?.description ?? "",
    /resuming a paused monitor.*runs it promptly/,
  );

  assert.deepEqual(tools.get("submit-batch")?.annotations, {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: true,
  });
  assert.deepEqual(tools.get("delete-batch")?.annotations, {
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: true,
    openWorldHint: false,
  });
  assert.deepEqual(tools.get("list-batches")?.annotations, {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
  });
  assert.deepEqual(tools.get("list-logs")?.annotations, {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
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
    "company-search",
    "people-search",
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
  // Each call can create a batch, monitor, run, secret, webhook attempt, or
  // feedback record, or repeat browser actions on a target site.
  const nonIdempotentTools = new Set([
    "web-scrape",
    "submit-batch",
    "create-monitor",
    "run-monitor-now",
    "rotate-monitor-webhook-secret",
    "retry-webhook-delivery",
    "submit-feedback",
  ]);

  for (const tool of selectEndpoints(ENDPOINTS)) {
    const behavior = readOnlyExternalTools.has(tool.name)
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
    const expected = {
      ...behavior,
      idempotentHint: !nonIdempotentTools.has(tool.name),
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
    idempotentHint: true,
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

test("legacy tools exist and those accepting browser actions require write scope", () => {
  for (const [name, annotations] of Object.entries(LEGACY_TOOL_ANNOTATIONS)) {
    const endpoint = ENDPOINTS.find((entry) => entry.name === name);
    assert.ok(endpoint, name);
    const acceptsActions = endpoint.parameters.some(
      (parameter) => parameter.name === "actions",
    );
    if (acceptsActions) assert.equal(annotations.readOnlyHint, false, name);
  }
  const listed = new Set(selectEndpoints(ENDPOINTS).map((endpoint) => endpoint.name));
  for (const name of Object.keys(LEGACY_TOOL_ANNOTATIONS)) {
    assert.equal(listed.has(name), false, name);
  }
});
