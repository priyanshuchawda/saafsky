import { test } from "node:test";
import assert from "node:assert/strict";
import { decideLimits } from "../src/server/rate-limit-result.ts";

test("rate limits fail closed when Upstash returns a successful timeout", () => {
  const permitted = { success: true, reset: 20_000 };
  const timeout = { success: true, reset: 0, reason: "timeout" };
  assert.deepEqual(decideLimits([permitted, timeout], 10_000), {
    allowed: false,
    reason: "unavailable",
  });
  assert.deepEqual(decideLimits([], 10_000), {
    allowed: false,
    reason: "unavailable",
  });
  assert.deepEqual(decideLimits([permitted], 10_000), { allowed: true });
});

test("rate limits report the longest rejected window and round up", () => {
  assert.deepEqual(
    decideLimits(
      [{ success: false, reset: 11_001 }, { success: false, reset: 15_001 }],
      10_000,
    ),
    { allowed: false, reason: "limited", retryAfter: 6 },
  );
});
