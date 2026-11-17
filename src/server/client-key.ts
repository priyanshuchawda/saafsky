import { createHmac } from "node:crypto";
import { isIP } from "node:net";

/** Only trust the platform-provided address on Vercel; do not store raw IPs. */
export function trustedClientKey(
  headers: Headers,
  isVercel: boolean,
  secret: string,
): string | null {
  if (!isVercel || !secret) return null;
  const address = headers.get("x-vercel-forwarded-for")?.trim();
  if (!address || !isIP(address)) return null;
  return createHmac("sha256", secret)
    .update(address)
    .digest("hex")
    .slice(0, 32);
}
