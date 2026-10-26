// Tool-specific argument repairs for mistakes seen repeatedly in production
// tool calls. Each one maps an unambiguous near-miss onto the published
// schema; anything else is left for validation to report.

import { COMPONENT_SCHEMAS } from "../context-endpoints";

type Arguments = Record<string, unknown>;

function isPlainObject(value: unknown): value is Arguments {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// Models send null for values they do not have; treat it like a missing key.
function isMissing(value: unknown): value is null | undefined {
  return value === undefined || value === null;
}

function parseIfJson(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return value;
  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
}

// Removes the first present alias from `args` and returns its value.
function take(args: Arguments, aliases: string[]): unknown {
  const alias = aliases.find((name) => !isMissing(args[name]));
  if (!alias) return undefined;
  const value = args[alias];
  delete args[alias];
  return value;
}

function renameMissing(args: Arguments, target: string, aliases: string[]): Arguments {
  if (!isMissing(args[target])) return args;
  const alias = aliases.find((name) => !isMissing(args[name]));
  if (!alias) return args;
  const { [alias]: value, ...rest } = args;
  return { ...rest, [target]: value };
}

const SCRAPE_FORMATS = [
  "html",
  "markdown",
  "screenshot",
  "images",
  "bytes",
  "parse",
  "highlights",
  "json",
  "product",
];

const SCRAPE_FORMAT_PARAMS: Readonly<Record<string, string>> = {
  markdown: "markdownParams",
  screenshot: "screenshotParams",
  images: "imageParams",
  parse: "parseParams",
  highlights: "highlightsParams",
  json: "jsonParams",
  product: "productParams",
};

const FORMAT_ALIASES = [
  "format",
  "outputFormat",
  "outputFormats",
  "output_format",
  "output_formats",
  "responseFormat",
  "responseType",
  "mode",
];
const MAIN_CONTENT_ALIASES = ["onlyMainContent", "useMainContentOnly", "mainContentOnly"];
const FORMAT_NAME_ALIASES: Readonly<Record<string, string>> = {
  text: "markdown",
  md: "markdown",
  parsed: "parse",
  image: "images",
};

function formatName(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const name = value.trim().toLowerCase();
  const canonical = FORMAT_NAME_ALIASES[name] ?? name;
  return SCRAPE_FORMATS.includes(canonical) ? canonical : undefined;
}

// Models omit `formats`, name it `format` or `outputFormat` (sometimes inside
// sharedParams), send it as ["markdown"] or "markdown", put a format's options
// in place of its flag (`formats.markdown: {...}`), or reuse web-search's
// `markdownOptions`/`highlightsOptions`. Turn all of these into the flag object,
// request every format whose options were sent, and default to Markdown.
// The page URL arrives under other names, or as a one-item `urls` list.
function withPageUrl(input: Arguments): Arguments {
  if (!isMissing(input.url)) return input;
  const args = { ...input };
  const urls = args.urls;
  if (Array.isArray(urls) && urls.length === 1 && typeof urls[0] === "string") {
    delete args.urls;
    return { ...args, url: urls[0] };
  }
  const named = take(args, ["start_url", "startUrl", "link", "page", "pageUrl", "website", "site"]);
  if (typeof named === "string") return { ...args, url: named };
  if (typeof args.query === "string" && /^https?:\/\/\S+$/i.test(args.query.trim())) {
    const { query, ...rest } = args;
    return { ...rest, url: (query as string).trim() };
  }
  return input;
}

function repairScrapeFormats(input: Arguments): Arguments {
  const args = withPageUrl(input);
  const shared: Arguments = isPlainObject(args.sharedParams) ? { ...args.sharedParams } : {};
  let formats = parseIfJson(
    args.formats ?? take(args, FORMAT_ALIASES) ?? take(shared, ["formats", ...FORMAT_ALIASES]),
  );
  if (typeof formats === "string") formats = formats.split(/[\s,]+/);
  if (Array.isArray(formats)) {
    formats = Object.fromEntries(
      formats.flatMap((name) => {
        const format = formatName(name);
        return format ? [[format, true]] : [];
      }),
    );
  }
  const flags: Arguments = {};
  for (const [name, value] of Object.entries(isPlainObject(formats) ? formats : {})) {
    if (name === "type") {
      const format = formatName(value);
      if (format) flags[format] = true;
    } else if (name === "enabled" && value === true) {
      flags.markdown ??= true;
    } else if (name.endsWith("Params") && args[name] === undefined) {
      args[name] = value;
    } else if (MAIN_CONTENT_ALIASES.includes(name)) {
      shared.mainContentOnly ??= value;
    } else {
      const format = formatName(name);
      if (format) flags[format] = flags[format] === true ? true : value;
    }
  }
  // Format flags given directly, for example `markdown: true` or `highlights: true`.
  for (const source of [args, shared]) {
    for (const format of SCRAPE_FORMATS) {
      if (typeof source[format] === "boolean") {
        flags[format] ??= source[format];
        delete source[format];
      }
    }
  }
  const markdownOptions = take(args, ["markdownOptions"]) ?? take(shared, ["markdownOptions"]);
  if (isPlainObject(markdownOptions)) {
    flags.markdown ??= true;
    const { includeLinks, includeImages } = markdownOptions;
    if (args.markdownParams === undefined && (includeLinks !== undefined || includeImages !== undefined)) {
      args.markdownParams = { includeLinks, includeImages };
    }
    for (const alias of MAIN_CONTENT_ALIASES) {
      if (markdownOptions[alias] !== undefined) shared.mainContentOnly ??= markdownOptions[alias];
    }
  }
  const highlightsOptions = take(args, ["highlightsOptions"]) ?? take(shared, ["highlightsOptions"]);
  if (isPlainObject(highlightsOptions) && typeof highlightsOptions.query === "string") {
    flags.highlights ??= true;
    args.highlightsParams ??= {
      query: highlightsOptions.query,
      ...(highlightsOptions.maxCharacters !== undefined
        ? { maxCharacters: highlightsOptions.maxCharacters }
        : {}),
    };
  }
  for (const format of SCRAPE_FORMATS) {
    const value = flags[format];
    const paramsKey = SCRAPE_FORMAT_PARAMS[format];
    if (isPlainObject(value)) {
      flags[format] = true;
      if (paramsKey && args[paramsKey] === undefined) args[paramsKey] = value;
    }
    if (paramsKey && args[paramsKey] !== undefined && flags[format] === undefined) {
      flags[format] = true;
    }
  }
  if (!SCRAPE_FORMATS.some((format) => flags[format] === true)) {
    flags.markdown = true;
  }
  args.formats = flags;

  const mainContentOnly = take(args, MAIN_CONTENT_ALIASES);
  if (mainContentOnly !== undefined) shared.mainContentOnly ??= mainContentOnly;
  if (isPlainObject(args.markdownParams)) {
    const markdownParams = { ...args.markdownParams };
    const nested = take(markdownParams, MAIN_CONTENT_ALIASES);
    if (nested !== undefined) shared.mainContentOnly ??= nested;
    args.markdownParams = markdownParams;
  }
  const waitFor = take(args, ["waitFor", "waitForMs"]) ?? take(shared, ["waitForMs"]);
  if (typeof waitFor === "number" || typeof waitFor === "string") {
    shared.waitFor ??= waitFor;
  }
  if (isPlainObject(args.jsonParams)) {
    args.jsonParams = renameMissing(args.jsonParams, "instructions", ["prompt"]);
  }
  if (isPlainObject(args.highlightsParams)) {
    args.highlightsParams = renameMissing(args.highlightsParams, "query", ["prompt", "question"]);
  }
  // Rules sent as a list of named entries: [{ name, selector, attribute }].
  if (isPlainObject(args.parseParams) && Array.isArray(args.parseParams.rules)) {
    const entries = args.parseParams.rules.flatMap((rule) => {
      if (!isPlainObject(rule) || typeof rule.name !== "string") return [];
      const { name, attribute, ...rest } = rule;
      return [[name, typeof attribute === "string" && rest.output === undefined
        ? { ...rest, output: `@${attribute}` }
        : rest]];
    });
    if (entries.length === args.parseParams.rules.length) {
      args.parseParams = { ...args.parseParams, rules: Object.fromEntries(entries) };
    }
  }
  if (Array.isArray(shared.actions)) {
    shared.actions = shared.actions.map(repairClickAction);
  }
  if (Object.keys(shared).length > 0 || isPlainObject(input.sharedParams)) {
    args.sharedParams = shared;
  } else {
    delete args.sharedParams;
  }
  return repairScrapeParseParams(args);
}

// Other scraping APIs click by CSS selector ({ type: "click", selector }), and
// models copy that into perform; perform takes one plain-language instruction.
function repairClickAction(action: unknown): unknown {
  if (!isPlainObject(action) || typeof action.selector !== "string") return action;
  const isBareClick =
    action.type === "click" ||
    (action.type === "perform" &&
      typeof action.action === "string" &&
      action.action.trim().toLowerCase() === "click");
  return isBareClick
    ? { type: "perform", action: `Click the element matching the CSS selector \`${action.selector}\`` }
    : action;
}

function repairParseRuleAttributes(rule: unknown): unknown {
  if (!isPlainObject(rule) || !isPlainObject(rule.output)) return rule;
  const selector = typeof rule.selector === "string" ? rule.selector : undefined;
  let hasChanges = false;
  const output = Object.fromEntries(
    Object.entries(rule.output).map(([field, nestedRule]) => {
      const repairedRule =
        selector && typeof nestedRule === "string" && nestedRule.startsWith("@")
          ? { selector, output: nestedRule }
          : repairParseRuleAttributes(nestedRule);
      if (repairedRule !== nestedRule) hasChanges = true;
      return [field, repairedRule];
    }),
  );
  return hasChanges ? { ...rule, output } : rule;
}

function scopeSelectorlessParseRule(rule: unknown): unknown {
  return isPlainObject(rule) && rule.selector === undefined && isPlainObject(rule.output)
    ? { ...rule, selector: "html" }
    : rule;
}

function repairScrapeParseParams(args: Arguments): Arguments {
  if (!isPlainObject(args.parseParams) || !isPlainObject(args.parseParams.rules)) return args;
  let hasChanges = false;
  const rules = Object.fromEntries(
    Object.entries(args.parseParams.rules).map(([field, rule]) => {
      const repairedRule = scopeSelectorlessParseRule(repairParseRuleAttributes(rule));
      if (repairedRule !== rule) hasChanges = true;
      return [field, repairedRule];
    }),
  );
  return hasChanges
    ? { ...args, parseParams: { ...args.parseParams, rules } }
    : args;
}

// web-answers takes an example object, not a JSON Schema. Models often send the
// schema they would use for structured output; describe the same shape.
function exampleFromJsonSchema(schema: unknown): unknown {
  if (!isPlainObject(schema)) return null;
  const type = Array.isArray(schema.type) ? schema.type.find((t) => t !== "null") : schema.type;
  if (type === "object" || isPlainObject(schema.properties)) {
    return Object.fromEntries(
      Object.entries(isPlainObject(schema.properties) ? schema.properties : {}).map(
        ([name, property]) => [name, exampleFromJsonSchema(property)],
      ),
    );
  }
  if (type === "array") return [exampleFromJsonSchema(schema.items)];
  if (type === "integer" || type === "number") return 0;
  if (type === "boolean") return false;
  if (type === "string") return "";
  return null;
}

function isJsonSchemaObject(value: unknown): value is Arguments {
  if (!isPlainObject(value) || !isPlainObject(value.properties)) return false;
  return Array.isArray(value.type) ? value.type.includes("object") : value.type === "object";
}

function isJsonSchemaPropertyMap(value: unknown): value is Arguments {
  if (!isPlainObject(value) || Object.keys(value).length === 0) return false;
  const properties = Object.values(value);
  const schemaTypes = new Set([
    "array",
    "boolean",
    "integer",
    "null",
    "number",
    "object",
    "string",
  ]);
  const hasSchemaDetail = properties.some(
    (property) =>
      isPlainObject(property) &&
      (property.description !== undefined ||
        property.items !== undefined ||
        isPlainObject(property.properties) ||
        property.enum !== undefined ||
        property.format !== undefined ||
        property.oneOf !== undefined ||
        property.anyOf !== undefined ||
        property.allOf !== undefined),
  );
  return (
    hasSchemaDetail &&
    properties.every((property) => {
      if (!isPlainObject(property)) return false;
      const types = Array.isArray(property.type)
        ? property.type
        : [property.type];
      const hasSchemaType = types.some(
        (type) => typeof type === "string" && schemaTypes.has(type),
      );
      return (
        hasSchemaType ||
        isPlainObject(property.properties) ||
        property.items !== undefined
      );
    })
  );
}

function repairAnswers(input: Arguments): Arguments {
  let args = renameMissing(input, "task", ["query", "question", "prompt", "q"]);
  if (isMissing(args.json_format)) {
    const alias = [
      "schema",
      "json_schema",
      "jsonSchema",
      "outputSchema",
      "output_schema",
      "responseSchema",
      "response_schema",
    ].find((name) => isPlainObject(parseIfJson(args[name])));
    if (alias) {
      const { [alias]: shape, ...rest } = args;
      args = { ...rest, json_format: parseIfJson(shape) };
    }
  } else if (typeof args.json_format === "string") {
    args = { ...args, json_format: parseIfJson(args.json_format) };
  }
  if (isJsonSchemaObject(args.json_format)) {
    args = { ...args, json_format: exampleFromJsonSchema(args.json_format) };
  } else if (isJsonSchemaPropertyMap(args.json_format)) {
    args = {
      ...args,
      json_format: exampleFromJsonSchema({
        type: "object",
        properties: args.json_format,
      }),
    };
  }
  return args;
}

// web-map takes a domain; models usually pass the site URL instead.
function repairMap(input: Arguments): Arguments {
  const args = renameMissing(input, "maxLinks", ["limit", "maxResults", "max_links"]);
  if (!isMissing(args.domain)) return args;
  const url = take(args, ["url", "site", "website"]);
  if (typeof url !== "string") return url === undefined ? args : { ...args, domain: url };
  try {
    return { ...args, domain: /^https?:\/\//i.test(url.trim()) ? new URL(url.trim()).hostname : url };
  } catch {
    return { ...args, domain: url };
  }
}

function repairSearch(input: Arguments): Arguments {
  const args = { ...input };
  if (Array.isArray(args.query) && typeof args.query[0] === "string") {
    args.query = args.query[0];
  } else if (isPlainObject(args.query)) {
    const text = Object.values(args.query).filter((value) => typeof value === "string");
    if (text.length === 1) args.query = text[0];
  }
  if (isMissing(args.query)) {
    const query = take(args, ["q", "search_term", "searchTerm", "search", "text", "keywords"]);
    const queries = take(args, ["queries", "search_queries", "searchQueries"]);
    if (typeof query === "string") args.query = query;
    else if (Array.isArray(queries) && typeof queries[0] === "string") args.query = queries[0];
  }
  const count = take(args, ["limit", "maxResults", "count", "num"]);
  if (count !== undefined) args.numResults ??= count;
  if (isPlainObject(args.highlightsOptions)) {
    args.highlightsOptions = renameMissing(args.highlightsOptions, "maxCharacters", [
      "maxChars",
      "maxCharsPerHighlight",
    ]);
  }
  return args;
}

function looksLikeDomain(value: string): boolean {
  return /^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(value.trim());
}

function newsEntity(value: unknown): unknown {
  const parsed = parseIfJson(value);
  if (Array.isArray(parsed) && parsed.length === 2 && typeof parsed[0] === "string") {
    return { type: parsed[0], [parsed[0]]: parsed[1] };
  }
  if (typeof parsed === "string") {
    return looksLikeDomain(parsed)
      ? { type: "domain", domain: parsed.trim() }
      : { type: "name", name: parsed.trim() };
  }
  if (isPlainObject(parsed) && parsed.type === undefined) {
    for (const type of ["domain", "ticker", "isin", "name"]) {
      if (typeof parsed[type] === "string") return { ...parsed, type };
    }
  }
  return parsed;
}

function flatNewsIdentity(value: unknown): Arguments {
  const entity = newsEntity(value);
  if (!isPlainObject(entity)) return {};
  const type = entity.type ?? entity.entityType ?? entity.entity_type;
  const valueForType = typeof type === "string"
    ? entity[type] ?? entity.entityCode ?? entity.entity_code ?? entity.value
    : undefined;
  const companyName = entity.name ?? entity.companyName ?? entity.company_name ?? entity.company;
  if (type === "name" && typeof (valueForType ?? companyName) === "string") {
    return { companyName: valueForType ?? companyName };
  }
  if (type === "domain" && typeof valueForType === "string") {
    return { domain: valueForType };
  }
  if (type === "ticker" && typeof valueForType === "string") {
    return {
      ticker: valueForType,
      ...(typeof entity.exchange === "string" ? { exchange: entity.exchange } : {}),
    };
  }
  if (type === "isin" && typeof valueForType === "string") {
    return { isin: valueForType };
  }
  if (typeof companyName === "string") {
    return { companyName };
  }
  return {};
}

// Only unambiguous dates become a filter: epoch milliseconds or ISO 8601.
function toEpochMs(value: unknown): number | undefined {
  // Numbers count only in the epoch-millisecond range (2001 onward), so a year
  // or a timestamp in seconds is not mistaken for a date near 1970.
  if (typeof value === "number") {
    return Number.isInteger(value) && value >= 1e12 && value < 1e14 ? value : undefined;
  }
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?)?$/.test(value.trim())
  ) {
    return undefined;
  }
  const parsed = Date.parse(value.trim());
  return Number.isNaN(parsed) ? undefined : parsed;
}

