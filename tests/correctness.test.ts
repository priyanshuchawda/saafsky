import { test } from "node:test";
import assert from "node:assert/strict";
import { parseCoordinates } from "../src/lib/coordinates.ts";
import { upcomingForecast } from "../src/lib/air.ts";

test("coordinates reject empty, malformed, and out-of-range values", () => {
  for (const query of [
    "lat=&lon=1",
    "lat=%20&lon=1",
    "lat=abc&lon=1",
    "lat=91&lon=1",
    "lat=1&lon=181",
    "lat=0x10&lon=1",
    "lon=1",
  ]) {
    assert.equal(parseCoordinates(new URLSearchParams(query)), null, query);
  }
  assert.deepEqual(
    parseCoordinates(new URLSearchParams("lat=28.65195&lon=77.23149")),
    { latitude: 28.652, longitude: 77.231 },
  );
});

test("upcoming forecast excludes past, sorts, preserves values across midnight", () => {
  const result = upcomingForecast(
    ["2026-01-02T00:00", "2026-01-01T21:00", "2026-01-01T23:00"],
    [10, 20, 30],
    "2026-01-01T22:00",
  );
  assert.deepEqual(result, [
    { time: "2026-01-01T23:00", aqi: 30 },
    { time: "2026-01-02T00:00", aqi: 10 },
  ]);
  assert.deepEqual(
    upcomingForecast(["2026-01-01T00:00"], [20], "2026-01-02T00:00"),
    [],
  );
  assert.deepEqual(upcomingForecast([], [], "2026-01-02T00:00"), []);
});
