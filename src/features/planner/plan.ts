export type ForecastHour = { time: string; aqi: number | null };
export type PlanResult =
  | { kind: "unavailable" }
  | { kind: "available"; time: string; aqi: number; considered: number };

/** Select the lowest forecast within a user's stated local-time window. */
export function planOutdoorWindow(
  hours: ForecastHour[],
  start: string,
  end: string,
): PlanResult {
  if (!start || !end || end <= start) return { kind: "unavailable" };
  const candidates = hours
    .filter(
      (hour) =>
        hour.time >= start &&
        hour.time < end &&
        typeof hour.aqi === "number" &&
        Number.isFinite(hour.aqi) &&
        hour.aqi >= 0,
    )
    .sort((a, b) => a.time.localeCompare(b.time));
  let best: { time: string; aqi: number } | null = null;
  for (const hour of candidates) {
    if (hour.aqi !== null && (!best || hour.aqi < best.aqi))
      best = { time: hour.time, aqi: hour.aqi };
  }
  return best
    ? { kind: "available", ...best, considered: candidates.length }
    : { kind: "unavailable" };
}
