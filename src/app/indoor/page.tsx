"use client";
import Link from "next/link";
import { useState } from "react";
import { useCity, useHousehold, useLanguage } from "@/hooks/use-preferences";
import { useAirQuality } from "@/hooks/use-air-quality";
import { displayCity } from "@/features/i18n/city";
import { translate, translateText } from "@/features/i18n/messages";
import { RoomAirCleanerSizing } from "@/components/room-air-cleaner-sizing";
import {
  generateIndoorAdvice,
  outdoorCondition,
  type OutdoorCondition,
} from "@/features/indoor/advice";

export default function IndoorAdvisor() {
  const [language] = useLanguage();
  const [city, , cityReady] = useCity();
  const [profile, setProfile] = useHousehold();
  const airState = useAirQuality(cityReady ? city : null);
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
      <p className="eyebrow">{translate(language, "indoorEyebrow")}</p>
      <h1>
        {translate(language, "indoorTitle")} <em>{translate(language, "inside")}</em>
      </h1>
      <p className="lead">{translate(language, "indoorLead")}</p>
      <div className="toolbar">
        <div className="profile">
          <label htmlFor="smoke">{translate(language, "cookingSmoke")}</label>
          <select
            id="smoke"
            value={profile.cookingSmoke ? "yes" : "no"}
            onChange={(e) =>
              setProfile({ ...profile, cookingSmoke: e.target.value === "yes" })
            }
          >
            <option value="no">{translate(language, "notSelected")}</option>
            <option value="yes">{translate(language, "yes")}</option>
          </select>
        </div>
        <div className="profile">
          <label htmlFor="purifier">{translate(language, "purifierAvailable")}</label>
          <select
            id="purifier"
            value={purifier ? "yes" : "no"}
            onChange={(e) => setPurifier(e.target.value === "yes")}
          >
            <option value="no">{translate(language, "noUnsure")}</option>
            <option value="yes">{translate(language, "yes")}</option>
          </select>
        </div>
        <div className="profile">
          <label htmlFor="outdoor">{translate(language, "outdoorContext")}</label>
          <select
            id="outdoor"
            value={outdoorMode}
            onChange={(e) =>
              setOutdoorMode(e.target.value as "auto" | OutdoorCondition)
            }
          >
            <option value="auto">{translate(language, "useSelectedCity")}</option>
            <option value="elevated">{translate(language, "outdoorPoor")}</option>
            <option value="unknown">{translate(language, "notSure")}</option>
          </select>
        </div>
      </div>
      <p className="fine" role="status">
        {outdoorMode === "auto"
          ? airState.kind === "error"
            ? translateText(language, airState.message)
            : aqi === null
              ? translate(language, "selectedCityDataUnavailable").replace("{city}", displayCity(city, language))
              : translate(language, "outdoorEstimate").replace("{city}", displayCity(city, language)).replace("{aqi}", String(Math.round(aqi)))
          : translate(language, "usingSelectedOutdoorContext")}
      </p>
      <section className="plan scenario-result" aria-live="polite">
        <p className="eyebrow">{translate(language, "indoorActions")}</p>
        <h2>
          {translate(language, "cleanerRoom")} <em>{translate(language, "cleanerRoomEmphasis")}</em>
        </h2>
        <ol>
          {actions.map((action, index) => (
            <li key={action.id}>
              <span>0{index + 1}</span>
              <div>
                <strong>{translateText(language, action.title)}</strong>
                <p>{translateText(language, action.detail)}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="fine">
          {translate(language, "indoorSourceNote")}{" "}
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
      <RoomAirCleanerSizing language={language} />
      <footer>
        <Link href="/">{translate(language, "backDashboard")}</Link>
      </footer>
    </main>
  );
}
