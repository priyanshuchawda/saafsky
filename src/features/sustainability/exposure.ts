/** Classify modeled city conditions for a qualitative commute consideration. */
export function commuteAirContext(
  aqi: number | null,
  sensitive: boolean,
): "unknown" | "general" | "caution" | "elevated" {
  if (aqi === null || !Number.isFinite(aqi) || aqi < 0) return "unknown";
  if (aqi > 150 || (aqi > 100 && sensitive)) return "elevated";
  if (aqi > 100) return "caution";
  return "general";
}
