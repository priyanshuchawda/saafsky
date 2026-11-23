import { generateRecommendations } from "../features/recommendations/engine.ts";
import { isValidAqi } from "./aqi-validity.ts";
import { US_AQI_UPPER_BOUND } from "./aqi-policy.ts";

export type Profile = "adult" | "sensitive";
export function category(aqi: number | null): string {
  if (!isValidAqi(aqi)) return "Unavailable";
  if (aqi <= US_AQI_UPPER_BOUND.good) return "Good";
  if (aqi <= US_AQI_UPPER_BOUND.moderate) return "Moderate";
  if (aqi <= US_AQI_UPPER_BOUND.sensitiveGroups)
    return "Unhealthy for sensitive groups";
  if (aqi <= US_AQI_UPPER_BOUND.unhealthy) return "Unhealthy";
  if (aqi <= US_AQI_UPPER_BOUND.veryUnhealthy) return "Very unhealthy";
  return "Hazardous";
}

export function advice(aqi: number | null, profile: Profile): string[] {
  return generateRecommendations(aqi, {
    sensitive: profile === "sensitive",
    children: false,
    outdoorExercise: false,
    commute: "none",
    cookingSmoke: false,
  }).map((action) => action.description);
}

export function lowestForecastPeriod(
  times: string[],
  values: (number | null)[],
  currentTime: string,
): { time: string; aqi: number } | null {
  return upcomingForecast(times, values, currentTime)
    .slice(0, 24)
    .reduce<{ time: string; aqi: number } | null>((best, item) => {
      if (!isValidAqi(item.aqi)) return best;
      return !best || item.aqi < best.aqi
        ? { time: item.time, aqi: item.aqi }
        : best;
    }, null);
}

export function upcomingForecast(
  times: string[],
  values: (number | null)[],
  currentTime: string,
): { time: string; aqi: number | null }[] {
  if (!currentTime) return [];
  return times
    .flatMap((time, index) =>
      time && time >= currentTime ? [{ time, aqi: values[index] ?? null }] : [],
    )
    .sort((a, b) => a.time.localeCompare(b.time));
}
