import { test } from "node:test";
import assert from "node:assert/strict";
import { planOutdoorWindow } from "../src/features/planner/plan.ts";

test("planner respects the specified time window and chooses the earliest tie", () => {
  const hours = [
    { time: "2026-01-01T09:00", aqi: 180 },
    { time: "2026-01-01T10:00", aqi: 120 },
    { time: "2026-01-01T11:00", aqi: 120 },
    { time: "2026-01-01T12:00", aqi: 20 },
  ];
  assert.deepEqual(
    planOutdoorWindow(hours, "2026-01-01T09:00", "2026-01-01T12:00"),
    { kind: "available", time: "2026-01-01T10:00", aqi: 120, considered: 3 },
  );
  assert.deepEqual(
    planOutdoorWindow(hours, "2026-01-01T12:00", "2026-01-01T09:00"),
    { kind: "unavailable" },
  );
  assert.deepEqual(
    planOutdoorWindow(
      [{ time: "2026-01-01T09:00", aqi: null }],
      "2026-01-01T08:00",
      "2026-01-01T10:00",
    ),
    { kind: "unavailable" },
  );
});
