import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

type JsonObject = Record<string, unknown>;

const HTTP_METHODS = ["get", "post", "put", "patch", "delete"] as const;

const CORE_TOOL_NAMES: Record<string, string> = {
  "POST /parse": "parse-document",
  "POST /web/scrape": "web-scrape",
  "GET /web/urls": "web-map",
  "GET /web/scrape/html": "web-scrape-html",
  "GET /web/scrape/markdown": "web-scrape-markdown",
  "GET /web/scrape/images": "web-scrape-images",
  "GET /web/scrape/sitemap": "web-scrape-sitemap",
  "POST /web/crawl": "web-crawl",
  "POST /web/extract": "web-extract",
  "POST /web/search": "web-search",
  "POST /web/answers": "web-answers",
  "POST /news/search": "get-news-search",
  "POST /company/search": "company-search",
  "GET /web/competitors": "web-competitors",
  "POST /people/retrieve": "people-retrieve",
  "POST /people/enrich": "people-enrich",
  "GET /brand/search": "brand-search",
  "GET /brand/retrieve": "brand-retrieve",
  "POST /brand/retrieve": "brand-retrieve-unified",
  "GET /brand/retrieve-by-name": "brand-retrieve-by-name",
  "GET /brand/retrieve-by-email": "brand-retrieve-by-email",
  "GET /brand/retrieve-by-ticker": "brand-retrieve-by-ticker",
  "GET /brand/retrieve-by-isin": "brand-retrieve-by-isin",
  "GET /brand/transaction_identifier": "brand-transaction-identifier",
  "GET /brand/retrieve-simplified": "brand-retrieve-simplified",
  "GET /web/styleguide": "web-styleguide",
  "GET /web/fonts": "web-fonts",
  "GET /web/screenshot": "web-screenshot",
  "GET /web/naics": "web-naics",
  "GET /web/sic": "web-sic",
  "POST /brand/ai/query": "brand-ai-query",
  "POST /brand/ai/product": "brand-ai-product",
  "POST /brand/ai/products": "brand-ai-products",
  "POST /brand/prefetch": "brand-prefetch",
  "POST /brand/prefetch-by-email": "brand-prefetch-by-email",
  "POST /utility/prefetch": "utility-prefetch",
};

const READ_ONLY_POST_PATHS = new Set([
  "/parse",
  "/web/crawl",
  "/web/extract",
  "/web/search",
  "/web/answers",
  "/news/search",
  "/company/search",
  "/people/retrieve",
  "/people/enrich",
  "/webhooks/deliveries",
  "/brand/retrieve",
  "/brand/ai/query",
  "/brand/ai/product",
  "/brand/ai/products",
  "/webdbs/preview",
  "/webdbs/collections/{collection_id}/query",
]);

function asObject(value: unknown): JsonObject {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonObject)
    : {};
}

function resolveReference(spec: JsonObject, value: unknown): unknown {
  const reference = asObject(value).$ref;
  if (typeof reference !== "string" || !reference.startsWith("#/")) {
    return value;
  }

  return reference
    .slice(2)
    .split("/")
    .map((segment) => segment.replaceAll("~1", "/").replaceAll("~0", "~"))
    .reduce<unknown>((current, segment) => asObject(current)[segment], spec);
}

function cleanDescription(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return undefined;
  }

  return normalized.length <= maxLength
    ? normalized
    : `${normalized.slice(0, maxLength - 1).trimEnd()}…`;
}

