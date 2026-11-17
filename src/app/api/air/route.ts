import { NextResponse } from "next/server";
import { loadAir } from "@/server/air-provider";
import { parseCoordinates } from "@/lib/coordinates";

export async function GET(request: Request) {
  const coordinates = parseCoordinates(new URL(request.url).searchParams);
  if (!coordinates)
    return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
  try {
    return NextResponse.json(
      await loadAir(coordinates.latitude, coordinates.longitude),
    );
  } catch {
    return NextResponse.json(
      { error: "Air data is temporarily unavailable." },
      { status: 503 },
    );
  }
}
