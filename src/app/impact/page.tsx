"use client";
import Link from "next/link";
import { useImpactCalculator } from "@/hooks/use-impact-calculator";
import { parseTransportMode } from "@/features/sustainability/calculate";
import { useLanguage } from "@/hooks/use-preferences";
import { translate } from "@/features/i18n/messages";
import { CommuteAirContext } from "@/components/commute-air-context";

export default function Impact() {
  const [language] = useLanguage();
  const {
    distance,
    setDistance,
    days,
    setDays,
    baseline,
    setBaseline,
    baselineMode,
    setBaselineMode,
    occupants,
    setOccupants,
    custom,
    setCustom,
    mode,
    setMode,
    result,
  } = useImpactCalculator();
  return (
    <main id="main-content" tabIndex={-1} className="shell scenario">
      <p className="eyebrow">{translate(language, "impactEyebrow")}</p>
      <h1>
        {translate(language, "impactTitle")}{" "}
        <em>{translate(language, "choices")}</em>
      </h1>
      <p className="lead">{translate(language, "impactLead")}</p>
      <div className="toolbar impact-form">
        <div className="profile">
          <label htmlFor="baseline-mode">
            {translate(language, "currentTravel")}
          </label>
          <select
            id="baseline-mode"
            value={baselineMode}
            onChange={(event) =>
              setBaselineMode(
                event.target.value === "custom" ? "custom" : "car",
              )
            }
          >
            <option value="car">{translate(language, "indiaPetrolCar")}</option>
            <option value="custom">{translate(language, "ownFactor")}</option>
          </select>
        </div>
        {baselineMode === "car" && (
          <div className="profile">
            <label htmlFor="occupants">
              {translate(language, "peopleInCar")}
            </label>
            <input
              id="occupants"
              type="number"
              min="1"
              max="8"
              step="1"
              value={occupants}
              onChange={(event) => setOccupants(event.target.value)}
            />
          </div>
        )}
        <div className="profile">
          <label htmlFor="distance">
            {translate(language, "dailyDistance")}
          </label>
          <input
            id="distance"
            type="number"
            min="0"
            max="1000"
            step="any"
            value={distance}
            onChange={(e) => setDistance(e.target.value)}
          />
        </div>
        <div className="profile">
          <label htmlFor="days">{translate(language, "travelDays")}</label>
          <input
            id="days"
            type="number"
            min="0"
            max="31"
            step="1"
            value={days}
            onChange={(e) => setDays(e.target.value)}
          />
        </div>
        {baselineMode === "custom" && (
          <div className="profile">
            <label htmlFor="baseline">
              {translate(language, "baselineFactor")}
            </label>
            <input
              id="baseline"
              type="number"
              min="0"
              max="10"
              step="any"
              value={baseline}
              onChange={(e) => setBaseline(e.target.value)}
              placeholder={translate(language, "sourcedFactorPlaceholder")}
            />
          </div>
        )}
        <div className="profile">
          <label htmlFor="mode">{translate(language, "alternative")}</label>
          <select
            id="mode"
            value={mode}
            onChange={(e) =>
              setMode(parseTransportMode(e.target.value) ?? mode)
            }
          >
            <option value="bus">{translate(language, "indiaCityBus")}</option>
            <option value="metro">{translate(language, "indiaMetro")}</option>
            <option value="walk">{translate(language, "walking")}</option>
            <option value="cycle">{translate(language, "cycling")}</option>
            <option value="custom">
              {translate(language, "customFactor")}
            </option>
          </select>
        </div>
        {mode === "custom" && (
          <div className="profile">
            <label htmlFor="custom">
              {translate(language, "alternativeFactor")}
            </label>
            <input
              id="custom"
              type="number"
              min="0"
              max="10"
              step="any"
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
            />
          </div>
        )}
      </div>
      <section className="plan scenario-result">
        <p className="eyebrow">{translate(language, "monthlyEstimate")}</p>
        {result ? (
          <>
            <h2>
              {Math.abs(result.difference).toFixed(2)} kg{" "}
              <em>
                CO₂e{" "}
                {translate(language, result.difference >= 0 ? "less" : "more")}.
              </em>
            </h2>
            <p>
              {translate(language, "baseline")} {result.baseline.toFixed(2)} kg
              · {translate(language, "alternativeValue")}{" "}
              {result.alternative.toFixed(2)} kg
            </p>
          </>
        ) : (
          <p>{translate(language, "enterValidFactor")}</p>
        )}
        <p className="fine">{translate(language, "impactMethod")}</p>
        <p className="fine">
          {translate(language, "impactExposure")}{" "}
          <a href="https://www.oecd.org/content/dam/oecd/en/publications/reports/2023/08/life-cycle-assessment-of-passenger-transport_9e2ebe5e/2d11e416-en.pdf">
            International Transport Forum India life-cycle assessment (2023)
          </a>
          .
        </p>
      </section>
      <CommuteAirContext language={language} />
      <footer>
        <Link href="/">{translate(language, "backDashboard")}</Link>
      </footer>
    </main>
  );
}