// get-news-search publishes a flat query or flat company identifiers to MCP
// clients, while the API takes searchBy. Normalize old and near-miss MCP calls
// to the flat shape; the request boundary translates it back for the API.
function repairNewsSearch(input: Arguments): Arguments {
  const args = { ...input };
  const searchBy = isPlainObject(args.searchBy) ? args.searchBy : undefined;
  const legacyQuery = typeof searchBy?.query === "string" ? searchBy.query : undefined;
  const legacyIdentity = legacyQuery === undefined ? flatNewsIdentity(searchBy?.entity ?? searchBy) : {};
  delete args.searchBy;
  if (isMissing(args.query) && legacyQuery !== undefined) {
    args.query = legacyQuery;
  }

  const company = take(args, ["company", "company_name"]);
  const domain = take(args, ["company_domain", "companyDomain"]);
  if (isMissing(args.companyName) && typeof company === "string") {
    args.companyName = company;
  }
  if (isMissing(args.domain) && typeof domain === "string") {
    args.domain = domain;
  }
  if (["query", "companyName", "domain", "ticker", "isin"].every((name) => isMissing(args[name]))) {
    Object.assign(args, legacyIdentity);
  }
  if (isPlainObject(args.sortBy) && typeof args.sortBy.type === "string") {
    args.sortBy = args.sortBy.type;
  }
  const count = take(args, ["num_results", "numResults", "maxResults", "max_results"]);
  if (count !== undefined) args.limit ??= count;
  const dateAlias = (aliases: string[]) => {
    const alias = aliases.find((name) => toEpochMs(args[name]) !== undefined);
    if (!alias) return undefined;
    const value = toEpochMs(args[alias]);
    delete args[alias];
    return value;
  };
  const from = dateAlias(["startDate", "start_date", "from", "since"]);
  const to = dateAlias(["endDate", "end_date", "to", "until"]);
  if (from !== undefined || to !== undefined) {
    const filterBy: Arguments = isPlainObject(args.filterBy) ? { ...args.filterBy } : {};
    filterBy.date ??= {
      ...(from !== undefined ? { from } : {}),
      ...(to !== undefined ? { to } : {}),
    };
    args.filterBy = filterBy;
  }
  return args;
}

