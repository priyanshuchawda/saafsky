type ProtectionEnvironment = Readonly<Record<string, string | undefined>>;

type ProtectionConfig =
  | { kind: "local" }
  | { kind: "unavailable" }
  | { kind: "ready"; onVercel: boolean; hashSecret: string };

/** Public deployments fail closed if their shared protection is misconfigured. */
export function protectionConfig(env: ProtectionEnvironment): ProtectionConfig {
  const onVercel = Boolean(env.VERCEL);
  const publicMode = onVercel || env.SAAFSKY_PUBLIC === "true";
  if (env.SAAFSKY_PUBLIC && !["true", "false"].includes(env.SAAFSKY_PUBLIC))
    return { kind: "unavailable" };
  const url = env.UPSTASH_REDIS_REST_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN;
  if (!url && !token)
    return publicMode ? { kind: "unavailable" } : { kind: "local" };
  if (!url || !token?.trim()) return { kind: "unavailable" };
  try {
    const parsed = new URL(url);
    if (
      (publicMode
        ? parsed.protocol !== "https:"
        : !["http:", "https:"].includes(parsed.protocol)) ||
      !parsed.hostname ||
      parsed.username ||
      parsed.password ||
      parsed.search ||
      parsed.hash
    )
      return { kind: "unavailable" };
  } catch {
    return { kind: "unavailable" };
  }
  const hashSecret = env.RATE_LIMIT_HASH_SECRET ?? "";
  if (onVercel && !hashSecret.trim()) return { kind: "unavailable" };
  return { kind: "ready", onVercel, hashSecret };
}
