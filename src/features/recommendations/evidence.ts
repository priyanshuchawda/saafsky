export const reasonDescriptions: Record<string, string> = {
  missing_air_data:
    "Current air data is missing or too old to use for this plan.",
  available_air_data:
    "A current model estimate is available for the selected city.",
  sensitive_group_aqi:
    "The modeled US AQI is in the range where sensitive groups may need extra care.",
  elevated_aqi:
    "The modeled US AQI crossed a precaution threshold for this household.",
  sensitive_household:
    "The household includes a child or someone more sensitive to air pollution.",
  outdoor_exercise: "You indicated that you usually exercise outdoors.",
  very_unhealthy_aqi: "The modeled US AQI is above 200.",
  outdoor_commute: "Your selected commute involves walking or cycling.",
  indoor_source_control:
    "Reducing indoor sources can help manage indoor pollution.",
  cooking_smoke: "You indicated that cooking smoke is usually present.",
};
export const evidenceCatalog: Record<string, { label: string; url: string }> = {
  "airnow-aqi": {
    label: "AirNow: US AQI basics",
    url: "https://www.airnow.gov/aqi/aqi-basics/",
  },
  "epa-indoor": {
    label: "US EPA: improving indoor air",
    url: "https://www.epa.gov/indoor-air-quality-iaq/improving-indoor-air-quality",
  },
  "epa-near-road": {
    label: "US EPA: near-road pollution",
    url: "https://www.epa.gov/sites/default/files/2015-11/documents/420f14044_0.pdf",
  },
};
