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
    ["air-unavailable", "indoor-smoke"],
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

test("indoor smoke guidance remains personalized when outdoor data is unavailable", () => {
  for (const aqi of [null, Number.NaN, -1]) {
    const actions = generateRecommendations(aqi, {
      ...adult,
      cookingSmoke: true,
    });
    assert.equal(actions[0]?.id, "air-unavailable");
    assert.equal(actions[1]?.id, "indoor-smoke");
    assert.equal(actions[1]?.priority, "medium");
    assert.ok(actions[1]?.reasonCodes.includes("cooking_smoke"));
    assert.ok(!actions.some((action) => action.id === "monitor-conditions"));
  }
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

test("adding sensitivity never weakens the highest health priority", () => {
  const rank = { low: 1, medium: 2, high: 3 } as const;
  for (const aqi of [0, 50, 51, 100, 101, 150, 151, 200, 201, 300, 301]) {
    const healthRank = (profile: HouseholdProfile) =>
      Math.max(
        ...generateRecommendations(aqi, profile)
          .filter((action) => action.category === "health")
          .map((action) => rank[action.priority]),
      );
    assert.ok(
      healthRank({ ...adult, sensitive: true }) >= healthRank(adult),
      `AQI ${aqi}`,
    );
    assert.ok(
      healthRank({ ...adult, children: true }) >= healthRank(adult),
      `AQI ${aqi}`,
    );
  }
});
