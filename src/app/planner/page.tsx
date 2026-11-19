"use client";

import Link from "next/link";
import { parseCommuteMode } from "@/features/preferences/commute";
import { useState } from "react";
import { DailyTimeline } from "@/components/planner/daily-timeline";
import { LocationSearch } from "@/components/location-search";
import { useAirQuality } from "@/hooks/use-air-quality";
import {
  findActivityWindow,
  nextForecastRange,
} from "@/features/planner/activity-window";
import { generateDailyPlan } from "@/features/planner/daily";
import { category, upcomingForecast } from "@/lib/air";
import { localMinuteAt } from "@/lib/freshness";
import { useCity, useHousehold, useLanguage } from "@/hooks/use-preferences";
import { displayCity } from "@/features/i18n/city";
import { translate, translateText } from "@/features/i18n/messages";

export default function Planner() {
  const [language] = useLanguage();
  const [city, setCity, cityReady] = useCity();
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [durationHours, setDurationHours] = useState(1);
  const [essential, setEssential] = useState(false);
  const [busyStart, setBusyStart] = useState("");
  const [busyEnd, setBusyEnd] = useState("");
  const [profile, setProfile] = useHousehold();
  const state = useAirQuality(cityReady ? city : null);
  const air = state.kind === "success" && state.fresh ? state.data : null;
  const localNow =
    state.kind === "success"
      ? localMinuteAt(state.checkedAt, state.data.timezone)
      : null;
  const hours =
    air && localNow
      ? upcomingForecast(air.hourly.time, air.hourly.us_aqi, localNow)
      : [];
  const suggestedRange = nextForecastRange(hours);
  const partialCommitment = Boolean(busyStart) !== Boolean(busyEnd);
  const invalidCommitment = Boolean(
    busyStart && busyEnd && busyEnd <= busyStart,
  );
  const result = findActivityWindow(hours, {
    start,
    end,
    durationHours,
    essential,
    sensitive: profile.sensitive || profile.children,
    busy: busyStart && busyEnd ? [{ start: busyStart, end: busyEnd }] : [],
  });
  const steps = generateDailyPlan(air?.current.us_aqi ?? null, profile);
  return (
    <main id="main-content" tabIndex={-1} className="shell scenario">
      <p className="eyebrow">{translate(language, "plannerEyebrow")}</p>
      <h1>
        {translate(language, "plannerTitle")}{" "}
        <em>{translate(language, "betterWindow")}</em>
      </h1>
      <p className="lead">{translate(language, "plannerLead")}</p>
      <div className="toolbar impact-form">
        <LocationSearch
          onSelect={(nextCity) => {
            setCity(nextCity);
            setStart("");
            setEnd("");
            setBusyStart("");
            setBusyEnd("");
          }}
        />
        <div className="profile">
          <label htmlFor="plan-profile">
            {translate(language, "household")}
          </label>
          <select
            id="plan-profile"
            value={profile.sensitive ? "sensitive" : "general"}
            onChange={(event) =>
              setProfile({
                ...profile,
                sensitive: event.target.value === "sensitive",
              })
            }
          >
            <option value="general">
              {translate(language, "generalGuidance")}
            </option>
            <option value="sensitive">
              {translate(language, "sensitiveHousehold")}
            </option>
          </select>
        </div>
        <div className="profile">
          <label htmlFor="plan-commute">
            {translate(language, "commuteLabel")}
          </label>
          <select
            id="plan-commute"
            value={profile.commute}
            onChange={(event) =>
              setProfile({
                ...profile,
                commute:
                  parseCommuteMode(event.target.value) ?? profile.commute,
              })
            }
          >
            <option value="none">{translate(language, "noneSelected")}</option>
            <option value="walk">{translate(language, "walk")}</option>
            <option value="bike">{translate(language, "bicycle")}</option>
            <option value="public">
              {translate(language, "publicTransport")}
            </option>
            <option value="car">{translate(language, "car")}</option>
          </select>
        </div>
        <div className="profile">
          <label htmlFor="window-start">
            {translate(language, "earliestTime")}
          </label>
          <input
            id="window-start"
            type="datetime-local"
            value={start}
            onChange={(event) => setStart(event.target.value)}
          />
        </div>
        <div className="profile">
          <label htmlFor="window-end">
            {translate(language, "latestTime")}
          </label>
          <input
            id="window-end"
            type="datetime-local"
            value={end}
            onChange={(event) => setEnd(event.target.value)}
          />
        </div>
        <div className="profile">
          <label htmlFor="activity-duration">
            {translate(language, "timeNeeded")}
          </label>
          <select
            id="activity-duration"
            value={durationHours}
            onChange={(event) => setDurationHours(Number(event.target.value))}
          >
            <option value={1}>{translate(language, "oneHour")}</option>
            <option value={2}>{translate(language, "twoHours")}</option>
            <option value={3}>{translate(language, "threeHours")}</option>
            <option value={4}>{translate(language, "fourHours")}</option>
          </select>
        </div>
        <div className="profile">
          <label htmlFor="activity-essential">
            {translate(language, "outingPostponed")}
          </label>
          <select
            id="activity-essential"
            value={essential ? "essential" : "flexible"}
            onChange={(event) =>
              setEssential(event.target.value === "essential")
            }
          >
            <option value="flexible">
              {translate(language, "flexibleYes")}
            </option>
            <option value="essential">
              {translate(language, "essentialNo")}
            </option>
          </select>
        </div>
        <div className="profile">
          <label htmlFor="busy-start">
            {translate(language, "commitmentStart")}
          </label>
          <input
            id="busy-start"
            type="datetime-local"
            value={busyStart}
            aria-describedby={
              invalidCommitment ? "busy-help busy-error" : "busy-help"
            }
            aria-invalid={invalidCommitment}
            onChange={(event) => setBusyStart(event.target.value)}
          />
        </div>
        <div className="profile">
          <label htmlFor="busy-end">
            {translate(language, "commitmentEnd")}
          </label>
          <input
            id="busy-end"
            type="datetime-local"
            value={busyEnd}
            aria-describedby={
              invalidCommitment ? "busy-help busy-error" : "busy-help"
            }
            aria-invalid={invalidCommitment}
            onChange={(event) => setBusyEnd(event.target.value)}
          />
        </div>
      </div>
      {suggestedRange && (
        <div className="planner-quick-range">
          <button
            className="action-button"
            type="button"
            onClick={() => {
              setStart(suggestedRange.start);
              setEnd(suggestedRange.end);
            }}
          >
            {translate(language, "useForecastRange")}
          </button>
          <p className="fine">{translate(language, "forecastRangeHelp")}</p>
        </div>
      )}
      <p id="busy-help" className="fine">
        {translate(language, "commitmentHelp")}
      </p>
      <DailyTimeline steps={steps} language={language} />
      <section className="plan scenario-result" aria-live="polite">
        <p className="eyebrow">
          {translate(language, "forecastFor")}{" "}
          {cityReady ? displayCity(city, language).toUpperCase() : "…"}
        </p>
        <h2>
          {translate(language, "availableWindow")}{" "}
          <em>{translate(language, "window")}</em>
        </h2>
        <p className="muted">
          {translate(language, "enterTimesIn")}{" "}
          {air?.timezone ?? translate(language, "localTime")}.{" "}
          {translate(language, "forecastWindowInputHint")}
        </p>
        {state.kind === "loading" && (
          <p>{translate(language, "loadingForecast")}</p>
        )}
        {state.kind === "error" && (
          <p>{translateText(language, state.message)}</p>
        )}
        {state.kind === "success" && !state.fresh && (
          <p>{translate(language, "forecastStale")}</p>
        )}
        {partialCommitment && (
          <p>{translate(language, "enterBothCommitmentTimes")}</p>
        )}
        {invalidCommitment && (
          <p id="busy-error">
            {translate(language, "commitmentEndAfterStart")}
          </p>
        )}
        {air &&
          !partialCommitment &&
          !invalidCommitment &&
          start &&
          end &&
          (result.kind === "available" || result.kind === "elevated" ? (
            <p>
              {result.kind === "elevated"
                ? translate(language, "allOptionsAboveThreshold")
                : translate(language, "lowestPeak")}{" "}
              <strong>
                {result.start.replace("T", " ")}–{result.end.replace("T", " ")}
              </strong>{" "}
              · {translate(language, "peakUsAqi")} {Math.round(result.peakAqi)}{" "}
              ({translateText(language, category(result.peakAqi))}).{" "}
              {translate(language, "estimateNotSafe")}
            </p>
          ) : result.kind === "no-suitable" ? (
            <p>{translate(language, "completeWindowsElevated")}</p>
          ) : (
            <p>{translate(language, "completeWindow")}</p>
          ))}
        <p className="fine">{translate(language, "plannerModelNote")}</p>
      </section>
      <footer>
        <Link href="/">{translate(language, "backDashboard")}</Link>
      </footer>
    </main>
  );
}
