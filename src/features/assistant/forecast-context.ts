import { upcomingForecast } from "../../lib/air.ts";
import { localMinuteAt } from "../../lib/freshness.ts";
import type { Air } from "../../types/air.ts";

export type ForecastContext = {
  timezone: string;
  hours: { time: string; aqi: number | null }[];
};

/** Share a bounded, local-time forecast; omit ambiguous duplicate wall times. */
export function buildForecastContext(
  air: Air,
  now: number,
): ForecastContext | null {
  const localNow = localMinuteAt(now, air.timezone);
  if (!localNow) return null;
  const counts = new Map<string, number>();
  for (const time of air.hourly.time)
    counts.set(time, (counts.get(time) ?? 0) + 1);
  const hours = upcomingForecast(air.hourly.time, air.hourly.us_aqi, localNow)
    .filter((hour) => counts.get(hour.time) === 1)
    .slice(0, 12);
  return hours.length ? { timezone: air.timezone, hours } : null;
}
