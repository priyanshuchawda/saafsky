import type { City } from "@/types/air";
import type { Language } from "./messages";

const indianCities: Record<string, string> = {
  delhi: "दिल्ली",
  pune: "पुणे",
  mumbai: "मुंबई",
  bengaluru: "बेंगलुरु",
  bangalore: "बेंगलुरु",
  kolkata: "कोलकाता",
  chennai: "चेन्नई",
  hyderabad: "हैदराबाद",
};

export function displayCity(city: City, language: Language): string {
  if (language !== "hi" || city.country?.toLowerCase() !== "india")
    return city.name;
  return indianCities[city.name.toLowerCase()] ?? city.name;
}
