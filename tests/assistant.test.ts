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
      ),
    AssistantReplyValidationError,
  );
  assert.throws(
    () =>
      validateAssistantReply(
        JSON.stringify({ ...reply, answer: "आज AQI ४२ है।" }),
        actions,
      ),
    AssistantReplyValidationError,
  );
});

test("assistant rejects numbers even when they match trusted values", () => {
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

  assert.throws(
    () =>
      validateAssistantReply(
        JSON.stringify({
          answer: "The current AQI is 120; the lower forecast is at 18:00.",
          referencedActionIds: ["monitor-conditions"],
          sourceIds: ["airnow-aqi"],
          uncertainty: "Estimates can change.",
        }),
        actions,
      ),
    AssistantReplyValidationError,
  );
});

test("assistant rejects spelled-out numeric claims in English and Hindi", () => {
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

  for (const answer of [
    "The AQI is one hundred twenty today.",
    "The peak is at five thirty PM.",
    "This may last for three hours.",
    "आज AQI एक सौ बीस है।",
    "यह स्थिति तीन घंटे रह सकती है।",
  ]) {
    assert.throws(
      () =>
        validateAssistantReply(JSON.stringify({ ...reply, answer }), actions),
      AssistantReplyValidationError,
      answer,
    );
  }

  assert.equal(
    validateAssistantReply(
      JSON.stringify({
        ...reply,
        answer: "One helpful step is to review the forecast.",
      }),
      actions,
    ).answer,
    "One helpful step is to review the forecast.",
  );
});

test("assistant rejects unsupported qualitative safety and product claims", () => {
  const actions: Recommendation[] = [
    {
      id: "monitor-conditions",
      title: "Check current conditions",
      description: "Review the forecast before flexible outdoor activity.",
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

  for (const answer of [
    "Cycling is safe during rush hour.",
    "An N95 mask guarantees clean air.",
    "Houseplants eliminate indoor smoke.",
  ]) {
    assert.throws(
      () =>
        validateAssistantReply(JSON.stringify({ ...reply, answer }), actions),
      AssistantReplyValidationError,
      answer,
    );
  }
  assert.equal(
    validateAssistantReply(
      JSON.stringify({
        ...reply,
        answer: "Review the forecast before going out.",
      }),
      actions,
    ).answer,
    "Review the forecast before going out.",
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
