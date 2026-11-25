import { test } from "node:test";
import assert from "node:assert/strict";
import { createAssistantReply } from "../src/features/assistant/orchestrate.ts";
import type { HouseholdProfile } from "../src/features/recommendations/engine.ts";
import { withModelFallback } from "../src/features/assistant/model-fallback.ts";
import type { ForecastContext } from "../src/features/assistant/forecast-context.ts";

const profile: HouseholdProfile = {
  sensitive: true,
  children: false,
  outdoorExercise: true,
  commute: "walk",
  cookingSmoke: false,
};

const airContext = (aqi: number | null) => ({ aqi, forecast: null });

test("missing air data gives conservative guidance without spending AI quota", async () => {
  let budgetChecks = 0;
  const reply = await createAssistantReply(profile, {
    getAirContext: async () => {
      throw new Error("provider down");
    },
    aiConfigured: true,
    checkAiBudget: async () => {
      budgetChecks++;
      return true;
    },
    explain: async () => {
      throw new Error("must not be called");
    },
  });
  assert.equal(reply.mode, "fallback");
  assert.deepEqual(reply.referencedActionIds, [
    "air-unavailable",
    "indoor-smoke",
  ]);
  assert.deepEqual(reply.sourceIds, ["airnow-aqi", "epa-indoor"]);
  assert.match(reply.uncertainty, /cannot answer your specific question/);
  assert.equal(budgetChecks, 0);
});

test("budget failures and model failures retain personalized fallback guidance", async () => {
  for (const checkAiBudget of [
    async () => false,
    async () => {
      throw new Error("quota unavailable");
    },
    async () => true,
  ]) {
    const reply = await createAssistantReply(profile, {
      getAirContext: async () => airContext(180),
      aiConfigured: true,
      checkAiBudget,
      explain: async () => {
        throw new Error("model unavailable");
      },
    });
    assert.equal(reply.mode, "fallback");
    assert.ok(reply.referencedActionIds.includes("reduce-outdoor-exertion"));
    assert.match(reply.uncertainty, /may not answer your specific question/);
  }
});

test("assistant fallbacks report only the failing service boundary", async () => {
  const failures: string[] = [];
  const onFailure = (service: string) => failures.push(service);

  await createAssistantReply(profile, {
    getAirContext: async () => {
      throw new Error("private provider response");
    },
    aiConfigured: true,
    checkAiBudget: async () => true,
    explain: async () => {
      throw new Error("must not be called");
    },
    onFailure,
  });
  assert.deepEqual(failures, ["air"]);

  failures.length = 0;
  await createAssistantReply(profile, {
    getAirContext: async () => airContext(180),
    aiConfigured: true,
    checkAiBudget: async () => {
      throw new Error("private Redis response");
    },
    explain: async () => {
      throw new Error("must not be called");
    },
    onFailure,
  });
  assert.deepEqual(failures, ["rate_limit"]);

  failures.length = 0;
  await createAssistantReply(profile, {
    getAirContext: async () => airContext(180),
    aiConfigured: true,
    checkAiBudget: async () => true,
    explain: async () => {
      throw new Error("private model response");
    },
    onFailure,
  });
  assert.deepEqual(failures, ["gemini"]);
  assert.doesNotMatch(failures.join(" "), /private/);
});

test("AI explanations receive rule-selected actions and appear only within budget", async () => {
  const reply = await createAssistantReply(profile, {
    getAirContext: async () => airContext(180),
    aiConfigured: true,
    checkAiBudget: async () => true,
    explain: async (context, actions) => {
      assert.equal(context.aqi, 180);
      assert.ok(
        actions.some((action) => action.id === "reduce-outdoor-exertion"),
      );
      return {
        answer: "Consider an indoor alternative.",
        referencedActionIds: ["reduce-outdoor-exertion"],
        sourceIds: ["airnow-aqi"],
        uncertainty: "Forecasts can change.",
      };
    },
  });
  assert.equal(reply.mode, "ai");
  assert.equal(reply.answer, "Consider an indoor alternative.");
  assert.deepEqual(reply.sourceIds, ["airnow-aqi"]);
});

test("AI explanation receives the forecast together with its validated AQI context", async () => {
  const forecast = {
    timezone: "Asia/Kolkata",
    hours: [{ time: "2026-11-26T18:00", aqi: 130 }],
  };
  let receivedForecast: ForecastContext | null = null;
  const reply = await createAssistantReply(profile, {
    getAirContext: async () => ({ aqi: 120, forecast }),
    aiConfigured: true,
    checkAiBudget: async () => true,
    explain: async (context) => {
      assert.equal(context.aqi, 120);
      receivedForecast = context.forecast;
      return {
        answer: "Compare the available forecast hours.",
        referencedActionIds: [],
        sourceIds: [],
        uncertainty: "Estimates can change.",
      };
    },
  });

  assert.equal(reply.mode, "ai");
  assert.deepEqual(receivedForecast, forecast);
});

test("concurrent assistant attempts respect a shared simulated AI budget", async () => {
  let remaining = 4;
  let modelCalls = 0;
  const reserve = async () => {
    if (remaining === 0) return false;
    remaining--;
    return true;
  };
  const responses = await Promise.all(
    Array.from({ length: 10 }, () =>
      createAssistantReply(profile, {
        getAirContext: async () => airContext(180),
        aiConfigured: true,
        checkAiBudget: reserve,
        explain: async () =>
          withModelFallback(
            "first",
            "second",
            async (model) => {
              modelCalls++;
              if (model === "first")
                throw Object.assign(new Error("unavailable"), { status: 429 });
              return {
                answer: "Review conditions.",
                referencedActionIds: [],
                sourceIds: [],
                uncertainty: "",
              };
            },
            reserve,
          ),
      }),
    ),
  );
  assert.equal(remaining, 0);
  assert.equal(modelCalls, 4);
  assert.ok(responses.every((response) => response.mode === "fallback"));
});

test("an alternate model requires its own simulated budget reservation", async () => {
  let remaining = 2;
  let calls = 0;
  const reserve = async () => {
    if (remaining === 0) return false;
    remaining--;
    return true;
  };
  const response = await createAssistantReply(profile, {
    getAirContext: async () => airContext(180),
    aiConfigured: true,
    checkAiBudget: reserve,
    explain: async () =>
      withModelFallback(
        "first",
        "second",
        async (model) => {
          calls++;
          if (model === "first")
            throw Object.assign(new Error("unavailable"), { status: 503 });
          return {
            answer: "Review conditions.",
            referencedActionIds: [],
            sourceIds: [],
            uncertainty: "",
          };
        },
        reserve,
      ),
  });
  assert.equal(response.mode, "ai");
  assert.equal(calls, 2);
  assert.equal(remaining, 0);
});
