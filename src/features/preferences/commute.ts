import type { HouseholdProfile } from "../recommendations/engine.ts";

export const commuteModes = [
  "none",
  "walk",
  "bike",
  "public",
  "car",
] as const satisfies readonly HouseholdProfile["commute"][];

/** Ignore values that did not come from a supported form option. */
export function parseCommuteMode(
  value: string,
): HouseholdProfile["commute"] | null {
  return commuteModes.find((mode) => mode === value) ?? null;
}
