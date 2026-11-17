/** Upstash's timeout result is fail-open by default; never treat it as approval. */
export type LimitResult = {
  success: boolean;
  reset: number;
  reason?: string | undefined;
};

export type LimitDecision =
  | { allowed: true }
  | { allowed: false; reason: "limited" | "unavailable"; retryAfter?: number };

export function decideLimits(
  results: readonly LimitResult[],
  now: number,
): LimitDecision {
  if (
    results.length === 0 ||
    results.some((result) => result.reason === "timeout")
  ) {
    return { allowed: false, reason: "unavailable" };
  }
  const rejected = results.filter((result) => !result.success);
  if (rejected.length === 0) return { allowed: true };
  return {
    allowed: false,
    reason: "limited",
    retryAfter: Math.max(
      1,
      Math.ceil((Math.max(...rejected.map((result) => result.reset)) - now) / 1000),
    ),
  };
}
