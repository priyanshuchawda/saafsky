import { test } from "node:test";
import assert from "node:assert/strict";
import { generateDailyPlan } from "../src/features/planner/daily.ts";
import type { HouseholdProfile } from "../src/features/recommendations/engine.ts";

const profile: HouseholdProfile = {
  sensitive: true,
  children: false,
  outdoorExercise: false,
  commute: "bike",
  cookingSmoke: false,
};
test("daily plan uses the safety engine and accounts for outdoor commutes", () => {
  const steps = generateDailyPlan(180, profile);
  assert.equal(steps.length, 3);
  assert.ok(steps[0]?.actionIds.includes("reduce-outdoor-exertion"));
  assert.ok(steps[1]?.actionIds.includes("commute-exposure"));
  assert.ok(steps[2]?.actionIds.includes("indoor-smoke"));
});
test("daily plan does not treat missing air data as safe", () => {
  assert.ok(
    generateDailyPlan(null, profile)[0]?.actionIds.includes("air-unavailable"),
  );
});
