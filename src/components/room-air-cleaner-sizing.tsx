"use client";

import { useState } from "react";
import { smokeCadrForArea } from "@/features/indoor/room-sizing";
import { translate, type Language } from "@/features/i18n/messages";

export function RoomAirCleanerSizing({ language }: { language: Language }) {
  const [area, setArea] = useState("");
  const cadr = area.trim() === "" ? null : smokeCadrForArea(Number(area));

  return (
    <section className="plan scenario-result" aria-labelledby="room-sizing-title">
      <p className="eyebrow">{translate(language, "roomSizer")}</p>
      <h2 id="room-sizing-title">{translate(language, "roomSizerTitle")}</h2>
      <p>{translate(language, "roomSizerLead")}</p>
      <div className="toolbar impact-form">
        <div className="profile">
          <label htmlFor="room-area">{translate(language, "roomArea")}</label>
          <input
            id="room-area"
            type="number"
            inputMode="decimal"
            min="0.1"
            max="500"
            step="any"
            value={area}
            aria-describedby="room-area-hint"
            aria-invalid={area !== "" && cadr === null}
            onChange={(event) => setArea(event.target.value)}
          />
        </div>
      </div>
      <p id="room-area-hint" className="fine">{translate(language, "roomAreaHint")}</p>
      <div role="status" aria-live="polite">
        {cadr !== null && (
          <p><strong>{translate(language, "recommendedCadr")}: {Math.ceil(cadr)} m³/h</strong></p>
        )}
      </div>
      <p className="fine">{translate(language, "roomSizerMethod")}{" "}
        <a href="https://www.epa.gov/wildfire-smoke-course/preparing-smoke-and-heat">
          {translate(language, "roomSizerSource")}
        </a>.
      </p>
    </section>
  );
}
