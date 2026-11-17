"use client";
import Link from "next/link";
import { useState } from "react";
import {
  clearPreferences,
  useCity,
  useHousehold,
} from "@/hooks/use-preferences";
import type { HouseholdProfile } from "@/features/recommendations/engine";

export default function Settings() {
  const [city] = useCity();
  const [profile, setProfile] = useHousehold();
  const [message, setMessage] = useState("");
  return (
    <main id="main-content" tabIndex={-1} className="shell scenario">
      <header className="top">
        <Link className="brand" href="/">
          ✳ saafsky<span>.</span>
        </Link>
        <p>Your privacy and preferences</p>
      </header>
      <p className="eyebrow">YOUR SETTINGS</p>
      <h1>
        Make it <em>yours.</em>
      </h1>
      <section className="plan">
        <h2>Saved preferences</h2>
        <p>
          Selected city: <strong>{city.name}</strong>
        </p>
        <p>
          Household guidance:{" "}
          <strong>
            {profile.sensitive
              ? "Sensitive household member"
              : "General guidance"}
          </strong>
        </p>
        <div className="toolbar impact-form">
          <div className="profile">
            <label htmlFor="setting-children">CHILDREN IN HOUSEHOLD</label>
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
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </div>
          <div className="profile">
            <label htmlFor="setting-commute">USUAL COMMUTE</label>
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
              <option value="none">Not selected</option>
              <option value="walk">Walk</option>
              <option value="bike">Bicycle</option>
              <option value="public">Public transport</option>
              <option value="car">Car</option>
            </select>
          </div>
          <div className="profile">
            <label htmlFor="setting-exercise">OUTDOOR EXERCISE</label>
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
              <option value="no">Not selected</option>
              <option value="yes">Usually exercise outdoors</option>
            </select>
          </div>
          <div className="profile">
            <label htmlFor="setting-smoke">INDOOR COOKING SMOKE</label>
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
              <option value="no">No or unsure</option>
              <option value="yes">Usually present</option>
            </select>
          </div>
        </div>
        <p className="fine">
          The city is stored in this browser. Household and lifestyle choices
          are kept for this browser tab session only. Chat messages are not
          saved by the app. Browser settings may also clear this data.
        </p>
        <button
          className="action-button"
          type="button"
          onClick={() => {
            clearPreferences();
            setMessage("Preferences cleared.");
          }}
        >
          Clear preferences
        </button>
        <p role="status">{message}</p>
      </section>
      <footer>
        <Link href="/">← Back to dashboard</Link>
      </footer>
    </main>
  );
}
