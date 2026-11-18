"use client";

import Link from "next/link";
import { useState } from "react";
import { ActionReason } from "@/components/action-reason";
import { category, type Profile } from "@/lib/air";
import {
  generateRecommendations,
  type HouseholdProfile,
} from "@/features/recommendations/engine";
import { useLanguage } from "@/hooks/use-preferences";
import { translate, translateText } from "@/features/i18n/messages";

export default function Scenarios() {
  const [language] = useLanguage();
  const [aqi, setAqi] = useState(120);
  const [profile, setProfile] = useState<Profile>("adult");
  const [children, setChildren] = useState(false);
  const [commute, setCommute] = useState<HouseholdProfile["commute"]>("none");
  const actions = generateRecommendations(aqi, {
    sensitive: profile === "sensitive",
    children,
    commute,
    outdoorExercise: false,
    cookingSmoke: false,
  });
  return (
    <main id="main-content" tabIndex={-1} className="shell scenario">
      <p className="eyebrow">{translate(language, "scenarioEyebrow")}</p>
      <h1>
        {translate(language, "scenarioTitle")} <em>{translate(language, "scenarioChange")}</em>
      </h1>
      <p className="lead">{translate(language, "scenarioLead")}</p>
      <div className="toolbar">
        <div className="profile">
          <label htmlFor="scenario-aqi">{translate(language, "illustrativeAqi")}</label>
          <select
            id="scenario-aqi"
            value={aqi}
            onChange={(event) => setAqi(Number(event.target.value))}
          >
            <option value={40}>40 — {translateText(language, "Good")}</option>
            <option value={120}>120 — {translateText(language, "Unhealthy for sensitive groups")}</option>
            <option value={180}>180 — {translateText(language, "Unhealthy")}</option>
            <option value={250}>250 — {translateText(language, "Very unhealthy")}</option>
          </select>
        </div>
        <div className="profile">
          <label htmlFor="scenario-profile">{translate(language, "household")}</label>
          <select
            id="scenario-profile"
            value={profile}
            onChange={(event) => setProfile(event.target.value as Profile)}
          >
            <option value="adult">{translate(language, "generalGuidance")}</option>
            <option value="sensitive">{translate(language, "sensitiveHousehold")}</option>
          </select>
        </div>
        <div className="profile">
          <label htmlFor="scenario-children">{translate(language, "householdChildren")}</label>
          <select
            id="scenario-children"
            value={children ? "yes" : "no"}
            onChange={(event) => setChildren(event.target.value === "yes")}
          >
            <option value="no">{translate(language, "no")}</option>
            <option value="yes">{translate(language, "yes")}</option>
          </select>
        </div>
        <div className="profile">
          <label htmlFor="scenario-commute">{translate(language, "commuteLabel")}</label>
          <select
            id="scenario-commute"
            value={commute}
            onChange={(event) =>
              setCommute(event.target.value as HouseholdProfile["commute"])
            }
          >
            <option value="none">{translate(language, "noneSelected")}</option>
            <option value="walk">{translate(language, "walk")}</option>
            <option value="bike">{translate(language, "bicycle")}</option>
            <option value="public">{translate(language, "publicTransport")}</option>
            <option value="car">{translate(language, "car")}</option>
          </select>
        </div>
      </div>
      <section className="dashboard scenario-result" aria-live="polite">
        <article className="aq">
          <p className="eyebrow">{translate(language, "illustrativeAir")}</p>
          <div className="number">
            {aqi} <small>{translate(language, "usAqi")}</small>
          </div>
          <strong className="category">{translateText(language, category(aqi))}</strong>
          <p>{translate(language, "noLiveData")}</p>
        </article>
        <article className="plan">
          <p className="eyebrow">{translate(language, "exampleActionPlan")}</p>
          <h2>
            {translate(language, "whatChanges")} <em>{translate(language, "today")}</em>
          </h2>
          <ol>
            {actions.map((item, i) => (
              <li key={item.id}>
                <span>0{i + 1}</span>
                <div>
                  <strong>{translateText(language, item.title)}</strong>
                  <p>{translateText(language, item.description)}</p>
                  <ActionReason action={item} language={language} />
                </div>
              </li>
            ))}
          </ol>
          <p className="fine">{translate(language, "generalInformation")}</p>
        </article>
      </section>
      <p className="fine">
        {translate(language, "scenarioEvidence")}{" "}
        <a href="https://www.airnow.gov/aqi/aqi-basics/">AirNow</a>. Indoor air
        {translate(language, "indoorEvidence")}{" "}
        <a href="https://www.epa.gov/indoor-air-quality-iaq/indoor-air-filtration">
          US EPA
        </a>
        .
      </p>
      <footer>
        <Link href="/">{translate(language, "backLiveDashboard")}</Link>
      </footer>
    </main>
  );
}
