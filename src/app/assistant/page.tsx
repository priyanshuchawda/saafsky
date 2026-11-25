"use client";
import Link from "next/link";
import { useAssistant } from "@/hooks/use-assistant";
import { LocationSearch } from "@/components/location-search";
import { findEvidence } from "@/features/recommendations/evidence";
import { useCity, useHousehold, useLanguage } from "@/hooks/use-preferences";
import { displayCity } from "@/features/i18n/city";
import { translate } from "@/features/i18n/messages";

export default function Assistant() {
  const [language] = useLanguage();
  const [city, setCity, cityReady] = useCity();
  const [profile, setProfile] = useHousehold();
  const {
    question,
    setQuestion,
    turns,
    status,
    isPending,
    clearConversation,
    submit,
  } = useAssistant(city, profile, language);
  return (
    <main id="main-content" tabIndex={-1} className="shell scenario">
      <p className="eyebrow">{translate(language, "airAssistant")}</p>
      <h1>
        {translate(language, "askQuestion")}{" "}
        <em>{translate(language, "question")}</em>
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
            <option value="yes">
              {translate(language, "sensitiveHousehold")}
            </option>
          </select>
        </div>
      </div>
      <form
        className="plan scenario-result"
        onSubmit={submit}
        aria-label={translate(language, "assistant")}
      >
        <label htmlFor="question">
          {translate(language, "questionAbout")}{" "}
          {cityReady ? displayCity(city, language).toUpperCase() : "…"}
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
        <button className="action-button" aria-disabled={isPending}>
          {translate(language, "askSaafSky")}
        </button>
      </form>
      <p
        id="assistant-announcement"
        className="sr-only"
        role="status"
        aria-live="polite"
        lang={status ? language : (turns.at(-1)?.language ?? language)}
      >
        {status || turns.at(-1)?.reply.answer || ""}
      </p>
      {(status || turns.length > 0) && (
        <section className="plan scenario-result">
          {status && <p>{status}</p>}
          {turns.map((turn, index) => (
            <div key={`${index}-${turn.question}`} lang={turn.language}>
              <p>
                <strong>{translate(turn.language, "you")}</strong>{" "}
                {turn.question}
              </p>
              <p className="eyebrow">
                {turn.reply.mode === "ai"
                  ? translate(turn.language, "aiExplanation")
                  : translate(turn.language, "ruleBasedFallback")}
              </p>
              <p>{turn.reply.answer}</p>
              {turn.reply.sourceIds.length > 0 && (
                <details className="action-reason">
                  <summary>
                    {translate(turn.language, "sourcesForAnswer")}
                  </summary>
                  <ul>
                    {turn.reply.sourceIds.map((sourceId) => {
                      const source = findEvidence(sourceId);
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
        <Link href="/">{translate(language, "backDashboard")}</Link>
      </footer>
    </main>
  );
}
