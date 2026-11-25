import { test } from "node:test";
import assert from "node:assert/strict";
import {
  explainPlan,
  type GeminiInteractionRequest,
} from "../src/server/chat.ts";
import type { Recommendation } from "../src/features/recommendations/engine.ts";

const action: Recommendation = {
  id: "monitor-conditions",
  title: "Check conditions",
  description: "Review the current forecast.",
  priority: "low",
  category: "health",
  reasonCodes: ["available_air_data"],
  evidenceIds: ["airnow-aqi"],
};

const validReply = JSON.stringify({
  answer: "Check the forecast before your trip.",
  referencedActionIds: [action.id],
  sourceIds: ["airnow-aqi"],
  uncertainty: "Forecasts can change.",
});

test("Gemini adapter passes bounded, stateless structured requests to an injected client", async () => {
  let request: GeminiInteractionRequest | undefined;
  const reply = await explainPlan(
    "Should I go outside?",
    120,
    [action],
    [],
    async () => false,
    null,
    "en",
    {
      env: { GEMINI_API_KEY: "test-key", GEMINI_MODEL: "gemini-test" },
      createClient: () => ({
        createInteraction: async (input) => {
          request = input;
          return validReply;
        },
      }),
    },
  );

  assert.equal(reply.answer, "Check the forecast before your trip.");
  assert.equal(request?.model, "gemini-test");
  assert.equal(request?.maxOutputTokens, 500);
  assert.equal(request?.timeoutMs, 12_000);
  assert.match(request?.systemInstruction ?? "", /untrusted data/);
  assert.equal(JSON.parse(request?.input ?? "{}").usAqi, 120);
});

test("Gemini adapter rejects malformed output from the injected provider", async () => {
  await assert.rejects(
    explainPlan("Question", 100, [action], [], async () => false, null, "en", {
      env: { GEMINI_API_KEY: "test-key" },
      createClient: () => ({
        createInteraction: async () => "not JSON",
      }),
    }),
  );
});

test("Gemini adapter uses one reserved fallback attempt after a retryable model failure", async () => {
  const models: string[] = [];
  let reservations = 0;
  await explainPlan(
    "Question",
    100,
    [action],
    [],
    async () => {
      reservations++;
      return true;
    },
    null,
    "en",
    {
      env: {
        GEMINI_API_KEY: "test-key",
        GEMINI_MODEL: "primary",
        GEMINI_FALLBACK_MODEL: "fallback",
      },
      createClient: () => ({
        createInteraction: async ({ model }) => {
          models.push(model);
          if (model === "primary") {
            throw Object.assign(new Error("provider unavailable"), {
              status: 503,
            });
          }
          return validReply;
        },
      }),
    },
  );

  assert.deepEqual(models, ["primary", "fallback"]);
  assert.equal(reservations, 1);
});

test("Gemini adapter never constructs a client when credentials are missing", async () => {
  let clientCreated = false;
  await assert.rejects(
    explainPlan("Question", 100, [action], [], async () => false, null, "en", {
      env: {},
      createClient: () => {
        clientCreated = true;
        return { createInteraction: async () => validReply };
      },
    }),
  );
  assert.equal(clientCreated, false);
});
