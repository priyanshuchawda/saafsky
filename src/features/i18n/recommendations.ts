import type { Recommendation } from "../recommendations/engine.ts";
import type { Language } from "./messages.ts";

const hindiActions = {
  "air-unavailable": {
    title: "वर्तमान स्थिति देखें",
    description:
      "वायु गुणवत्ता उपलब्ध नहीं है। बाहर की गतिविधि की योजना बनाने से पहले स्थानीय आधिकारिक स्रोत देखें।",
  },
  "indoor-smoke": {
    title: "घर के अंदर का धुआँ कम करें",
    description:
      "घर के अंदर का धुआँ कम करें और उपलब्ध हो तो खाना पकाते समय एग्जॉस्ट का उपयोग करें।",
  },
  "reduce-outdoor-exertion": {
    title: "बाहर की शारीरिक मेहनत घटाएँ",
    description:
      "लंबे समय तक या कठिन बाहरी गतिविधि कम करें; घर के अंदर के विकल्प पर विचार करें।",
  },
  "sensitive-caution": {
    title: "संवेदनशील लोगों का ध्यान रखें",
    description:
      "संवेदनशील लोगों को लंबे समय तक बाहर की मेहनत घटाने पर विचार करना चाहिए।",
  },
  "monitor-conditions": {
    title: "स्थिति देखें",
    description:
      "बाहर की गतिविधि की योजना बनाते समय पूर्वानुमान और अपने लक्षणों पर ध्यान दें।",
  },
  "essential-trips": {
    title: "ज़रूरी यात्राओं की योजना बनाएँ",
    description:
      "जहाँ संभव हो, ज़रूरी यात्राएँ छोटी रखें और अपनी मौजूदा चिकित्सीय सलाह मानें।",
  },
  "commute-exposure": {
    title: "आवागमन के विकल्प देखें",
    description:
      "भारी यातायात के पास बिताया समय घटाने वाले व्यावहारिक विकल्प देखें; कम उत्सर्जन वाला साधन भी प्रदूषण का संपर्क बढ़ा सकता है।",
  },
} as const;

type ActionId = keyof typeof hindiActions;
function isActionId(id: string): id is ActionId {
  return Object.hasOwn(hindiActions, id);
}

/** Keep the English API contract while choosing Hindi copy by a stable action ID. */
export function localizeRecommendation(
  language: Language,
  action: Recommendation,
): { title: string; description: string } {
  if (language === "en" || !isActionId(action.id)) {
    return { title: action.title, description: action.description };
  }
  const translated = hindiActions[action.id];
  if (
    action.id === "reduce-outdoor-exertion" &&
    action.reasonCodes.includes("outdoor_exercise")
  ) {
    return {
      title: translated.title,
      description:
        "योजना बनाई गई कठिन कसरत घर के अंदर करें या संभव हो तो टालें; लंबे समय तक बाहर रहने को कम करें।",
    };
  }
  return translated;
}
