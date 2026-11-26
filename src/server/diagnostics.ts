import { ZodError } from "zod";
import { UpstreamHttpError } from "../lib/upstream-error.ts";
import { AssistantReplyValidationError } from "../features/assistant/validate.ts";
export { UpstreamHttpError } from "../lib/upstream-error.ts";

type Service = "air" | "locations" | "rate_limit" | "gemini";
type FailureCode =
  | "timeout"
  | "quota"
  | "configuration"
  | "invalid_json"
  | "duplicate_action_reference"
  | "duplicate_evidence_reference"
  | "unknown_action_reference"
  | "missing_evidence_reference"
  | "unknown_evidence_reference"
  | "unsupported_numeric_claim"
  | "unsupported_qualitative_claim"
  | "upstream_http"
  | "upstream_contract"
  | "unexpected";
type Diagnostic = {
  event: "service_failure";
  service: Service;
  code: FailureCode;
};

function providerStatusCode(error: unknown): number | null {
  if (!(error instanceof Error) || !("status" in error)) return null;
  return typeof error.status === "number" ? error.status : null;
}

function classifyHttpStatus(status: number): FailureCode {
  if (status === 429) return "quota";
  if (status === 408 || status === 504) return "timeout";
  if (status >= 400 && status < 600) return "upstream_http";
  return "unexpected";
}

export function classifyFailure(error: unknown): FailureCode {
  if (error instanceof AssistantReplyValidationError) return error.code;
  if (error instanceof ZodError) return "upstream_contract";
  if (error instanceof UpstreamHttpError)
    return error.status === null
      ? "upstream_http"
      : classifyHttpStatus(error.status);
  if (error instanceof Error && error.name === "TimeoutError") return "timeout";
  if (error instanceof Error && error.name === "GeminiConfigurationError")
    return "configuration";
  const status = providerStatusCode(error);
  if (typeof status !== "number") return "unexpected";
  return classifyHttpStatus(status);
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
