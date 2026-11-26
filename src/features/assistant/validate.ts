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
  | "unsupported_numeric_claim"
  | "unsupported_qualitative_claim";

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

const SPELLED_NUMBERS = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
  "thirteen",
  "fourteen",
  "fifteen",
  "sixteen",
  "seventeen",
  "eighteen",
  "nineteen",
  "twenty",
  "thirty",
  "forty",
  "fifty",
  "sixty",
  "seventy",
  "eighty",
  "ninety",
  "hundred",
  "thousand",
  "million",
  "शून्य",
  "एक",
  "दो",
  "तीन",
  "चार",
  "पांच",
  "पाँच",
  "छह",
  "छः",
  "सात",
  "आठ",
  "नौ",
  "दस",
  "ग्यारह",
  "बारह",
  "तेरह",
  "चौदह",
  "पंद्रह",
  "पन्द्रह",
  "सोलह",
  "सत्रह",
  "अठारह",
  "उन्नीस",
  "बीस",
  "तीस",
  "चालीस",
  "पचास",
  "साठ",
  "सत्तर",
  "अस्सी",
  "नब्बे",
  "सौ",
  "हजार",
  "हज़ार",
  "लाख",
  "करोड़",
] as const;
const NUMBER_WORD = `(?:${SPELLED_NUMBERS.join("|")})`;
const NUMBER_SEQUENCE = `(?<!\\p{L})${NUMBER_WORD}(?:[\\s-]+${NUMBER_WORD}){0,4}(?!\\p{L})`;
const NUMERIC_CONTEXT =
  "(?:AQI|PM(?:2(?:\\.5)?|10)|index|pollution level|forecast peak|peak|hours?|minutes?|seconds?|days?|weeks?|months?|years?|percent(?:age)?|kilometers?|kilometres?|km|miles?|degrees?|people|children|times|am|pm|o'clock|एक्यूआई|पीएम(?:२\\.?५|१०)?|घंटे?|मिनट|सेकंड|दिन|हफ्ते?|सप्ताह|प्रतिशत|किलोमीटर|मीटर|लोग|बच्चे|बार)";
const SPOKEN_NUMERIC_CLAIM = new RegExp(
  `(?:${NUMBER_SEQUENCE}\\s*${NUMERIC_CONTEXT}|(?:AQI|PM(?:2(?:\\.5)?|10)|index|pollution level|forecast peak|peak)[^.!?।\\n]{0,36}${NUMBER_SEQUENCE}|\\b(?:at|around|about|approximately|roughly|after|before)\\s+${NUMBER_SEQUENCE}\\s*(?:am|pm|o'clock))`,
  "iu",
);
const ABSOLUTE_SAFETY_CLAIM =
  /\b(?:is|are|remains|will be|always)\s+(?:(?:perfectly|completely)\s+)?safe\b|\bsafely\s+(?:cycle|ride|run|walk|exercise|commute|ventilate)\b/i;
const UNSOURCED_EFFICACY_CLAIM =
  /\b(?:guarantees?|cures?|prevents?|eliminates?)\b/i;
const PRODUCT_OR_HOUSEHOLD_CLAIM =
  /\b(?:n95|masks?|air purifiers?|houseplants?|plants?)\b/i;

export function validateAssistantReply(
  raw: string,
  actions: Recommendation[],
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

  const generatedText = normalizeNumerals(
    `${parsed.answer} ${parsed.uncertainty}`,
  );
  if (
    /\b\d+(?:[.,:]\d+)*\b/.test(generatedText) ||
    SPOKEN_NUMERIC_CLAIM.test(generatedText)
  )
    throw new AssistantReplyValidationError("unsupported_numeric_claim");

  const approvedActionText = parsed.referencedActionIds
    .map((id) => {
      const action = actionsById.get(id);
      return action ? `${action.title} ${action.description}` : "";
    })
    .join(" ");
  if (
    ABSOLUTE_SAFETY_CLAIM.test(generatedText) ||
    UNSOURCED_EFFICACY_CLAIM.test(generatedText) ||
    (PRODUCT_OR_HOUSEHOLD_CLAIM.test(generatedText) &&
      !PRODUCT_OR_HOUSEHOLD_CLAIM.test(approvedActionText))
  )
    throw new AssistantReplyValidationError("unsupported_qualitative_claim");

  return parsed;
}
