"use client";

import Link from "next/link";
import { useState } from "react";
import { DailyTimeline } from "@/components/planner/daily-timeline";
import { PlannerControls } from "@/components/planner/planner-controls";
import { PlannerWindowResult } from "@/components/planner/planner-window-result";
import { generateDailyPlan } from "@/features/planner/daily";
import {
  findActivityWindow,
  nextForecastRange,
} from "@/features/planner/activity-window";
import { useAirQuality } from "@/hooks/use-air-quality";
import { useCity, useHousehold, useLanguage } from "@/hooks/use-preferences";
import { upcomingForecast } from "@/lib/air";
import { localMinuteAt } from "@/lib/freshness";
import { translate } from "@/features/i18n/messages";

export default function Planner() {
  const [language] = useLanguage();
  const [city, setCity, cityReady] = useCity();
  const [profile, setProfile] = useHousehold();
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [durationHours, setDurationHours] = useState(1);
  const [essential, setEssential] = useState(false);
  const [busyStart, setBusyStart] = useState("");
  const [busyEnd, setBusyEnd] = useState("");
  const { state } = useAirQuality(cityReady ? city : null);
  const air = state.kind === "success" && state.fresh ? state.data : null;
  const localNow =
    state.kind === "success"
      ? localMinuteAt(state.checkedAt, state.data.timezone)
      : null;
  const forecastHours =
    air && localNow
      ? upcomingForecast(air.hourly.time, air.hourly.us_aqi, localNow)
      : [];
  const suggestedRange = nextForecastRange(forecastHours);
  const partialCommitment = Boolean(busyStart) !== Boolean(busyEnd);
  const invalidCommitment = Boolean(
    busyStart && busyEnd && busyEnd <= busyStart,
  );
  const result = findActivityWindow(forecastHours, {
    start,
    end,
    durationHours,
    essential,
    sensitive: profile.sensitive || profile.children,
    busy: busyStart && busyEnd ? [{ start: busyStart, end: busyEnd }] : [],
  });
  const steps = generateDailyPlan(air?.current.us_aqi ?? null, profile);

  function handleCitySelect(nextCity: NonNullable<typeof city>) {
    setCity(nextCity);
    setStart("");
    setEnd("");
    setBusyStart("");
    setBusyEnd("");
  }

  return (
    <main id="main-content" tabIndex={-1} className="shell scenario">
      <p className="eyebrow">{translate(language, "plannerEyebrow")}</p>
      <h1>
        {translate(language, "plannerTitle")}{" "}
        <em>{translate(language, "betterWindow")}</em>
      </h1>
      <p className="lead">{translate(language, "plannerLead")}</p>
      <PlannerControls
        language={language}
        profile={profile}
        onProfileChange={setProfile}
        onCitySelect={handleCitySelect}
        start={start}
        onStartChange={setStart}
        end={end}
        onEndChange={setEnd}
        durationHours={durationHours}
        onDurationChange={setDurationHours}
        essential={essential}
        onEssentialChange={setEssential}
        busyStart={busyStart}
        onBusyStartChange={setBusyStart}
        busyEnd={busyEnd}
        onBusyEndChange={setBusyEnd}
        suggestedRange={suggestedRange}
        onUseSuggestedRange={(range) => {
          setStart(range.start);
          setEnd(range.end);
        }}
      />
      <DailyTimeline steps={steps} language={language} />
      <PlannerWindowResult
        language={language}
        city={city}
        cityReady={cityReady}
        state={state}
        air={air}
        result={result}
        partialCommitment={partialCommitment}
        invalidCommitment={invalidCommitment}
        start={start}
        end={end}
      />
      <footer>
        <Link href="/">{translate(language, "backDashboard")}</Link>
      </footer>
    </main>
  );
}
