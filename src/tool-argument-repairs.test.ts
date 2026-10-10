import assert from "node:assert/strict";
import { test } from "node:test";
import {
  completeValidArguments,
  repairToolSpecificArguments,
  reroutedToolName,
  VALIDATION_HINTS,
} from "./tool-argument-repairs";

test("web-scrape defaults to Markdown and accepts format lists", () => {
  const scrape = (args: Record<string, unknown>) =>
    repairToolSpecificArguments("web-scrape", { url: "https://a.test", ...args });

  assert.deepEqual(scrape({}).formats, { markdown: true });
  assert.deepEqual(scrape({ formats: ["Markdown", "html", "pdf"] }).formats, {
    markdown: true,
    html: true,
  });
  assert.deepEqual(scrape({ formats: "markdown, screenshot" }).formats, {
    markdown: true,
    screenshot: true,
  });
});

test("web-scrape requests the formats whose options were sent", () => {
  assert.deepEqual(
    repairToolSpecificArguments("web-scrape", {
      url: "https://a.test",
      formats: { markdown: { includeLinks: false }, html: true },
      jsonParams: { schema: { type: "object" } },
    }),
    {
      url: "https://a.test",
      formats: { markdown: true, html: true, json: true },
      markdownParams: { includeLinks: false },
      jsonParams: { schema: { type: "object" } },
    },
  );
  assert.deepEqual(
    repairToolSpecificArguments("web-scrape", {
      url: "https://a.test",
      formats: { markdown: false, html: true },
      markdownParams: { includeLinks: true },
    }).formats,
    { markdown: false, html: true },
  );
});

test("web-answers accepts query and a JSON Schema for the answer shape", () => {
  assert.deepEqual(
    repairToolSpecificArguments("web-answers", {
      query: "Who founded Context?",
      schema: {
        type: "object",
        properties: {
          founders: { type: "array", items: { type: "string" } },
          year: { type: "integer" },
          public: { type: "boolean" },
        },
      },
    }),
    {
      task: "Who founded Context?",
      json_format: { founders: [""], year: 0, public: false },
    },
  );
  const example = { task: "x", json_format: { type: "company", properties: 3 } };
  assert.deepEqual(repairToolSpecificArguments("web-answers", example), example);
});

test("web-map takes the host from a URL", () => {
  assert.deepEqual(
    repairToolSpecificArguments("web-map", { url: "https://docs.a.test/start" }),
    { domain: "docs.a.test" },
  );
  assert.deepEqual(
    repairToolSpecificArguments("web-map", { domain: "a.test", url: "https://b.test" }),
    { domain: "a.test", url: "https://b.test" },
  );
  assert.deepEqual(
    repairToolSpecificArguments("web-map", { domain: "https://a.test/docs" }),
    { domain: "https://a.test/docs" },
  );
});

test("web-scrape reads format choices from aliases and web-search options", () => {
  const scrape = (args: Record<string, unknown>) =>
    repairToolSpecificArguments("web-scrape", { url: "https://a.test", ...args });

  assert.deepEqual(scrape({ format: "markdown" }).formats, { markdown: true });
  assert.deepEqual(
    scrape({ sharedParams: { outputFormat: "html", waitForMs: 500 } }),
    { url: "https://a.test", formats: { html: true }, sharedParams: { waitFor: 500 } },
  );
  assert.deepEqual(scrape({ highlights: true }).formats, { highlights: true });
  assert.deepEqual(scrape({ formats: { type: "markdown" } }).formats, { markdown: true });
  assert.deepEqual(
    scrape({
      markdownOptions: { enabled: true, useMainContentOnly: true, includeLinks: false },
      onlyMainContent: false,
    }),
    {
      url: "https://a.test",
      formats: { markdown: true },
      markdownParams: { includeLinks: false, includeImages: undefined },
      sharedParams: { mainContentOnly: true },
    },
  );
  assert.deepEqual(
    scrape({ formats: { json: { prompt: "Find prices", schema: { type: "object" } } } }),
    {
      url: "https://a.test",
      formats: { json: true },
      jsonParams: { schema: { type: "object" }, instructions: "Find prices" },
    },
  );
});

test("web-search accepts common query and count names", () => {
  assert.deepEqual(
    repairToolSpecificArguments("web-search", {
      search_queries: ["first", "second"],
      limit: 5,
      highlightsOptions: { enabled: true, maxChars: 300 },
    }),
    {
      query: "first",
      numResults: 5,
      highlightsOptions: { enabled: true, maxCharacters: 300 },
    },
  );
  assert.deepEqual(
    repairToolSpecificArguments("web-search", { query: "x", responseMode: "content" }),
    { query: "x" },
  );
});

