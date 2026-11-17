import { test } from "node:test";
import assert from "node:assert/strict";
import {
  airSchema,
  householdSchema,
  locationSchema,
} from "../src/lib/schemas.ts";

test("rejects malformed provider data and mismatched time series", () => {
  assert.equal(airSchema.safeParse({}).success, false);
  assert.equal(
    airSchema.safeParse({
      timezone: "Asia/Kolkata",
      utc_offset_seconds: 19800,
      current: {
        time: "2026-01-01T12:00",
        us_aqi: null,
        pm2_5: null,
        pm10: null,
      },
      hourly: { time: ["one"], us_aqi: [] },
    }).success,
    false,
  );
  assert.equal(
    locationSchema.safeParse({
      results: [{ name: "Invalid", latitude: 1000, longitude: 0 }],
    }).success,
    false,
  );
});

test("household profile rejects unknown fields and invalid modes", () => {
  const valid = {
    sensitive: false,
    children: true,
    outdoorExercise: false,
    commute: "bike",
    cookingSmoke: false,
  };
  assert.equal(householdSchema.safeParse(valid).success, true);
  assert.equal(
    householdSchema.safeParse({ ...valid, commute: "unlisted" }).success,
    false,
  );
  assert.equal(
    householdSchema.safeParse({ ...valid, name: "Person" }).success,
    false,
  );
});
