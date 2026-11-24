import { test } from "node:test";
import assert from "node:assert/strict";
import { applyRateLimitStages } from "../src/server/rate-limit-stages.ts";

test("rejected or unavailable visitor checks do not spend the shared budget", async () => {
  for (const visitor of [
    { success: false, reset: 15_000 },
    { success: true, reset: 0, reason: "timeout" },
  ]) {
    let globalCalls = 0;
    const decision = await applyRateLimitStages(
      () => [Promise.resolve(visitor)],
      () => {
        globalCalls++;
        return [Promise.resolve({ success: true, reset: 20_000 })];
      },
      () => 10_000,
    );
    assert.equal(decision.allowed, false);
    assert.equal(globalCalls, 0);
  }
});

test("eligible visitors still consume and obey the global budget", async () => {
  let globalCalls = 0;
  const decision = await applyRateLimitStages(
    () => [Promise.resolve({ success: true, reset: 15_000 })],
    () => {
      globalCalls++;
      return [Promise.resolve({ success: false, reset: 20_000 })];
    },
    () => 10_000,
  );
  assert.equal(globalCalls, 1);
  assert.deepEqual(decision, {
    allowed: false,
    reason: "limited",
    retryAfter: 10,
  });
});

test("missing visitor identity still checks global limits; errors never run a later stage", async () => {
  assert.deepEqual(
    await applyRateLimitStages(
      null,
      () => [Promise.resolve({ success: true, reset: 20_000 })],
      () => 10_000,
    ),
    { allowed: true },
  );
  let globalCalls = 0;
  await assert.rejects(
    applyRateLimitStages(
      () => [Promise.reject(new Error("Redis unavailable"))],
      () => {
        globalCalls++;
        return [Promise.resolve({ success: true, reset: 20_000 })];
      },
      () => 10_000,
    ),
  );
  assert.equal(globalCalls, 0);
});

test("concurrent requests cannot bypass either controlled counter", async () => {
  let visitorCount = 0;
  let globalCount = 0;
  const attempts = Array.from({ length: 12 }, () =>
    applyRateLimitStages(
      () => [Promise.resolve({ success: ++visitorCount <= 5, reset: 20_000 })],
      () => [Promise.resolve({ success: ++globalCount <= 3, reset: 20_000 })],
      () => 10_000,
    ),
  );
  const decisions = await Promise.all(attempts);
  assert.equal(decisions.filter((decision) => decision.allowed).length, 3);
  assert.equal(globalCount, 5);
});
