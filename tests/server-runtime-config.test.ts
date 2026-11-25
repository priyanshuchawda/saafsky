import { test } from "node:test";
import assert from "node:assert/strict";
import { geminiRuntimeConfig } from "../src/config/server-runtime-config.ts";

test("Gemini runtime configuration uses a free-compatible default and keeps credentials server-side", () => {
  assert.deepEqual(geminiRuntimeConfig({ GEMINI_API_KEY: " key " }), {
    kind: "ready",
    apiKey: "key",
    model: "gemini-3.5-flash-lite",
    fallbackModel: undefined,
  });
});

test("Gemini runtime configuration accepts explicit model fallback settings", () => {
  assert.deepEqual(
    geminiRuntimeConfig({
      GEMINI_API_KEY: "key",
      GEMINI_MODEL: "gemini-3.8-flash",
      GEMINI_FALLBACK_MODEL: "gemini-3.5-flash-lite",
    }),
    {
      kind: "ready",
      apiKey: "key",
      model: "gemini-3.8-flash",
      fallbackModel: "gemini-3.5-flash-lite",
    },
  );
});

test("Gemini runtime configuration distinguishes missing credentials from malformed model names", () => {
  assert.deepEqual(geminiRuntimeConfig({}), { kind: "unconfigured" });
  assert.deepEqual(geminiRuntimeConfig({ GEMINI_API_KEY: " " }), {
    kind: "unconfigured",
  });
  assert.deepEqual(
    geminiRuntimeConfig({ GEMINI_API_KEY: "key", GEMINI_MODEL: "bad model" }),
    { kind: "invalid" },
  );
  assert.deepEqual(
    geminiRuntimeConfig({
      GEMINI_API_KEY: "key",
      GEMINI_FALLBACK_MODEL: "bad/model",
    }),
    { kind: "invalid" },
  );
});
