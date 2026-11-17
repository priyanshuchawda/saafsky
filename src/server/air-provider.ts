import { cacheLife } from "next/cache";
import { fetchAirForecast } from "@/features/air-quality/provider";

export async function loadAir(latitude: number, longitude: number) {
  "use cache";
  cacheLife({ stale: 1800, revalidate: 1800, expire: 3600 });
  return fetchAirForecast(latitude, longitude);
}
