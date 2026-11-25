import { locationSchema } from "../lib/schemas.ts";
import { rateLimitResponse } from "./rate-limit-result.ts";
import type { LimitDecision } from "./rate-limit-result.ts";
import { reportServiceFailure } from "./diagnostics.ts";
import { UpstreamHttpError } from "../lib/upstream-error.ts";
import { SERVER_BUDGETS } from "../config/server-budgets.ts";

type LocationsEndpointDependencies = {
  checkPublicRequest: (
    scope: "locations",
    request: Request,
  ) => Promise<LimitDecision>;
  fetcher?: typeof fetch;
};

export async function handleLocationsRequest(
  request: Request,
  dependencies: LocationsEndpointDependencies,
): Promise<Response> {
  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (query.length < 2 || query.length > 80) {
    return Response.json({ results: [] });
  }

  const protection = await dependencies.checkPublicRequest(
    "locations",
    request,
  );
  if (!protection.allowed) return rateLimitResponse(protection);

  try {
    const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
    url.search = new URLSearchParams({
      name: query,
      count: "8",
      language: "en",
      format: "json",
    }).toString();
    const fetcher = dependencies.fetcher ?? fetch;
    const response = await fetcher(url, {
      next: { revalidate: SERVER_BUDGETS.cache.locationsRevalidateSeconds },
      signal: AbortSignal.timeout(SERVER_BUDGETS.timeouts.geocodingMs),
    });
    if (!response.ok) throw new UpstreamHttpError(response.status);

    return Response.json(locationSchema.parse(await response.json()));
  } catch (error) {
    reportServiceFailure("locations", error);
    return Response.json(
      { error: "Location search is unavailable." },
      { status: 503 },
    );
  }
}
