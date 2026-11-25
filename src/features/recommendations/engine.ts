import type { EvidenceId, ReasonCode } from "./evidence.ts";
import { isValidAqi } from "../../lib/aqi-validity.ts";
import { US_AQI_UPPER_BOUND } from "../../lib/aqi-policy.ts";

export type HouseholdProfile = {
  sensitive: boolean;
  children: boolean;
  outdoorExercise: boolean;
  commute: "none" | "walk" | "bike" | "public" | "car";
  cookingSmoke: boolean;
};

/** Stable identifiers shared by recommendation producers and localization. */
export const RECOMMENDATION_IDS = [
  "air-unavailable",
  "indoor-smoke",
  "reduce-outdoor-exertion",
  "sensitive-caution",
  "monitor-conditions",
  "essential-trips",
  "commute-exposure",
] as const;
export type RecommendationId = (typeof RECOMMENDATION_IDS)[number];

export type Recommendation = {
  id: RecommendationId;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  category: "health" | "indoor" | "transport";
  reasonCodes: ReasonCode[];
  evidenceIds: EvidenceId[];
};

function indoorSmokeAdvice(profile: HouseholdProfile): Recommendation {
  return {
    id: "indoor-smoke",
    title: "Reduce indoor smoke",
    description: "Reduce indoor smoke and use cooking exhaust where available.",
    priority: profile.cookingSmoke ? "medium" : "low",
    category: "indoor",
    reasonCodes: [
      "indoor_source_control",
      ...(profile.cookingSmoke ? (["cooking_smoke"] as const) : []),
    ],
    evidenceIds: ["epa-indoor"],
  };
}

export function generateRecommendations(
  aqi: number | null,
  profile: HouseholdProfile,
): Recommendation[] {
  const actions: Recommendation[] = [];
  if (!isValidAqi(aqi)) {
    return [
      {
        id: "air-unavailable",
        title: "Check current conditions",
        description:
          "Air quality is unavailable. Check a local official source before planning outdoor activity.",
        priority: "high",
        category: "health",
        reasonCodes: ["missing_air_data"],
        evidenceIds: ["airnow-aqi"],
      },
      indoorSmokeAdvice(profile),
    ];
  }
  const vulnerable = profile.sensitive || profile.children;
  if (
    aqi > US_AQI_UPPER_BOUND.sensitiveGroups ||
    (aqi > US_AQI_UPPER_BOUND.moderate && vulnerable)
  ) {
    actions.push({
      id: "reduce-outdoor-exertion",
      title: "Reduce outdoor exertion",
      description: profile.outdoorExercise
        ? "Move planned strenuous outdoor exercise indoors or postpone it if practical; reduce prolonged outdoor activity."
        : "Reduce prolonged or strenuous outdoor activity; consider an indoor alternative.",
      priority: "high",
      category: "health",
      reasonCodes: [
        "elevated_aqi",
        ...(vulnerable ? (["sensitive_household"] as const) : []),
        ...(profile.outdoorExercise ? (["outdoor_exercise"] as const) : []),
      ],
      evidenceIds: ["airnow-aqi"],
    });
  } else if (aqi > US_AQI_UPPER_BOUND.moderate) {
    actions.push({
      id: "sensitive-caution",
      title: "Consider sensitive people",
      description:
        "Sensitive people should consider reducing prolonged outdoor exertion.",
      priority: "medium",
      category: "health",
      reasonCodes: ["sensitive_group_aqi"],
      evidenceIds: ["airnow-aqi"],
    });
  } else {
    actions.push({
      id: "monitor-conditions",
      title: "Check conditions",
      description:
        "Consider the forecast and your own symptoms when planning outdoor activity.",
      priority: "low",
      category: "health",
      reasonCodes: ["available_air_data"],
      evidenceIds: ["airnow-aqi"],
    });
  }
  if (aqi > US_AQI_UPPER_BOUND.unhealthy)
    actions.unshift({
      id: "essential-trips",
      title: "Plan essential trips",
      description:
        "Keep essential trips short where practical and follow your existing medical advice.",
      priority: "high",
      category: "health",
      reasonCodes: ["very_unhealthy_aqi"],
      evidenceIds: ["airnow-aqi"],
    });
  if (
    aqi > US_AQI_UPPER_BOUND.sensitiveGroups &&
    (profile.commute === "walk" || profile.commute === "bike")
  )
    actions.push({
      id: "commute-exposure",
      title: "Review your commute",
      description:
        "Consider practical alternatives that reduce time near heavy traffic; a lower-emission mode can still increase exposure.",
      priority: "medium",
      category: "transport",
      reasonCodes: ["outdoor_commute", "elevated_aqi"],
      evidenceIds: ["airnow-aqi", "epa-near-road"],
    });
  actions.push(indoorSmokeAdvice(profile));
  return actions;
}
