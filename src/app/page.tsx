"use client";

import Link from "next/link";
import { AirQualitySummary } from "@/components/dashboard/air-quality-summary";
import { ForecastSection } from "@/components/dashboard/forecast-section";
import { LocationSearch } from "@/components/location-search";
import { generateRecommendations } from "@/features/recommendations/engine";
import { useAirQuality } from "@/hooks/use-air-quality";
import { useCity, useHousehold } from "@/hooks/use-preferences";
import { lowestForecastPeriod, upcomingForecast } from "@/lib/air";
import { localMinuteAt } from "@/lib/freshness";

export default function Home() {
  const [city, setCity] = useCity();
  const [profile, setProfile] = useHousehold();
  const state = useAirQuality(city);
  const air = state.kind === "success" ? state.data : null;
  const updated = state.kind === "success" ? state.retrievedAt : "";
  const fresh = state.kind === "success" && state.fresh;
  const status =
    state.kind === "loading"
      ? "Loading air quality…"
      : state.kind === "error"
        ? state.message
        : !state.fresh
          ? "The model data or retrieval time is stale or unavailable. Check a local official source for current conditions."
          : "";
  const aqi =
    fresh &&
    typeof air?.current?.us_aqi === "number" &&
    Number.isFinite(air.current.us_aqi)
      ? air.current.us_aqi
      : null;
  const recommendations = generateRecommendations(aqi, profile);
  const localNow =
    state.kind === "success"
      ? localMinuteAt(state.checkedAt, state.data.timezone)
      : null;
  const upcoming =
    fresh && air
      ? upcomingForecast(air.hourly.time, air.hourly.us_aqi, localNow ?? "")
      : [];
  const lowest =
    fresh && air && localNow
      ? lowestForecastPeriod(air.hourly.time, air.hourly.us_aqi, localNow)
      : null;

  return (
    <main id="main-content" tabIndex={-1} className="shell">
      <section className="intro">
        <div>
          <p className="eyebrow">A BETTER DAY STARTS HERE ✳</p>
          <h1>
            Breathe a little
            <br />
            <em>easier.</em>
          </h1>
          <p className="lead">
            Know your air. Plan your day. Make choices that feel right for you
            and your family.
          </p>
        </div>
        <div className="art" aria-hidden="true">
          ✳
          <p>
            Small steps.
            <br />
            Clearer days.
          </p>
        </div>
      </section>

      <section className="toolbar" aria-label="Location and household">
        <LocationSearch onSelect={setCity} />
        <div className="profile">
          <label htmlFor="profile">YOUR HOUSEHOLD</label>
          <select
            id="profile"
            value={profile.sensitive ? "sensitive" : "adult"}
            onChange={(event) =>
              setProfile({
                ...profile,
                sensitive: event.target.value === "sensitive",
              })
            }
          >
            <option value="adult">General guidance</option>
            <option value="sensitive">Sensitive household member</option>
          </select>
        </div>
      </section>

      <div className="heading">
        <div>
          <p className="eyebrow">YOUR AIR, AT A GLANCE</p>
          <h2>Today in {city.name} ↗</h2>
        </div>
        <p>Model estimates · US AQI</p>
      </div>
      {status && (
        <p role="status" className="notice">
          {status}
        </p>
      )}

      <AirQualitySummary
        cityName={city.name}
        aqi={aqi}
        current={air?.current ?? null}
        fresh={fresh}
        recommendations={recommendations}
      />
      <ForecastSection
        cityName={city.name}
        timezone={air?.timezone}
        currentModelTime={air?.current.time}
        retrievedAt={updated}
        upcoming={upcoming}
        lowest={lowest}
      />

      <footer>
        <strong>✳ saafsky.</strong>
        <span>A calmer way to navigate the air around you.</span>
        <Link href="/impact">Compare commute impact ↗</Link>
        <Link href="/assistant">Ask SaafSky ↗</Link>
        <Link href="/indoor">Indoor air guide ↗</Link>
        <Link href="/settings">Settings ↗</Link>
      </footer>
    </main>
  );
}
