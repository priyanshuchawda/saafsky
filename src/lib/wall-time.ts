/** Validate and index a wall-clock label. The result is not a zoned instant. */
export function parseWallTime(value: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const time = Date.parse(`${value}:00Z`);
  return Number.isFinite(time) &&
    new Date(time).toISOString().slice(0, 16) === value
    ? time
    : null;
}
