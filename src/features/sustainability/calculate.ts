export type Mode = "bus" | "walk" | "cycle" | "custom";
export const UK_BUS_KG_PER_PASSENGER_KM = 0.10385;

export function monthlyImpact(
  distanceKm: number,
  days: number,
  baselineFactor: number,
  mode: Mode,
  customFactor = 0,
): { baseline: number; alternative: number; difference: number } | null {
  if (
    ![distanceKm, days, baselineFactor, customFactor].every(Number.isFinite) ||
    distanceKm < 0 ||
    distanceKm > 1000 ||
    !Number.isInteger(days) ||
    days < 0 ||
    days > 31 ||
    baselineFactor < 0 ||
    baselineFactor > 10 ||
    customFactor < 0 ||
    customFactor > 10
  )
    return null;
  const factor =
    mode === "bus"
      ? UK_BUS_KG_PER_PASSENGER_KM
      : mode === "custom"
        ? customFactor
        : 0;
  const baseline = distanceKm * days * baselineFactor;
  const alternative = distanceKm * days * factor;
  return { baseline, alternative, difference: baseline - alternative };
}
