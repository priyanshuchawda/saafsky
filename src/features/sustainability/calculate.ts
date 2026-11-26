export type Mode = "bus" | "metro" | "walk" | "cycle" | "custom";
const modes = [
  "bus",
  "metro",
  "walk",
  "cycle",
  "custom",
] as const satisfies readonly Mode[];

export function parseTransportMode(value: string): Mode | null {
  return modes.find((mode) => mode === value) ?? null;
}

export const INDIA_DIESEL_BUS_KG_PER_PASSENGER_KM = 0.028;
export const INDIA_METRO_KG_PER_PASSENGER_KM = 0.024;
export const INDIA_PETROL_CAR_KG_PER_VEHICLE_KM = 0.243;
const MODE_FACTORS: Record<Exclude<Mode, "custom">, number> = {
  bus: INDIA_DIESEL_BUS_KG_PER_PASSENGER_KM,
  metro: INDIA_METRO_KG_PER_PASSENGER_KM,
  walk: 0,
  cycle: 0,
};

export function petrolCarPassengerFactor(occupants: number): number | null {
  return Number.isInteger(occupants) && occupants >= 1 && occupants <= 8
    ? INDIA_PETROL_CAR_KG_PER_VEHICLE_KM / occupants
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
    parseTransportMode(mode) === null ||
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
  const factor = mode === "custom" ? customFactor : MODE_FACTORS[mode];
  const baseline = distanceKm * days * baselineFactor;
  const alternative = distanceKm * days * factor;
  return { baseline, alternative, difference: baseline - alternative };
}
