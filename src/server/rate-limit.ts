import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
import { SERVER_BUDGETS } from "../config/server-budgets.ts";
import type { ServerEnvironment } from "../config/server-runtime-config.ts";
import { trustedClientKey } from "./client-key.ts";
import { reportServiceFailure } from "./diagnostics.ts";
import { protectionConfig } from "./protection-config.ts";
import {
  decideLimits,
  type LimitDecision,
  type LimitResult,
} from "./rate-limit-result.ts";
import { applyRateLimitStages } from "./rate-limit-stages.ts";

type Scope = "air" | "locations" | "chat";
type LimiterWindow = "1 m" | "1 d";
type LimiterOptions = {
  redis: unknown;
  limit: number;
  window: LimiterWindow;
  prefix: string;
};
type Limiter = { limit(identifier: string): Promise<LimitResult> };

export type RateLimitAdapterDependencies = {
  environment: () => ServerEnvironment;
  createRedis: () => unknown;
  createLimiter: (options: LimiterOptions) => Limiter;
  identifyClient: (
    headers: Headers,
    onVercel: boolean,
    hashSecret: string,
  ) => string | null;
  onFailure: (service: "rate_limit", error: unknown) => void;
  now?: () => number;
};

export type AiAttemptBudgetDependencies = Pick<
  RateLimitAdapterDependencies,
  "createRedis" | "createLimiter" | "now"
>;

/** Reuse the distributed AI budget limiters across requests in this runtime. */
export function createAiAttemptChecker(
  dependencies: AiAttemptBudgetDependencies,
): () => Promise<boolean> {
  let limiters: { minute: Limiter; daily: Limiter } | undefined;
  return async () => {
    if (!limiters) {
      const redis = dependencies.createRedis();
      limiters = {
        minute: dependencies.createLimiter({
          redis,
          limit: SERVER_BUDGETS.ai.minute,
          window: "1 m",
          prefix: "saafsky:chat:minute",
        }),
        daily: dependencies.createLimiter({
          redis,
          limit: SERVER_BUDGETS.ai.day,
          window: "1 d",
          prefix: "saafsky:chat:day",
        }),
      };
    }
    const [minute, daily] = await Promise.all([
      limiters.minute.limit("global"),
      limiters.daily.limit("global"),
    ]);
    return decideLimits([minute, daily], dependencies.now?.() ?? Date.now())
      .allowed;
  };
}

/** Build the shared limiter with replaceable infrastructure for deterministic tests. */
export function createPublicRequestChecker(
  dependencies: RateLimitAdapterDependencies,
): (scope: Scope, request: Request) => Promise<LimitDecision> {
  return async (scope, request) => {
    const config = protectionConfig(dependencies.environment());
    if (config.kind === "local") return { allowed: true };
    if (config.kind === "unavailable")
      return { allowed: false, reason: "unavailable" };

    const client = dependencies.identifyClient(
      request.headers,
      config.onVercel,
      config.hashSecret,
    );
    if (config.onVercel && !client)
      return { allowed: false, reason: "unavailable" };

    try {
      const requestBudget = SERVER_BUDGETS.requests[scope];
      const redis = dependencies.createRedis();
      const createLimit = (
        limit: number,
        window: LimiterWindow,
        prefix: string,
      ) => {
        const limiter = dependencies.createLimiter({
          redis,
          limit,
          window,
          prefix,
        });
        return (identifier: string) => limiter.limit(identifier);
      };

      const minute = createLimit(
        requestBudget.minute,
        "1 m",
        `saafsky:${scope}:requests`,
      );
      const daily = createLimit(
        requestBudget.day,
        "1 d",
        `saafsky:${scope}:daily`,
      );
      const visitorChecks: (() => Promise<LimitResult>)[] = [];
      if (client) {
        const perClient = createLimit(
          requestBudget.visitorMinute,
          "1 m",
          `saafsky:${scope}:visitor`,
        );
        visitorChecks.push(() => perClient(client));
        if (scope === "chat") {
          const perDay = createLimit(
            SERVER_BUDGETS.requests.chat.visitorDay,
            "1 d",
            "saafsky:chat:visitor-day",
          );
          visitorChecks.push(() => perDay(client));
        }
      }

      return await applyRateLimitStages(
        client ? () => visitorChecks.map((check) => check()) : null,
        () => [minute("global"), daily("global")],
        dependencies.now ?? Date.now,
      );
    } catch (error) {
      dependencies.onFailure("rate_limit", error);
      return { allowed: false, reason: "unavailable" };
    }
  };
}

let sharedRedis: ReturnType<typeof Redis.fromEnv> | undefined;
const redisClient = () => (sharedRedis ??= Redis.fromEnv());
const sharedLimiters = new Map<
  string,
  { limit: number; window: LimiterWindow; limiter: Limiter }
>();

function upstashLimiter(options: LimiterOptions): Limiter {
  const cached = sharedLimiters.get(options.prefix);
  if (cached) {
    if (cached.limit !== options.limit || cached.window !== options.window) {
      throw new Error("Rate-limit configuration changed for a cached prefix");
    }
    return cached.limiter;
  }
  if (sharedLimiters.size >= 12) {
    throw new Error("Rate-limit prefix capacity exceeded");
  }
  const limiter = new Ratelimit({
    redis: options.redis as ReturnType<typeof Redis.fromEnv>,
    limiter: Ratelimit.fixedWindow(options.limit, options.window),
    prefix: options.prefix,
  });
  sharedLimiters.set(options.prefix, {
    limit: options.limit,
    window: options.window,
    limiter,
  });
  return limiter;
}

const checkWithUpstash = createPublicRequestChecker({
  environment: () => process.env,
  createRedis: redisClient,
  createLimiter: upstashLimiter,
  identifyClient: trustedClientKey,
  onFailure: reportServiceFailure,
});

const checkAiAttemptWithUpstash = createAiAttemptChecker({
  createRedis: redisClient,
  createLimiter: upstashLimiter,
});

/** Shared Redis-backed request limits; public configuration fails closed. */
export const checkPublicRequest = checkWithUpstash;
/** Shared global reservation for each primary or fallback Gemini request. */
export const checkAiAttempt = checkAiAttemptWithUpstash;
