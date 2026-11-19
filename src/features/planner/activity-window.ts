import type { ForecastHour } from "./plan.ts";

type Constraints = {
  start: string;
  end: string;
  durationHours: number;
  sensitive: boolean;
  essential: boolean;
  busy?: { start: string; end: string }[];
};
type Candidate = { start: string; end: string; peakAqi: number };
export type ActivityWindow =
  | {
      kind: "available" | "elevated";
      start: string;
      end: string;
      peakAqi: number;
    }
  | { kind: "no-suitable" | "unavailable" };
const HOUR_MS = 3_600_000;

function parseWallTime(value: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const time = Date.parse(`${value}:00Z`);
  return Number.isFinite(time) &&
    new Date(time).toISOString().slice(0, 16) === value
    ? time
    : null;
}

/** Keep duplicate wall-clock hours separate because DST can make them ambiguous. */
function indexForecast(hours: ForecastHour[]): {
  values: Map<number, number | null>;
  duplicates: Set<number>;
} {
  const values = new Map<number, number | null>();
  const duplicates = new Set<number>();
  for (const hour of hours) {
    const time = parseWallTime(hour.time);
    if (time === null || time % HOUR_MS !== 0) continue;
    if (values.has(time)) duplicates.add(time);
    else values.set(time, hour.aqi);
  }
  return { values, duplicates };
}

/** Offer a contiguous forecast range with an observed end boundary, without inventing hours. */
export function nextForecastRange(
  hours: ForecastHour[],
): { start: string; end: string } | null {
  const { values, duplicates } = indexForecast(hours);
  const usable = (time: number): boolean => {
    const value = values.get(time);
    return (
      !duplicates.has(time) &&
      typeof value === "number" &&
      Number.isFinite(value) &&
      value >= 0
    );
  };
  for (const start of [...values.keys()].sort((a, b) => a - b)) {
    if (!usable(start)) continue;
    let end = start;
    for (let i = 1; i <= 12; i++) {
      const next = start + i * HOUR_MS;
      if (!values.has(next) || duplicates.has(next)) break;
      end = next;
      if (!usable(next)) break;
    }
    if (end > start) {
      return {
        start: new Date(start).toISOString().slice(0, 16),
        end: new Date(end).toISOString().slice(0, 16),
      };
    }
  }
  return null;
}

/** Compare complete hourly model values; duplicate wall times are excluded as ambiguous. */
export function findActivityWindow(
  hours: ForecastHour[],
  constraints: Constraints,
): ActivityWindow {
  const start = parseWallTime(constraints.start),
    end = parseWallTime(constraints.end);
  if (
    start === null ||
    end === null ||
    end <= start ||
    !Number.isInteger(constraints.durationHours) ||
    constraints.durationHours < 1 ||
    constraints.durationHours > 4
  )
    return { kind: "unavailable" };
  const busy: { start: number; end: number }[] = [];
  for (const interval of constraints.busy ?? []) {
    const busyStart = parseWallTime(interval.start);
    const busyEnd = parseWallTime(interval.end);
    if (busyStart === null || busyEnd === null || busyEnd <= busyStart)
      return { kind: "unavailable" };
    busy.push({ start: busyStart, end: busyEnd });
  }
  const { values, duplicates } = indexForecast(hours);
  const candidates: Candidate[] = [];
  for (const time of [...values.keys()].sort((a, b) => a - b)) {
    const finish = time + constraints.durationHours * HOUR_MS;
    if (time < start || finish > end) continue;
    if (busy.some((interval) => time < interval.end && finish > interval.start))
      continue;
    const period: number[] = [];
    for (let i = 0; i < constraints.durationHours; i++) {
      const instant = time + i * HOUR_MS,
        value = values.get(instant);
      if (
        duplicates.has(instant) ||
        typeof value !== "number" ||
        !Number.isFinite(value) ||
        value < 0
      )
        break;
      period.push(value);
    }
    if (period.length === constraints.durationHours)
      candidates.push({
        start: new Date(time).toISOString().slice(0, 16),
        end: new Date(finish).toISOString().slice(0, 16),
        peakAqi: Math.max(...period),
      });
  }
  candidates.sort(
    (a, b) => a.peakAqi - b.peakAqi || a.start.localeCompare(b.start),
  );
  const best = candidates[0];
  if (!best) return { kind: "unavailable" };
  if (best.peakAqi > (constraints.sensitive ? 100 : 150))
    return constraints.essential
      ? { kind: "elevated", ...best }
      : { kind: "no-suitable" };
  return { kind: "available", ...best };
}
