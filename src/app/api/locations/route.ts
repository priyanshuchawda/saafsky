import { NextResponse } from "next/server";
import { locationSchema } from "@/lib/schemas";
import { allowPublicRequest } from "@/server/rate-limit";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (query.length < 2 || query.length > 80)
    return NextResponse.json({ results: [] });
  if (!(await allowPublicRequest("locations")))
    return NextResponse.json(
      { error: "Request limit reached or protection unavailable." },
      { status: 503 },
    );
  try {
    const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
    url.search = new URLSearchParams({
      name: query,
      count: "8",
      language: "en",
      format: "json",
    }).toString();
    const response = await fetch(url, {
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error("Provider error");
    return NextResponse.json(locationSchema.parse(await response.json()));
  } catch {
    return NextResponse.json(
      { error: "Location search is unavailable." },
      { status: 503 },
    );
  }
}
