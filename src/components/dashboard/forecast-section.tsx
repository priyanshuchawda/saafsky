type LowestForecast = { time: string; aqi: number } | null;
type ForecastEntry = { time: string; aqi: number | null };

type ForecastSectionProps = {
  cityName: string;
  timezone: string | undefined;
  currentModelTime: string | undefined;
  retrievedAt: string;
  upcoming: ForecastEntry[];
  lowest: LowestForecast;
};

export function ForecastSection({
  cityName,
  timezone,
  currentModelTime,
  retrievedAt,
  upcoming,
  lowest,
}: ForecastSectionProps) {
  return (
    <section>
      <div className="heading">
        <div>
          <p className="eyebrow">LOOKING AHEAD</p>
          <h2>The hours ahead ↗</h2>
        </div>
        <p>Forecast · {timezone ?? "local time"}</p>
      </div>
      {lowest && (
        <p className="forecast-note">
          Lowest forecast among the next 24 available hourly periods:{" "}
          <strong>{lowest.time.replace("T", " ")}</strong> · US AQI{" "}
          {Math.round(lowest.aqi)}. This is a comparison, not a guarantee of
          safe conditions.
        </p>
      )}
      <div className="hours">
        {upcoming.slice(0, 8).map(({ time, aqi }, index) => (
          <div key={`${time}-${index}`}>
            <span>{time.replace("T", " ").slice(5)}</span>
            <strong>{aqi ?? "—"}</strong>
            <small>US AQI</small>
          </div>
        ))}
        {upcoming.length === 0 && <p>No upcoming forecast available.</p>}
      </div>
      <p className="fine">
        Source:{" "}
        <a href="https://open-meteo.com/en/docs/air-quality-api">Open-Meteo</a>
        {" / "}
        <a href="https://atmosphere.copernicus.eu/">
          Copernicus Atmosphere Monitoring Service (CAMS)
        </a>
        . Forecast time: {currentModelTime?.replace("T", " ") ?? "unavailable"}.
        Retrieved:{" "}
        {retrievedAt
          ? new Date(retrievedAt).toLocaleString()
          : "unavailable"}
        .
        Forecasts are estimates, not local sensor measurements for {cityName}.
      </p>
    </section>
  );
}
