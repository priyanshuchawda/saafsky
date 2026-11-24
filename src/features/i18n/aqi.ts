import { AQI_CATEGORY_LABELS, categoryKey } from "../../lib/air.ts";
import type { AqiCategoryKey } from "../../lib/air.ts";
import type { Language } from "./messages.ts";

const hindiCategories = {
  unavailable: "उपलब्ध नहीं",
  good: "अच्छी",
  moderate: "मध्यम",
  sensitive: "संवेदनशील समूहों के लिए अस्वस्थ",
  unhealthy: "अस्वस्थ",
  veryUnhealthy: "बहुत अस्वस्थ",
  hazardous: "खतरनाक",
} satisfies Record<AqiCategoryKey, string>;

export function translateAqiCategory(
  language: Language,
  aqi: number | null,
): string {
  const key = categoryKey(aqi);
  return language === "hi" ? hindiCategories[key] : AQI_CATEGORY_LABELS[key];
}
