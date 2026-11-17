import { NextResponse } from "next/server";
import { loadAir } from "@/server/air-provider";
import { parseCoordinates } from "@/lib/coordinates";
import { allowPublicRequest } from "@/server/rate-limit";

export async function GET(request: Request) {
  const coordinates = parseCoordinates(new URL(request.url).searchParams);
  if (!coordinates)
    return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
  if (!(await allowPublicRequest("air")))
    return NextResponse.json(
      { error: "Request limit reached or protection unavailable." },
      { status: 503 },
    );
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
