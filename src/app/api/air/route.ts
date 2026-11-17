import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const latitude = Number(params.get("lat"));
  const longitude = Number(params.get("lon"));
  if (!params.has("lat") || !params.has("lon") || !Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
  const url = new URL("https://air-quality-api.open-meteo.com/v1/air-quality");
  url.search = new URLSearchParams({ latitude: String(latitude), longitude: String(longitude), current: "us_aqi,pm2_5,pm10", hourly: "us_aqi", forecast_days: "2", timezone: "auto" }).toString();
  try {
    const response = await fetch(url, { next: { revalidate: 1800 }, signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error("Provider error");
    const data: unknown = await response.json();
    if (!data || typeof data !== "object" || !("current" in data) || !("hourly" in data)) throw new Error("Invalid data");
    return NextResponse.json({ data, retrievedAt: new Date().toISOString() });
  } catch { return NextResponse.json({ error: "Air data is temporarily unavailable." }, { status: 503 }); }
}
