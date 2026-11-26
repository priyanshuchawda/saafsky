import type { ForecastHour } from "./plan.ts";
import { US_AQI_UPPER_BOUND } from "../../lib/aqi-policy.ts";
import { parseWallTime } from "../../lib/wall-time.ts";

type Constraints = {
  start: string;
  end: string;
  durationHours: number;
  sensitive: boolean;
  essential: boolean;
  busy?: { start: string; end: string }[];
};
type ParsedConstraints = {
  start: number;
  end: number;
  durationHours: number;
  sensitive: boolean;
  essential: boolean;
  busy: { start: number; end: number }[];
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

function parseConstraints(constraints: Constraints): ParsedConstraints | null {
  const start = parseWallTime(constraints.start);
  const end = parseWallTime(constraints.end);
  if (
    start === null ||
    end === null ||
    end <= start ||
    !Number.isInteger(constraints.durationHours) ||
    constraints.durationHours < 1 ||
    constraints.durationHours > 4
  )
    return null;

  const busy: ParsedConstraints["busy"] = [];
  for (const interval of constraints.busy ?? []) {
    const busyStart = parseWallTime(interval.start);
    const busyEnd = parseWallTime(interval.end);
    if (busyStart === null || busyEnd === null || busyEnd <= busyStart)
      return null;
    busy.push({ start: busyStart, end: busyEnd });
  }
  return {
    start,
    end,
    durationHours: constraints.durationHours,
    sensitive: constraints.sensitive,
    essential: constraints.essential,
    busy,
  };
}

function getPeriodPeak(
  start: number,
  durationHours: number,
  values: Map<number, number | null>,
  duplicates: Set<number>,
): number | null {
  const period: number[] = [];
  for (let offset = 0; offset < durationHours; offset++) {
    const time = start + offset * HOUR_MS;
    const value = values.get(time);
    if (
      duplicates.has(time) ||
      typeof value !== "number" ||
      !Number.isFinite(value) ||
      value < 0
    )
      return null;
    period.push(value);
  }
  return Math.max(...period);
}

function overlapsBusy(
  start: number,
  end: number,
  busy: ParsedConstraints["busy"],
): boolean {
  return busy.some((interval) => start < interval.end && end > interval.start);
}

function findCandidates(
  hours: ForecastHour[],
  constraints: ParsedConstraints,
): Candidate[] {
  const { values, duplicates } = indexForecast(hours);
  const candidates: Candidate[] = [];
  for (const time of [...values.keys()].sort((a, b) => a - b)) {
    const finish = time + constraints.durationHours * HOUR_MS;
    if (
      time < constraints.start ||
      finish > constraints.end ||
      overlapsBusy(time, finish, constraints.busy)
    )
      continue;
    const peakAqi = getPeriodPeak(
      time,
      constraints.durationHours,
      values,
      duplicates,
    );
    if (peakAqi === null) continue;
    candidates.push({
      start: new Date(time).toISOString().slice(0, 16),
      end: new Date(finish).toISOString().slice(0, 16),
      peakAqi,
    });
  }
  return candidates.sort(
    (a, b) => a.peakAqi - b.peakAqi || a.start.localeCompare(b.start),
  );
}

function classifyCandidate(
  best: Candidate,
  constraints: ParsedConstraints,
): ActivityWindow {
  const limit = constraints.sensitive
    ? US_AQI_UPPER_BOUND.moderate
    : US_AQI_UPPER_BOUND.sensitiveGroups;
  if (best.peakAqi <= limit) return { kind: "available", ...best };
  return constraints.essential
    ? { kind: "elevated", ...best }
    : { kind: "no-suitable" };
}

/** Compare complete hourly model values; duplicate wall times are excluded as ambiguous. */
export function findActivityWindow(
  hours: ForecastHour[],
  constraints: Constraints,
): ActivityWindow {
  const parsed = parseConstraints(constraints);
  if (!parsed) return { kind: "unavailable" };
  const [best] = findCandidates(hours, parsed);
  return best ? classifyCandidate(best, parsed) : { kind: "unavailable" };
}