function camelToKebab(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

function toolName(method: string, path: string, operation: JsonObject): string {
  const key = `${method.toUpperCase()} ${path}`;
  const coreName = CORE_TOOL_NAMES[key];
  if (coreName) {
    return coreName;
  }

  const operationId = operation.operationId;
  if (typeof operationId === "string" && operationId) {
    return camelToKebab(operationId);
  }

  return camelToKebab(`${method}-${path.replace(/[{}]/g, "")}`).slice(0, 64);
}

function collectSchemaReferences(value: unknown, references: Set<string>): void {
  if (Array.isArray(value)) {
    value.forEach((entry) => collectSchemaReferences(entry, references));
    return;
  }

  const record = asObject(value);
  const reference = record.$ref;
  if (
    typeof reference === "string" &&
    reference.startsWith("#/components/schemas/")
  ) {
    references.add(reference.slice("#/components/schemas/".length));
  }
  Object.values(record).forEach((entry) =>
    collectSchemaReferences(entry, references)
  );
}

function collectReferencedSchemas(
  sourceSchemas: JsonObject,
  endpoints: JsonObject[]
): JsonObject {
  const references = new Set<string>();
  endpoints.forEach((endpoint) => collectSchemaReferences(endpoint, references));

  const collected: JsonObject = {};
  const pending = [...references];
  while (pending.length) {
    const name = pending.shift()!;
    if (name in collected) {
      continue;
    }

    const schema = sourceSchemas[name];
    if (!schema) {
      continue;
    }

    collected[name] = schema;
    const before = new Set(references);
    collectSchemaReferences(schema, references);
    for (const reference of references) {
      if (!before.has(reference) || !(reference in collected)) {
        pending.push(reference);
      }
    }
  }

  return collected;
}

function generateEndpoints(spec: JsonObject): JsonObject[] {
  const endpoints: JsonObject[] = [];
  const paths = asObject(spec.paths);

  for (const [path, rawPathItem] of Object.entries(paths)) {
    const pathItem = asObject(resolveReference(spec, rawPathItem));
    const pathParameters = Array.isArray(pathItem.parameters)
      ? pathItem.parameters
      : [];

    for (const method of HTTP_METHODS) {
      if (!pathItem[method]) {
        continue;
      }

      const operation = asObject(resolveReference(spec, pathItem[method]));
      const operationParameters = Array.isArray(operation.parameters)
        ? operation.parameters
        : [];
      const parameterMap = new Map<string, JsonObject>();

      for (const rawParameter of [...pathParameters, ...operationParameters]) {
        const parameter = asObject(resolveReference(spec, rawParameter));
        const location = parameter.in;
        const name = parameter.name;
        if (typeof location === "string" && typeof name === "string") {
          parameterMap.set(`${location}:${name}`, {
            name,
            in: location,
            required: parameter.required === true || location === "path",
            description: cleanDescription(parameter.description, 600),
            schema: parameter.schema ?? {},
          });
        }
      }

      const rawRequestBody = operation.requestBody
        ? resolveReference(spec, operation.requestBody)
        : undefined;
      const requestBody = asObject(rawRequestBody);
      const content = asObject(requestBody.content);
      const selectedContentEntry =
        content["application/json"] ??
          content["application/*+json"] ??
          Object.entries(content).find(([mediaType]) =>
            mediaType.includes("+json")
          )?.[1] ??
          content["application/octet-stream"] ??
          content["application/pdf"] ??
          content["*/*"];
      const selectedContent = asObject(selectedContentEntry);
      const bodySchema = selectedContent.schema;
      const selectedMediaType =
        Object.entries(content).find(([, value]) => value === selectedContentEntry)?.[0] ??
        "application/json";
      const binaryBody =
        asObject(bodySchema).format === "binary" ||
        selectedMediaType === "application/octet-stream" ||
        selectedMediaType === "application/pdf";
      const isReadOnly =
        method === "get" || READ_ONLY_POST_PATHS.has(path);

      endpoints.push({
        name: toolName(method, path, operation),
        title:
          cleanDescription(operation.summary, 100) ??
          `${method.toUpperCase()} ${path}`,
        method: method.toUpperCase(),
        path,
        description: cleanDescription(
          [operation.summary, operation.description]
            .filter((value) => typeof value === "string" && value)
            .join(" — "),
          1400
        ),
        parameters: [...parameterMap.values()],
        ...(bodySchema
          ? {
              requestBody: {
                required: requestBody.required === true,
                description: cleanDescription(requestBody.description, 600),
                schema: bodySchema,
                contentType: selectedMediaType,
                binary: binaryBody,
              },
            }
          : {}),
        annotations: {
          readOnlyHint: isReadOnly,
          destructiveHint: !isReadOnly,
          openWorldHint: true,
        },
      });
    }
  }

  return endpoints;
}

const sourcePath = resolve(
  process.argv[2] ?? "../brand-dev-server/gcp/openapispec.json"
);
const outputPath = resolve(process.argv[3] ?? "context-endpoints.ts");
const spec = JSON.parse(readFileSync(sourcePath, "utf8")) as JsonObject;
const endpoints = generateEndpoints(spec);
const schemas = collectReferencedSchemas(
  asObject(asObject(spec.components).schemas),
  endpoints
);
const source = `// Generated from Context's OpenAPI specification by scripts/generate-context-endpoints.ts.
export type JsonSchema = {
  [key: string]: unknown;
  $ref?: string;
  type?: string | string[];
  const?: unknown;
  enum?: unknown[];
  format?: string;
  description?: string;
  default?: unknown;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  minItems?: number;
  maxItems?: number;
  pattern?: string;
  nullable?: boolean;
  properties?: Record<string, JsonSchema>;
  required?: string[];
  items?: JsonSchema;
  additionalProperties?: boolean | JsonSchema;
  oneOf?: JsonSchema[];
  anyOf?: JsonSchema[];
  allOf?: JsonSchema[];
};

export type EndpointParameter = {
  name: string;
  in: string;
  required: boolean;
  description?: string;
  schema: JsonSchema;
};

export type Endpoint = {
  name: string;
  title: string;
  method: string;
  path: string;
  description?: string;
  parameters: EndpointParameter[];
  requestBody?: {
    required: boolean;
    description?: string;
    schema: JsonSchema;
    contentType: string;
    binary: boolean;
  };
  annotations: {
    readOnlyHint: boolean;
    destructiveHint: boolean;
    openWorldHint: boolean;
  };
};

export const ENDPOINTS: Endpoint[] = ${JSON.stringify(endpoints, null, 2)};

export const COMPONENT_SCHEMAS: Record<string, JsonSchema> = ${JSON.stringify(schemas, null, 2)};
`;

writeFileSync(outputPath, source);
console.log(
  `Generated ${endpoints.length} endpoints and ${Object.keys(schemas).length} component schemas`
);
