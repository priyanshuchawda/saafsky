import { ActionReason } from "@/components/action-reason";
import type { Recommendation } from "@/features/recommendations/engine";
import { category } from "@/lib/air";
import type { Air } from "@/types/air";

type AirQualitySummaryProps = {
  cityName: string;
  aqi: number | null;
  current: Air["current"] | null;
  fresh: boolean;
  recommendations: Recommendation[];
};

export function AirQualitySummary({
  cityName,
  aqi,
  current,
  fresh,
  recommendations,
}: AirQualitySummaryProps) {
  return (
    <section className="dashboard">
      <article className="aq">
        <p className="eyebrow">CURRENT AIR QUALITY</p>
        <div className="number">
          {aqi === null ? "—" : Math.round(aqi)} <small>US AQI</small>
        </div>
        <strong className="category">{category(aqi)}</strong>
        <p>
          Model estimate for {cityName}. Conditions can vary across your city.
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
        <p className="eyebrow">YOUR PERSONAL AIR PLAN ✳</p>
        <h3>
          Little actions,
          <br />
          <em>meaningful care.</em>
        </h3>
        <p className="muted">
          Based on the current estimate and your household selection.
        </p>
        <ol>
          {recommendations.map((item, index) => (
            <li key={item.id}>
              <span>0{index + 1}</span>
              <div>
                <strong>{item.title}</strong>
                <p>{item.description}</p>
                <ActionReason action={item} />
              </div>
            </li>
          ))}
        </ol>
        <p className="fine">
          General information, not a diagnosis. Follow your clinician’s advice
          when applicable.
        </p>
      </article>
    </section>
  );
}
