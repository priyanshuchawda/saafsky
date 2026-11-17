import { test } from "node:test";
import assert from "node:assert/strict";
import { airSchema, locationSchema } from "../src/lib/schemas.ts";

test("rejects malformed provider data and mismatched time series", () => {
  assert.equal(airSchema.safeParse({}).success, false);
  assert.equal(airSchema.safeParse({ timezone: "Asia/Kolkata", current: { time: "2026-01-01T12:00", us_aqi: null, pm2_5: null, pm10: null }, hourly: { time: ["one"], us_aqi: [] } }).success, false);
  assert.equal(locationSchema.safeParse({ results: [{ name: "Invalid", latitude: 1000, longitude: 0 }] }).success, false);
});
