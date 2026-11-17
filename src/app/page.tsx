"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { isFresh } from "@/lib/freshness";
import {
  advice,
  category,
  lowestForecastPeriod,
  upcomingForecast,
  type Profile,
} from "@/lib/air";
type City = {
  name: string;
  country?: string;
  admin1?: string;
  latitude: number;
  longitude: number;
};
type Air = {
  current?: {
    time?: string;
    us_aqi?: number | null;
    pm2_5?: number | null;
    pm10?: number | null;
  };
  hourly?: { time?: string[]; us_aqi?: (number | null)[] };
  timezone?: string;
  utc_offset_seconds: number;
};
const initial: City = {
  name: "Delhi",
  country: "India",
  latitude: 28.6519,
  longitude: 77.2315,
};
export default function Home() {
  const [city, setCity] = useState(initial);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<City[]>([]);
  const [profile, setProfile] = useState<Profile>("adult");
  const [air, setAir] = useState<Air | null>(null);
  const [status, setStatus] = useState("Loading air quality…");
  const [locationStatus, setLocationStatus] = useState("");
  const searchController = useRef<AbortController | null>(null);
  const [updated, setUpdated] = useState("");
  const [fresh, setFresh] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/air?lat=${city.latitude}&lon=${city.longitude}`, {
      signal: controller.signal,
    })
      .then(async (r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((body: { data: Air; retrievedAt: string }) => {
        setAir(body.data);
        setUpdated(body.retrievedAt);
        const current = isFresh(body.retrievedAt, body.data.current?.time ?? "", body.data.utc_offset_seconds, Date.now());
        setFresh(current);
        setStatus(
          !current
            ? "The model data or retrieval time is stale or unavailable. Check a local official source for current conditions."
            : "",
        );
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setAir(null);
          setFresh(false);
          setStatus("Air data is unavailable. Please try again later.");
        }
      });
    return () => controller.abort();
  }, [city]);
  useEffect(() => {
    if (!air || !updated) return;
    const timer = window.setInterval(() => {
      if (!isFresh(updated, air.current?.time ?? "", air.utc_offset_seconds, Date.now())) {
        setFresh(false);
        setStatus("The model data or retrieval time is stale or unavailable. Check a local official source for current conditions.");
      }
    }, 60_000);
    return () => window.clearInterval(timer);
  }, [air, updated]);
  async function search(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (query.trim().length < 2) return;
    searchController.current?.abort();
    const controller = new AbortController();
    searchController.current = controller;
    setResults([]);
    setLocationStatus("Searching for cities…");
    try {
      const r = await fetch(`/api/locations?q=${encodeURIComponent(query)}`, { signal: controller.signal });
      if (!r.ok) throw new Error();
      const body = (await r.json()) as { results?: City[] };
      setResults(body.results ?? []);
      setLocationStatus(body.results?.length ? "" : "No cities found. Try another search.");
    } catch {
      if (!controller.signal.aborted) setLocationStatus("City search is unavailable. Please try again.");
    }
  }
  const aqi =
    fresh && typeof air?.current?.us_aqi === "number" &&
    Number.isFinite(air.current.us_aqi)
      ? air.current.us_aqi
      : null;
  const times = air?.hourly?.time ?? [];
  const values = air?.hourly?.us_aqi ?? [];
  const upcoming = fresh ? upcomingForecast(times, values, air?.current?.time ?? "") : [];
  const lowest = fresh && air?.current?.time
    ? lowestForecastPeriod(times, values, air.current.time)
    : null;
  return (
    <main className="shell">
      <header className="top">
        <Link className="brand" href="/">
          ✳ saafsky<span>.</span>
        </Link>
        <p>A little clarity for the air you breathe</p>
        <Link className="demo-link" href="/scenarios">
          Try a demo ↗
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
        <form onSubmit={search}>
          <label htmlFor="city">YOUR LOCATION</label>
          <div className="search">
            <input
              id="city"
              value={query}
              onChange={(e) => { searchController.current?.abort(); setResults([]); setLocationStatus(""); setQuery(e.target.value); }}
              placeholder="Search for a city"
              minLength={2}
              maxLength={80}
            />
            <button>Search</button>
          </div>
          {locationStatus && <p role="status">{locationStatus}</p>}
          {results.length > 0 && (
            <ul className="results">
              {results.map((c, i) => (
                <li key={`${c.latitude}-${c.longitude}-${i}`}>
                  <button
                    type="button"
                    onClick={() => {
                      setStatus("Loading air quality…");
                      setAir(null);
                      setCity(c);
                      setResults([]);
                      setLocationStatus("");
                      setQuery("");
                    }}
                  >
                    {c.name}
                    {c.admin1 ? `, ${c.admin1}` : ""}
                    {c.country ? `, ${c.country}` : ""}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </form>
        <div className="profile">
          <label htmlFor="profile">YOUR HOUSEHOLD</label>
          <select
            id="profile"
            value={profile}
            onChange={(e) => setProfile(e.target.value as Profile)}
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
            {advice(aqi, profile).map((item, i) => (
              <li key={item}>
                <span>0{i + 1}</span>
                {item}
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
          . Forecast time:{" "}
          {air?.current?.time?.replace("T", " ") ?? "unavailable"}. Retrieved:{" "}
          {updated ? new Date(updated).toLocaleString() : "unavailable"}.
          Forecasts are estimates, not local sensor measurements.
        </p>
      </section>
      <footer>
        <strong>✳ saafsky.</strong>
        <span>A calmer way to navigate the air around you.</span>
      </footer>
    </main>
  );
}
