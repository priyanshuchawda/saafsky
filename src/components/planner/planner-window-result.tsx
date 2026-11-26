import { translateAqiCategory } from "@/features/i18n/aqi";
import { displayCity } from "@/features/i18n/city";
import { localizeAirError } from "@/features/i18n/errors";
import { translate, type Language } from "@/features/i18n/messages";
import type { ActivityWindow } from "@/features/planner/activity-window";
import type { Air, City } from "@/types/air";
import type { AirQualityState } from "@/hooks/use-air-quality";

type PlannerWindowResultProps = {
  language: Language;
  city: City | null;
  cityReady: boolean;
  state: AirQualityState;
  air: Air | null;
  result: ActivityWindow;
  partialCommitment: boolean;
  invalidCommitment: boolean;
  start: string;
  end: string;
};

export function PlannerWindowResult({
  language,
  city,
  cityReady,
  state,
  air,
  result,
  partialCommitment,
  invalidCommitment,
  start,
  end,
}: PlannerWindowResultProps) {
  const cityName = cityReady && city ? displayCity(city, language) : "…";
  return (
    <section className="plan scenario-result">
      <p className="eyebrow">
        {translate(language, "forecastFor")} {cityName.toUpperCase()}
      </p>
      <h2>
        {translate(language, "availableWindow")}{" "}
        <em>{translate(language, "window")}</em>
      </h2>
      <p className="muted">
        {translate(language, "enterTimesIn")}{" "}
        {air?.timezone ?? translate(language, "localTime")}.{" "}
        {translate(language, "forecastWindowInputHint")}
      </p>
      {state.kind === "loading" && (
        <p role="status">{translate(language, "loadingForecast")}</p>
      )}
      {state.kind === "error" && (
        <p role="status">{localizeAirError(language, state.rateLimit)}</p>
      )}
      {state.kind === "success" && !state.fresh && (
        <p role="status">{translate(language, "forecastStale")}</p>
      )}
      {partialCommitment && (
        <p id="busy-missing">
          {translate(language, "enterBothCommitmentTimes")}
        </p>
      )}
      {invalidCommitment && (
        <p id="busy-error">{translate(language, "commitmentEndAfterStart")}</p>
      )}
      {air &&
        !partialCommitment &&
        !invalidCommitment &&
        start &&
        end &&
        (result.kind === "available" || result.kind === "elevated" ? (
          <p>
            {result.kind === "elevated"
              ? translate(language, "allOptionsAboveThreshold")
              : translate(language, "lowestPeak")}{" "}
            <strong>
              {result.start.replace("T", " ")}–{result.end.replace("T", " ")}
            </strong>{" "}
            · {translate(language, "peakUsAqi")} {Math.round(result.peakAqi)}(
            {translateAqiCategory(language, result.peakAqi)}).{" "}
            {translate(language, "estimateNotSafe")}
          </p>
        ) : result.kind === "no-suitable" ? (
          <p>{translate(language, "completeWindowsElevated")}</p>
        ) : (
          <p>{translate(language, "completeWindow")}</p>
        ))}
      <p className="fine">{translate(language, "plannerModelNote")}</p>
    </section>
  );
}
