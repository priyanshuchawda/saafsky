/** Gemini's supported JSON Schema subset; runtime limits remain in Zod. */
export const geminiResponseSchema = {
  type: "object",
  properties: {
    answer: { type: "string" },
    referencedActionIds: { type: "array", items: { type: "string" } },
    sourceIds: { type: "array", items: { type: "string" } },
    uncertainty: { type: "string" },
  },
  required: ["answer", "referencedActionIds", "sourceIds", "uncertainty"],
};
