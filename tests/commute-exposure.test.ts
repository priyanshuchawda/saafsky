import { test } from "node:test";
import assert from "node:assert/strict";
import { commuteAirContext } from "../src/features/sustainability/exposure.ts";

test("commute context handles missing data and US AQI boundaries", () => {
  assert.equal(commuteAirContext(null, false), "unknown");
  assert.equal(commuteAirContext(Number.NaN, true), "unknown");
  assert.equal(commuteAirContext(-1, false), "unknown");
  assert.equal(commuteAirContext(100, true), "general");
  assert.equal(commuteAirContext(101, false), "caution");
  assert.equal(commuteAirContext(101, true), "elevated");
  assert.equal(commuteAirContext(150, false), "caution");
  assert.equal(commuteAirContext(151, false), "elevated");
});
