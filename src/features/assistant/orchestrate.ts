import { generateRecommendations } from "../recommendations/engine.ts";
import type {
  HouseholdProfile,
  Recommendation,
} from "../recommendations/engine.ts";
import { translate, type Language } from "../i18n/messages.ts";
import { localizeRecommendation } from "../i18n/recommendations.ts";
import type { AssistantExplanation, AssistantResponse } from "./validate.ts";
import { isValidAqi } from "../../lib/aqi-validity.ts";

type AssistantDependencies = {
  getAqi: () => Promise<number | null>;
  aiConfigured: boolean;
  checkAiBudget: () => Promise<boolean>;
  explain: (
    aqi: number,
    actions: Recommendation[],
  ) => Promise<AssistantExplanation>;
  language?: Language;
};

/** Keep a useful general plan available even when a provider or quota fails. */
export async function createAssistantReply(
  profile: HouseholdProfile,
  dependencies: AssistantDependencies,
): Promise<AssistantResponse> {
  let aqi: number | null = null;
  try {
    aqi = await dependencies.getAqi();
  } catch {
    // The recommendation engine treats unknown conditions conservatively.
  }
  if (!isValidAqi(aqi)) aqi = null;
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
  try {
    if (!(await dependencies.checkAiBudget())) return fallback;
    return { ...(await dependencies.explain(aqi, actions)), mode: "ai" };
  } catch {
    return fallback;
  }
}
