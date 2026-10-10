import { createHash } from "node:crypto";

type KeyQueue = { running: number; waiting: Array<() => void> };

// Agents fire tool calls in parallel, but plans with a concurrency limit reject
// every call past the limit with 429. Holding the extra calls here until a
// slot frees turns those rejections into short waits.
const MAX_REMEMBERED_KEYS = 10_000;
const concurrencyLimits = new Map<string, number>();
const queues = new Map<string, KeyQueue>();

export function getApiKeyId(headers: HeadersInit | undefined): string | undefined {
  const authorization = new Headers(headers).get("Authorization");
  if (!authorization) return undefined;
  return createHash("sha256").update(authorization).digest("hex");
}

export async function acquireApiKeySlot(
  keyId: string,
  deadline: number,
): Promise<() => void> {
  const queue = queues.get(keyId) ?? { running: 0, waiting: [] };
  queues.set(keyId, queue);
  const limit = concurrencyLimits.get(keyId) ?? Infinity;
  const isSlotFree = queue.running < limit && queue.waiting.length === 0;
  const hasReceivedSlot = isSlotFree ? false : await waitForSlot(queue, deadline);
  if (!hasReceivedSlot) queue.running += 1;
  let isReleased = false;
  return () => {
    if (isReleased) return;
    isReleased = true;
    releaseSlot(keyId, queue);
  };
}

export function rememberConcurrencyLimit(keyId: string, headers: Headers) {
  const limit = Number(headers.get("X-RateLimit-Limit"));
  const isConcurrencyLimit =
    headers.get("X-RateLimit-Mode") === "concurrency" && Number.isInteger(limit) && limit > 0;
  concurrencyLimits.delete(keyId);
  if (!isConcurrencyLimit) return;
  concurrencyLimits.set(keyId, limit);
  if (concurrencyLimits.size <= MAX_REMEMBERED_KEYS) return;
  const oldestKeyId = concurrencyLimits.keys().next().value;
  if (oldestKeyId) concurrencyLimits.delete(oldestKeyId);
}

// The slot moves straight to the next waiter so a new call cannot take it in between.
function releaseSlot(keyId: string, queue: KeyQueue) {
  const nextWaiter = queue.waiting.shift();
  if (nextWaiter) return nextWaiter();
  queue.running -= 1;
  if (queue.running === 0) queues.delete(keyId);
}

// Past the deadline the call goes out anyway; the API's 429 retry path then
// decides, so a stuck slot can never hold a call forever.
function waitForSlot(queue: KeyQueue, deadline: number): Promise<boolean> {
  return new Promise((resolve) => {
    const receiveSlot = () => {
      clearTimeout(timer);
      resolve(true);
    };
    const timer = setTimeout(() => {
      queue.waiting.splice(queue.waiting.indexOf(receiveSlot), 1);
      resolve(false);
    }, Math.max(0, deadline - Date.now()));
    queue.waiting.push(receiveSlot);
  });
}
