export class RateLimitError extends Error {
  readonly retryAfterSeconds: number | null;
  constructor(message: string, retryAfterSeconds: number | null = null) {
    super(message);
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export function parseRetryAfter(header: string | null): number | null {
  if (!header || !/^\d{1,6}$/.test(header)) return null;
  return Math.min(86_400, Math.max(1, Number(header)));
}

export function retryMessage(header: string | null): string {
  const seconds = parseRetryAfter(header);
  if (seconds === null) return "Request limit reached. Please try again later.";
  return seconds < 60
    ? `Request limit reached. Please try again in ${seconds} ${seconds === 1 ? "second" : "seconds"}.`
    : `Request limit reached. Please try again in ${Math.ceil(seconds / 60)} ${seconds <= 60 ? "minute" : "minutes"}.`;
}
export function throwIfHttpError(response: Response): void {
  if (response.status === 429) {
    const header = response.headers.get("Retry-After");
    throw new RateLimitError(retryMessage(header), parseRetryAfter(header));
  }
  if (!response.ok) throw new Error("Request unavailable");
}
