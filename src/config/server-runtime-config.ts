export type ServerEnvironment = Readonly<Record<string, string | undefined>>;

export type GeminiRuntimeConfig =
  | { kind: "unconfigured" }
  | { kind: "invalid" }
  | {
      kind: "ready";
      apiKey: string;
      model: string;
      fallbackModel: string | undefined;
    };

const DEFAULT_GEMINI_MODEL = "gemini-3.5-flash-lite";
const MODEL_NAME_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/;

function parseModel(value: string | undefined): string | null {
  const model = value?.trim();
  if (!model) return null;
  return MODEL_NAME_PATTERN.test(model) ? model : "";
}

/** Parse only server-side Gemini settings; never expose the key to client code. */
export function geminiRuntimeConfig(
  env: ServerEnvironment,
): GeminiRuntimeConfig {
  const apiKey = env.GEMINI_API_KEY?.trim();
  if (!apiKey) return { kind: "unconfigured" };

  const configuredModel = parseModel(env.GEMINI_MODEL);
  const configuredFallback = parseModel(env.GEMINI_FALLBACK_MODEL);
  if (configuredModel === "" || configuredFallback === "") {
    return { kind: "invalid" };
  }

  return {
    kind: "ready",
    apiKey,
    model: configuredModel ?? DEFAULT_GEMINI_MODEL,
    fallbackModel: configuredFallback ?? undefined,
  };
}
