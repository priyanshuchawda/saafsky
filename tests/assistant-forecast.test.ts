import { test } from "node:test";
import assert from "node:assert/strict";
import { buildForecastContext } from "../src/features/assistant/forecast-context.ts";
import type { Air } from "../src/types/air.ts";

test("assistant forecast uses upcoming local hours, bounds context, and preserves missing readings", () => {
  const times = Array.from({ length: 16 }, (_, index) =>
    new Date(Date.UTC(2026, 0, 1, index)).toISOString().slice(0, 16),
  );
  const air: Air = {
    timezone: "Asia/Kolkata",
    utc_offset_seconds: 19800,
    current: { time: "2026-01-01T05:30", us_aqi: 120, pm2_5: 50, pm10: 80 },
    hourly: {
      time: times,
      us_aqi: times.map((_, index) => (index === 6 ? null : index)),
    },
  };
  const context = buildForecastContext(air, Date.parse("2026-01-01T00:00:00Z"));
  assert.equal(context?.timezone, "Asia/Kolkata");
  assert.equal(context?.hours[0]?.time, "2026-01-01T06:00");
  assert.equal(context?.hours[0]?.aqi, null);
  assert.equal(context?.hours.length, 10);
  assert.ok(context?.hours.every((hour) => hour.time >= "2026-01-01T05:30"));
});

test("assistant forecast excludes duplicate wall times and limits output to twelve hours", () => {
  const times = Array.from({ length: 20 }, (_, index) =>
    new Date(Date.UTC(2026, 0, 1, index)).toISOString().slice(0, 16),
  );
  times.splice(2, 0, times[1]!);
  const air: Air = {
    timezone: "UTC",
    utc_offset_seconds: 0,
    current: { time: "2026-01-01T00:00", us_aqi: 120, pm2_5: 50, pm10: 80 },
    hourly: { time: times, us_aqi: times.map(() => 120) },
  };
  const context = buildForecastContext(air, Date.parse("2026-01-01T00:00:00Z"));
  assert.equal(context?.hours.length, 12);
  assert.ok(context?.hours.every((hour) => hour.time !== "2026-01-01T01:00"));
  assert.equal(
    buildForecastContext(air, Date.parse("2026-01-02T00:00:00Z")),
    null,
  );
});
