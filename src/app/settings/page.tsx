"use client";
import Link from "next/link";
import { useState } from "react";
import {
  clearPreferences,
  useCity,
  useSensitivity,
} from "@/hooks/use-preferences";

export default function Settings() {
  const [city] = useCity();
  const [sensitive] = useSensitivity();
  const [message, setMessage] = useState("");
  return (
    <main className="shell scenario">
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
        <h3>Saved preferences</h3>
        <p>
          Selected city: <strong>{city.name}</strong>
        </p>
        <p>
          Household guidance:{" "}
          <strong>
            {sensitive ? "Sensitive household member" : "General guidance"}
          </strong>
        </p>
        <p className="fine">
          The city is stored in this browser. The sensitive-household selection
          is kept for this browser tab session only. Chat messages are not saved
          by the app. Browser settings may also clear this data.
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
