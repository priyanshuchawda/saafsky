import { test } from "node:test";
import assert from "node:assert/strict";
import { createAssistantReply } from "../src/features/assistant/orchestrate.ts";
import type { HouseholdProfile } from "../src/features/recommendations/engine.ts";

const profile: HouseholdProfile = {
  sensitive: true,
  children: false,
  outdoorExercise: true,
  commute: "walk",
  cookingSmoke: false,
};

test("missing air data gives conservative guidance without spending AI quota", async () => {
  let budgetChecks = 0;
  const reply = await createAssistantReply(profile, {
    getAqi: async () => {
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
  assert.deepEqual(reply.referencedActionIds, ["air-unavailable"]);
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
      getAqi: async () => 180,
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

test("AI explanations receive rule-selected actions and appear only within budget", async () => {
  const reply = await createAssistantReply(profile, {
    getAqi: async () => 180,
    aiConfigured: true,
    checkAiBudget: async () => true,
    explain: async (aqi, actions) => {
      assert.equal(aqi, 180);
      assert.ok(
        actions.some((action) => action.id === "reduce-outdoor-exertion"),
      );
      return {
        answer: "Consider an indoor alternative.",
        referencedActionIds: ["reduce-outdoor-exertion"],
        uncertainty: "Forecasts can change.",
      };
    },
  });
  assert.equal(reply.mode, "ai");
  assert.equal(reply.answer, "Consider an indoor alternative.");
});