const BRAND_LOOKUPS: ReadonlyArray<[string, string]> = [
  ["domain", "by_domain"],
  ["name", "by_name"],
  ["email", "by_email"],
  ["ticker", "by_ticker"],
  ["direct_url", "by_direct_url"],
  ["transaction_info", "by_transaction"],
];

// brand-retrieve-unified takes one lookup under `body` with its `type`. Models
// send the identifier flat, leave out `type`, or name it `url`/`query`.
function repairBrandRetrieve(input: Arguments): Arguments {
  const args = { ...input };
  const body: Arguments = isPlainObject(args.body) ? { ...args.body } : {};
  if (!isPlainObject(args.body)) {
    for (const key of Object.keys(args)) {
      if (key !== "body") {
        body[key] = args[key];
        delete args[key];
      }
    }
  }
  if (typeof body.type === "string" && !body.type.startsWith("by_")) {
    body.type = body.type === "url" ? "by_direct_url" : `by_${body.type}`;
  }
  if (isMissing(body.type)) {
    const identifiers = take(body, ["identifiers"]);
    const first = Array.isArray(identifiers) ? identifiers[0] : undefined;
    const identifier =
      take(body, ["identifier", "query", "company", "url", "website"]) ??
      (isPlainObject(first) ? first.value : first);
    if (typeof identifier === "string" && isMissing(body.domain) && isMissing(body.name)) {
      const trimmed = identifier.trim();
      if (/^https?:\/\//i.test(trimmed)) {
        try {
          body.domain = new URL(trimmed).hostname;
        } catch {
          body.name = trimmed;
        }
      } else if (looksLikeDomain(trimmed)) {
        body.domain = trimmed;
      } else {
        body.name = trimmed;
      }
    }
    const lookup = BRAND_LOOKUPS.find(([key]) => typeof body[key] === "string");
    if (lookup) body.type = lookup[1];
  }
  args.body = body;
  return args;
}

