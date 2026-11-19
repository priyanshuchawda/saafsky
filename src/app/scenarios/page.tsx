"use client";

import Link from "next/link";
import { parseCommuteMode } from "@/features/preferences/commute";
import { useState } from "react";
import { ScenarioActionPlan } from "@/components/scenario-action-plan";
import { category, type Profile } from "@/lib/air";
import {
  generateRecommendations,
  type HouseholdProfile,
} from "@/features/recommendations/engine";
import { useLanguage } from "@/hooks/use-preferences";
import { translate, translateText } from "@/features/i18n/messages";

type ComparisonProfile = "general" | "sensitive" | "children" | "cyclist";

function comparisonHousehold(value: ComparisonProfile): HouseholdProfile {
  return {
    sensitive: value === "sensitive",
    children: value === "children",
    commute: value === "cyclist" ? "bike" : "none",
    outdoorExercise: false,
    cookingSmoke: false,
  };
}

export default function Scenarios() {
  const [language] = useLanguage();
  const [aqi, setAqi] = useState(120);
  const [profile, setProfile] = useState<Profile>("adult");
  const [children, setChildren] = useState(false);
  const [commute, setCommute] = useState<HouseholdProfile["commute"]>("none");
  const [showComparison, setShowComparison] = useState(false);
  const [comparison, setComparison] = useState<ComparisonProfile>("children");
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
        {translate(language, "scenarioTitle")}{" "}
        <em>{translate(language, "scenarioChange")}</em>
      </h1>
      <p className="lead">{translate(language, "scenarioLead")}</p>
      <div className="toolbar">
        <div className="profile">
          <label htmlFor="scenario-aqi">
            {translate(language, "illustrativeAqi")}
          </label>
          <select
            id="scenario-aqi"
            value={aqi}
            onChange={(event) => setAqi(Number(event.target.value))}
          >
            <option value={40}>40 — {translateText(language, "Good")}</option>
            <option value={120}>
              120 — {translateText(language, "Unhealthy for sensitive groups")}
            </option>
            <option value={180}>
              180 — {translateText(language, "Unhealthy")}
            </option>
            <option value={250}>
              250 — {translateText(language, "Very unhealthy")}
            </option>
          </select>
        </div>
        <div className="profile">
          <label htmlFor="scenario-profile">
            {translate(language, "household")}
          </label>
          <select
            id="scenario-profile"
            value={profile}
            onChange={(event) => setProfile(event.target.value as Profile)}
          >
            <option value="adult">
              {translate(language, "generalGuidance")}
            </option>
            <option value="sensitive">
              {translate(language, "sensitiveHousehold")}
            </option>
          </select>
        </div>
        <div className="profile">
          <label htmlFor="scenario-children">
            {translate(language, "householdChildren")}
          </label>
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
          <label htmlFor="scenario-commute">
            {translate(language, "commuteLabel")}
          </label>
          <select
            id="scenario-commute"
            value={commute}
            onChange={(event) =>
              setCommute(parseCommuteMode(event.target.value) ?? commute)
            }
          >
            <option value="none">{translate(language, "noneSelected")}</option>
            <option value="walk">{translate(language, "walk")}</option>
            <option value="bike">{translate(language, "bicycle")}</option>
            <option value="public">
              {translate(language, "publicTransport")}
            </option>
            <option value="car">{translate(language, "car")}</option>
          </select>
        </div>
      </div>
      <div className="scenario-comparison-controls">
        <button
          type="button"
          className="action-button"
          aria-expanded={showComparison}
          aria-controls={showComparison ? "comparison-plan" : undefined}
          onClick={() => setShowComparison(!showComparison)}
        >
          {translate(
            language,
            showComparison ? "hideComparison" : "compareHouseholds",
          )}
        </button>
        {showComparison && (
          <div className="profile">
            <label htmlFor="comparison-profile">
              {translate(language, "comparisonHousehold")}
            </label>
            <select
              id="comparison-profile"
              value={comparison}
              onChange={(event) =>
                setComparison(event.target.value as ComparisonProfile)
              }
            >
              <option value="general">
                {translate(language, "comparisonGeneral")}
              </option>
              <option value="sensitive">
                {translate(language, "comparisonSensitive")}
              </option>
              <option value="children">
                {translate(language, "comparisonChildren")}
              </option>
              <option value="cyclist">
                {translate(language, "comparisonCyclist")}
              </option>
            </select>
          </div>
        )}
      </div>
      <section
        id="scenario-results"
        className={`dashboard scenario-result${showComparison ? " scenario-comparing" : ""}`}
        aria-live="polite"
      >
        <article className="aq">
          <p className="eyebrow">{translate(language, "illustrativeAir")}</p>
          <div className="number">
            {aqi} <small>{translate(language, "usAqi")}</small>
          </div>
          <strong className="category">
            {translateText(language, category(aqi))}
          </strong>
          <p>{translate(language, "noLiveData")}</p>
        </article>
        <ScenarioActionPlan
          actions={actions}
          language={language}
          comparison={false}
        />
        {showComparison && (
          <ScenarioActionPlan
            actions={generateRecommendations(
              aqi,
              comparisonHousehold(comparison),
            )}
            language={language}
            comparison
          />
        )}
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
