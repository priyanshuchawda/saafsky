import { loadAir } from "@/server/air-provider";
import { handleAirRequest } from "@/server/air-endpoint";
import { checkPublicRequest } from "@/server/rate-limit";

export function GET(request: Request): Promise<Response> {
  return handleAirRequest(request, { loadAir, checkPublicRequest });
}
