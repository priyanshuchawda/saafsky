import { z } from "zod";

const outputSchema = z.object({
  answer: z.string().min(1).max(1800),
  referencedActionIds: z.array(z.string()).max(8),
  uncertainty: z.string().max(400),
});
export const assistantResponseSchema = outputSchema.extend({
  mode: z.enum(["ai", "fallback"]),
});
export function validateAssistantReply(
  raw: string,
  actionIds: string[],
): z.infer<typeof outputSchema> {
  const parsed = outputSchema.parse(JSON.parse(raw));
  const allowed = new Set(actionIds);
  if (parsed.referencedActionIds.some((id) => !allowed.has(id)))
    throw new Error("Unknown action reference");
  return parsed;
}
