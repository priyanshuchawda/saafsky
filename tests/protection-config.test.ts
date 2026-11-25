import { test } from "node:test";
import assert from "node:assert/strict";
import { protectionConfig } from "../src/server/protection-config.ts";

test("only fully unconfigured local development may bypass shared protection", () => {
  assert.deepEqual(protectionConfig({}), { kind: "local" });
  assert.deepEqual(protectionConfig({ SAAFSKY_PUBLIC: "true" }), {
    kind: "unavailable",
  });
  assert.deepEqual(protectionConfig({ VERCEL: "1" }), { kind: "unavailable" });
  assert.deepEqual(
    protectionConfig({ UPSTASH_REDIS_REST_URL: "https://redis.example" }),
    { kind: "unavailable" },
  );
  assert.deepEqual(protectionConfig({ SAAFSKY_PUBLIC: "TRUE" }), {
    kind: "unavailable",
  });
});

test("public protection requires a secure Redis URL and a platform hash secret", () => {
  const config = {
    VERCEL: "1",
    UPSTASH_REDIS_REST_TOKEN: "token",
    RATE_LIMIT_HASH_SECRET: "secret",
  };
  for (const url of [
    "not a URL",
    "http://redis.example",
    "https://user:password@redis.example",
    "https://redis.example/?token=bad",
  ]) {
    assert.deepEqual(
      protectionConfig({ ...config, UPSTASH_REDIS_REST_URL: url }),
      { kind: "unavailable" },
    );
  }
  assert.deepEqual(
    protectionConfig({
      ...config,
      UPSTASH_REDIS_REST_URL: "https://redis.example",
      RATE_LIMIT_HASH_SECRET: " ",
    }),
    { kind: "unavailable" },
  );
  assert.deepEqual(
    protectionConfig({
      ...config,
      UPSTASH_REDIS_REST_URL: "https://redis.example",
    }),
    { kind: "ready", onVercel: true, hashSecret: "secret" },
  );
});

test("configured local development can use a local HTTP Redis emulator", () => {
  assert.deepEqual(
    protectionConfig({
      UPSTASH_REDIS_REST_URL: "http://localhost:8080",
      UPSTASH_REDIS_REST_TOKEN: "token",
    }),
    { kind: "ready", onVercel: false, hashSecret: "" },
  );
});
