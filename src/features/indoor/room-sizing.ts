const SQUARE_FEET_PER_SQUARE_METRE = 10.7639104167;
const CUBIC_METRES_PER_HOUR_PER_CFM = 1.69901082;

/** EPA's smoke-CADR sizing rule for rooms with ceilings up to eight feet. */
export function smokeCadrForArea(areaM2: number): number | null {
  if (!Number.isFinite(areaM2) || areaM2 <= 0 || areaM2 > 500) return null;
  return (areaM2 * SQUARE_FEET_PER_SQUARE_METRE * 2 / 3) * CUBIC_METRES_PER_HOUR_PER_CFM;
}
