import { handleLocationsRequest } from "@/server/locations-endpoint";
import { checkPublicRequest } from "@/server/rate-limit";

export function GET(request: Request): Promise<Response> {
  return handleLocationsRequest(request, { checkPublicRequest });
}
