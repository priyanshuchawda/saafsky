/** The provider's current time is local wall time; its UTC offset is in seconds. */
export function isFresh(retrievedAt: string, modelTime: string, utcOffsetSeconds: number, now: number): boolean {
  const fetched = Date.parse(retrievedAt);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(modelTime) || !Number.isFinite(utcOffsetSeconds)) return false;
  const model = Date.parse(`${modelTime}:00Z`) - utcOffsetSeconds * 1000;
  return Number.isFinite(fetched) && Number.isFinite(model) && fetched <= now + 300_000 && now - fetched <= 3_600_000 && model <= now + 3_600_000 && now - model <= 7_200_000;
}
