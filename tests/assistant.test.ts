import { test } from "node:test";
import assert from "node:assert/strict";
import { validateAssistantReply } from "../src/features/assistant/validate.ts";

test("assistant output accepts only known action references", () => {
  const good = JSON.stringify({
    answer: "Consider the plan.",
    referencedActionIds: ["check"],
    uncertainty: "Forecasts can change.",
  });
  assert.equal(
    validateAssistantReply(good, ["check"]).answer,
    "Consider the plan.",
  );
  assert.throws(() => validateAssistantReply(good, []));
  assert.throws(() => validateAssistantReply("not JSON", ["check"]));
  assert.throws(() =>
    validateAssistantReply(
      JSON.stringify({ answer: "", referencedActionIds: [], uncertainty: "" }),
      [],
    ),
  );
});
