"use client";
import Link from "next/link";
import { useState } from "react";
import {
  clearPreferences,
  useCity,
  useHousehold,
  useLanguage,
} from "@/hooks/use-preferences";
import type { HouseholdProfile } from "@/features/recommendations/engine";
import { displayCity } from "@/features/i18n/city";
import { translate } from "@/features/i18n/messages";

export default function Settings() {
  const [language] = useLanguage();
  const [city, , cityReady] = useCity();
  const [profile, setProfile] = useHousehold();
  const [message, setMessage] = useState("");
  return (
    <main id="main-content" tabIndex={-1} className="shell scenario">
      <p className="eyebrow">{translate(language, "yourSettings")}</p>
      <h1>
        {translate(language, "makeIt")} <em>{translate(language, "yours")}</em>
      </h1>
      <section className="plan">
        <h2>{translate(language, "savedPreferences")}</h2>
        <p>
          {translate(language, "selectedCity")}{" "}
          <strong>
            {[cityReady ? displayCity(city, language) : "…", city.admin1, city.country].filter(Boolean).join(", ")}
          </strong>
        </p>
        <p>
          {translate(language, "householdGuidance")}{" "}
          <strong>
            {profile.sensitive
              ? translate(language, "sensitiveHousehold")
              : translate(language, "generalGuidance")}
          </strong>
        </p>
        <div className="toolbar impact-form">
          <div className="profile">
            <label htmlFor="setting-children">{translate(language, "householdChildren")}</label>
            <select
              id="setting-children"
              value={profile.children ? "yes" : "no"}
              onChange={(event) =>
                setProfile({
                  ...profile,
                  children: event.target.value === "yes",
                })
              }
            >
              <option value="no">{translate(language, "no")}</option>
              <option value="yes">{translate(language, "yes")}</option>
            </select>
          </div>
          <div className="profile">
            <label htmlFor="setting-commute">{translate(language, "usualCommute")}</label>
            <select
              id="setting-commute"
              value={profile.commute}
              onChange={(event) =>
                setProfile({
                  ...profile,
                  commute: event.target.value as HouseholdProfile["commute"],
                })
              }
            >
              <option value="none">{translate(language, "noneSelected")}</option>
              <option value="walk">{translate(language, "walk")}</option>
              <option value="bike">{translate(language, "bicycle")}</option>
              <option value="public">{translate(language, "publicTransport")}</option>
              <option value="car">{translate(language, "car")}</option>
            </select>
          </div>
          <div className="profile">
            <label htmlFor="setting-exercise">{translate(language, "outdoorExercise")}</label>
            <select
              id="setting-exercise"
              value={profile.outdoorExercise ? "yes" : "no"}
              onChange={(event) =>
                setProfile({
                  ...profile,
                  outdoorExercise: event.target.value === "yes",
                })
              }
            >
              <option value="no">{translate(language, "notSelected")}</option>
              <option value="yes">{translate(language, "usuallyExercise")}</option>
            </select>
          </div>
          <div className="profile">
            <label htmlFor="setting-smoke">{translate(language, "indoorCookingSmoke")}</label>
            <select
              id="setting-smoke"
              value={profile.cookingSmoke ? "yes" : "no"}
              onChange={(event) =>
                setProfile({
                  ...profile,
                  cookingSmoke: event.target.value === "yes",
                })
              }
            >
              <option value="no">{translate(language, "noOrUnsure")}</option>
              <option value="yes">{translate(language, "usuallyPresent")}</option>
            </select>
          </div>
        </div>
        <p className="fine">
          {translate(language, "cityStored")}
        </p>
        <p className="fine">
          {translate(language, "rateLimitPrivacy")}
        </p>
        <button
          className="action-button"
          type="button"
          onClick={() => {
            clearPreferences();
            setMessage(translate(language, "preferencesCleared"));
          }}
        >
          {translate(language, "clearPreferences")}
        </button>
        <p role="status">{message}</p>
      </section>
      <footer>
        <Link href="/">{translate(language, "backDashboard")}</Link>
      </footer>
    </main>
  );
}
