import { randomUUID } from "node:crypto";
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
if (!redisUrl || !redisToken) {
  throw new Error(
    "Set both Upstash REST credentials before running this smoke.",
  );
}

const prefix = `saafsky:verification:${randomUUID()}`;
const limiter = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.fixedWindow(1, "1 m"),
  prefix,
});
const concurrentResults = await Promise.all(
  Array.from({ length: 24 }, () => limiter.limit("same-client")),
);
const allowed = concurrentResults.filter((result) => result.success).length;
if (allowed !== 1) {
  throw new Error(
    `Expected exactly one distributed permit for one client; received ${allowed}.`,
  );
}

const independentClient = await limiter.limit("independent-client");
if (!independentClient.success) {
  throw new Error(
    "A separate client unexpectedly shared the first client's limit.",
  );
}

console.log(
  "Upstash concurrency smoke passed: one permit across 24 concurrent requests; a separate client received its own permit. Test keys expire within one minute.",
);
