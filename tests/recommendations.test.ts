import { test } from "node:test";
import assert from "node:assert/strict";
import {
  generateRecommendations,
  type HouseholdProfile,
} from "../src/features/recommendations/engine.ts";

const adult: HouseholdProfile = {
  sensitive: false,
  children: false,
  outdoorExercise: false,
  commute: "none",
  cookingSmoke: false,
};
test("sensitive households receive stronger precautions at AQI 120", () => {
  assert.equal(generateRecommendations(120, adult)[0]?.id, "sensitive-caution");
  assert.equal(
    generateRecommendations(120, { ...adult, children: true })[0]?.id,
    "reduce-outdoor-exertion",
  );
});
test("unknown data is not treated as safe and exposed commutes are considered", () => {
  assert.deepEqual(
    generateRecommendations(null, adult).map((action) => action.id),
    ["air-unavailable"],
  );
  const actions = generateRecommendations(180, { ...adult, commute: "bike" });
  assert.ok(actions.some((action) => action.id === "commute-exposure"));
  assert.ok(
    actions.every(
      (action) =>
        action.evidenceIds.length > 0 && action.reasonCodes.length > 0,
    ),
  );
});

test("planned outdoor exercise and cooking smoke affect actions", () => {
  const actions = generateRecommendations(180, {
    ...adult,
    outdoorExercise: true,
    cookingSmoke: true,
  });
  const exercise = actions.find(
    (action) => action.id === "reduce-outdoor-exertion",
  );
  assert.match(exercise?.description ?? "", /exercise indoors/);
  assert.ok(exercise?.reasonCodes.includes("outdoor_exercise"));
  assert.equal(
    actions.find((action) => action.id === "indoor-smoke")?.priority,
    "medium",
  );
});
