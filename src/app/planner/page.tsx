"use client";

import Link from "next/link";
import { useState } from "react";
import { LocationSearch } from "@/components/location-search";
import { useAirQuality } from "@/hooks/use-air-quality";
import { planOutdoorWindow } from "@/features/planner/plan";
import { generateDailyPlan } from "@/features/planner/daily";
import type { HouseholdProfile } from "@/features/recommendations/engine";
import { category, upcomingForecast } from "@/lib/air";
import { useCity, useHousehold } from "@/hooks/use-preferences";

export default function Planner() {
  const [city, setCity] = useCity();
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [profile, setProfile] = useHousehold();
  const state = useAirQuality(city);
  const air = state.kind === "success" && state.fresh ? state.data : null;
  const hours = air
    ? upcomingForecast(air.hourly.time, air.hourly.us_aqi, air.current.time)
    : [];
  const result = planOutdoorWindow(hours, start, end);
  const steps = generateDailyPlan(air?.current.us_aqi ?? null, profile);
  return (
    <main className="shell scenario">
      <header className="top">
        <Link className="brand" href="/">
          ✳ saafsky<span>.</span>
        </Link>
        <p>Find a lower forecast period</p>
      </header>
      <p className="eyebrow">PLAN A NECESSARY OUTING</p>
      <h1>
        Find a <em>better window.</em>
      </h1>
      <p className="lead">
        Compare forecast hours within a time window you choose. This is an
        estimate, not a guarantee of safe air.
      </p>
      <div className="toolbar">
        <LocationSearch onSelect={setCity} />
        <div className="profile">
          <label htmlFor="plan-profile">HOUSEHOLD</label>
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
            <option value="general">General guidance</option>
            <option value="sensitive">Sensitive household member</option>
          </select>
        </div>
        <div className="profile">
          <label htmlFor="plan-commute">COMMUTE</label>
          <select
            id="plan-commute"
            value={profile.commute}
            onChange={(event) =>
              setProfile({
                ...profile,
                commute: event.target.value as HouseholdProfile["commute"],
              })
            }
          >
            <option value="none">None selected</option>
            <option value="walk">Walk</option>
            <option value="bike">Bicycle</option>
            <option value="public">Public transport</option>
            <option value="car">Car</option>
          </select>
        </div>
        <div className="profile">
          <label htmlFor="window-start">EARLIEST TIME</label>
          <input
            id="window-start"
            type="datetime-local"
            value={start}
            onChange={(event) => setStart(event.target.value)}
          />
        </div>
        <div className="profile">
          <label htmlFor="window-end">LATEST TIME (EXCLUSIVE)</label>
          <input
            id="window-end"
            type="datetime-local"
            value={end}
            onChange={(event) => setEnd(event.target.value)}
          />
        </div>
      </div>
      <section className="plan scenario-result" aria-live="polite">
        <p className="eyebrow">YOUR DAILY PLAN</p>
        <h3>
          Morning to <em>evening.</em>
        </h3>
        <ol>
          {steps.map((step) => (
            <li key={step.id}>
              <span>{step.period}</span>
              <div>
                <strong>{step.title}</strong>
                <p>{step.detail}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="fine">
          These are general suggestions and can change as conditions change.
          Essential commitments and medical advice take priority.
        </p>
      </section>
      <section className="plan scenario-result" aria-live="polite">
        <p className="eyebrow">FORECAST FOR {city.name.toUpperCase()}</p>
        <h3>
          Your available <em>window.</em>
        </h3>
        <p className="muted">
          Enter both times in {air?.timezone ?? "the city’s local time"}. Only
          upcoming forecast hours are compared.
        </p>
        {state.kind === "loading" && <p>Loading forecast…</p>}
        {state.kind === "error" && (
          <p>Forecast unavailable. Try again later.</p>
        )}
        {state.kind === "success" && !state.fresh && (
          <p>The forecast is stale, so it cannot be used for planning.</p>
        )}
        {air &&
          start &&
          end &&
          (result.kind === "available" ? (
            <p>
              Lowest available forecast:{" "}
              <strong>{result.time.replace("T", " ")}</strong> · US AQI{" "}
              {Math.round(result.aqi)} ({category(result.aqi)}), across{" "}
              {result.considered} available hours. Even the lowest period may be
              unhealthy; consider postponing nonessential outdoor activity.
            </p>
          ) : (
            <p>
              No usable forecast falls within this window. Check the dates and
              times or choose another window.
            </p>
          ))}
        <p className="fine">
          Model forecast: Open-Meteo / CAMS. Local conditions may differ. This
          tool does not measure personal exposure or provide medical advice.
        </p>
      </section>
      <footer>
        <Link href="/">← Back to dashboard</Link>
      </footer>
    </main>
  );
}
