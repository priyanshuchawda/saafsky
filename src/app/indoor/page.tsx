"use client";
import Link from "next/link";
import { useState } from "react";
import { useCity, useHousehold } from "@/hooks/use-preferences";
import { useAirQuality } from "@/hooks/use-air-quality";
import {
  generateIndoorAdvice,
  outdoorCondition,
  type OutdoorCondition,
} from "@/features/indoor/advice";

export default function IndoorAdvisor() {
  const [city] = useCity();
  const [profile, setProfile] = useHousehold();
  const airState = useAirQuality(city);
  const [purifier, setPurifier] = useState(false);
  const [outdoorMode, setOutdoorMode] = useState<"auto" | OutdoorCondition>(
    "auto",
  );
  const aqi =
    airState.kind === "success" && airState.fresh
      ? airState.data.current.us_aqi
      : null;
  const condition =
    outdoorMode === "auto" ? outdoorCondition(aqi) : outdoorMode;
  const actions = generateIndoorAdvice(
    profile.cookingSmoke,
    purifier,
    condition,
  );
  return (
    <main id="main-content" tabIndex={-1} className="shell scenario">
      <header className="top">
        <Link className="brand" href="/">
          ✳ saafsky<span>.</span>
        </Link>
        <p>Make your indoor space more comfortable</p>
      </header>
      <p className="eyebrow">INDOOR AIR ADVISOR</p>
      <h1>
        Care for the air <em>inside.</em>
      </h1>
      <p className="lead">
        Choose what applies to your home for practical, low-cost actions.
        SaafSky does not measure indoor air quality.
      </p>
      <div className="toolbar">
        <div className="profile">
          <label htmlFor="smoke">COOKING SMOKE?</label>
          <select
            id="smoke"
            value={profile.cookingSmoke ? "yes" : "no"}
            onChange={(e) =>
              setProfile({ ...profile, cookingSmoke: e.target.value === "yes" })
            }
          >
            <option value="no">Not selected</option>
            <option value="yes">Yes</option>
          </select>
        </div>
        <div className="profile">
          <label htmlFor="purifier">AIR PURIFIER AVAILABLE?</label>
          <select
            id="purifier"
            value={purifier ? "yes" : "no"}
            onChange={(e) => setPurifier(e.target.value === "yes")}
          >
            <option value="no">No or unsure</option>
            <option value="yes">Yes</option>
          </select>
        </div>
        <div className="profile">
          <label htmlFor="outdoor">OUTDOOR AIR CONTEXT</label>
          <select
            id="outdoor"
            value={outdoorMode}
            onChange={(e) =>
              setOutdoorMode(e.target.value as "auto" | OutdoorCondition)
            }
          >
            <option value="auto">Use selected city</option>
            <option value="elevated">Outdoor air is poor</option>
            <option value="unknown">Not sure</option>
          </select>
        </div>
      </div>
      <p className="fine" role="status">
        {outdoorMode === "auto"
          ? airState.kind === "error"
            ? airState.message
            : aqi === null
              ? `Current outdoor data for ${city.name} is unavailable or stale.`
              : `Outdoor model estimate for ${city.name}: US AQI ${Math.round(aqi)}. This is not an indoor measurement.`
          : "Using your selected outdoor-air context."}
      </p>
      <section className="plan scenario-result" aria-live="polite">
        <p className="eyebrow">YOUR INDOOR ACTIONS</p>
        <h2>
          Small steps for a <em>cleaner room.</em>
        </h2>
        <ol>
          {actions.map((action, index) => (
            <li key={action.id}>
              <span>0{index + 1}</span>
              <div>
                <strong>{action.title}</strong>
                <p>{action.detail}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="fine">
          These are general actions, not an indoor measurement. Source:{" "}
          <a href="https://www.epa.gov/wildfires/how-create-cleaner-air-room-home">
            US EPA cleaner-air room guidance
          </a>{" "}
          and{" "}
          <a href="https://www.epa.gov/indoor-air-quality-iaq/improving-indoor-air-quality">
            indoor air quality guidance
          </a>
          .
        </p>
      </section>
      <footer>
        <Link href="/">← Back to dashboard</Link>
      </footer>
    </main>
  );
}
