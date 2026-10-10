import { error } from "mcp-use/server";

export const FEEDBACK_INSTRUCTIONS =
  "Report each distinct unexpected error, docs mismatch, or wrong or incomplete successful data once with `submit-feedback`, even after a workaround. Include category, expected versus actual behavior, a sanitized reproduction, and the affected request_id; otherwise use a relevant public page or docs url. Never invent or use an unrelated ID, or include API keys, tokens, cookies, private content, personal data, or secret URL parameters. Respect user preferences and host permissions. Expected validation, authentication, or credit-limit errors, empty results, and MCP truncation are not automatically bugs. If submission fails, do not retry or report itself; mention the failure. Claim success only after confirmation. Feedback costs no credits.";

export const FEEDBACK_TOOL_DESCRIPTION =
  "Report a Context problem to the Context team. Always use this when a tool or API behaves unexpectedly, including wrong or incomplete successful results, unexpected errors, or a docs mismatch, even after a successful workaround. Never use it for account limits working as intended: 401 USAGE_EXCEEDED, 429 RATE_LIMITED, or 403 PAID_PLAN_REQUIRED. Send a category, a note describing the affected tool and expected versus actual behavior, and the affected request_id, a relevant public url, or both. Use a url when no request_id is available; never invent an ID. Sanitize secrets and private data. Costs no credits. Report each distinct issue once; reporting the same request_id again returns the original feedback_id. If this tool fails, do not recursively report its failure or loop on retries.";

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

const ACCOUNT_LIMIT_NEXT_STEPS = new Map([
  [
    "USAGE_EXCEEDED",
    "Context has insufficient credits for this request, and every other Context tool that costs credits will fail the same way until credits are added or refilled. Stop calling Context tools for the rest of this task, including from parallel calls or subagents; retrying or switching tools only repeats this error. Tell the user once that they can add credits at [Manage billing](https://www.context.dev/dashboard/subscription); `get-usage` (free) shows their balance and next refill. Continue any work that does not need Context.",
  ],
  [
    "RATE_LIMITED",
    "Wait for the Retry-After window before retrying, and make fewer parallel calls.",
  ],
  [
    "PAID_PLAN_REQUIRED",
    "Retry without `sharedParams.actions`; use `sharedParams.waitFor` to wait for content instead.",
  ],
]);

export function contextApiError(
  toolName: string,
  message: string,
  errorCode?: string,
) {
  const accountLimitNextStep = errorCode
    ? ACCOUNT_LIMIT_NEXT_STEPS.get(errorCode)
    : undefined;
  const guidance =
    toolName === "submit-feedback"
      ? "Feedback submission was not confirmed. Do not call submit-feedback to report its own failure or loop on retries. Continue the task and tell the user feedback could not be submitted."
      : accountLimitNextStep
        ? `This is an account limit working as intended; do not call submit-feedback. ${accountLimitNextStep}`
        : "If this behavior is unexpected, always call submit-feedback once for this issue, even if a retry or workaround succeeds. Include a category, a sanitized note naming the tool and expected versus actual behavior, and the affected request_id above or a relevant public page/docs url if no ID is available. Never invent an ID or include secrets/private data. Follow the user's reporting preferences and host permissions. Do not report expected validation, authentication, or credit-limit errors as bugs.";
  return error(`${message}\n\n${guidance}`);
}
