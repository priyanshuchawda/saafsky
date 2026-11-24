import { parseWallTime } from "./wall-time.ts";

/** The provider's current time is local wall time; its UTC offset is in seconds. */
export function isFresh(
  retrievedAt: string,
  modelTime: string,
  utcOffsetSeconds: number,
  now: number,
): boolean {
  const fetched = Date.parse(retrievedAt);
  const wallTime = parseWallTime(modelTime);
  if (wallTime === null || !Number.isFinite(utcOffsetSeconds)) return false;
  const model = wallTime - utcOffsetSeconds * 1000;
  return (
    Number.isFinite(fetched) &&
    Number.isFinite(model) &&
    fetched <= now + 300_000 &&
    now - fetched <= 3_600_000 &&
    model <= now + 3_600_000 &&
    now - model <= 7_200_000
  );
}

/** Format an instant as local wall time in the provider's IANA time zone. */
export function localMinuteAt(now: number, timezone: string): string | null {
  if (!Number.isFinite(now)) return null;
  try {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(now);
    const get = (type: Intl.DateTimeFormatPartTypes) =>
      parts.find((part) => part.type === type)?.value;
    const year = get("year"),
      month = get("month"),
      day = get("day"),
      hour = get("hour"),
      minute = get("minute");
    return year && month && day && hour && minute
      ? `${year}-${month}-${day}T${hour}:${minute}`
      : null;
  } catch {
    return null;
  }
}
