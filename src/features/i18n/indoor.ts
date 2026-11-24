import type { IndoorAction, IndoorContentKey } from "../indoor/advice.ts";
import type { Language } from "./messages.ts";

const hindiIndoor = {
  "sources-smoke": {
    title: "घर के अंदर प्रदूषण के स्रोत घटाएँ",
    detail:
      "जहाँ संभव हो खाना पकाने का धुआँ घटाएँ और खाना बनाते समय बाहर की ओर हवा निकालने वाला एग्जॉस्ट चलाएँ।",
  },
  "sources-general": {
    title: "घर के अंदर प्रदूषण के स्रोत घटाएँ",
    detail:
      "मोमबत्ती, अगरबत्ती, धूम्रपान और अन्य स्रोतों से होने वाले अनावश्यक घर के अंदर के धुएँ से बचें।",
  },
  "filtration-available": {
    title: "एयर प्यूरीफायर का सही उपयोग करें",
    detail:
      "कमरे के आकार के अनुसार कणों को छानने वाला प्यूरीफायर चलाएँ और उसका फ़िल्टर ठीक रखें। ओज़ोन बनाने वाले उपकरणों से बचें।",
  },
  "filtration-unavailable": {
    title: "कम प्रदूषित कमरा चुनें",
    detail:
      "कम धुएँ वाले आरामदायक कमरे में समय बिताएँ; फ़िल्टर उपलब्ध हो तो मदद कर सकता है।",
  },
  "ventilation-elevated": {
    title: "हवादारी और सुरक्षा में संतुलन रखें",
    detail:
      "जहाँ संभव हो बाहर की प्रदूषित हवा का प्रवेश घटाएँ, पर सुरक्षित तापमान और ज़रूरी हवादारी बनाए रखें—खासकर खाना पकाते समय।",
  },
  "ventilation-lower": {
    title: "हवादारी और सुरक्षा में संतुलन रखें",
    detail:
      "बाहर की हवा बेहतर होने पर, घर के अंदर के स्रोतों और परिवार की सुरक्षा को ध्यान में रखकर हवादारी करें।",
  },
  "ventilation-unknown": {
    title: "हवादारी और सुरक्षा में संतुलन रखें",
    detail:
      "बाहर की वर्तमान स्थिति देखें और सुरक्षित तापमान व ज़रूरी हवादारी बनाए रखें—खासकर खाना पकाते समय।",
  },
} satisfies Record<IndoorContentKey, { title: string; detail: string }>;

export function localizeIndoorAction(
  language: Language,
  action: IndoorAction,
): { title: string; detail: string } {
  return language === "hi"
    ? hindiIndoor[action.contentKey]
    : { title: action.title, detail: action.detail };
}
