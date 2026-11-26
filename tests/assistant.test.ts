import { test } from "node:test";
import assert from "node:assert/strict";
import {
  AssistantReplyValidationError,
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
  assert.throws(
    () => validateAssistantReply("not JSON", actions),
    AssistantReplyValidationError,
  );
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

test("assistant rejects numerical claims absent from trusted context", () => {
  const actions: Recommendation[] = [
    {
      id: "monitor-conditions",
      title: "Check current AQI",
      description: "Review the forecast.",
      priority: "low",
      category: "health",
      reasonCodes: ["available_air_data"],
      evidenceIds: ["airnow-aqi"],
    },
  ];
  const reply = {
    referencedActionIds: ["monitor-conditions"],
    sourceIds: ["airnow-aqi"],
    uncertainty: "Forecast estimates can change.",
  };

  assert.throws(
    () =>
      validateAssistantReply(
        JSON.stringify({ ...reply, answer: "The AQI is 42 today." }),
        actions,
        [120, "18:00"],
      ),
    AssistantReplyValidationError,
  );
  assert.throws(
    () =>
      validateAssistantReply(
        JSON.stringify({ ...reply, answer: "आज AQI ४२ है।" }),
        actions,
        [120],
      ),
    AssistantReplyValidationError,
  );
});

test("assistant accepts numerical claims that match trusted AQI and forecast data", () => {
  const actions: Recommendation[] = [
    {
      id: "monitor-conditions",
      title: "Check current AQI",
      description: "Review the forecast.",
      priority: "low",
      category: "health",
      reasonCodes: ["available_air_data"],
      evidenceIds: ["airnow-aqi"],
    },
  ];

  assert.equal(
    validateAssistantReply(
      JSON.stringify({
        answer: "The current AQI is 120; the lower forecast is at 18:00.",
        referencedActionIds: ["monitor-conditions"],
        sourceIds: ["airnow-aqi"],
        uncertainty: "Estimates can change.",
      }),
      actions,
      [120, "18:00"],
    ).answer,
    "The current AQI is 120; the lower forecast is at 18:00.",
  );
});

test("assistant rejects duplicate action or evidence references", () => {
  const actions: Recommendation[] = [
    {
      id: "monitor-conditions",
      title: "Check current AQI",
      description: "Review the forecast.",
      priority: "low",
      category: "health",
      reasonCodes: ["available_air_data"],
      evidenceIds: ["airnow-aqi"],
    },
  ];
  const reply = {
    answer: "Review current conditions.",
    referencedActionIds: ["monitor-conditions", "monitor-conditions"],
    sourceIds: ["airnow-aqi"],
    uncertainty: "Estimates can change.",
  };

  assert.throws(() => validateAssistantReply(JSON.stringify(reply), actions));
  assert.throws(() =>
    validateAssistantReply(
      JSON.stringify({
        ...reply,
        referencedActionIds: ["monitor-conditions"],
        sourceIds: ["airnow-aqi", "airnow-aqi"],
      }),
      actions,
    ),
  );
});
