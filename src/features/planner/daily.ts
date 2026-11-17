import {
  generateRecommendations,
  type HouseholdProfile,
} from "../recommendations/engine.ts";

export type DailyStep = {
  id: string;
  period: string;
  title: string;
  detail: string;
  actionIds: string[];
};
export function generateDailyPlan(
  aqi: number | null,
  profile: HouseholdProfile,
): DailyStep[] {
  const actions = generateRecommendations(aqi, profile);
  const health = actions.find((action) => action.category === "health");
  const indoor = actions.find((action) => action.category === "indoor");
  const commute = actions.find((action) => action.id === "commute-exposure");
  return [
    {
      id: "morning",
      period: "Morning",
      title: "Check conditions before leaving",
      detail: health?.description ?? "Check local conditions before leaving.",
      actionIds: health ? [health.id] : [],
    },
    {
      id: "daytime",
      period: "Daytime",
      title: "Plan essential travel",
      detail:
        commute?.description ??
        "Use the forecast window comparison below for flexible outings; the lowest forecast is not necessarily safe.",
      actionIds: commute ? [commute.id] : [],
    },
    {
      id: "evening",
      period: "Evening",
      title: "Manage indoor sources",
      detail:
        indoor?.description ??
        "Check local guidance before changing ventilation or activity.",
      actionIds: indoor ? [indoor.id] : [],
    },
  ];
}
