export type Profile = "adult" | "sensitive";
export function category(aqi: number | null): string {
  if (aqi === null || !Number.isFinite(aqi) || aqi < 0) return "Unavailable";
  if (aqi <= 50) return "Good";
  if (aqi <= 100) return "Moderate";
  if (aqi <= 150) return "Unhealthy for sensitive groups";
  if (aqi <= 200) return "Unhealthy";
  if (aqi <= 300) return "Very unhealthy";
  return "Hazardous";
}

export function advice(aqi: number | null, profile: Profile): string[] {
  if (aqi === null || !Number.isFinite(aqi) || aqi < 0) return ["Air quality is unavailable. Check a local official source before planning outdoor activity."];
  const actions = ["Reduce indoor smoke and use cooking exhaust where available."];
  if (aqi > 150 || (aqi > 100 && profile === "sensitive")) actions.unshift("Reduce prolonged or strenuous outdoor activity; consider an indoor alternative.");
  else if (aqi > 100) actions.unshift("Sensitive people should consider reducing prolonged outdoor exertion.");
  else actions.unshift("Consider the forecast and your own symptoms when planning outdoor activity.");
  if (aqi > 200) actions.unshift("Keep essential trips short where practical and follow your existing medical advice.");
  return actions;
}

export function lowestForecastPeriod(times: string[], values: (number | null)[], currentTime: string): { time: string; aqi: number } | null {
  let best: { time: string; aqi: number } | null = null;
  let considered = 0;
  for (let index = 0; index < times.length && considered < 24; index++) {
    const time = times[index];
    const value = values[index];
    if (!time || time < currentTime) continue;
    considered++;
    if (typeof value !== "number" || !Number.isFinite(value) || value < 0) continue;
    if (!best || value < best.aqi) best = { time, aqi: value };
  }
  return best;
}
