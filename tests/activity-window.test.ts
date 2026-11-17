import { test } from "node:test";
import assert from "node:assert/strict";
import { findActivityWindow } from "../src/features/planner/activity-window.ts";

const hours = [
  { time: "2026-01-01T08:00", aqi: 120 },
  { time: "2026-01-01T09:00", aqi: 80 },
  { time: "2026-01-01T10:00", aqi: 90 },
  { time: "2026-01-01T11:00", aqi: 180 },
];
test("planner selects a complete multi-hour window within the user's constraints", () => {
  assert.deepEqual(
    findActivityWindow(hours, {
      start: "2026-01-01T08:00",
      end: "2026-01-01T12:00",
      durationHours: 2,
      sensitive: true,
      essential: false,
    }),
    {
      kind: "available",
      start: "2026-01-01T09:00",
      end: "2026-01-01T11:00",
      peakAqi: 90,
    },
  );
});
test("planner distinguishes elevated essential trips from flexible activities", () => {
  const input = {
    start: "2026-01-01T08:00",
    end: "2026-01-01T09:00",
    durationHours: 1,
    sensitive: true,
    essential: false,
  };
  assert.deepEqual(findActivityWindow(hours, input), { kind: "no-suitable" });
  assert.equal(
    findActivityWindow(hours, { ...input, essential: true }).kind,
    "elevated",
  );
});
test("planner rejects missing, duplicate and incomplete forecast hours", () => {
  const input = {
    start: "2026-01-01T08:00",
    end: "2026-01-01T11:00",
    durationHours: 2,
    sensitive: false,
    essential: false,
  };
  assert.deepEqual(
    findActivityWindow(
      [
        { time: hours[0]!.time, aqi: 20 },
        { time: hours[2]!.time, aqi: 20 },
      ],
      input,
    ),
    { kind: "unavailable" },
  );
  assert.deepEqual(
    findActivityWindow(
      [
        { time: hours[0]!.time, aqi: 20 },
        { time: hours[1]!.time, aqi: 20 },
        { time: hours[1]!.time, aqi: 30 },
      ],
      input,
    ),
    { kind: "unavailable" },
  );
});

test("planner handles threshold boundaries and midnight without crossing constraints", () => {
  const night = [
    { time: "2026-01-01T23:00", aqi: 100 },
    { time: "2026-01-02T00:00", aqi: 100 },
  ];
  const input = {
    start: "2026-01-01T23:00",
    end: "2026-01-02T01:00",
    durationHours: 2,
    sensitive: true,
    essential: false,
  };
  assert.deepEqual(findActivityWindow(night, input), {
    kind: "available",
    start: input.start,
    end: input.end,
    peakAqi: 100,
  });
  assert.equal(
    findActivityWindow(night, { ...input, end: "2026-01-02T00:00" }).kind,
    "unavailable",
  );
  assert.equal(
    findActivityWindow([{ time: "2026-01-01T23:00", aqi: 151 }], {
      ...input,
      durationHours: 1,
      sensitive: false,
    }).kind,
    "no-suitable",
  );
  assert.equal(
    findActivityWindow(night, { ...input, start: "2026-02-30T23:00" }).kind,
    "unavailable",
  );
});