// submit-batch nests the mode under `input`, and each URL entry is an object.
function repairBatch(input: Arguments): Arguments {
  const args = { ...input };
  if (!isPlainObject(args.input)) return args;
  const batch: Arguments = { ...args.input };
  const mode = take(args, ["mode"]);
  if (mode !== undefined) batch.mode ??= mode;
  if (isPlainObject(batch.data) && Array.isArray(batch.data.urls)) {
    batch.data = {
      ...batch.data,
      urls: batch.data.urls.map((entry) => (typeof entry === "string" ? { url: entry } : entry)),
    };
  }
  args.input = batch;
  return args;
}

function letters(value: string): string {
  return value.normalize("NFD").toLowerCase().replace(/[^a-z]/g, "");
}

let countryCodesByName: Map<string, string> | undefined;

// English country names keyed by their letters, so "United States" and
// "Cote d'Ivoire" find US and CI. Retired codes such as FX canonicalize to
// a current one and are skipped.
function countryCodeForName(name: string): string | undefined {
  if (!countryCodesByName) {
    countryCodesByName = new Map([["usa", "US"], ["unitedstatesofamerica", "US"]]);
    const names = new Intl.DisplayNames(["en"], { type: "region" });
    for (let first = 65; first <= 90; first++) {
      for (let second = 65; second <= 90; second++) {
        const code = String.fromCharCode(first, second);
        const countryName = names.of(code);
        if (countryName && countryName !== code && new Intl.Locale(`und-${code}`).region === code) {
          countryCodesByName.set(letters(countryName), code);
        }
      }
    }
  }
  return countryCodesByName.get(name);
}

