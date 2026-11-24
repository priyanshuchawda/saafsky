import { ZodError } from "zod";
import { UpstreamHttpError } from "../lib/upstream-error.ts";
export { UpstreamHttpError } from "../lib/upstream-error.ts";

type Service = "air" | "locations" | "rate_limit";
type FailureCode =
  "timeout" | "quota" | "upstream_http" | "upstream_contract" | "unexpected";
type Diagnostic = {
  event: "service_failure";
  service: Service;
  code: FailureCode;
};

export function classifyFailure(error: unknown): FailureCode {
  if (error instanceof Error && error.name === "TimeoutError") return "timeout";
  if (error instanceof UpstreamHttpError)
    return error.status === 429 ? "quota" : "upstream_http";
  if (error instanceof ZodError) return "upstream_contract";
  return "unexpected";
}

/** Never emit error messages, request inputs, provider payloads, or credentials. */
export function reportServiceFailure(
  service: Service,
  error: unknown,
  write: (entry: Diagnostic) => void = (entry) =>
    console.error(JSON.stringify(entry)),
): void {
  write({ event: "service_failure", service, code: classifyFailure(error) });
}
