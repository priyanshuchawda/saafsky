export type Mode = "bus" | "walk" | "cycle" | "custom";
export const UK_BUS_KG_PER_PASSENGER_KM = 0.10385;
export const UK_PETROL_CAR_KG_PER_VEHICLE_KM = 0.16272;

export function petrolCarPassengerFactor(occupants: number): number | null {
  return Number.isInteger(occupants) && occupants >= 1 && occupants <= 8
    ? UK_PETROL_CAR_KG_PER_VEHICLE_KM / occupants
    : null;
}

export function monthlyImpact(
  distanceKm: number,
  days: number,
  baselineFactor: number,
  mode: Mode,
  customFactor = 0,
): { baseline: number; alternative: number; difference: number } | null {
  if (
    !["bus", "walk", "cycle", "custom"].includes(mode) ||
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
