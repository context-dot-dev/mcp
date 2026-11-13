type JsonObject = Record<string, unknown>;

export function compactWebResponse(
  name: string,
  value: JsonObject,
): JsonObject {
  const { cache_metadata, ...response } = value;
  if (
    (name === "web-search" || name === "web-crawl") &&
    Array.isArray(value.results)
  ) {
    const maxCharacters = name === "web-search" ? 1_200 : 4_000;
    const results = value.results.map((result) =>
      compactPage(result, maxCharacters),
    );
    return withTruncation(
      { ...response, results: results.map((result) => result.data) },
      results.some((result) => result.isTruncated),
    );
  }
  const page = compactPage(response, 4_000);
  return withTruncation(page.data, page.isTruncated);
}

function compactPage(value: JsonObject, maxCharacters: number) {
  const data: JsonObject = { ...value };
  let isTruncated = false;
  for (const name of [
    "html",
    "markdown",
    "highlights",
    "screenshot",
    "images",
    "bytes",
    "parsed",
    "json",
    "product",
  ]) {
    const format = data[name];
    if (
      ["html", "markdown", "highlights"].includes(name) &&
      (typeof format === "string" || Array.isArray(format))
    ) {
      const shortened = shortenContent(format, maxCharacters);
      data[name] = shortened.data;
      isTruncated ||= shortened.isTruncated;
      continue;
    }
    if (!isObject(format)) continue;
    if (format.requested === false || format.code === "NOT_REQUESTED") {
      delete data[name];
      continue;
    }
    const { requested, ...status } = format;
    const isSuccessful = format.success === true || format.code === "SUCCESS";
    if (!isSuccessful || name === "screenshot") {
      data[name] = status;
      continue;
    }
    const content = "data" in format ? format.data : format[name];
    if (content === undefined) continue;
    if (["html", "markdown", "highlights"].includes(name)) {
      const shortened = shortenContent(content, maxCharacters);
      data[name] = shortened.data;
      isTruncated ||= shortened.isTruncated;
    } else {
      data[name] = content;
    }
  }
  if (
    Array.isArray(data.highlights) &&
    data.highlights.some(
      (entry) => typeof entry === "string" && entry.length > 0,
    )
  ) {
    delete data.description;
  }
  if (isObject(data.metadata)) {
    const {
      headings,
      openGraph,
      twitter,
      jsonLd,
      additionalMeta,
      alternates,
      image,
      favicon,
      ...metadata
    } = data.metadata;
    data.metadata = metadata;
  }
  return { data, isTruncated };
}

function shortenContent(
  value: unknown,
  maxCharacters: number,
): { data: unknown; isTruncated: boolean } {
  if (typeof value === "string") {
    if (value.length <= maxCharacters)
      return { data: value, isTruncated: false };
    const marker = "…[truncated]";
    const prefix = value.slice(0, Math.max(0, maxCharacters - marker.length));
    const safePrefix = prefix.replace(/[\uD800-\uDBFF]$/, "");
    return { data: safePrefix + marker, isTruncated: true };
  }
  if (
    Array.isArray(value) &&
    value.every((entry) => typeof entry === "string")
  ) {
    let remaining = maxCharacters;
    const data: string[] = [];
    let isTruncated = false;
    for (const entry of value) {
      if (entry.length > remaining && remaining < "…[truncated]".length) {
        isTruncated = true;
        break;
      }
      const shortened = shortenContent(entry, remaining);
      const content = shortened.data as string;
      data.push(content);
      remaining -= content.length;
      isTruncated ||= shortened.isTruncated;
    }
    return { data, isTruncated };
  }
  return { data: value, isTruncated: false };
}

function withTruncation(data: JsonObject, isTruncated: boolean): JsonObject {
  if (!isTruncated) return data;
  return {
    ...data,
    _context_mcp: {
      truncated: true,
      message:
        'Text clipped for compact mode. Use query-relevant highlights or responseMode="full" for more content (server response limit still applies).',
    },
  };
}

function isObject(value: unknown): value is JsonObject {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
