type ProtectionEnvironment = Readonly<Record<string, string | undefined>>;

type ProtectionConfig =
  | { kind: "local" }
  | { kind: "unavailable" }
  | { kind: "ready"; onVercel: boolean; hashSecret: string };

function hasValidPublicFlag(value: string | undefined): boolean {
  return value === undefined || value === "true" || value === "false";
}

function isValidRedisUrl(value: string, publicMode: boolean): boolean {
  try {
    const parsed = new URL(value);
    const protocolAllowed = publicMode
      ? parsed.protocol === "https:"
      : parsed.protocol === "http:" || parsed.protocol === "https:";
    return Boolean(
      protocolAllowed &&
      parsed.hostname &&
      !parsed.username &&
      !parsed.password &&
      !parsed.search &&
      !parsed.hash,
    );
  } catch {
    return false;
  }
}

/** Public deployments fail closed if their shared protection is misconfigured. */
export function protectionConfig(env: ProtectionEnvironment): ProtectionConfig {
  const onVercel = Boolean(env.VERCEL);
  if (!hasValidPublicFlag(env.SAAFSKY_PUBLIC)) return { kind: "unavailable" };
  const publicMode = onVercel || env.SAAFSKY_PUBLIC === "true";
  const url = env.UPSTASH_REDIS_REST_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN;
  if (!url && !token)
    return publicMode ? { kind: "unavailable" } : { kind: "local" };
  if (!url || !token?.trim()) return { kind: "unavailable" };
  if (!isValidRedisUrl(url, publicMode)) return { kind: "unavailable" };
  const hashSecret = env.RATE_LIMIT_HASH_SECRET ?? "";
  if (onVercel && !hashSecret.trim()) return { kind: "unavailable" };
  return { kind: "ready", onVercel, hashSecret };
}
