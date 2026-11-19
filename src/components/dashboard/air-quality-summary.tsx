import { ActionReason } from "@/components/action-reason";
import type { Recommendation } from "@/features/recommendations/engine";
import { category } from "@/lib/air";
import type { Air } from "@/types/air";
import {
  translate,
  translateText,
  type Language,
} from "@/features/i18n/messages";

type AirQualitySummaryProps = {
  cityName: string;
  aqi: number | null;
  current: Air["current"] | null;
  fresh: boolean;
  recommendations: Recommendation[];
  language: Language;
};

export function AirQualitySummary({
  cityName,
  aqi,
  current,
  fresh,
  recommendations,
  language,
}: AirQualitySummaryProps) {
  return (
    <section className="dashboard">
      <article className="aq">
        <p className="eyebrow">{translate(language, "currentAir")}</p>
        <div className="number">
          {aqi === null ? "—" : Math.round(aqi)}{" "}
          <small>{translate(language, "usAqi")}</small>
        </div>
        <strong className="category">
          {translateText(language, category(aqi))}
        </strong>
        <p>
          {translate(language, "modelEstimateFor")} {cityName}.{" "}
          {translate(language, "conditionsVary")}
        </p>
        <div className="pollutants">
          <div>
            PM2.5
            <strong>
              {fresh ? (current?.pm2_5 ?? "—") : "—"} <small>µg/m³</small>
            </strong>
          </div>
          <div>
            PM10
            <strong>
              {fresh ? (current?.pm10 ?? "—") : "—"} <small>µg/m³</small>
            </strong>
          </div>
        </div>
      </article>
      <article className="plan">
        <p className="eyebrow">{translate(language, "personalAirPlan")}</p>
        <h3>
          {translate(language, "littleActions")}
          <br />
          <em>{translate(language, "meaningfulCare")}</em>
        </h3>
        <p className="muted">{translate(language, "basedOnCurrent")}</p>
        <ol>
          {recommendations.map((item, index) => (
            <li key={item.id}>
              <span>0{index + 1}</span>
              <div>
                <strong>{translateText(language, item.title)}</strong>
                <p>{translateText(language, item.description)}</p>
                <ActionReason action={item} language={language} />
              </div>
            </li>
          ))}
        </ol>
        <p className="fine">{translate(language, "generalInformation")}</p>
      </article>
    </section>
  );
}
