"use client";

import Link from "next/link";
import { AirQualitySummary } from "@/components/dashboard/air-quality-summary";
import { ForecastSection } from "@/components/dashboard/forecast-section";
import { LocationSearch } from "@/components/location-search";
import { generateRecommendations } from "@/features/recommendations/engine";
import { useAirQuality } from "@/hooks/use-air-quality";
import { useCity, useHousehold, useLanguage } from "@/hooks/use-preferences";
import { lowestForecastPeriod, upcomingForecast } from "@/lib/air";
import { localMinuteAt } from "@/lib/freshness";
import { displayCity } from "@/features/i18n/city";
import { translate } from "@/features/i18n/messages";
import { localizeAirError } from "@/features/i18n/errors";

export default function Home() {
  const [language] = useLanguage();
  const [city, setCity, cityReady] = useCity();
  const [profile, setProfile] = useHousehold();
  const state = useAirQuality(cityReady ? city : null);
  const air = state.kind === "success" ? state.data : null;
  const updated = state.kind === "success" ? state.retrievedAt : "";
  const fresh = state.kind === "success" && state.fresh;
  const status =
    state.kind === "loading"
      ? translate(language, "loadingAir")
      : state.kind === "error"
        ? localizeAirError(language, state.rateLimit)
        : !state.fresh
          ? translate(language, "staleAir")
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
          <p className="eyebrow">{translate(language, "heroEyebrow")}</p>
          <h1>
            {translate(language, "heroTitle")}
            <br />
            <em>{translate(language, "heroTitleEmphasis")}</em>
          </h1>
          <p className="lead">{translate(language, "heroLead")}</p>
        </div>
        <div className="art" aria-hidden="true">
          <p>{translate(language, "heroArt")}</p>
        </div>
      </section>

      <section
        className="toolbar"
        aria-label={translate(language, "locationHousehold")}
      >
        <LocationSearch onSelect={setCity} />
        <div className="profile">
          <label htmlFor="profile">{translate(language, "household")}</label>
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
            <option value="adult">
              {translate(language, "generalGuidance")}
            </option>
            <option value="sensitive">
              {translate(language, "sensitiveHousehold")}
            </option>
          </select>
        </div>
      </section>

      <div className="heading">
        <div>
          <p className="eyebrow">{translate(language, "airAtGlance")}</p>
          <h2>
            {translate(language, "todayIn")}{" "}
            {cityReady ? displayCity(city, language) : "…"}
          </h2>
        </div>
        <p>{translate(language, "modelEstimates")}</p>
      </div>
      {status && (
        <p role="status" className="notice">
          {status}
        </p>
      )}

      <AirQualitySummary
        cityName={cityReady ? displayCity(city, language) : "…"}
        aqi={aqi}
        current={air?.current ?? null}
        fresh={fresh}
        recommendations={recommendations}
        language={language}
      />
      <ForecastSection
        cityName={cityReady ? displayCity(city, language) : "…"}
        timezone={air?.timezone}
        currentModelTime={air?.current.time}
        retrievedAt={updated}
        upcoming={upcoming}
        lowest={lowest}
        language={language}
      />

      <footer>
        <strong>saafsky.</strong>
        <span>{translate(language, "footerTagline")}</span>
        <Link href="/impact">{translate(language, "compareCommute")}</Link>
        <Link href="/assistant">{translate(language, "assistant")}</Link>
        <Link href="/indoor">{translate(language, "indoorGuide")}</Link>
        <Link href="/settings">{translate(language, "settings")}</Link>
      </footer>
    </main>
  );
}
