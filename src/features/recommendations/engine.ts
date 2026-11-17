export type HouseholdProfile = {
  sensitive: boolean;
  children: boolean;
  outdoorExercise: boolean;
  commute: "none" | "walk" | "bike" | "public" | "car";
  cookingSmoke: boolean;
};
export type Recommendation = {
  id: string;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  category: "health" | "indoor" | "transport";
  reasonCodes: string[];
  evidenceIds: string[];
};

export function generateRecommendations(
  aqi: number | null,
  profile: HouseholdProfile,
): Recommendation[] {
  const actions: Recommendation[] = [];
  if (aqi === null || !Number.isFinite(aqi) || aqi < 0) {
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
    ];
  }
  const vulnerable = profile.sensitive || profile.children;
  if (aqi > 150 || (aqi > 100 && vulnerable)) {
    actions.push({
      id: "reduce-outdoor-exertion",
      title: "Reduce outdoor exertion",
      description:
        "Reduce prolonged or strenuous outdoor activity; consider an indoor alternative.",
      priority: "high",
      category: "health",
      reasonCodes: [
        "elevated_aqi",
        ...(vulnerable ? ["sensitive_household"] : []),
      ],
      evidenceIds: ["airnow-aqi"],
    });
  } else if (aqi > 100) {
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
  if (aqi > 200)
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
  if (aqi > 150 && (profile.commute === "walk" || profile.commute === "bike"))
    actions.push({
      id: "commute-exposure",
      title: "Review your commute",
      description:
        "Consider practical alternatives that reduce time near heavy traffic; a lower-emission mode can still increase exposure.",
      priority: "medium",
      category: "transport",
      reasonCodes: ["outdoor_commute", "elevated_aqi"],
      evidenceIds: ["airnow-aqi"],
    });
  actions.push({
    id: "indoor-smoke",
    title: "Reduce indoor smoke",
    description: "Reduce indoor smoke and use cooking exhaust where available.",
    priority: profile.cookingSmoke ? "medium" : "low",
    category: "indoor",
    reasonCodes: [
      "indoor_source_control",
      ...(profile.cookingSmoke ? ["cooking_smoke"] : []),
    ],
    evidenceIds: ["epa-indoor"],
  });
  return actions;
}
