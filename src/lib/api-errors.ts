export class RateLimitError extends Error {}

export function retryMessage(header: string | null): string {
  if (!header || !/^\d{1,6}$/.test(header))
    return "Request limit reached. Please try again later.";
  const seconds = Math.min(86_400, Math.max(1, Number(header)));
  return seconds < 60
    ? `Request limit reached. Please try again in ${seconds} ${seconds === 1 ? "second" : "seconds"}.`
    : `Request limit reached. Please try again in ${Math.ceil(seconds / 60)} ${seconds <= 60 ? "minute" : "minutes"}.`;
}
export function throwIfHttpError(response: Response): void {
  if (response.status === 429)
    throw new RateLimitError(retryMessage(response.headers.get("Retry-After")));
  if (!response.ok) throw new Error("Request unavailable");
}
