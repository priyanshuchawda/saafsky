"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { LocationSearch } from "@/components/location-search";
import { evidenceCatalog } from "@/features/recommendations/evidence";
import { assistantResponseSchema } from "@/features/assistant/validate";
import { RateLimitError, throwIfHttpError } from "@/lib/api-errors";
import { useCity, useHousehold, useLanguage } from "@/hooks/use-preferences";
import { translate, translateText, type Language } from "@/features/i18n/messages";

type Reply = {
  answer: string;
  uncertainty: string;
  mode: "ai" | "fallback";
  sourceIds: string[];
};
type Turn = { question: string; reply: Reply; language: Language };
export default function Assistant() {
  const [language] = useLanguage();
  const [city, setCity] = useCity();
  const [profile, setProfile] = useHousehold();
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
  return (
    <main id="main-content" tabIndex={-1} className="shell scenario">
      <p className="eyebrow">{translate(language, "airAssistant")}</p>
      <h1>
        {translate(language, "askQuestion")} <em>{translate(language, "question")}</em>
      </h1>
      <p className="lead">{translate(language, "assistantLead")}</p>
      <div className="toolbar">
        <LocationSearch
          onSelect={(city) => {
            setCity(city);
            clearConversation();
          }}
        />
        <div className="profile">
          <label htmlFor="sensitive">{translate(language, "household")}</label>
          <select
            id="sensitive"
            value={profile.sensitive ? "yes" : "no"}
            onChange={(e) => {
              setProfile({ ...profile, sensitive: e.target.value === "yes" });
              clearConversation();
            }}
          >
            <option value="no">{translate(language, "generalGuidance")}</option>
            <option value="yes">{translate(language, "sensitiveHousehold")}</option>
          </select>
        </div>
      </div>
      <form
        className="plan scenario-result"
        onSubmit={submit}
        aria-label={translate(language, "assistant")}
      >
        <label htmlFor="question">
          {translate(language, "questionAbout")} {city.name.toUpperCase()}
        </label>
        <textarea
          id="question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          required
          minLength={1}
          maxLength={500}
          rows={4}
          placeholder={translate(language, "commuteQuestionPlaceholder")}
        />
        <button
          className="action-button"
          disabled={status === translate(language, "preparingAnswer")}
        >
          {translate(language, "askSaafSky")}
        </button>
      </form>
      {(status || turns.length > 0) && (
        <section className="plan scenario-result" aria-live="polite">
          {status && <p>{status}</p>}
          {turns.map((turn, index) => (
            <div key={`${index}-${turn.question}`} lang={turn.language}>
              <p>
                <strong>{translate(turn.language, "you")}</strong> {turn.question}
              </p>
              <p className="eyebrow">
                {turn.reply.mode === "ai"
                  ? translate(turn.language, "aiExplanation")
                  : translate(turn.language, "ruleBasedFallback")}
              </p>
              <p>{turn.reply.answer}</p>
              {turn.reply.sourceIds.length > 0 && (
                <details className="action-reason">
                  <summary>{translate(turn.language, "sourcesForAnswer")}</summary>
                  <ul>
                    {turn.reply.sourceIds.map((sourceId) => {
                      const source = evidenceCatalog[sourceId];
                      return source ? (
                        <li key={sourceId}>
                          <a href={source.url}>{source.label}</a>
                        </li>
                      ) : null;
                    })}
                  </ul>
                </details>
              )}
              <p className="fine">
                {turn.reply.uncertainty} {translate(turn.language, "aiCaveat")}
              </p>
            </div>
          ))}
          {turns.length > 0 && (
            <button
              className="action-button"
              type="button"
              onClick={clearConversation}
            >
              {translate(language, "clearConversation")}
            </button>
          )}
        </section>
      )}
      <footer>
        <Link href="/">← Back to dashboard</Link>
      </footer>
    </main>
  );
}
