"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { LocationSearch } from "@/components/location-search";
import { useCity, useHousehold } from "@/hooks/use-preferences";

type Reply = { answer: string; uncertainty: string; mode: "ai" | "fallback" };
type Turn = { question: string; reply: Reply };
export default function Assistant() {
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
    setStatus("Preparing your answer…");
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: text,
          latitude: city.latitude,
          longitude: city.longitude,
          profile,
          history: turns.slice(-2).flatMap((turn) => [
            { role: "user", text: turn.question.slice(0, 500) },
            { role: "assistant", text: turn.reply.answer.slice(0, 500) },
          ]),
        }),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error();
      const result: unknown = await response.json();
      if (
        !result ||
        typeof result !== "object" ||
        !("answer" in result) ||
        typeof result.answer !== "string" ||
        !("uncertainty" in result) ||
        typeof result.uncertainty !== "string" ||
        !("mode" in result) ||
        (result.mode !== "ai" && result.mode !== "fallback")
      )
        throw new Error("Invalid response");
      if (controller.signal.aborted) return;
      setTurns((previous) =>
        [
          ...previous,
          {
            question: text,
            reply: {
              answer: result.answer as string,
              uncertainty: result.uncertainty as string,
              mode: result.mode as Reply["mode"],
            },
          },
        ].slice(-5),
      );
      setQuestion("");
      setStatus("");
    } catch {
      if (!controller.signal.aborted)
        setStatus(
          "The assistant is unavailable. Please use the dashboard plan instead.",
        );
    }
  }
  return (
    <main id="main-content" tabIndex={-1} className="shell scenario">
      <header className="top">
        <Link className="brand" href="/">
          ✳ saafsky<span>.</span>
        </Link>
        <p>Ask about your air plan</p>
      </header>
      <p className="eyebrow">YOUR AIR ASSISTANT</p>
      <h1>
        Ask a <em>question.</em>
      </h1>
      <p className="lead">
        Get a short explanation using current modeled air quality and the
        rule-based plan.
      </p>
      <div className="toolbar">
        <LocationSearch
          onSelect={(city) => {
            setCity(city);
            clearConversation();
          }}
        />
        <div className="profile">
          <label htmlFor="sensitive">HOUSEHOLD</label>
          <select
            id="sensitive"
            value={profile.sensitive ? "yes" : "no"}
            onChange={(e) => {
              setProfile({ ...profile, sensitive: e.target.value === "yes" });
              clearConversation();
            }}
          >
            <option value="no">General guidance</option>
            <option value="yes">Sensitive household member</option>
          </select>
        </div>
      </div>
      <form
        className="plan scenario-result"
        onSubmit={submit}
        aria-label="Ask SaafSky"
      >
        <label htmlFor="question">
          YOUR QUESTION ABOUT {city.name.toUpperCase()}
        </label>
        <textarea
          id="question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          required
          minLength={1}
          maxLength={500}
          rows={4}
          placeholder="How should I plan an essential trip?"
        />
        <p className="fine">
          Do not enter names, medical history, or identifying details. If AI is
          enabled, your question, generalized sensitivity flag, current US AQI
          and selected actions are sent to Google; free-tier content may be used
          to improve its products. Up to two previous exchanges are sent for
          follow-up context. This app keeps conversation text in memory only
          until you leave or clear this page.
        </p>
        <button
          className="action-button"
          disabled={!!status && status.startsWith("Preparing")}
        >
          Ask SaafSky
        </button>
      </form>
      <section className="plan scenario-result" aria-live="polite">
        {status && <p>{status}</p>}
        {turns.map((turn, index) => (
          <div key={`${index}-${turn.question}`}>
            <p>
              <strong>You:</strong> {turn.question}
            </p>
            <p className="eyebrow">
              {turn.reply.mode === "ai"
                ? "AI EXPLANATION"
                : "RULE-BASED FALLBACK"}
            </p>
            <p>{turn.reply.answer}</p>
            <p className="fine">
              {turn.reply.uncertainty} AI can make mistakes. Follow existing
              medical advice and check official local conditions.
            </p>
          </div>
        ))}
        {turns.length > 0 && (
          <button
            className="action-button"
            type="button"
            onClick={clearConversation}
          >
            Clear conversation
          </button>
        )}
      </section>
      <footer>
        <Link href="/">← Back to dashboard</Link>
      </footer>
    </main>
  );
}
