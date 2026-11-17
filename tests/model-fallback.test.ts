import { test } from "node:test";
import assert from "node:assert/strict";
import { withModelFallback } from "../src/features/assistant/model-fallback.ts";

function providerError(status: number): Error & { status: number } {
  return Object.assign(new Error("Provider failure"), { status });
}

test("fallback model is attempted once only after an eligible failure and a new budget reservation", async () => {
  const calls: string[] = [];
  let reservations = 0;
  const answer = await withModelFallback(
    "first",
    "second",
    async (model) => {
      calls.push(model);
      if (model === "first") throw providerError(429);
      return "answer";
    },
    async () => {
      reservations++;
      return true;
    },
  );
  assert.equal(answer, "answer");
  assert.deepEqual(calls, ["first", "second"]);
  assert.equal(reservations, 1);
});

test("invalid responses, denied budgets, and repeated model names never trigger a fallback call", async () => {
  for (const [error, fallback, budget] of [
    [new Error("invalid response"), "second", true],
    [providerError(429), "second", false],
    [providerError(503), "first", true],
  ] as const) {
    let calls = 0;
    await assert.rejects(
      withModelFallback(
        "first",
        fallback,
        async () => {
          calls++;
          throw error;
        },
        async () => budget,
      ),
    );
    assert.equal(calls, 1);
  }
});