// Two-letter codes are uppercased and canonicalized (UK becomes GB).
function countryCode(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const name = letters(value);
  if (name.length === 2) return new Intl.Locale(`und-${name.toUpperCase()}`).region;
  return countryCodeForName(name);
}

function countryCodes(value: unknown): unknown {
  const entries =
    typeof value === "string" ? value.split(/[,;|]/).filter((entry) => entry.trim()) : value;
  if (!Array.isArray(entries)) return value;
  const codes = entries.map(countryCode);
  if (codes.some((code) => code === undefined)) return value;
  const isUnchanged =
    Array.isArray(value) && value.length === codes.length && codes.every((code, i) => code === value[i]);
  return isUnchanged ? value : codes;
}

// `country`, `min_employees`, and `yearsOfExperienceMin` name declared filters.
function searchFilterName(key: string, filterNames: string[]): string | undefined {
  const name = letters(key);
  const candidates = [name, `${name}s`, name.replace(/y$/, "ies"), name.replace(/^(min|max)(.+)$/, "$2$1")];
  return filterNames.find((filterName) => candidates.includes(letters(filterName)));
}

// company-search and people-search take their constraints under `filters`.
// Models send them flat ({ query, countries: ["US"] }), which validation would
// silently strip, and send countries as names, lowercase, or one string.
function repairEntitySearch(filterSchema: string): (args: Arguments) => Arguments {
  const filterNames = Object.keys(COMPONENT_SCHEMAS[filterSchema]?.properties ?? {});
  return (input) => {
    const args = renameMissing(input, "query", [
      "q",
      "search",
      "search_query",
      "searchQuery",
      "description",
      "prompt",
      "text",
    ]);
    if (args.filters !== undefined && !isPlainObject(args.filters)) return args;
    let hasChanges = args !== input;
    const filters: Arguments = {};
    for (const [key, value] of Object.entries(args.filters ?? {})) {
      const name = searchFilterName(key, filterNames) ?? key;
      if (name !== key) hasChanges = true;
      if (isMissing(filters[name])) filters[name] = value;
    }
    const rest: Arguments = {};
    for (const [key, value] of Object.entries(args)) {
      if (key === "filters") continue;
      const name = searchFilterName(key, filterNames);
      if (!name) {
        rest[key] = value;
        continue;
      }
      hasChanges = true;
      if (isMissing(filters[name])) filters[name] = value;
    }
    if (filters.countries !== undefined) {
      const codes = countryCodes(filters.countries);
      if (codes !== filters.countries) hasChanges = true;
      filters.countries = codes;
    }
    if (!hasChanges) return input;
    return Object.keys(filters).length > 0 ? { ...rest, filters } : rest;
  };
}

