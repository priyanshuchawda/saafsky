import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequestCache } from "../src/lib/request-cache.ts";

test("request cache reuses a fresh value without calling the loader", async () => {
  let now = 100;
  const cache = createRequestCache<string>(500, () => now);
  let calls = 0;
  const first = await cache.load("city", async () => {
    calls++;
    return "air snapshot";
  });
  now += 499;
  const second = await cache.load("city", async () => {
    calls++;
    return "new snapshot";
  });

  assert.equal(first, "air snapshot");
  assert.equal(second, first);
  assert.equal(calls, 1);
});

test("request cache deduplicates overlapping loads for the same key", async () => {
  const cache = createRequestCache<string>(1000);
  let release!: (value: string) => void;
  let calls = 0;
  const loader = () => {
    calls++;
    return new Promise<string>((resolve) => {
      release = resolve;
    });
  };
  const first = cache.load("same-city", loader);
  const second = cache.load("same-city", loader);
  release("shared result");

  assert.deepEqual(await Promise.all([first, second]), [
    "shared result",
    "shared result",
  ]);
  assert.equal(calls, 1);
});

test("request cache expires and invalidates values, and never retains failures", async () => {
  let now = 0;
  const cache = createRequestCache<number>(10, () => now);
  let calls = 0;
  await cache.load("city", async () => ++calls);
  now = 10;
  assert.equal(await cache.load("city", async () => ++calls), 2);
  cache.invalidate("city");
  assert.equal(await cache.load("city", async () => ++calls), 3);
  await assert.rejects(
    cache.load("failed", async () => {
      throw new Error("temporary failure");
    }),
  );
  assert.equal(await cache.load("failed", async () => ++calls), 4);
});

test("request cache evicts the least recently used city when its size is bounded", async () => {
  const cache = createRequestCache<number>(1000, Date.now, 2);
  let calls = 0;
  const load = (key: string) => cache.load(key, async () => ++calls);

  await load("one");
  await load("two");
  await load("one");
  await load("three");
  await load("two");

  assert.equal(calls, 4);
});
