"use client";

import Link from "next/link";
import { commuteAirContext } from "@/features/sustainability/exposure";
import { displayCity } from "@/features/i18n/city";
import { translate, type Language } from "@/features/i18n/messages";
import { useAirQuality } from "@/hooks/use-air-quality";
import { useCity, useHousehold } from "@/hooks/use-preferences";
import { translateAqiCategory } from "@/features/i18n/aqi";

export function CommuteAirContext({ language }: { language: Language }) {
  const [city, , cityReady] = useCity();
  const [household] = useHousehold();
  const air = useAirQuality(cityReady ? city : null);
  const aqi =
    air.kind === "success" && air.fresh ? air.data.current.us_aqi : null;
  const context = commuteAirContext(
    aqi,
    household.sensitive || household.children,
  );
  const messageKey = {
    unknown: "commuteAirUnknown",
    general: "commuteAirGeneral",
    caution: "commuteAirCaution",
    elevated: "commuteAirElevated",
  } as const;

  return (
    <section
      className="plan scenario-result"
      aria-labelledby="commute-air-heading"
    >
      <p className="eyebrow">{translate(language, "commuteAirEyebrow")}</p>
      <h2 id="commute-air-heading">{translate(language, "commuteAirTitle")}</h2>
      <div role="status">
        {air.kind === "loading" ? (
          <p>{translate(language, "commuteAirLoading")}</p>
        ) : (
          <>
            {aqi !== null && context !== "unknown" && (
              <p>
                <strong>
                  {translate(language, "commuteAirCurrent").replace(
                    "{city}",
                    displayCity(city, language),
                  )}{" "}
                  {Math.round(aqi)} · {translateAqiCategory(language, aqi)}
                </strong>
              </p>
            )}
            <p>{translate(language, messageKey[context])}</p>
          </>
        )}
      </div>
      <p className="fine">{translate(language, "commuteAirModel")}</p>
      <p className="fine">
        <a href="https://www.airnow.gov/aqi/aqi-basics/">AirNow</a>
        {" · "}
        <a href="https://www.epa.gov/air-research/research-near-roadway-and-other-near-source-air-pollution">
          US EPA
        </a>
        {" · "}
        <Link href="/planner">{translate(language, "planner")}</Link>
      </p>
    </section>
  );
}
