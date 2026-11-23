/** An unavailable or invalid model value must never be treated as clean air. */
export function isValidAqi(value: number | null): value is number {
  return value !== null && Number.isFinite(value) && value >= 0;
}
