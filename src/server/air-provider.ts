import { cacheLife } from "next/cache";
import { fetchAirForecast } from "@/features/air-quality/provider";
import { SERVER_BUDGETS } from "@/config/server-budgets";

export async function loadAir(latitude: number, longitude: number) {
  "use cache";
  cacheLife({
    stale: SERVER_BUDGETS.cache.air.staleSeconds,
    revalidate: SERVER_BUDGETS.cache.air.revalidateSeconds,
    expire: SERVER_BUDGETS.cache.air.expireSeconds,
  });
  return fetchAirForecast(latitude, longitude);
}
