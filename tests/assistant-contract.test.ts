import { test } from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";
import { assistantOutputSchema } from "../src/features/assistant/validate.ts";
import { geminiResponseSchema } from "../src/features/assistant/response-format.ts";

test("Gemini output shape stays aligned with runtime validation", () => {
  const runtime = z.toJSONSchema(assistantOutputSchema);
  assert.equal(runtime.type, geminiResponseSchema.type);
  assert.deepEqual(
    Object.keys(runtime.properties ?? {}).sort(),
    Object.keys(geminiResponseSchema.properties).sort(),
  );
  assert.deepEqual(
    [...(runtime.required ?? [])].sort(),
    [...geminiResponseSchema.required].sort(),
  );
  for (const [key, expected] of Object.entries(
    geminiResponseSchema.properties,
  )) {
    const actual = runtime.properties?.[key];
    assert.ok(actual && typeof actual === "object");
    assert.equal(actual.type, expected.type, key);
    if ("items" in expected) {
      assert.ok(
        actual.items &&
          typeof actual.items === "object" &&
          !Array.isArray(actual.items),
      );
      assert.equal(actual.items.type, expected.items.type, key);
    }
  }
});
