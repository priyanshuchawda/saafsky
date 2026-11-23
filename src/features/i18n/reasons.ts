import { reasonDescriptions } from "../recommendations/evidence.ts";
import type { ReasonCode } from "../recommendations/evidence.ts";
import type { Language } from "./messages.ts";

const hindiReasons = {
  missing_air_data:
    "वर्तमान हवा का डेटा अनुपलब्ध या पुराना है, इसलिए इस योजना में इसका उपयोग नहीं किया जा सकता।",
  available_air_data: "चुने गए शहर के लिए वर्तमान मॉडल अनुमान उपलब्ध है।",
  sensitive_group_aqi:
    "मॉडल का US AQI उस स्तर पर है जहाँ संवेदनशील समूहों को अतिरिक्त सावधानी की ज़रूरत हो सकती है।",
  elevated_aqi: "मॉडल का US AQI इस परिवार के लिए सावधानी की सीमा से ऊपर है।",
  sensitive_household: "परिवार में बच्चा या वायु प्रदूषण के प्रति अधिक संवेदनशील सदस्य है।",
  outdoor_exercise: "आपने बताया कि आप आमतौर पर बाहर व्यायाम करते हैं।",
  very_unhealthy_aqi: "मॉडल का US AQI 200 से अधिक है।",
  outdoor_commute: "आपके चुने हुए आवागमन में पैदल चलना या साइकिल चलाना शामिल है।",
  indoor_source_control:
    "घर के अंदर प्रदूषण के स्रोत घटाने से हवा को बेहतर रखने में मदद मिल सकती है।",
  cooking_smoke: "आपने बताया कि खाना पकाते समय आमतौर पर धुआँ होता है।",
} satisfies Record<ReasonCode, string>;

export function translateReason(language: Language, code: ReasonCode): string {
  return language === "hi" ? hindiReasons[code] : reasonDescriptions[code];
}
