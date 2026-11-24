import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
import { trustedClientKey } from "@/server/client-key";
import { applyRateLimitStages } from "@/server/rate-limit-stages";
import type { LimitDecision, LimitResult } from "@/server/rate-limit-result";
import { reportServiceFailure } from "@/server/diagnostics";

type Decision = LimitDecision;
type Scope = "air" | "locations" | "chat";

/** Global budgets protect upstream quotas; Vercel requests also receive per-client caps. */
export async function checkPublicRequest(
  scope: Scope,
  request: Request,
): Promise<Decision> {
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!process.env.UPSTASH_REDIS_REST_URL || !token)
    return !process.env.VERCEL && process.env.SAAFSKY_PUBLIC !== "true"
      ? { allowed: true }
      : { allowed: false, reason: "unavailable" };
  const onVercel = Boolean(process.env.VERCEL);
  const client = trustedClientKey(
    request.headers,
    onVercel,
    process.env.RATE_LIMIT_HASH_SECRET ?? "",
  );
  if (onVercel && !client) return { allowed: false, reason: "unavailable" };
  try {
    const redis = Redis.fromEnv();
    const minute = new Ratelimit({
      redis,
      limiter: Ratelimit.fixedWindow(scope === "chat" ? 5 : 30, "1 m"),
      prefix: `saafsky:${scope}:requests`,
    });
    const daily = new Ratelimit({
      redis,
      limiter: Ratelimit.fixedWindow(scope === "chat" ? 50 : 1000, "1 d"),
      prefix: `saafsky:${scope}:daily`,
    });
    const visitorChecks: (() => Promise<LimitResult>)[] = [];
    if (client) {
      const perClient = new Ratelimit({
        redis,
        limiter: Ratelimit.fixedWindow(scope === "chat" ? 3 : 15, "1 m"),
        prefix: `saafsky:${scope}:visitor`,
      });
      visitorChecks.push(() => perClient.limit(client));
      if (scope === "chat") {
        const perDay = new Ratelimit({
          redis,
          limiter: Ratelimit.fixedWindow(5, "1 d"),
          prefix: "saafsky:chat:visitor-day",
        });
        visitorChecks.push(() => perDay.limit(client));
      }
    }
    return await applyRateLimitStages(
      client ? () => visitorChecks.map((check) => check()) : null,
      () => [minute.limit("global"), daily.limit("global")],
      Date.now,
    );
  } catch (error) {
    reportServiceFailure("rate_limit", error);
    return { allowed: false, reason: "unavailable" };
  }
}
