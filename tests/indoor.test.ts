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
