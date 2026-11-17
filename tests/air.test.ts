import { test } from "node:test";
import assert from "node:assert/strict";
import { advice, category, lowestForecastPeriod } from "../src/lib/air.ts";

test("US AQI categories honor boundaries", () => {
  for (const [value, expected] of [[50,"Good"],[51,"Moderate"],[100,"Moderate"],[101,"Unhealthy for sensitive groups"],[150,"Unhealthy for sensitive groups"],[151,"Unhealthy"],[200,"Unhealthy"],[201,"Very unhealthy"],[300,"Very unhealthy"],[301,"Hazardous"]] as const) assert.equal(category(value), expected);
  assert.equal(category(null), "Unavailable");
  assert.equal(category(NaN), "Unavailable");
});

test("forecast comparison ignores past and missing values", () => {
  const times = ["2026-01-01T08:00", "2026-01-01T09:00", "2026-01-01T10:00", "2026-01-01T11:00"];
  assert.deepEqual(lowestForecastPeriod(times, [1, null, 140, 110], "2026-01-01T09:00"), { time: times[3], aqi: 110 });
  assert.equal(lowestForecastPeriod(times, [null, null, null, null], "2026-01-01T09:00"), null);
});
test("guidance accounts for sensitive people and missing data", () => {
  assert.match(advice(120, "sensitive")[0]!, /Reduce/);
  assert.match(advice(120, "adult")[0]!, /Sensitive/);
  assert.match(advice(null, "adult")[0]!, /unavailable/);
});
