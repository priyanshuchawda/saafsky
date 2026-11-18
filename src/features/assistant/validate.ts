import { z } from "zod";
import type { Recommendation } from "@/features/recommendations/engine";

const outputSchema = z.object({
  answer: z.string().min(1).max(1800),
  referencedActionIds: z.array(z.string().min(1).max(80)).max(8),
  sourceIds: z.array(z.string().min(1).max(80)).max(8),
  uncertainty: z.string().max(400),
});
export const assistantResponseSchema = outputSchema.extend({
  mode: z.enum(["ai", "fallback"]),
});
export function validateAssistantReply(
  raw: string,
  actions: Recommendation[],
): z.infer<typeof outputSchema> {
  const parsed = outputSchema.parse(JSON.parse(raw));
  const actionsById = new Map(actions.map((action) => [action.id, action]));
  if (parsed.referencedActionIds.some((id) => !actionsById.has(id)))
    throw new Error("Unknown action reference");
  const allowedSources = new Set(
    parsed.referencedActionIds.flatMap(
      (id) => actionsById.get(id)?.evidenceIds ?? [],
    ),
  );
  if (allowedSources.size > 0 && parsed.sourceIds.length === 0)
    throw new Error("Missing evidence reference");
  if (parsed.sourceIds.some((id) => !allowedSources.has(id)))
    throw new Error("Unknown evidence reference");
  return parsed;
}
