"use client";

import { useState } from "react";
import { compareSmokeCadr, smokeCadrForArea } from "@/features/indoor/room-sizing";
import { translate, type Language } from "@/features/i18n/messages";

export function RoomAirCleanerSizing({ language }: { language: Language }) {
  const [area, setArea] = useState("");
  const [reportedCadr, setReportedCadr] = useState("");
  const [ratingTouched, setRatingTouched] = useState(false);
  const cadr = area.trim() === "" ? null : smokeCadrForArea(Number(area));
  const rating = reportedCadr.trim() === "" ? null : Number(reportedCadr);
  const ratingValid = rating === null || (Number.isFinite(rating) && rating >= 0 && rating <= 10000);
  const comparison = cadr !== null && rating !== null ? compareSmokeCadr(Number(area), rating) : null;

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
            min="0"
            max="500"
            step="any"
            value={area}
            aria-describedby="room-area-hint"
            aria-invalid={area !== "" && cadr === null}
            onChange={(event) => setArea(event.target.value)}
          />
        </div>
        <div className="profile">
          <label htmlFor="purifier-cadr">{translate(language, "purifierCadr")}</label>
          <input
            id="purifier-cadr"
            type="number"
            inputMode="decimal"
            min="0"
            max="10000"
            step="any"
            value={reportedCadr}
            aria-describedby="purifier-cadr-hint"
            aria-invalid={ratingTouched && !ratingValid}
            onBlur={() => setRatingTouched(true)}
            onChange={(event) => setReportedCadr(event.target.value)}
          />
        </div>
      </div>
      <p id="room-area-hint" className="fine">{translate(language, "roomAreaHint")}</p>
      <p id="purifier-cadr-hint" className="fine">{translate(language, "purifierCadrHint")}</p>
      <div role="status" aria-live="polite">
        {cadr !== null && (
          <p><strong>{translate(language, "recommendedCadr")}: {Math.ceil(cadr)} m³/h</strong></p>
        )}
        {comparison && (
          <p>{comparison.kind === "meets"
            ? translate(language, "purifierMeets")
            : translate(language, "purifierBelow")}</p>
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