test("get-news-search builds the company entity", () => {
  const news = (args: Record<string, unknown>) =>
    repairToolSpecificArguments("get-news-search", args);
  assert.deepEqual(news({ company: "Tiledmedia", startDate: "2026-10-04", num_results: 5 }), {
    searchBy: { type: "entity", entity: { type: "name", name: "Tiledmedia" } },
    limit: 5,
    filterBy: { date: { from: Date.parse("2026-10-04") } },
  });
  // Free text is usually a topic, not a company; leave it for the hint.
  assert.equal(news({ query: "after-hours stock movers earnings" }).searchBy, undefined);
  assert.deepEqual(news({ searchBy: { query: "stocks Wall Street midday" } }).searchBy, {
    query: "stocks Wall Street midday",
  });
  assert.deepEqual(news({ searchBy: { entity: "puls4.com", type: "entity" } }).searchBy, {
    entity: { type: "domain", domain: "puls4.com" },
    type: "entity",
  });
  assert.deepEqual(news({ searchBy: { entity: ["ticker", "AAPL"] } }).searchBy, {
    entity: { type: "ticker", ticker: "AAPL" },
    type: "entity",
  });
  assert.equal(news({ query: "NBA OR NHL" }).searchBy, undefined);
  assert.deepEqual(news({ company_domain: "acme.test" }).searchBy, {
    entity: { type: "domain", domain: "acme.test" },
    type: "entity",
  });
});

test("brand-retrieve-unified wraps a flat identifier in a typed body", () => {
  const brand = (args: Record<string, unknown>) =>
    repairToolSpecificArguments("brand-retrieve-unified", args);
  assert.deepEqual(brand({ domain: "gong.io", maxAgeMs: 0 }), {
    body: { domain: "gong.io", maxAgeMs: 0, type: "by_domain" },
  });
  assert.deepEqual(brand({ url: "https://www.betify.co.za/x" }), {
    body: { domain: "www.betify.co.za", type: "by_domain" },
  });
  assert.deepEqual(brand({ query: "Acme Corporation" }), {
    body: { name: "Acme Corporation", type: "by_name" },
  });
  assert.deepEqual(brand({ body: { type: "domain", domain: "a.test" } }), {
    body: { type: "by_domain", domain: "a.test" },
  });
});

test("submit-batch moves mode into input and wraps URL strings", () => {
  assert.deepEqual(
    repairToolSpecificArguments("submit-batch", {
      mode: "scrape",
      input: { data: { format: "markdown", urls: ["https://a.test", { url: "https://b.test" }] } },
    }),
    {
      input: {
        data: { format: "markdown", urls: [{ url: "https://a.test" }, { url: "https://b.test" }] },
        mode: "scrape",
      },
    },
  );
});

test("web-scrape scopes selector-less nested parse rules to the page", () => {
  assert.deepEqual(
    repairToolSpecificArguments("web-scrape", {
      url: "https://a.test",
      formats: { parse: true },
      parseParams: {
        rules: {
          title: "h1",
          headings: { output: { items: { selector: "h2", type: "list" } } },
          plain: { output: "text" },
        },
      },
    }).parseParams,
    {
      rules: {
        title: "h1",
        headings: { output: { items: { selector: "h2", type: "list" } }, selector: "html" },
        plain: { output: "text" },
      },
    },
  );
});

test("calls carrying only another tool's input go to that tool", () => {
  assert.equal(reroutedToolName("list-monitor-changes", { since: "2026-10-09" }), "list-changes");
  assert.equal(reroutedToolName("list-monitor-changes", { monitor_id: "mon_1" }), undefined);
  assert.equal(reroutedToolName("list-changes", {}), undefined);
  assert.equal(
    reroutedToolName("web-search", { url: "https://a.test", formats: { markdown: true } }),
    "web-scrape",
  );
  assert.equal(reroutedToolName("web-search", { url: "a.test" }), undefined);
  assert.equal(reroutedToolName("web-search", { query: "x", url: "https://a.test" }), undefined);
  assert.equal(reroutedToolName("web-scrape", { query: "pricing", numResults: 20 }), "web-search");
  assert.equal(reroutedToolName("web-scrape", { query: "", numResults: 20 }), undefined);
});

test("web-search takes the one query from a list or wrapper", () => {
  assert.equal(repairToolSpecificArguments("web-search", { query: ["first", "second"] }).query, "first");
  assert.equal(
    repairToolSpecificArguments("web-search", { query: { inputText: "jev ai", num: 10 } }).query,
    "jev ai",
  );
});

