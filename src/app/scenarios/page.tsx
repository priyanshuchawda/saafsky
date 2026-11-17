"use client";

import Link from "next/link";
import { useState } from "react";
import { advice, category, type Profile } from "@/lib/air";

export default function Scenarios() {
  const [aqi, setAqi] = useState(120);
  const [profile, setProfile] = useState<Profile>("adult");
  return <main className="shell scenario">
    <header className="top"><Link className="brand" href="/">✳ saafsky<span>.</span></Link><p>Explore a controlled example</p></header>
    <p className="eyebrow">SCENARIO COMPARISON</p>
    <h1>See the plan <em>change.</em></h1>
    <p className="lead">Choose an illustrative air-quality level and household. These values are sample data, not live readings.</p>
    <div className="toolbar">
      <div className="profile"><label htmlFor="scenario-aqi">ILLUSTRATIVE US AQI</label><select id="scenario-aqi" value={aqi} onChange={event => setAqi(Number(event.target.value))}><option value={40}>40 — Good</option><option value={120}>120 — Unhealthy for sensitive groups</option><option value={180}>180 — Unhealthy</option><option value={250}>250 — Very unhealthy</option></select></div>
      <div className="profile"><label htmlFor="scenario-profile">HOUSEHOLD</label><select id="scenario-profile" value={profile} onChange={event => setProfile(event.target.value as Profile)}><option value="adult">General guidance</option><option value="sensitive">Sensitive household member</option></select></div>
    </div>
    <section className="dashboard scenario-result" aria-live="polite"><article className="aq"><p className="eyebrow">ILLUSTRATIVE AIR QUALITY</p><div className="number">{aqi} <small>US AQI</small></div><strong className="category">{category(aqi)}</strong><p>This scenario does not use live data or make any API calls.</p></article><article className="plan"><p className="eyebrow">EXAMPLE ACTION PLAN</p><h3>What changes <em>today?</em></h3><ol>{advice(aqi, profile).map((item, i) => <li key={item}><span>0{i + 1}</span>{item}</li>)}</ol><p className="fine">General information, not a diagnosis. Follow your clinician’s advice when applicable.</p></article></section>
    <p className="fine">US AQI categories: <a href="https://www.airnow.gov/aqi/aqi-basics/">AirNow</a>. Indoor air actions: <a href="https://www.epa.gov/indoor-air-quality-iaq/indoor-air-filtration">US EPA</a>.</p>
    <footer><Link href="/">← Back to live dashboard</Link></footer>
  </main>;
}
