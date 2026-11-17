import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

/** Global caps protect shared free quotas. Public deployments fail closed without Redis. */
export async function allowPublicRequest(
  scope: "air" | "locations" | "chat",
): Promise<boolean> {
  if (
    !process.env.UPSTASH_REDIS_REST_URL ||
    !process.env.UPSTASH_REDIS_REST_TOKEN
  )
    return !process.env.VERCEL && process.env.SAAFSKY_PUBLIC !== "true";
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
    const [short, day] = await Promise.all([
      minute.limit("global"),
      daily.limit("global"),
    ]);
    return short.success && day.success;
  } catch {
    return false;
  }
}