const repairCompanySearch = repairEntitySearch("CompanySearchFilters");
const repairPeopleSearch = repairEntitySearch("PeopleSearchFilters");

// responseMode only selects compact output; any other value means the default.
function withoutUnknownResponseMode(
  repair: (args: Arguments) => Arguments,
): (args: Arguments) => Arguments {
  return (input) => {
    const args = repair(input);
    if (args.responseMode === undefined || ["full", "compact"].includes(String(args.responseMode))) {
      return args;
    }
    const { responseMode: _ignored, ...rest } = args;
    return rest;
  };
}

const TOOL_REPAIRS: Readonly<Record<string, (args: Arguments) => Arguments>> = {
  "web-scrape": withoutUnknownResponseMode(repairScrapeFormats),
  "web-search": withoutUnknownResponseMode(repairSearch),
  "web-crawl": withoutUnknownResponseMode(withPageUrl),
  "web-answers": repairAnswers,
  "web-map": repairMap,
  "get-news-search": repairNewsSearch,
  "company-search": repairCompanySearch,
  "people-search": repairPeopleSearch,
  "brand-retrieve-unified": repairBrandRetrieve,
  "submit-batch": repairBatch,
};

export function repairToolSpecificArguments(
  toolName: string,
  args: Arguments,
): Arguments {
  const repair = TOOL_REPAIRS[toolName];
  return repair ? repair(args) : args;
}

