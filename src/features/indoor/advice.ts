export type OutdoorCondition = "elevated" | "lower" | "unknown";
export type IndoorAction = { id: string; title: string; detail: string };

export function outdoorCondition(aqi: number | null): OutdoorCondition {
  if (aqi === null || !Number.isFinite(aqi) || aqi < 0) return "unknown";
  return aqi > 100 ? "elevated" : "lower";
}
export function generateIndoorAdvice(
  smoke: boolean,
  purifier: boolean,
  outdoor: OutdoorCondition,
): IndoorAction[] {
  return [
    {
      id: "sources",
      title: "Reduce indoor sources",
      detail: smoke
        ? "Reduce cooking smoke where possible and use an exhaust fan vented outdoors while cooking."
        : "Avoid unnecessary indoor smoke from candles, incense, smoking and other sources.",
    },
    {
      id: "filtration",
      title: purifier
        ? "Use your purifier effectively"
        : "Choose a cleaner-air room",
      detail: purifier
        ? "Use a suitably sized particle-filtering purifier and maintain its filter. Avoid devices that produce ozone."
        : "Spend time in a comfortable room with fewer indoor smoke sources; filtration can help if it is available.",
    },
    {
      id: "ventilation",
      title: "Balance ventilation and safety",
      detail:
        outdoor === "elevated"
          ? "Reduce polluted outdoor air entry where practical, while maintaining safe temperatures and necessary ventilation, especially when cooking."
          : outdoor === "lower"
            ? "When outdoor air improves, consider ventilation while accounting for indoor sources and household safety."
            : "Check current outdoor conditions and maintain safe temperatures and necessary ventilation, especially when cooking.",
    },
  ];
}
