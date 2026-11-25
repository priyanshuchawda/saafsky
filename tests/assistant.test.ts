import { test } from "node:test";
import assert from "node:assert/strict";
import {
  assistantResponseSchema,
  validateAssistantReply,
} from "../src/features/assistant/validate.ts";
import type { Recommendation } from "../src/features/recommendations/engine.ts";

test("assistant output accepts only action-linked evidence references", () => {
  const actions: Recommendation[] = [
    {
      id: "monitor-conditions",
      title: "Check conditions",
      description: "Review the forecast.",
      priority: "low" as const,
      category: "health" as const,
      reasonCodes: ["available_air_data"],
      evidenceIds: ["airnow-aqi"],
    },
  ];
  const good = JSON.stringify({
    answer: "Consider the plan.",
    referencedActionIds: ["monitor-conditions"],
    sourceIds: ["airnow-aqi"],
    uncertainty: "Forecasts can change.",
  });
  assert.equal(
    validateAssistantReply(good, actions).answer,
    "Consider the plan.",
  );
  assert.throws(() => validateAssistantReply(good, []));
  assert.throws(() =>
    validateAssistantReply(
      JSON.stringify({ ...JSON.parse(good), sourceIds: ["epa-indoor"] }),
      actions,
    ),
  );
  assert.throws(() =>
    validateAssistantReply(
      JSON.stringify({ ...JSON.parse(good), sourceIds: [] }),
      actions,
    ),
  );
  assert.throws(() => validateAssistantReply("not JSON", actions));
  assert.throws(() =>
    validateAssistantReply(
      JSON.stringify({
        answer: "",
        referencedActionIds: [],
        sourceIds: [],
        uncertainty: "",
      }),
      actions,
    ),
  );
});

test("browser assistant responses require a known mode and structured output", () => {
  assert.equal(
    assistantResponseSchema.safeParse({
      answer: "Check the forecast.",
      uncertainty: "Estimates vary.",
      referencedActionIds: [],
      sourceIds: [],
      mode: "fallback",
    }).success,
    true,
  );
  assert.equal(
    assistantResponseSchema.safeParse({
      answer: "Check the forecast.",
      mode: "unknown",
    }).success,
    false,
  );
});

test("assistant rejects forged references and oversized generated text", () => {
  const actions: Recommendation[] = [
    {
      id: "monitor-conditions",
      title: "Check",
      description: "Review conditions.",
      priority: "low",
      category: "health",
      reasonCodes: ["available_air_data"],
      evidenceIds: ["airnow-aqi"],
    },
  ];
  const reply = {
    answer: "Check conditions.",
    referencedActionIds: ["monitor-conditions"],
    sourceIds: ["airnow-aqi"],
    uncertainty: "",
  };
  for (const forged of [
    "__proto__",
    "constructor",
    "<script>alert(1)</script>",
  ]) {
    assert.throws(() =>
      validateAssistantReply(
        JSON.stringify({ ...reply, referencedActionIds: [forged] }),
        actions,
      ),
    );
    assert.throws(() =>
      validateAssistantReply(
        JSON.stringify({ ...reply, sourceIds: [forged] }),
        actions,
      ),
    );
  }
  assert.throws(() =>
    validateAssistantReply(
      JSON.stringify({ ...reply, answer: "x".repeat(1801) }),
      actions,
    ),
  );
});
