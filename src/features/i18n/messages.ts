import { englishMessages } from "./en.ts";
import { hindiMessages } from "./hi.ts";

export const messages = { en: englishMessages, hi: hindiMessages } as const;

export type Language = keyof typeof messages;
export type MessageKey = keyof (typeof messages)["en"];

const translatedContent: Record<string, string> = {
  Unavailable: "उपलब्ध नहीं",
  unavailable: "उपलब्ध नहीं",
  Good: "अच्छी",
  Moderate: "मध्यम",
  "Unhealthy for sensitive groups": "संवेदनशील समूहों के लिए अस्वस्थ",
  Unhealthy: "अस्वस्थ",
  "Very unhealthy": "बहुत अस्वस्थ",
  Hazardous: "खतरनाक",
  "Check current conditions": "वर्तमान स्थिति देखें",
  "Air quality is unavailable. Check a local official source before planning outdoor activity.":
    "वायु गुणवत्ता उपलब्ध नहीं है। बाहर की गतिविधि की योजना बनाने से पहले स्थानीय आधिकारिक स्रोत देखें।",
  "Reduce indoor smoke": "घर के अंदर का धुआँ कम करें",
  "Reduce indoor smoke and use cooking exhaust where available.":
    "घर के अंदर का धुआँ कम करें और उपलब्ध हो तो खाना पकाते समय एग्जॉस्ट का उपयोग करें।",
  "Reduce outdoor exertion": "बाहर की शारीरिक मेहनत घटाएँ",
  "Move planned strenuous outdoor exercise indoors or postpone it if practical; reduce prolonged outdoor activity.":
    "योजना बनाई गई कठिन कसरत घर के अंदर करें या संभव हो तो टालें; लंबे समय तक बाहर रहने को कम करें।",
  "Reduce prolonged or strenuous outdoor activity; consider an indoor alternative.":
    "लंबे समय तक या कठिन बाहरी गतिविधि कम करें; घर के अंदर के विकल्प पर विचार करें।",
  "Consider sensitive people": "संवेदनशील लोगों का ध्यान रखें",
  "Check conditions": "स्थिति देखें",
  "Consider the forecast and your own symptoms when planning outdoor activity.":
    "बाहर की गतिविधि की योजना बनाते समय पूर्वानुमान और अपने लक्षणों पर ध्यान दें।",
  "Plan essential trips": "ज़रूरी यात्राओं की योजना बनाएँ",
  "Keep essential trips short where practical and follow your existing medical advice.":
    "जहाँ संभव हो, ज़रूरी यात्राएँ छोटी रखें और अपनी मौजूदा चिकित्सीय सलाह मानें।",
  "Review your commute": "आवागमन के विकल्प देखें",
  "Consider practical alternatives that reduce time near heavy traffic; a lower-emission mode can still increase exposure.":
    "भारी यातायात के पास बिताया समय घटाने वाले व्यावहारिक विकल्प देखें; कम उत्सर्जन वाला साधन भी प्रदूषण का संपर्क बढ़ा सकता है।",
  Morning: "सुबह",
  Daytime: "दिन में",
  Evening: "शाम",
  "Check conditions before leaving": "निकलने से पहले स्थिति देखें",
  "Sensitive people should consider reducing prolonged outdoor exertion.":
    "संवेदनशील लोगों को लंबे समय तक बाहर की मेहनत घटाने पर विचार करना चाहिए।",
  "Plan essential travel": "ज़रूरी यात्रा की योजना बनाएँ",
  "Use the forecast window comparison below for flexible outings; the lowest forecast is not necessarily safe.":
    "लचीली यात्रा के लिए नीचे दिए समय-खंडों की तुलना करें; सबसे कम अनुमान का अर्थ सुरक्षित हवा नहीं है।",
  "Manage indoor sources": "घर के अंदर के स्रोत संभालें",
  "Check local conditions before leaving.": "निकलने से पहले स्थानीय स्थिति देखें।",
  "Check local guidance before changing ventilation or activity.":
    "हवादारी या गतिविधि बदलने से पहले स्थानीय मार्गदर्शन देखें।",
  "Reduce indoor sources": "घर के अंदर प्रदूषण के स्रोत घटाएँ",
  "Reduce cooking smoke where possible and use an exhaust fan vented outdoors while cooking.":
    "जहाँ संभव हो खाना पकाने का धुआँ घटाएँ और खाना बनाते समय बाहर की ओर हवा निकालने वाला एग्जॉस्ट चलाएँ।",
  "Avoid unnecessary indoor smoke from candles, incense, smoking and other sources.":
    "मोमबत्ती, अगरबत्ती, धूम्रपान और अन्य स्रोतों से होने वाले अनावश्यक घर के अंदर के धुएँ से बचें।",
  "Use your purifier effectively": "एयर प्यूरीफायर का सही उपयोग करें",
  "Choose a cleaner-air room": "कम प्रदूषित कमरा चुनें",
  "Use a suitably sized particle-filtering purifier and maintain its filter. Avoid devices that produce ozone.":
    "कमरे के आकार के अनुसार कणों को छानने वाला प्यूरीफायर चलाएँ और उसका फ़िल्टर ठीक रखें। ओज़ोन बनाने वाले उपकरणों से बचें।",
  "Spend time in a comfortable room with fewer indoor smoke sources; filtration can help if it is available.":
    "कम धुएँ वाले आरामदायक कमरे में समय बिताएँ; फ़िल्टर उपलब्ध हो तो मदद कर सकता है।",
  "Balance ventilation and safety": "हवादारी और सुरक्षा में संतुलन रखें",
  "Reduce polluted outdoor air entry where practical, while maintaining safe temperatures and necessary ventilation, especially when cooking.":
    "जहाँ संभव हो बाहर की प्रदूषित हवा का प्रवेश घटाएँ, पर सुरक्षित तापमान और ज़रूरी हवादारी बनाए रखें—खासकर खाना पकाते समय।",
  "When outdoor air improves, consider ventilation while accounting for indoor sources and household safety.":
    "बाहर की हवा बेहतर होने पर, घर के अंदर के स्रोतों और परिवार की सुरक्षा को ध्यान में रखकर हवादारी करें।",
  "Check current outdoor conditions and maintain safe temperatures and necessary ventilation, especially when cooking.":
    "बाहर की वर्तमान स्थिति देखें और सुरक्षित तापमान व ज़रूरी हवादारी बनाए रखें—खासकर खाना पकाते समय।",
  "Current air data is missing or too old to use for this plan.":
    "वर्तमान हवा का डेटा अनुपलब्ध या पुराना है, इसलिए इस योजना में इसका उपयोग नहीं किया जा सकता।",
  "A current model estimate is available for the selected city.":
    "चुने गए शहर के लिए वर्तमान मॉडल अनुमान उपलब्ध है।",
  "The modeled US AQI is in the range where sensitive groups may need extra care.":
    "मॉडल का US AQI उस स्तर पर है जहाँ संवेदनशील समूहों को अतिरिक्त सावधानी की ज़रूरत हो सकती है।",
  "The modeled US AQI crossed a precaution threshold for this household.":
    "मॉडल का US AQI इस परिवार के लिए सावधानी की सीमा से ऊपर है।",
  "The household includes a child or someone more sensitive to air pollution.":
    "परिवार में बच्चा या वायु प्रदूषण के प्रति अधिक संवेदनशील सदस्य है।",
  "You indicated that you usually exercise outdoors.":
    "आपने बताया कि आप आमतौर पर बाहर व्यायाम करते हैं।",
  "The modeled US AQI is above 200.": "मॉडल का US AQI 200 से अधिक है।",
  "Your selected commute involves walking or cycling.":
    "आपके चुने हुए आवागमन में पैदल चलना या साइकिल चलाना शामिल है।",
  "Reducing indoor sources can help manage indoor pollution.":
    "घर के अंदर प्रदूषण के स्रोत घटाने से हवा को बेहतर रखने में मदद मिल सकती है।",
  "You indicated that cooking smoke is usually present.":
    "आपने बताया कि खाना पकाते समय आमतौर पर धुआँ होता है।",
  "These rules use a city-scale estimate; local conditions may differ.":
    "ये नियम शहर-स्तर के अनुमान पर आधारित हैं; स्थानीय स्थितियाँ अलग हो सकती हैं।",
  "Current air data is unavailable, so this general plan cannot answer your specific question.":
    "वर्तमान हवा का डेटा उपलब्ध नहीं है, इसलिए यह सामान्य योजना आपके विशेष प्रश्न का उत्तर नहीं दे सकती।",
  "The AI explanation is unavailable. This general plan may not answer your specific question.":
    "AI का स्पष्टीकरण उपलब्ध नहीं है। यह सामान्य योजना आपके विशेष प्रश्न का उत्तर शायद न दे सके।",
  "Request limit reached. Please try later.":
    "अनुरोध की सीमा पूरी हो गई है। कृपया थोड़ी देर बाद कोशिश करें।",
  "Air data is unavailable. Please try again later.":
    "हवा का डेटा अभी उपलब्ध नहीं है। कृपया थोड़ी देर बाद फिर कोशिश करें।",
  "The assistant is unavailable. Please use the dashboard plan instead.":
    "सहायक अभी उपलब्ध नहीं है। कृपया डैशबोर्ड की योजना देखें।",
  "Preparing your answer…": "आपका उत्तर तैयार हो रहा है…",
  "AI can make mistakes. Follow existing medical advice and check official local conditions.":
    "AI से गलती हो सकती है। मौजूदा चिकित्सीय सलाह मानें और स्थानीय आधिकारिक स्थिति देखें।",
};
const translatedContentEntries = Object.entries(translatedContent).sort(
  ([left], [right]) => right.length - left.length,
);

export function translate(language: Language, key: MessageKey): string {
  return messages[language][key];
}

export function translateText(language: Language, text: string): string {
  if (language === "en") return text;
  const retry = text.match(
    /^Request limit reached\. Please try again in (\d+) (second|seconds|minute|minutes)\.$/,
  );
  if (retry) {
    const unit = retry[2]?.startsWith("second") ? "सेकंड" : "मिनट";
    return `अनुरोध की सीमा पूरी हो गई है। कृपया ${retry[1]} ${unit} बाद फिर कोशिश करें।`;
  }
  const exact = translatedContent[text];
  if (exact) return exact;
  return translatedContentEntries.reduce(
    (translated, [english, hindi]) =>
      translated.includes(english)
        ? translated.replaceAll(english, hindi)
        : translated,
    text,
  );
}
