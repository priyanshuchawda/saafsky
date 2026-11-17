import { test } from "node:test";
import assert from "node:assert/strict";
import { monthlyImpact } from "../src/features/sustainability/calculate.ts";

test("impact uses distance, days and per-passenger factors", () => {
  assert.deepEqual(monthlyImpact(10, 20, 0.2, "bus"), {
    baseline: 40,
    alternative: 20.77,
    difference: 19.23,
  });
  assert.equal(monthlyImpact(0, 20, 0.2, "walk")?.difference, 0);
  assert.ok(monthlyImpact(10, 20, 0.01, "bus")!.difference < 0);
  assert.equal(monthlyImpact(10, 32, 0.2, "bus"), null);
});
