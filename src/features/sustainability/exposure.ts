import { isValidAqi } from "../../lib/aqi-validity.ts";
import { US_AQI_UPPER_BOUND } from "../../lib/aqi-policy.ts";

/** Classify modeled city conditions for a qualitative commute consideration. */
export function commuteAirContext(
  aqi: number | null,
  sensitive: boolean,
): "unknown" | "general" | "caution" | "elevated" {
  if (!isValidAqi(aqi)) return "unknown";
  if (
    aqi > US_AQI_UPPER_BOUND.sensitiveGroups ||
    (aqi > US_AQI_UPPER_BOUND.moderate && sensitive)
  )
    return "elevated";
  if (aqi > US_AQI_UPPER_BOUND.moderate) return "caution";
  return "general";
}
