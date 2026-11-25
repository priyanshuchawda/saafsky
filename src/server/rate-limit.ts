import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
import { trustedClientKey } from "@/server/client-key";
import { applyRateLimitStages } from "@/server/rate-limit-stages";
import type { LimitDecision, LimitResult } from "@/server/rate-limit-result";
import { reportServiceFailure } from "@/server/diagnostics";
import { protectionConfig } from "@/server/protection-config";
import { SERVER_BUDGETS } from "@/config/server-budgets";

type Decision = LimitDecision;
type Scope = "air" | "locations" | "chat";

/** Global budgets protect upstream quotas; Vercel requests also receive per-client caps. */
export async function checkPublicRequest(
  scope: Scope,
  request: Request,
): Promise<Decision> {
  const config = protectionConfig(process.env);
  if (config.kind === "local") return { allowed: true };
  if (config.kind === "unavailable")
    return { allowed: false, reason: "unavailable" };
  const client = trustedClientKey(
    request.headers,
    config.onVercel,
    config.hashSecret,
  );
  if (config.onVercel && !client)
    return { allowed: false, reason: "unavailable" };
  try {
    const requestBudget = SERVER_BUDGETS.requests[scope];
    const redis = Redis.fromEnv();
    const minute = new Ratelimit({
      redis,
      limiter: Ratelimit.fixedWindow(requestBudget.minute, "1 m"),
      prefix: `saafsky:${scope}:requests`,
    });
    const daily = new Ratelimit({
      redis,
      limiter: Ratelimit.fixedWindow(requestBudget.day, "1 d"),
      prefix: `saafsky:${scope}:daily`,
    });
    const visitorChecks: (() => Promise<LimitResult>)[] = [];
    if (client) {
      const perClient = new Ratelimit({
        redis,
        limiter: Ratelimit.fixedWindow(requestBudget.visitorMinute, "1 m"),
        prefix: `saafsky:${scope}:visitor`,
      });
      visitorChecks.push(() => perClient.limit(client));
      if (scope === "chat") {
        const perDay = new Ratelimit({
          redis,
          limiter: Ratelimit.fixedWindow(
            SERVER_BUDGETS.requests.chat.visitorDay,
            "1 d",
          ),
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
