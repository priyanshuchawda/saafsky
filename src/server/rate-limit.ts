import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
import { NextResponse } from "next/server";
import { trustedClientKey } from "@/server/client-key";

type Decision =
  | { allowed: true }
  | { allowed: false; reason: "limited" | "unavailable"; retryAfter?: number };
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
    const checks = [minute.limit("global"), daily.limit("global")];
    if (client) {
      const perClient = new Ratelimit({
        redis,
        limiter: Ratelimit.fixedWindow(scope === "chat" ? 3 : 15, "1 m"),
        prefix: `saafsky:${scope}:visitor`,
      });
      checks.push(perClient.limit(client));
      if (scope === "chat") {
        const perDay = new Ratelimit({
          redis,
          limiter: Ratelimit.fixedWindow(5, "1 d"),
          prefix: "saafsky:chat:visitor-day",
        });
        checks.push(perDay.limit(client));
      }
    }
    const results = await Promise.all(checks);
    const rejected = results.filter((result) => !result.success);
    if (rejected.length)
      return {
        allowed: false,
        reason: "limited",
        retryAfter: Math.max(
          1,
          Math.ceil(
            (Math.max(...rejected.map((result) => result.reset)) - Date.now()) /
              1000,
          ),
        ),
      };
    return { allowed: true };
  } catch {
    return { allowed: false, reason: "unavailable" };
  }
}

export function rateLimitResponse(
  decision: Exclude<Decision, { allowed: true }>,
): NextResponse {
  return decision.reason === "limited"
    ? NextResponse.json(
        { error: "Request limit reached. Please try later." },
        {
          status: 429,
          headers: { "Retry-After": String(decision.retryAfter ?? 60) },
        },
      )
    : NextResponse.json(
        { error: "Request protection is temporarily unavailable." },
        { status: 503 },
      );
}
