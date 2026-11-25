"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import type { City } from "@/types/air";
import type { HouseholdProfile } from "@/features/recommendations/engine";
import { assistantResponseSchema } from "@/features/assistant/validate";
import type { AssistantResponse } from "@/features/assistant/validate";
import { RateLimitError, throwIfHttpError } from "@/lib/api-errors";
import { translate, type Language } from "@/features/i18n/messages";
import { localizeRateLimit } from "@/features/i18n/errors";

type Reply = Pick<
  AssistantResponse,
  "answer" | "uncertainty" | "mode" | "sourceIds"
>;
type Turn = { question: string; reply: Reply; language: Language };
type RequestStatus =
  | { kind: "idle" }
  | { kind: "pending" }
  | { kind: "error"; rateLimit: RateLimitError | null };
export function useAssistant(
  city: City,
  profile: HouseholdProfile,
  language: Language,
) {
  const [question, setQuestion] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [requestStatus, setRequestStatus] = useState<RequestStatus>({
    kind: "idle",
  });
  const status =
    requestStatus.kind === "pending"
      ? translate(language, "preparingAnswer")
      : requestStatus.kind === "error"
        ? requestStatus.rateLimit
          ? localizeRateLimit(language, requestStatus.rateLimit)
          : translate(language, "assistantUnavailable")
        : "";
  const activeRequest = useRef<AbortController | null>(null);
  useEffect(() => () => activeRequest.current?.abort(), []);
  function clearConversation() {
    activeRequest.current?.abort();
    activeRequest.current = null;
    setTurns([]);
    setRequestStatus({ kind: "idle" });
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (activeRequest.current) return;
    const text = question.trim();
    if (!text) return;
    const controller = new AbortController();
    activeRequest.current = controller;
    setRequestStatus({ kind: "pending" });
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
      setRequestStatus({ kind: "idle" });
    } catch (error) {
      if (!controller.signal.aborted)
        setRequestStatus({
          kind: "error",
          rateLimit: error instanceof RateLimitError ? error : null,
        });
    } finally {
      if (activeRequest.current === controller) activeRequest.current = null;
    }
  }
  return {
    question,
    setQuestion,
    turns,
    status,
    isPending: requestStatus.kind === "pending",
    clearConversation,
    submit,
  };
}
