import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createPublicRequestChecker,
  type RateLimitAdapterDependencies,
} from "../src/server/rate-limit.ts";
import type { LimitResult } from "../src/server/rate-limit-result.ts";

const publicEnvironment = {
  VERCEL: "1",
  SAAFSKY_PUBLIC: "true",
  UPSTASH_REDIS_REST_URL: "https://redis.example",
  UPSTASH_REDIS_REST_TOKEN: "token",
  RATE_LIMIT_HASH_SECRET: "hash-secret",
};

function dependencies(
  result: (prefix: string) => LimitResult = () => ({
    success: true,
    reset: Date.now() + 60_000,
  }),
  onFailure: () => void = () => {},
): RateLimitAdapterDependencies {
  return {
    environment: () => publicEnvironment,
    identifyClient: () => "visitor-hash",
    createRedis: () => ({}),
    createLimiter: ({ prefix }) => ({
      limit: async () => result(prefix),
    }),
    onFailure: () => onFailure(),
  };
}

const request = new Request("https://saafsky.example/api/air");

test("local development bypasses Redis and public mode applies visitor and global budgets", async () => {
  let redisCalls = 0;
  const local = createPublicRequestChecker({
    ...dependencies(),
    environment: () => ({}),
    createRedis: () => {
      redisCalls++;
      return {};
    },
  });
  assert.deepEqual(await local("air", request), { allowed: true });
  assert.equal(redisCalls, 0);

  const publicCheck = createPublicRequestChecker(dependencies());
  assert.deepEqual(await publicCheck("air", request), { allowed: true });
});

test("visitor rejection does not consume global counters", async () => {
  const counterCalls: string[] = [];
  const check = createPublicRequestChecker({
    ...dependencies(),
    createLimiter: ({ prefix }) => {
      return {
        limit: async () => {
          counterCalls.push(prefix);
          return {
            success: !prefix.includes(":visitor"),
            reset: Date.now() + 60_000,
          };
        },
      };
    },
  });

  const decision = await check("air", request);

  assert.equal(decision.allowed, false);
  assert.equal(
    counterCalls.some((prefix) => prefix.endsWith(":requests")),
    false,
  );
});

test("chat enforces its separate visitor-day budget before global usage", async () => {
  const counterCalls: string[] = [];
  const check = createPublicRequestChecker({
    ...dependencies(),
    now: () => 0,
    createLimiter: ({ prefix }) => ({
      limit: async () => {
        counterCalls.push(prefix);
        return {
          success: !prefix.endsWith(":visitor-day"),
          reset: 60_000,
        };
      },
    }),
  });

  const decision = await check("chat", request);

  assert.deepEqual(decision, {
    allowed: false,
    reason: "limited",
    retryAfter: 60,
  });
  assert.ok(counterCalls.some((prefix) => prefix.endsWith(":visitor-day")));
  assert.equal(
    counterCalls.some((prefix) => prefix.endsWith(":requests")),
    false,
  );
});

test("global minute or day exhaustion denies an admitted visitor", async () => {
  const check = createPublicRequestChecker({
    ...dependencies(),
    now: () => 0,
    createLimiter: ({ prefix }) => ({
      limit: async () => ({
        success: !prefix.endsWith(":daily"),
        reset: 60_000,
      }),
    }),
  });

  assert.deepEqual(await check("air", request), {
    allowed: false,
    reason: "limited",
    retryAfter: 60,
  });
});

test("Redis and limiter errors fail closed and report only the service boundary", async () => {
  let failures = 0;
  const check = createPublicRequestChecker({
    ...dependencies(undefined, () => failures++),
    createRedis: () => {
      throw new Error("private Redis details");
    },
  });

  assert.deepEqual(await check("chat", request), {
    allowed: false,
    reason: "unavailable",
  });
  assert.equal(failures, 1);
});
