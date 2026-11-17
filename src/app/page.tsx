"use client";
import Link from "next/link";
import { useAirQuality } from "@/hooks/use-air-quality";
import { LocationSearch } from "@/components/location-search";
import { useCity, useHousehold } from "@/hooks/use-preferences";
import { generateRecommendations } from "@/features/recommendations/engine";
import { category, lowestForecastPeriod, upcomingForecast } from "@/lib/air";
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
        ? "Air data is unavailable. Please try again later."
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
  const times = air?.hourly?.time ?? [];
  const values = air?.hourly?.us_aqi ?? [];
  const upcoming = fresh
    ? upcomingForecast(times, values, air?.current?.time ?? "")
    : [];
  const lowest =
    fresh && air?.current?.time
      ? lowestForecastPeriod(times, values, air.current.time)
      : null;
  return (
    <main id="main-content" tabIndex={-1} className="shell">
      <header className="top">
        <Link className="brand" href="/">
          ✳ saafsky<span>.</span>
        </Link>
        <p>A little clarity for the air you breathe</p>
        <Link className="nav-link" href="/planner">
          Plan an outing ↗
        </Link>
        <Link className="nav-link" href="/scenarios">
          Explore scenarios ↗
        </Link>
      </header>
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
            onChange={(e) =>
              setProfile({
                ...profile,
                sensitive: e.target.value === "sensitive",
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
      <section className="dashboard">
        <article className="aq">
          <p className="eyebrow">CURRENT AIR QUALITY</p>
          <div className="number">
            {aqi === null ? "—" : Math.round(aqi)} <small>US AQI</small>
          </div>
          <strong className="category">{category(aqi)}</strong>
          <p>
            Model estimate for {city.name}. Conditions can vary across your
            city.
          </p>
          <div className="pollutants">
            <div>
              PM2.5
              <strong>
                {air?.current?.pm2_5 ?? "—"} <small>µg/m³</small>
              </strong>
            </div>
            <div>
              PM10
              <strong>
                {air?.current?.pm10 ?? "—"} <small>µg/m³</small>
              </strong>
            </div>
          </div>
        </article>
        <article className="plan">
          <p className="eyebrow">YOUR PERSONAL AIR PLAN ✳</p>
          <h3>
            Little actions,
            <br />
            <em>meaningful care.</em>
          </h3>
          <p className="muted">
            Based on the current estimate and your household selection.
          </p>
          <ol>
            {recommendations.map((item, i) => (
              <li key={item.id}>
                <span>0{i + 1}</span>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.description}</p>
                  <a
                    className="fine"
                    href={
                      item.evidenceIds.includes("epa-indoor")
                        ? "https://www.epa.gov/indoor-air-quality-iaq/improving-indoor-air-quality"
                        : "https://www.airnow.gov/aqi/aqi-basics/"
                    }
                  >
                    Why this advice? View guidance ↗
                  </a>
                </div>
              </li>
            ))}
          </ol>
          <p className="fine">
            General information, not a diagnosis. Follow your clinician’s advice
            when applicable.
          </p>
        </article>
      </section>
      <section>
        <div className="heading">
          <div>
            <p className="eyebrow">LOOKING AHEAD</p>
            <h2>The hours ahead ↗</h2>
          </div>
          <p>Forecast · {air?.timezone ?? "local time"}</p>
        </div>
        {lowest && (
          <p className="forecast-note">
            Lowest forecast in the next 24 hours:{" "}
            <strong>{lowest.time.replace("T", " ")}</strong> · US AQI{" "}
            {Math.round(lowest.aqi)}. This is a comparison, not a guarantee of
            safe conditions.
          </p>
        )}
        <div className="hours">
          {upcoming.slice(0, 8).map(({ time, aqi }, i) => (
            <div key={`${time}-${i}`}>
              <span>{time.replace("T", " ").slice(5)}</span>
              <strong>{aqi ?? "—"}</strong>
              <small>US AQI</small>
            </div>
          ))}
          {upcoming.length === 0 && <p>No upcoming forecast available.</p>}
        </div>
        <p className="fine">
          Source:{" "}
          <a href="https://open-meteo.com/en/docs/air-quality-api">
            Open-Meteo
          </a>
          {" / "}
          <a href="https://atmosphere.copernicus.eu/">
            Copernicus Atmosphere Monitoring Service (CAMS)
          </a>
          . Forecast time:{" "}
          {air?.current?.time?.replace("T", " ") ?? "unavailable"}. Retrieved:{" "}
          {updated ? new Date(updated).toLocaleString() : "unavailable"}.
          Forecasts are estimates, not local sensor measurements.
        </p>
      </section>
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
