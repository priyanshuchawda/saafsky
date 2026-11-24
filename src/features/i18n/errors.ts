import type { RateLimitError } from "../../lib/api-errors.ts";
import type { Language } from "./messages.ts";
import { translate } from "./messages.ts";

export function localizeRateLimit(
  language: Language,
  error: RateLimitError,
): string {
  if (language === "en") return error.message;
  const seconds = error.retryAfterSeconds;
  if (seconds === null)
    return "अनुरोध की सीमा पूरी हो गई है। कृपया थोड़ी देर बाद फिर कोशिश करें।";
  const count = seconds < 60 ? seconds : Math.ceil(seconds / 60);
  const unit = seconds < 60 ? "सेकंड" : "मिनट";
  return `अनुरोध की सीमा पूरी हो गई है। कृपया ${count} ${unit} बाद फिर कोशिश करें।`;
}

export function localizeAirError(
  language: Language,
  error: RateLimitError | null,
): string {
  return error
    ? localizeRateLimit(language, error)
    : translate(language, "airFetchFailed");
}
