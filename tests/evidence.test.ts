import { test } from "node:test";
import assert from "node:assert/strict";
import {
  generateRecommendations,
  type HouseholdProfile,
} from "../src/features/recommendations/engine.ts";
import {
  evidenceCatalog,
  findEvidence,
  reasonDescriptions,
} from "../src/features/recommendations/evidence.ts";

test("all selected actions have readable reasons and known evidence", () => {
  const profile: HouseholdProfile = {
    sensitive: true,
    children: true,
    outdoorExercise: true,
    cookingSmoke: true,
    commute: "bike",
  };
  for (const aqi of [null, 40, 120, 180, 250]) {
    for (const action of generateRecommendations(aqi, profile)) {
      for (const code of action.reasonCodes)
        assert.ok(reasonDescriptions[code], code);
      for (const id of action.evidenceIds) assert.ok(evidenceCatalog[id], id);
    }
  }
});

test("untrusted source IDs cannot resolve inherited object properties", () => {
  assert.equal(findEvidence("__proto__"), undefined);
  assert.equal(findEvidence("constructor"), undefined);
  assert.equal(findEvidence("unknown"), undefined);
  assert.equal(findEvidence("airnow-aqi"), evidenceCatalog["airnow-aqi"]);
});
