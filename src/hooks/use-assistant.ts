"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import type { City } from "@/types/air";
import type { HouseholdProfile } from "@/features/recommendations/engine";
import { assistantResponseSchema } from "@/features/assistant/validate";
import { RateLimitError, throwIfHttpError } from "@/lib/api-errors";
import {
  translate,
  translateText,
  type Language,
} from "@/features/i18n/messages";

type Reply = {
  answer: string;
  uncertainty: string;
  mode: "ai" | "fallback";
  sourceIds: string[];
};
type Turn = { question: string; reply: Reply; language: Language };
export function useAssistant(
  city: City,
  profile: HouseholdProfile,
  language: Language,
) {
  const [question, setQuestion] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [status, setStatus] = useState("");
  const activeRequest = useRef<AbortController | null>(null);
  useEffect(() => () => activeRequest.current?.abort(), []);
  function clearConversation() {
    activeRequest.current?.abort();
    setTurns([]);
    setStatus("");
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = question.trim();
    if (!text) return;
    activeRequest.current?.abort();
    const controller = new AbortController();
    activeRequest.current = controller;
    setStatus(translate(language, "preparingAnswer"));
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: text,
          latitude: city.latitude,
          longitude: city.longitude,
          profile,
          language,
          history: turns.slice(-2).flatMap((turn) => [
            { role: "user", text: turn.question.slice(0, 500) },
            { role: "assistant", text: turn.reply.answer.slice(0, 500) },
          ]),
        }),
        signal: controller.signal,
      });
      throwIfHttpError(response);
      const result = assistantResponseSchema.parse(await response.json());
      if (controller.signal.aborted) return;
      setTurns((previous) =>
        [
          ...previous,
          {
            question: text,
            language,
            reply: {
              answer: result.answer,
              uncertainty: result.uncertainty,
              mode: result.mode,
              sourceIds: result.sourceIds,
            },
          },
        ].slice(-5),
      );
      setQuestion("");
      setStatus("");
    } catch (error) {
      if (!controller.signal.aborted)
        setStatus(
          error instanceof RateLimitError
            ? translateText(language, error.message)
            : translate(language, "assistantUnavailable"),
        );
    }
  }
  return { question, setQuestion, turns, status, clearConversation, submit };
}
