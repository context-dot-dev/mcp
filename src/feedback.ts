import { error } from "mcp-use/server";

export const FEEDBACK_INSTRUCTIONS =
  "Always report unexpected Context API behavior with `submit-feedback` as part of completing the task, even if a retry or workaround succeeds. This includes unexpected errors, wrong or incomplete data in a successful response, and behavior that differs from the docs. Report each distinct issue once; do not submit duplicate reports for retries of the same issue. " +
  "Choose the closest category (bug, docs_mismatch, friction, feature_gap, quality_degradation, or other). In note, name the affected tool, describe expected versus actual behavior, and include minimal reproduction details (maximum 4000 characters). Include the affected call's request_id when available; otherwise use a relevant public page or docs url. Never invent a request_id or use the ID of a later logs/feedback call. Use list-logs/get-log only if needed to find the affected request. " +
  "Send only sanitized diagnostic details: never include API keys, tokens, cookies, private page contents, personal data, or secret URL parameters. Respect the user's reporting preferences and the host's permissions. Expected validation/authentication/credit-limit errors are not bugs unless the behavior is itself unexpected; normal empty results and MCP response truncation are not automatically defects. " +
  "Feedback costs no credits. If submit-feedback fails, do not report that failure through submit-feedback or enter a retry loop; continue the task and mention that feedback could not be submitted. Only say feedback was submitted after the tool confirms success.";

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
    "Context has insufficient credits for this request. Do not retry until credits are added or refilled. Use `get-usage` once (free) to tell the user their current balance and next refill, when available. They can add credits at [Manage billing](https://www.context.dev/dashboard/subscription). Continue any work that does not depend on this request.",
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

const NO_UNCHANGED_RETRY_CODES = new Set([
  "AUTHENTICATION_FAILED",
  "UNAUTHORIZED",
  "DISABLED",
  "FORBIDDEN",
  "INSUFFICIENT_PERMISSIONS",
  "NOT_FOUND",
  "INPUT_VALIDATION_ERROR",
  "TIMEOUT_EXCEEDS_MAXIMUM",
  "TIMEOUT_TOO_SHORT_FOR_WAIT",
  "WEBSITE_ACCESS_ERROR",
  "WEBSITE_BLOCKED",
  "WEBSITE_NOT_FOUND",
  "PDF_SKIPPED",
  "PDF_IMAGES_ONLY",
  "ZDR_NOT_SUPPORTED",
  "ZDR_NOT_ENABLED",
  "FREE_EMAIL_DETECTED",
  "DISPOSABLE_EMAIL_DETECTED",
  "COLD_DOMAIN_TIMEOUT_TOO_LOW",
  "UNSUPPORTED_CONTENT",
  "CONTENT_TOO_LARGE",
  "MONITOR_PAUSED",
  "MONITOR_NO_WEBHOOK",
  "COLLECTION_PAUSED",
  "MONITOR_LIMIT_EXCEEDED",
  "BATCH_LIMIT_EXCEEDED",
  "BATCH_NOT_CANCELLABLE",
  "IDEMPOTENCY_KEY_CONFLICT",
  "DELIVERY_ALREADY_DELIVERED",
  "DELIVERY_EXPIRED",
  "DELIVERY_CANCELLED",
]);

const RETRY_ONCE_CODES = new Set([
  "INTERNAL_ERROR",
  "REQUEST_TIMEOUT",
  "SEARCH_UNAVAILABLE",
]);

const RETRY_LATER_CODES = new Set([
  "BATCH_NOT_COMPLETED",
  "DELIVERY_IN_PROGRESS",
]);

export function contextApiError(
  toolName: string,
  message: string,
  errorCode?: string,
) {
  const accountLimitNextStep = errorCode
    ? ACCOUNT_LIMIT_NEXT_STEPS.get(errorCode)
    : undefined;
  const hasNoUnchangedRetry = errorCode
    ? NO_UNCHANGED_RETRY_CODES.has(errorCode)
    : false;
  const shouldRetryOnce = errorCode ? RETRY_ONCE_CODES.has(errorCode) : false;
  const shouldRetryLater = errorCode ? RETRY_LATER_CODES.has(errorCode) : false;
  const guidance =
    toolName === "submit-feedback"
      ? "Feedback submission was not confirmed. Do not call submit-feedback to report its own failure or loop on retries. Continue the task and tell the user feedback could not be submitted."
      : accountLimitNextStep
        ? `This is an account limit working as intended; do not call submit-feedback. ${accountLimitNextStep}`
        : hasNoUnchangedRetry
          ? "Retry: no, not with the same arguments. Fix the input, authentication, permissions, account state, or target before calling again. Only call submit-feedback if the error contradicts the documentation."
          : shouldRetryOnce
            ? "Retry: at most once, after any stated delay and with a smaller request when applicable. If it fails again, call submit-feedback once, then stop retrying this issue."
            : shouldRetryLater
              ? "Retry: later, after checking the resource status. Do not poll this tool in a tight loop."
        : "If this behavior is unexpected, always call submit-feedback once for this issue, even if a retry or workaround succeeds. Include a category, a sanitized note naming the tool and expected versus actual behavior, and the affected request_id above or a relevant public page/docs url if no ID is available. Never invent an ID or include secrets/private data. Follow the user's reporting preferences and host permissions. Do not report expected validation, authentication, or credit-limit errors as bugs.";
  return error(`${message}\n\n${guidance}`);
}
