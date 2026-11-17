"use client";
import Link from "next/link";
import { useState } from "react";
import {
  monthlyImpact,
  UK_BUS_KG_PER_PASSENGER_KM,
  type Mode,
} from "@/features/sustainability/calculate";

export default function Impact() {
  const [distance, setDistance] = useState("10");
  const [days, setDays] = useState("20");
  const [baseline, setBaseline] = useState("");
  const [custom, setCustom] = useState("");
  const [mode, setMode] = useState<Mode>("bus");
  const complete =
    distance.trim() !== "" &&
    days.trim() !== "" &&
    baseline.trim() !== "" &&
    (mode !== "custom" || custom.trim() !== "");
  const result = complete
    ? monthlyImpact(
        Number(distance),
        Number(days),
        Number(baseline),
        mode,
        mode === "custom" ? Number(custom) : 0,
      )
    : null;
  return (
    <main className="shell scenario">
      <header className="top">
        <Link className="brand" href="/">
          ✳ saafsky<span>.</span>
        </Link>
        <p>Compare commute emissions</p>
      </header>
      <p className="eyebrow">COMMUTE IMPACT</p>
      <h1>
        Compare your <em>choices.</em>
      </h1>
      <p className="lead">
        Estimate attributed travel emissions with your own baseline factor.
        Results depend on the factors and occupancy you choose.
      </p>
      <div className="toolbar impact-form">
        <div className="profile">
          <label htmlFor="distance">DAILY ROUND-TRIP DISTANCE (KM)</label>
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
          <label htmlFor="days">TRAVEL DAYS PER MONTH</label>
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
        <div className="profile">
          <label htmlFor="baseline">
            BASELINE FACTOR (KG CO₂E / PASSENGER-KM)
          </label>
          <input
            id="baseline"
            type="number"
            min="0"
            max="10"
            step="any"
            value={baseline}
            onChange={(e) => setBaseline(e.target.value)}
            placeholder="Enter a sourced factor"
          />
        </div>
        <div className="profile">
          <label htmlFor="mode">ALTERNATIVE</label>
          <select
            id="mode"
            value={mode}
            onChange={(e) => setMode(e.target.value as Mode)}
          >
            <option value="bus">Average UK local bus</option>
            <option value="walk">Walking</option>
            <option value="cycle">Cycling</option>
            <option value="custom">Custom factor</option>
          </select>
        </div>
        {mode === "custom" && (
          <div className="profile">
            <label htmlFor="custom">
              ALTERNATIVE FACTOR (KG CO₂E / PASSENGER-KM)
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
      <section className="plan scenario-result" aria-live="polite">
        <p className="eyebrow">MONTHLY ESTIMATE</p>
        {result ? (
          <>
            <h3>
              {Math.abs(result.difference).toFixed(2)} kg{" "}
              <em>CO₂e {result.difference >= 0 ? "less" : "more"}.</em>
            </h3>
            <p>
              Baseline {result.baseline.toFixed(2)} kg · Alternative{" "}
              {result.alternative.toFixed(2)} kg
            </p>
          </>
        ) : (
          <p>Enter a valid baseline factor and inputs to see a comparison.</p>
        )}
        <p className="fine">
          The bus factor is {UK_BUS_KG_PER_PASSENGER_KM} kg CO₂e per
          passenger-km, using 2025 UK average occupancy. It is a UK proxy, not
          an India-specific estimate. Walking and cycling are assigned zero
          direct vehicle emissions; food, vehicle manufacture and infrastructure
          are excluded. A baseline vehicle-km factor must be divided by
          occupants before entering it here. An emissions difference does not
          predict local AQI or health impact.
        </p>
        <p className="fine">
          Walking or cycling near traffic can increase pollution exposure during
          poor air quality. Consider current conditions and practical
          alternatives. Source:{" "}
          <a href="https://assets.publishing.service.gov.uk/media/6846b0870392ed9b784c0187/2025-GHG-CF-methodology-paper.pdf">
            UK government 2025 methodology, table 25
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
