import { test } from "node:test";
import assert from "node:assert/strict";
import {
  generateIndoorAdvice,
  outdoorCondition,
} from "../src/features/indoor/advice.ts";

test("indoor guidance accounts for smoke, filtration and unavailable outdoor data", () => {
  assert.equal(outdoorCondition(null), "unknown");
  assert.equal(outdoorCondition(101), "elevated");
  assert.equal(outdoorCondition(100), "lower");
  const actions = generateIndoorAdvice(true, true, "unknown");
  assert.match(actions[0]!.detail, /cooking smoke/);
  assert.match(actions[1]!.detail, /ozone/);
  assert.match(actions[2]!.detail, /Check current outdoor conditions/);
});

test("indoor guidance covers every source, filtration and outdoor-air branch", () => {
  assert.equal(outdoorCondition(-1), "unknown");
  assert.equal(outdoorCondition(Number.NaN), "unknown");
  assert.equal(outdoorCondition(Number.POSITIVE_INFINITY), "unknown");

  const noSmokeNoFilter = generateIndoorAdvice(false, false, "elevated");
  assert.match(noSmokeNoFilter[0]!.detail, /candles, incense/);
  assert.match(noSmokeNoFilter[1]!.title, /cleaner-air room/);
  assert.match(noSmokeNoFilter[2]!.detail, /Reduce polluted outdoor air entry/);

  const smokeWithFilterAndLowerAir = generateIndoorAdvice(
    true,
    true,
    "lower",
  );
  assert.match(smokeWithFilterAndLowerAir[0]!.detail, /exhaust fan/);
  assert.match(smokeWithFilterAndLowerAir[1]!.title, /purifier effectively/);
  assert.match(smokeWithFilterAndLowerAir[2]!.detail, /consider ventilation/);
});
