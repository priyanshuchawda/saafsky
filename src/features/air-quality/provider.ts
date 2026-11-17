import { airSchema } from "../../lib/schemas.ts";

type Fetcher = (url: URL, init: RequestInit) => Promise<Response>;
export async function fetchAirForecast(
  latitude: number,
  longitude: number,
  fetcher: Fetcher = fetch,
  now: () => Date = () => new Date(),
) {
  const url = new URL("https://air-quality-api.open-meteo.com/v1/air-quality");
  url.search = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: "us_aqi,pm2_5,pm10",
    hourly: "us_aqi",
    forecast_days: "2",
    timezone: "auto",
  }).toString();
  const response = await fetcher(url, { signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error("Air-quality provider returned an error");
  const data = airSchema.parse(await response.json());
  return { data, retrievedAt: now().toISOString() };
}
