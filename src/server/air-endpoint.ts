import { parseCoordinates } from "../lib/coordinates.ts";
import { rateLimitResponse } from "./rate-limit-result.ts";
import type { LimitDecision } from "./rate-limit-result.ts";
import type { AirResponse } from "../types/air.ts";
import { reportServiceFailure } from "./diagnostics.ts";

type AirEndpointDependencies = {
  loadAir: (latitude: number, longitude: number) => Promise<AirResponse>;
  checkPublicRequest: (
    scope: "air",
    request: Request,
  ) => Promise<LimitDecision>;
};

export async function handleAirRequest(
  request: Request,
  dependencies: AirEndpointDependencies,
): Promise<Response> {
  const coordinates = parseCoordinates(new URL(request.url).searchParams);
  if (!coordinates) {
    return Response.json({ error: "Invalid coordinates" }, { status: 400 });
  }

  const protection = await dependencies.checkPublicRequest("air", request);
  if (!protection.allowed) return rateLimitResponse(protection);

  try {
    const data = await dependencies.loadAir(
      coordinates.latitude,
      coordinates.longitude,
    );
    return Response.json(data);
  } catch (error) {
    reportServiceFailure("air", error);
    return Response.json(
      { error: "Air data is temporarily unavailable." },
      { status: 503 },
    );
  }
}