// list-monitor-changes lists one monitor's changes. Without a monitor_id the
// caller wants the account-wide list, which list-changes serves with the same
// filters.
// Also routes between web-search and web-scrape when the call carries only the
// other tool's input: a page URL and no query, or a search query and no URL.
export function reroutedToolName(
  toolName: string,
  args: unknown,
): string | undefined {
  if (!isPlainObject(args)) return undefined;
  if (toolName === "list-monitor-changes" && isMissing(args.monitor_id)) {
    return "list-changes";
  }
  if (
    toolName === "web-search" &&
    isMissing(args.query) &&
    typeof args.url === "string" &&
    /^https?:\/\//i.test(args.url.trim())
  ) {
    return "web-scrape";
  }
  if (
    toolName === "web-scrape" &&
    isMissing(args.url) &&
    typeof args.query === "string" &&
    args.query.trim() !== ""
  ) {
    return "web-search";
  }
  return undefined;
}

// Appended to validation errors that repair could not fix, so the model changes
// the call instead of repeating it.
export const VALIDATION_HINTS: Readonly<Record<string, string>> = {
  "web-search":
    "web-search needs `query`, the text to search for. To read a page whose URL you already have, use web-scrape.",
  "web-scrape":
    'web-scrape needs `url` and `formats`, for example {"url":"https://example.com","formats":{"markdown":true}}. Options for a format go in its own object, such as markdownParams or jsonParams. To find pages for a query, use web-search.',
  "web-answers":
    'web-answers needs `task`, the research question. Describe the answer shape with `json_format`, an example object such as {"price":0,"currency":""}.',
  "web-map": "web-map needs `domain`, the site's host name, such as docs.example.com.",
  "get-news-search":
    'get-news-search takes exactly one of: `query`, a plain-language topic such as {"query":"chip export restrictions to China"}, ordered by relevance; or one company identifier, for example {"companyName":"Acme"}, {"domain":"acme.com"}, {"ticker":"ACME"}, or {"isin":"US0000000000"}, with sortBy "newest" or "relevance".',
  "company-search":
    'company-search needs `query`, a plain-language description of the companies to find, for example {"query":"solar startups in California","filters":{"countries":["US"],"employees_min":50}}. Countries are two-letter codes. To resolve a company you can already name, use brand-search.',
  "people-search":
    'people-search needs `query`, a plain-language description of the people to find, for example {"query":"VPs of sales at solar companies","filters":{"countries":["US"],"years_of_experience_min":10}}. Countries are two-letter codes. To look up one known person, use people-enrich.',
  "brand-retrieve-unified":
    'Send one lookup in `body`, for example {"body":{"type":"by_domain","domain":"stripe.com"}}. Other lookups: by_name with name, by_email with email, by_ticker with ticker, by_direct_url with direct_url, by_transaction with transaction_info.',
  "submit-batch":
    'submit-batch takes {"input":{"mode":"scrape","data":{"format":"markdown","urls":[{"url":"https://example.com"}]}}}. Options must belong to the chosen format.',
};

// The API rejects a scrape whose format options arrive without the format
// (`highlightsParams` without `formats.highlights`) or that requests no format.
// Complete those even when the arguments already pass validation, and move
// flat search filters that validation would otherwise strip.
export function completeValidArguments(toolName: string, args: unknown): unknown {
  if (!isPlainObject(args)) return args;
  if (toolName === "web-answers") return repairAnswers(args);
  if (toolName === "company-search") return repairCompanySearch(args);
  if (toolName === "people-search") return repairPeopleSearch(args);
  if (toolName !== "web-scrape" || !isPlainObject(args.formats)) {
    return args;
  }
  const completed = repairScrapeParseParams(args);
  const formats: Arguments = { ...(completed.formats as Arguments) };
  for (const [format, paramsKey] of Object.entries(SCRAPE_FORMAT_PARAMS)) {
    if (completed[paramsKey] !== undefined && formats[format] === undefined) formats[format] = true;
  }
  if (!SCRAPE_FORMATS.some((format) => formats[format] === true)) formats.markdown = true;
  const original = completed.formats as Arguments;
  const changed = Object.keys(formats).some((key) => formats[key] !== original[key]);
  return changed ? { ...completed, formats } : completed;
}
