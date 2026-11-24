import type { DailyStep, DailyStepId } from "../planner/daily.ts";
import type { Language } from "./messages.ts";
import { localizeRecommendation } from "./recommendations.ts";

const hindiSteps = {
  morning: {
    period: "सुबह",
    title: "निकलने से पहले स्थिति देखें",
    fallback: "निकलने से पहले स्थानीय स्थिति देखें।",
  },
  daytime: {
    period: "दिन में",
    title: "ज़रूरी यात्रा की योजना बनाएँ",
    fallback:
      "लचीली यात्रा के लिए नीचे दिए समय-खंडों की तुलना करें; सबसे कम अनुमान का अर्थ सुरक्षित हवा नहीं है।",
  },
  evening: {
    period: "शाम",
    title: "घर के अंदर के स्रोत संभालें",
    fallback: "हवादारी या गतिविधि बदलने से पहले स्थानीय मार्गदर्शन देखें।",
  },
} satisfies Record<
  DailyStepId,
  { period: string; title: string; fallback: string }
>;

export function localizeDailyStep(
  language: Language,
  step: DailyStep,
): { period: string; title: string; detail: string } {
  if (language === "en")
    return { period: step.period, title: step.title, detail: step.detail };
  const copy = hindiSteps[step.id];
  return {
    period: copy.period,
    title: copy.title,
    detail: step.detailActions.length
      ? step.detailActions
          .map((action) => localizeRecommendation(language, action).description)
          .join(" ")
      : copy.fallback,
  };
}
