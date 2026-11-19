import Link from "next/link";
import { translate, translateText, type Language } from "@/features/i18n/messages";

type LowestForecast = { time: string; aqi: number } | null;
type ForecastEntry = { time: string; aqi: number | null };

type ForecastSectionProps = {
  cityName: string;
  timezone: string | undefined;
  currentModelTime: string | undefined;
  retrievedAt: string;
  upcoming: ForecastEntry[];
  lowest: LowestForecast;
  language: Language;
};

export function ForecastSection({
  cityName,
  timezone,
  currentModelTime,
  retrievedAt,
  upcoming,
  lowest,
  language,
}: ForecastSectionProps) {
  const visible = upcoming.slice(0, 8);
  const values = visible.flatMap(({ aqi }) =>
    aqi !== null && Number.isFinite(aqi) && aqi >= 0 ? [aqi] : [],
  );
  const scaleMax = Math.max(50, Math.ceil(Math.max(0, ...values) / 50) * 50);
  return (
    <section>
      <div className="heading">
        <div>
          <p className="eyebrow">{translate(language, "lookingAhead")}</p>
          <h2>{translate(language, "hoursAhead")}</h2>
        </div>
        <p>{translate(language, "forecast")} · {timezone ?? translate(language, "localTime")}</p>
      </div>
      {lowest && (
        <p className="forecast-note">
          {translate(language, "lowestForecast")}{" "}
          <strong>{lowest.time.replace("T", " ")}</strong> · US AQI{" "}
          {Math.round(lowest.aqi)}. {translate(language, "comparisonNotGuarantee")}
        </p>
      )}
      {visible.length > 0 ? (
        <>
          {values.length > 0 && <p className="fine forecast-scale">{translate(language, "trendScale").replace("{max}", String(scaleMax))}</p>}
          <ol className="hours" aria-label={translate(language, "hourlyTrend")}>
            {visible.map(({ time, aqi }, index) => (
              <li key={`${time}-${index}`}>
                <span>{time.replace("T", " ").slice(5)}</span>
                <div className="forecast-bar-track" aria-hidden="true">
                  {aqi !== null && Number.isFinite(aqi) && aqi >= 0 && (
                    <div className="forecast-bar" style={{ height: `${(aqi / scaleMax) * 100}%` }} />
                  )}
                </div>
                <strong aria-label={aqi === null ? translateText(language, "Unavailable") : undefined}>{aqi ?? "—"}</strong>
                <small>{translate(language, "usAqi")}</small>
              </li>
            ))}
          </ol>
          <p><Link className="forecast-planner-link" href="/planner">{translate(language, "planOuting")}</Link></p>
        </>
      ) : <p>{translate(language, "noForecast")}</p>}
      <p className="fine">
        {translate(language, "source")}{" "}
        <a href="https://open-meteo.com/en/docs/air-quality-api">Open-Meteo</a>
        {" / "}
        <a href="https://atmosphere.copernicus.eu/">
          Copernicus Atmosphere Monitoring Service (CAMS)
        </a>
        . {translate(language, "forecastTime")} {currentModelTime?.replace("T", " ") ?? translateText(language, "unavailable")}.
        {" "}{translate(language, "retrieved")}{" "}
        {retrievedAt
          ? new Date(retrievedAt).toLocaleString(language === "hi" ? "hi-IN" : "en-US")
          : translateText(language, "unavailable")}
        .
        {" "}{translate(language, "forecastEstimate")} {cityName}.
      </p>
    </section>
  );
}
