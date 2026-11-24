import { decideLimits } from "./rate-limit-result.ts";
import type { LimitDecision, LimitResult } from "./rate-limit-result.ts";

/** Check a trusted visitor first so repeated rejections do not drain global budgets. */
export async function applyRateLimitStages(
  visitorChecks: (() => Promise<LimitResult>[]) | null,
  globalChecks: () => Promise<LimitResult>[],
  now: () => number,
): Promise<LimitDecision> {
  if (visitorChecks) {
    const visitor = decideLimits(await Promise.all(visitorChecks()), now());
    if (!visitor.allowed) return visitor;
  }
  return decideLimits(await Promise.all(globalChecks()), now());
}
