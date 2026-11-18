"use client";

import Link from "next/link";
import { useState } from "react";
import { LocationSearch } from "@/components/location-search";
import { useAirQuality } from "@/hooks/use-air-quality";
import { findActivityWindow } from "@/features/planner/activity-window";
import { generateDailyPlan } from "@/features/planner/daily";
import type { HouseholdProfile } from "@/features/recommendations/engine";
import { category, upcomingForecast } from "@/lib/air";
import { localMinuteAt } from "@/lib/freshness";
import { useCity, useHousehold } from "@/hooks/use-preferences";

export default function Planner() {
  const [city, setCity] = useCity();
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [durationHours, setDurationHours] = useState(1);
  const [essential, setEssential] = useState(false);
  const [busyStart, setBusyStart] = useState("");
  const [busyEnd, setBusyEnd] = useState("");
  const [profile, setProfile] = useHousehold();
  const state = useAirQuality(city);
  const air = state.kind === "success" && state.fresh ? state.data : null;
  const localNow =
    state.kind === "success"
      ? localMinuteAt(state.checkedAt, state.data.timezone)
      : null;
  const hours =
    air && localNow
      ? upcomingForecast(air.hourly.time, air.hourly.us_aqi, localNow)
      : [];
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
      <p className="eyebrow">PLAN A NECESSARY OUTING</p>
      <h1>
        Find a <em>better window.</em>
      </h1>
      <p className="lead">
        Compare forecast hours within a time window you choose. This is an
        estimate, not a guarantee of safe air.
      </p>
      <div className="toolbar impact-form">
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
        <div className="profile">
          <label htmlFor="activity-duration">TIME NEEDED</label>
          <select
            id="activity-duration"
            value={durationHours}
            onChange={(event) => setDurationHours(Number(event.target.value))}
          >
            <option value={1}>1 hour</option>
            <option value={2}>2 hours</option>
            <option value={3}>3 hours</option>
            <option value={4}>4 hours</option>
          </select>
        </div>
        <div className="profile">
          <label htmlFor="activity-essential">
            CAN THE OUTING BE POSTPONED?
          </label>
          <select
            id="activity-essential"
            value={essential ? "essential" : "flexible"}
            onChange={(event) =>
              setEssential(event.target.value === "essential")
            }
          >
            <option value="flexible">Yes, it is flexible</option>
            <option value="essential">No, it is essential</option>
          </select>
        </div>
        <div className="profile">
          <label htmlFor="busy-start">FIXED COMMITMENT START (OPTIONAL)</label>
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
          <label htmlFor="busy-end">FIXED COMMITMENT END (OPTIONAL)</label>
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
      <p id="busy-help" className="fine">
        Add both times in the selected city’s local time to keep an outing clear
        of a fixed commitment.
      </p>
      <section className="plan scenario-result" aria-live="polite">
        <p className="eyebrow">YOUR DAILY PLAN</p>
        <h2>
          Morning to <em>evening.</em>
        </h2>
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
        <h2>
          Your available <em>window.</em>
        </h2>
        <p className="muted">
          Enter both times in {air?.timezone ?? "the city’s local time"}. Only
          upcoming forecast hours are compared.
        </p>
        {state.kind === "loading" && <p>Loading forecast…</p>}
        {state.kind === "error" && <p>{state.message}</p>}
        {state.kind === "success" && !state.fresh && (
          <p>The forecast is stale, so it cannot be used for planning.</p>
        )}
        {partialCommitment && (
          <p>Enter both commitment times to include it in the comparison.</p>
        )}
        {invalidCommitment && (
          <p id="busy-error">
            Choose a commitment end time after its start time.
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
                ? "All complete options exceed the precaution threshold. For an essential outing, the lowest modeled peak is"
                : "Lowest modeled peak within a complete window:"}{" "}
              <strong>
                {result.start.replace("T", " ")}–{result.end.replace("T", " ")}
              </strong>{" "}
              · peak US AQI {Math.round(result.peakAqi)} (
              {category(result.peakAqi)}). This is an estimate, not a guarantee
              of safe conditions.
            </p>
          ) : result.kind === "no-suitable" ? (
            <p>
              All complete forecast windows exceed this household’s precaution
              threshold. Consider postponing the flexible outing or choosing an
              indoor alternative.
            </p>
          ) : (
            <p>
              No complete forecast window is available. Check the dates, times
              and duration or choose another window.
            </p>
          ))}
        <p className="fine">
          Model forecast: Open-Meteo / CAMS. Local conditions may differ. This
          tool does not measure personal exposure or provide medical advice. The
          comparison uses hourly model values and a conservative US AQI
          precaution threshold of 100 for sensitive households and 150
          otherwise; it does not establish a safe level.
        </p>
      </section>
      <footer>
        <Link href="/">← Back to dashboard</Link>
      </footer>
    </main>
  );
}
