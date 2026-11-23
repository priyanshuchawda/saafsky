export const reasonDescriptions = {
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
} satisfies Record<string, string>;
export const evidenceCatalog = {
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
} satisfies Record<string, { label: string; url: string }>;

export type ReasonCode = keyof typeof reasonDescriptions;
export type EvidenceId = keyof typeof evidenceCatalog;

function isEvidenceId(id: string): id is EvidenceId {
  return Object.hasOwn(evidenceCatalog, id);
}

/** Public responses contain untrusted IDs; do not traverse the object prototype. */
export function findEvidence(
  id: string,
): { label: string; url: string } | undefined {
  return isEvidenceId(id) ? evidenceCatalog[id] : undefined;
}
