import { generateRecommendations } from "../recommendations/engine.ts";
import type {
  HouseholdProfile,
  Recommendation,
} from "../recommendations/engine.ts";
import { translate, type Language } from "../i18n/messages.ts";
import { localizeRecommendation } from "../i18n/recommendations.ts";
import type { AssistantExplanation, AssistantResponse } from "./validate.ts";
import { isValidAqi } from "../../lib/aqi-validity.ts";
import type { ForecastContext } from "./forecast-context.ts";

export type AssistantAirContext = {
  aqi: number | null;
  forecast: ForecastContext | null;
};

type AssistantDependencies = {
  getAirContext: () => Promise<AssistantAirContext>;
  aiConfigured: boolean;
  checkAiBudget: () => Promise<boolean>;
  explain: (
    context: AssistantAirContext,
    actions: Recommendation[],
  ) => Promise<AssistantExplanation>;
  language?: Language;
  onFailure?: (
    service: "air" | "rate_limit" | "gemini",
    error: unknown,
  ) => void;
};

/** Keep a useful general plan available even when a provider or quota fails. */
export async function createAssistantReply(
  profile: HouseholdProfile,
  dependencies: AssistantDependencies,
): Promise<AssistantResponse> {
  let context: AssistantAirContext = { aqi: null, forecast: null };
  try {
    context = await dependencies.getAirContext();
  } catch (error) {
    // The recommendation engine treats unknown conditions conservatively.
    dependencies.onFailure?.("air", error);
  }
  if (!isValidAqi(context.aqi)) context = { aqi: null, forecast: null };
  const aqi = context.aqi;
  const actions = generateRecommendations(aqi, profile);
  const language = dependencies.language ?? "en";
  const fallback = {
    answer: actions
      .map((action) => localizeRecommendation(language, action).description)
      .join(" "),
    referencedActionIds: actions.map((action) => action.id),
    sourceIds: [...new Set(actions.flatMap((action) => action.evidenceIds))],
    uncertainty: translate(
      language,
      aqi === null ? "fallbackNoAir" : "fallbackNoAi",
    ),
    mode: "fallback" as const,
  };
  if (aqi === null || !dependencies.aiConfigured) return fallback;
  let budgetAvailable: boolean;
  try {
    budgetAvailable = await dependencies.checkAiBudget();
  } catch (error) {
    dependencies.onFailure?.("rate_limit", error);
    return fallback;
  }
  if (!budgetAvailable) return fallback;
  try {
    return { ...(await dependencies.explain(context, actions)), mode: "ai" };
  } catch (error) {
    dependencies.onFailure?.("gemini", error);
    return fallback;
  }
}
