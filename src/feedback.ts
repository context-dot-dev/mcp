import { error } from "mcp-use/server";

export const FEEDBACK_INSTRUCTIONS =
  "Always report unexpected Context API behavior with `submit-feedback` as part of completing the task, even if a retry or workaround succeeds. This includes unexpected errors, wrong or incomplete data in a successful response, and behavior that differs from the docs. Report each distinct issue once; do not submit duplicate reports for retries of the same issue. " +
  "Choose the closest category (bug, docs_mismatch, friction, feature_gap, quality_degradation, or other). In note, name the affected tool, describe expected versus actual behavior, and include minimal reproduction details (maximum 4000 characters). Include the affected call's request_id when available; otherwise use a relevant public page or docs url. Never invent a request_id or use the ID of a later logs/feedback call. Use list-logs/get-log only if needed to find the affected request. " +
  "Send only sanitized diagnostic details: never include API keys, tokens, cookies, private page contents, personal data, or secret URL parameters. Respect the user's reporting preferences and the host's permissions. Expected validation/authentication/credit-limit errors are not bugs unless the behavior is itself unexpected; normal empty results and MCP response truncation are not automatically defects. " +
  "Feedback costs no credits. If submit-feedback fails, do not report that failure through submit-feedback or enter a retry loop; continue the task and mention that feedback could not be submitted. Only say feedback was submitted after the tool confirms success.";

export const FEEDBACK_TOOL_DESCRIPTION =
  "Report a Context problem to the Context team. Always use this when a tool or API behaves unexpectedly, including wrong or incomplete successful results, unexpected errors, or a docs mismatch, even after a successful workaround. Send a category, a note describing the affected tool and expected versus actual behavior, and the affected request_id, a relevant public url, or both. Use a url when no request_id is available; never invent an ID. Sanitize secrets and private data. Costs no credits. Report each distinct issue once; reporting the same request_id again returns the original feedback_id. If this tool fails, do not recursively report its failure or loop on retries.";

export function contextRequestId(
  payload: unknown,
  headers: Headers,
): string | undefined {
  const value =
    payload && typeof payload === "object"
      ? (payload as Record<string, unknown>).request_id
      : undefined;
  return typeof value === "string" && value.trim()
    ? value
    : headers.get("x-request-id") || undefined;
}

export function contextApiError(toolName: string, message: string) {
  const guidance =
    toolName === "submit-feedback"
      ? "Feedback submission was not confirmed. Do not call submit-feedback to report its own failure or loop on retries. Continue the task and tell the user feedback could not be submitted."
      : "If this behavior is unexpected, always call submit-feedback once for this issue, even if a retry or workaround succeeds. Include a category, a sanitized note naming the tool and expected versus actual behavior, and the affected request_id above or a relevant public page/docs url if no ID is available. Never invent an ID or include secrets/private data. Follow the user's reporting preferences and host permissions. Do not report expected validation, authentication, or credit-limit errors as bugs.";
  return error(`${message}\n\n${guidance}`);
}
