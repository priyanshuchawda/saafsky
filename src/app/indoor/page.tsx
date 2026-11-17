"use client";
import Link from "next/link";
import { useState } from "react";

export default function IndoorAdvisor() {
  const [smoke, setSmoke] = useState(false);
  const [purifier, setPurifier] = useState(false);
  const [outdoorPoor, setOutdoorPoor] = useState(false);
  return (
    <main id="main-content" tabIndex={-1} className="shell scenario">
      <header className="top">
        <Link className="brand" href="/">
          ✳ saafsky<span>.</span>
        </Link>
        <p>Make your indoor space more comfortable</p>
      </header>
      <p className="eyebrow">INDOOR AIR ADVISOR</p>
      <h1>
        Care for the air <em>inside.</em>
      </h1>
      <p className="lead">
        Choose what applies to your home for practical, low-cost actions.
        SaafSky does not measure indoor air quality.
      </p>
      <div className="toolbar">
        <div className="profile">
          <label htmlFor="smoke">COOKING OR OTHER INDOOR SMOKE?</label>
          <select
            id="smoke"
            value={smoke ? "yes" : "no"}
            onChange={(e) => setSmoke(e.target.value === "yes")}
          >
            <option value="no">Not selected</option>
            <option value="yes">Yes</option>
          </select>
        </div>
        <div className="profile">
          <label htmlFor="purifier">AIR PURIFIER AVAILABLE?</label>
          <select
            id="purifier"
            value={purifier ? "yes" : "no"}
            onChange={(e) => setPurifier(e.target.value === "yes")}
          >
            <option value="no">No or unsure</option>
            <option value="yes">Yes</option>
          </select>
        </div>
        <div className="profile">
          <label htmlFor="outdoor">IS OUTDOOR AIR POOR?</label>
          <select
            id="outdoor"
            value={outdoorPoor ? "yes" : "no"}
            onChange={(e) => setOutdoorPoor(e.target.value === "yes")}
          >
            <option value="no">No or unsure</option>
            <option value="yes">Yes</option>
          </select>
        </div>
      </div>
      <section className="plan scenario-result" aria-live="polite">
        <p className="eyebrow">YOUR INDOOR ACTIONS</p>
        <h2>
          Small steps for a <em>cleaner room.</em>
        </h2>
        <ol>
          <li>
            <span>01</span>
            <div>
              <strong>Reduce indoor sources</strong>
              <p>
                {smoke
                  ? "Reduce cooking smoke where possible and use an exhaust fan vented outdoors while cooking."
                  : "Avoid unnecessary indoor smoke from candles, incense, smoking and other sources."}
              </p>
            </div>
          </li>
          <li>
            <span>02</span>
            <div>
              <strong>
                {purifier
                  ? "Use your purifier effectively"
                  : "Choose a cleaner-air room"}
              </strong>
              <p>
                {purifier
                  ? "Use a suitably sized particle-filtering purifier and maintain its filter. Avoid devices that produce ozone."
                  : "Spend time in a comfortable room with fewer indoor smoke sources; filtration can help if it is available."}
              </p>
            </div>
          </li>
          <li>
            <span>03</span>
            <div>
              <strong>Balance ventilation and safety</strong>
              <p>
                {outdoorPoor
                  ? "Reduce polluted outdoor air entry where practical, while maintaining safe temperatures and necessary ventilation, especially when cooking."
                  : "When outdoor air improves, consider ventilation while accounting for indoor sources and household safety."}
              </p>
            </div>
          </li>
        </ol>
        <p className="fine">
          These are general actions, not an indoor measurement. Source:{" "}
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
      <footer>
        <Link href="/">← Back to dashboard</Link>
      </footer>
    </main>
  );
}
