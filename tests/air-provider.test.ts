import { test } from "node:test";
import assert from "node:assert/strict";
import { fetchAirForecast } from "../src/features/air-quality/provider.ts";

const sample = {
  timezone: "Asia/Kolkata",
  utc_offset_seconds: 19800,
  current: { time: "2026-01-01T12:00", us_aqi: 120, pm2_5: null, pm10: 60 },
  hourly: { time: ["2026-01-01T13:00"], us_aqi: [110] },
};
test("provider builds a fixed request and preserves missing measurements", async () => {
  const data = await fetchAirForecast(
    28.6,
    77.2,
    async (url, init) => {
      assert.equal(url.origin, "https://air-quality-api.open-meteo.com");
      assert.equal(url.searchParams.get("latitude"), "28.6");
      assert.ok(init.signal);
      return Response.json(sample);
    },
    () => new Date("2026-01-01T06:30:00Z"),
  );
  assert.equal(data.data.current.pm2_5, null);
  assert.equal(data.retrievedAt, "2026-01-01T06:30:00.000Z");
});
test("provider rejects upstream errors, malformed data and timeouts", async () => {
  await assert.rejects(
    fetchAirForecast(1, 2, async () => new Response("error", { status: 500 })),
  );
  await assert.rejects(
    fetchAirForecast(1, 2, async () =>
      Response.json({
        ...sample,
        current: { ...sample.current, time: "2026-02-31T10:00" },
      }),
    ),
  );
  await assert.rejects(
    fetchAirForecast(1, 2, async () => {
      throw new DOMException("Timeout", "TimeoutError");
    }),
  );
});
