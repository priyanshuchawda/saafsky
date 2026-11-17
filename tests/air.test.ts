import { test } from "node:test";
import assert from "node:assert/strict";
import { advice, category } from "../src/lib/air.ts";

test("US AQI categories honor boundaries", () => {
  for (const [value, expected] of [[50,"Good"],[51,"Moderate"],[100,"Moderate"],[101,"Unhealthy for sensitive groups"],[150,"Unhealthy for sensitive groups"],[151,"Unhealthy"],[200,"Unhealthy"],[201,"Very unhealthy"],[300,"Very unhealthy"],[301,"Hazardous"]] as const) assert.equal(category(value), expected);
  assert.equal(category(null), "Unavailable");
  assert.equal(category(NaN), "Unavailable");
});
test("guidance accounts for sensitive people and missing data", () => {
  assert.match(advice(120, "sensitive")[0]!, /Reduce/);
  assert.match(advice(120, "adult")[0]!, /Sensitive/);
  assert.match(advice(null, "adult")[0]!, /unavailable/);
});
