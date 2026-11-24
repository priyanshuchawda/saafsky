import {
  generateRecommendations,
  type HouseholdProfile,
  type Recommendation,
} from "../recommendations/engine.ts";

export type DailyStepId = "morning" | "daytime" | "evening";
export type DailyStep = {
  id: DailyStepId;
  period: string;
  title: string;
  detail: string;
  actionIds: string[];
  detailActions: Recommendation[];
};
export function generateDailyPlan(
  aqi: number | null,
  profile: HouseholdProfile,
): DailyStep[] {
  const actions = generateRecommendations(aqi, profile);
  const health = actions.filter((action) => action.category === "health");
  const indoor = actions.find((action) => action.category === "indoor");
  const commute = actions.find((action) => action.id === "commute-exposure");
  return [
    {
      id: "morning",
      period: "Morning",
      title: "Check conditions before leaving",
      detail:
        health.map((action) => action.description).join(" ") ||
        "Check local conditions before leaving.",
      actionIds: health.map((action) => action.id),
      detailActions: health,
    },
    {
      id: "daytime",
      period: "Daytime",
      title: "Plan essential travel",
      detail:
        commute?.description ??
        "Use the forecast window comparison below for flexible outings; the lowest forecast is not necessarily safe.",
      actionIds: commute ? [commute.id] : [],
      detailActions: commute ? [commute] : [],
    },
    {
      id: "evening",
      period: "Evening",
      title: "Manage indoor sources",
      detail:
        indoor?.description ??
        "Check local guidance before changing ventilation or activity.",
      actionIds: indoor ? [indoor.id] : [],
      detailActions: indoor ? [indoor] : [],
    },
  ];
}
