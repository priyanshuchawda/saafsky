"use client";
import Link from "next/link";
import { useState } from "react";
import type { FormEvent } from "react";
import { LocationSearch } from "@/components/location-search";
import { useCity, useHousehold } from "@/hooks/use-preferences";

type Reply = { answer: string; uncertainty: string; mode: "ai" | "fallback" };
export default function Assistant() {
  const [city, setCity] = useCity();
  const [profile, setProfile] = useHousehold();
  const [question, setQuestion] = useState("");
  const [reply, setReply] = useState<Reply | null>(null);
  const [status, setStatus] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setReply(null);
    setStatus("Preparing your answer…");
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          latitude: city.latitude,
          longitude: city.longitude,
          profile,
        }),
      });
      if (!response.ok) throw new Error();
      setReply((await response.json()) as Reply);
      setStatus("");
    } catch {
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
            setReply(null);
          }}
        />
        <div className="profile">
          <label htmlFor="sensitive">HOUSEHOLD</label>
          <select
            id="sensitive"
            value={profile.sensitive ? "yes" : "no"}
            onChange={(e) =>
              setProfile({ ...profile, sensitive: e.target.value === "yes" })
            }
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
          to improve its products. No chat history is stored by this app.
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
        {reply && (
          <>
            <p className="eyebrow">
              {reply.mode === "ai" ? "AI EXPLANATION" : "RULE-BASED FALLBACK"}
            </p>
            <p>{reply.answer}</p>
            <p className="fine">
              {reply.uncertainty} AI can make mistakes. Follow existing medical
              advice and check official local conditions.
            </p>
          </>
        )}
      </section>
      <footer>
        <Link href="/">← Back to dashboard</Link>
      </footer>
    </main>
  );
}
