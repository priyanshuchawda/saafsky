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
      <div className="hours">
        {upcoming.slice(0, 8).map(({ time, aqi }, index) => (
          <div key={`${time}-${index}`}>
            <span>{time.replace("T", " ").slice(5)}</span>
            <strong>{aqi ?? "—"}</strong>
            <small>{translate(language, "usAqi")}</small>
          </div>
        ))}
        {upcoming.length === 0 && <p>{translate(language, "noForecast")}</p>}
      </div>
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