test("web-scrape accepts parse rules as a list of named rules", () => {
  assert.deepEqual(
    repairToolSpecificArguments("web-scrape", {
      url: "https://a.test",
      formats: ["parse"],
      parseParams: {
        rules: [
          { name: "title", selector: "meta[property='og:title']", attribute: "content" },
          { name: "links", selector: "a", type: "list", output: "@href" },
        ],
      },
    }).parseParams,
    {
      rules: {
        title: { selector: "meta[property='og:title']", output: "@content" },
        links: { selector: "a", type: "list", output: "@href" },
      },
    },
  );
});

test("validation hints stay short", () => {
  for (const hint of Object.values(VALIDATION_HINTS)) {
    assert.ok(hint.length < 400);
  }
});

test("web-scrape and web-crawl find the page URL under other names", () => {
  assert.equal(repairToolSpecificArguments("web-scrape", { urls: ["https://a.test"] }).url, "https://a.test");
  assert.equal(
    repairToolSpecificArguments("web-scrape", { urls: ["https://a.test", "https://b.test"] }).url,
    undefined,
  );
  assert.equal(repairToolSpecificArguments("web-scrape", { query: " https://a.test/x " }).url, "https://a.test/x");
  assert.equal(repairToolSpecificArguments("web-scrape", { query: "pricing page" }).url, undefined);
  assert.deepEqual(repairToolSpecificArguments("web-crawl", { start_url: "https://a.test", max_pages: 3 }), {
    url: "https://a.test",
    max_pages: 3,
  });
});

test("repairs leave unrelated extra keys for validation to strip", () => {
  assert.deepEqual(
    repairToolSpecificArguments("brand-retrieve-unified", {
      body: { type: "by_domain", domain: "stripe.com" },
      name: "Stripe",
    }),
    { body: { type: "by_domain", domain: "stripe.com" }, name: "Stripe" },
  );
  assert.deepEqual(
    repairToolSpecificArguments("web-answers", { task: "x", format: "json", schema: "answer" }),
    { task: "x", format: "json", schema: "answer" },
  );
  assert.deepEqual(
    repairToolSpecificArguments("get-news-search", {
      searchBy: { type: "entity", entity: { type: "name", name: "Acme" } },
      since: "last week",
      from: "5",
    }),
    {
      searchBy: { type: "entity", entity: { type: "name", name: "Acme" } },
      since: "last week",
      from: "5",
    },
  );
});

test("web-scrape requests formats the API requires even for valid arguments", () => {
  const valid = { url: "https://a.test", formats: { markdown: true } };
  assert.equal(completeValidArguments("web-scrape", valid), valid);
  assert.deepEqual(
    completeValidArguments("web-scrape", {
      url: "https://a.test",
      formats: { html: true },
      highlightsParams: { query: "pricing" },
    }),
    {
      url: "https://a.test",
      formats: { html: true, highlights: true },
      highlightsParams: { query: "pricing" },
    },
  );
  assert.deepEqual(
    completeValidArguments("web-scrape", { url: "https://a.test", formats: { markdown: false } }),
    { url: "https://a.test", formats: { markdown: true } },
  );
  const search = { query: "x" };
  assert.equal(completeValidArguments("web-search", search), search);
});

test("null placeholders do not block recovery or routing", () => {
  assert.equal(
    repairToolSpecificArguments("web-scrape", { url: null, urls: ["https://a.test"] }).url,
    "https://a.test",
  );
  assert.equal(
    repairToolSpecificArguments("web-search", { query: null, search_term: "x" }).query,
    "x",
  );
  assert.equal(reroutedToolName("list-monitor-changes", { monitor_id: null }), "list-changes");
  assert.equal(reroutedToolName("web-search", { query: null, url: "https://a.test" }), "web-scrape");
  assert.equal(reroutedToolName("web-scrape", { url: null, query: "pricing" }), "web-search");
});

test("news date aliases accept only ISO dates and epoch milliseconds", () => {
  const news = (args: Record<string, unknown>) =>
    repairToolSpecificArguments("get-news-search", {
      searchBy: { type: "entity", entity: { type: "name", name: "Acme" } },
      ...args,
    });
  assert.equal(news({ from: 2026 }).filterBy, undefined);
  assert.equal(news({ from: 1791072000 }).filterBy, undefined);
  assert.deepEqual(news({ from: 1791072000000 }).filterBy, { date: { from: 1791072000000 } });
});

test("web-answers converts a nullable object schema", () => {
  assert.deepEqual(
    repairToolSpecificArguments("web-answers", {
      task: "x",
      schema: { type: ["object", "null"], properties: { price: { type: "number" } } },
    }).json_format,
    { price: 0 },
  );
});

test("other tools are unchanged", () => {
  const args = { url: "https://a.test" };
  assert.equal(repairToolSpecificArguments("web-styleguide", args), args);
});
