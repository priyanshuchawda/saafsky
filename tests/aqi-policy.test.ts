import { test } from "node:test";
import assert from "node:assert/strict";
import { US_AQI_UPPER_BOUND } from "../src/lib/aqi-policy.ts";

test("US AQI category upper bounds match the published scale", () => {
  assert.deepEqual(US_AQI_UPPER_BOUND, {
    good: 50,
    moderate: 100,
    sensitiveGroups: 150,
    unhealthy: 200,
    veryUnhealthy: 300,
  });
});
