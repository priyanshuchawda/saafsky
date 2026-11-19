import { test } from "node:test";
import assert from "node:assert/strict";
import {
  findActivityWindow,
  nextForecastRange,
} from "../src/features/planner/activity-window.ts";

const hours = [
  { time: "2026-01-01T08:00", aqi: 120 },
  { time: "2026-01-01T09:00", aqi: 80 },
  { time: "2026-01-01T10:00", aqi: 90 },
  { time: "2026-01-01T11:00", aqi: 180 },
];

test("quick forecast range uses observed consecutive boundaries and rejects gaps", () => {
  assert.deepEqual(nextForecastRange(hours), {
    start: "2026-01-01T08:00",
    end: "2026-01-01T11:00",
  });
  assert.equal(nextForecastRange([hours[0]!, hours[2]!]), null);
  assert.deepEqual(
    nextForecastRange([
      { time: "2026-01-01T08:00", aqi: 100 },
      { time: "2026-01-01T09:00", aqi: null },
    ]),
    { start: "2026-01-01T08:00", end: "2026-01-01T09:00" },
  );
  assert.equal(nextForecastRange([hours[0]!, hours[1]!, hours[1]!]), null);
  assert.equal(nextForecastRange([{ time: "invalid", aqi: 80 }]), null);
});

test("quick range respects the twelve-hour limit and excludes ambiguous wall times", () => {
  const series = Array.from({ length: 20 }, (_, hour) => ({
    time: `2026-01-01T${String(hour).padStart(2, "0")}:00`,
    aqi: 80,
  }));
  assert.deepEqual(nextForecastRange(series), {
    start: "2026-01-01T00:00",
    end: "2026-01-01T12:00",
  });
  const transition = [
    { time: "2026-11-01T01:00", aqi: 70 },
    { time: "2026-11-01T01:00", aqi: 80 },
    { time: "2026-11-01T02:00", aqi: 90 },
    { time: "2026-11-01T03:00", aqi: 80 },
  ];
  assert.deepEqual(nextForecastRange(transition), {
    start: "2026-11-01T02:00",
    end: "2026-11-01T03:00",
  });
});
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

test("planner excludes windows that overlap fixed commitments but permits touching boundaries", () => {
  const input = {
    start: "2026-01-01T08:00",
    end: "2026-01-01T12:00",
    durationHours: 1,
    sensitive: false,
    essential: true,
    busy: [{ start: "2026-01-01T09:30", end: "2026-01-01T10:30" }],
  };
  const result = findActivityWindow(hours, input);
  assert.equal(result.kind, "available");
  if (result.kind === "available")
    assert.equal(result.start, "2026-01-01T08:00");
  const boundary = findActivityWindow(hours, {
    ...input,
    busy: [{ start: "2026-01-01T10:00", end: "2026-01-01T11:00" }],
  });
  assert.equal(boundary.kind, "available");
  if (boundary.kind === "available")
    assert.equal(boundary.start, "2026-01-01T09:00");
  assert.equal(
    findActivityWindow(hours, {
      ...input,
      busy: [{ start: "2026-01-01T10:00", end: "2026-01-01T09:00" }],
    }).kind,
    "unavailable",
  );
});
