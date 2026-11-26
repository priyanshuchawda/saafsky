import { z } from "zod";
import type { Recommendation } from "@/features/recommendations/engine";

export const assistantOutputSchema = z.object({
  answer: z.string().min(1).max(1800),
  referencedActionIds: z.array(z.string().min(1).max(80)).max(8),
  sourceIds: z.array(z.string().min(1).max(80)).max(8),
  uncertainty: z.string().max(400),
});
export const assistantResponseSchema = assistantOutputSchema.extend({
  mode: z.enum(["ai", "fallback"]),
});
export type AssistantExplanation = z.infer<typeof assistantOutputSchema>;
export type AssistantResponse = z.infer<typeof assistantResponseSchema>;

export type AssistantReplyValidationCode =
  | "invalid_json"
  | "duplicate_action_reference"
  | "duplicate_evidence_reference"
  | "unknown_action_reference"
  | "missing_evidence_reference"
  | "unknown_evidence_reference"
  | "unsupported_numeric_claim";

export class AssistantReplyValidationError extends Error {
  readonly code: AssistantReplyValidationCode;

  constructor(code: AssistantReplyValidationCode) {
    super("Assistant response failed trusted contract validation");
    this.name = "AssistantReplyValidationError";
    this.code = code;
  }
}

function normalizeNumerals(value: string): string {
  return value.replace(/[०-९]/g, (digit) =>
    String(digit.charCodeAt(0) - "०".charCodeAt(0)),
  );
}

function numericTokens(values: readonly (number | string)[]): Set<string> {
  const tokens = new Set<string>();
  for (const value of values) {
    for (const match of normalizeNumerals(String(value)).matchAll(
      /\b\d+(?:[.,]\d+)?\b/g,
    )) {
      tokens.add(match[0].replace(",", "."));
    }
  }
  return tokens;
}

export function validateAssistantReply(
  raw: string,
  actions: Recommendation[],
  trustedFacts: readonly (number | string)[] = [],
): AssistantExplanation {
  let decoded: unknown;
  try {
    decoded = JSON.parse(raw);
  } catch {
    throw new AssistantReplyValidationError("invalid_json");
  }
  const parsed = assistantOutputSchema.parse(decoded);
  if (
    new Set(parsed.referencedActionIds).size !==
    parsed.referencedActionIds.length
  )
    throw new AssistantReplyValidationError("duplicate_action_reference");
  if (new Set(parsed.sourceIds).size !== parsed.sourceIds.length)
    throw new AssistantReplyValidationError("duplicate_evidence_reference");
  const actionsById = new Map<string, Recommendation>(
    actions.map((action) => [action.id, action]),
  );
  if (parsed.referencedActionIds.some((id) => !actionsById.has(id)))
    throw new AssistantReplyValidationError("unknown_action_reference");
  const allowedSources = new Set<string>(
    parsed.referencedActionIds.flatMap(
      (id) => actionsById.get(id)?.evidenceIds ?? [],
    ),
  );
  if (allowedSources.size > 0 && parsed.sourceIds.length === 0)
    throw new AssistantReplyValidationError("missing_evidence_reference");
  if (parsed.sourceIds.some((id) => !allowedSources.has(id)))
    throw new AssistantReplyValidationError("unknown_evidence_reference");

  const approvedNumbers = numericTokens([
    ...trustedFacts,
    ...actions.flatMap((action) => [action.title, action.description]),
  ]);
  const generatedText = normalizeNumerals(
    `${parsed.answer} ${parsed.uncertainty}`,
  );
  const unsupportedNumber = [...generatedText.matchAll(/\b\d+(?:[.,]\d+)?\b/g)]
    .map(([token]) => token.replace(",", "."))
    .find((token) => !approvedNumbers.has(token));
  if (unsupportedNumber)
    throw new AssistantReplyValidationError("unsupported_numeric_claim");

  return parsed;
}
