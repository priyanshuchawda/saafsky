"use client";

import { LocationSearch } from "@/components/location-search";
import { parseCommuteMode } from "@/features/preferences/commute";
import { translate, type Language } from "@/features/i18n/messages";
import type { HouseholdProfile } from "@/features/recommendations/engine";
import type { City } from "@/types/air";

type ForecastRange = { start: string; end: string };

type PlannerControlsProps = {
  language: Language;
  profile: HouseholdProfile;
  onProfileChange(profile: HouseholdProfile): void;
  onCitySelect(city: City): void;
  start: string;
  onStartChange(value: string): void;
  end: string;
  onEndChange(value: string): void;
  durationHours: number;
  onDurationChange(hours: number): void;
  essential: boolean;
  onEssentialChange(essential: boolean): void;
  busyStart: string;
  onBusyStartChange(value: string): void;
  busyEnd: string;
  onBusyEndChange(value: string): void;
  suggestedRange: ForecastRange | null;
  onUseSuggestedRange(range: ForecastRange): void;
};

export function PlannerControls({
  language,
  profile,
  onProfileChange,
  onCitySelect,
  start,
  onStartChange,
  end,
  onEndChange,
  durationHours,
  onDurationChange,
  essential,
  onEssentialChange,
  busyStart,
  onBusyStartChange,
  busyEnd,
  onBusyEndChange,
  suggestedRange,
  onUseSuggestedRange,
}: PlannerControlsProps) {
  const partialCommitment = Boolean(busyStart) !== Boolean(busyEnd);
  const invalidCommitment = Boolean(
    busyStart && busyEnd && busyEnd <= busyStart,
  );

  return (
    <>
      <div className="toolbar impact-form">
        <LocationSearch onSelect={onCitySelect} />
        <div className="profile">
          <label htmlFor="plan-profile">
            {translate(language, "household")}
          </label>
          <select
            id="plan-profile"
            value={profile.sensitive ? "sensitive" : "general"}
            onChange={(event) =>
              onProfileChange({
                ...profile,
                sensitive: event.target.value === "sensitive",
              })
            }
          >
            <option value="general">
              {translate(language, "generalGuidance")}
            </option>
            <option value="sensitive">
              {translate(language, "sensitiveHousehold")}
            </option>
          </select>
        </div>
        <div className="profile">
          <label htmlFor="plan-commute">
            {translate(language, "commuteLabel")}
          </label>
          <select
            id="plan-commute"
            value={profile.commute}
            onChange={(event) =>
              onProfileChange({
                ...profile,
                commute:
                  parseCommuteMode(event.target.value) ?? profile.commute,
              })
            }
          >
            <option value="none">{translate(language, "noneSelected")}</option>
            <option value="walk">{translate(language, "walk")}</option>
            <option value="bike">{translate(language, "bicycle")}</option>
            <option value="public">
              {translate(language, "publicTransport")}
            </option>
            <option value="car">{translate(language, "car")}</option>
          </select>
        </div>
        <div className="profile">
          <label htmlFor="window-start">
            {translate(language, "earliestTime")}
          </label>
          <input
            id="window-start"
            type="datetime-local"
            value={start}
            onChange={(event) => onStartChange(event.target.value)}
          />
        </div>
        <div className="profile">
          <label htmlFor="window-end">
            {translate(language, "latestTime")}
          </label>
          <input
            id="window-end"
            type="datetime-local"
            value={end}
            onChange={(event) => onEndChange(event.target.value)}
          />
        </div>
        <div className="profile">
          <label htmlFor="activity-duration">
            {translate(language, "timeNeeded")}
          </label>
          <select
            id="activity-duration"
            value={durationHours}
            onChange={(event) => onDurationChange(Number(event.target.value))}
          >
            <option value={1}>{translate(language, "oneHour")}</option>
            <option value={2}>{translate(language, "twoHours")}</option>
            <option value={3}>{translate(language, "threeHours")}</option>
            <option value={4}>{translate(language, "fourHours")}</option>
          </select>
        </div>
        <div className="profile">
          <label htmlFor="activity-essential">
            {translate(language, "outingPostponed")}
          </label>
          <select
            id="activity-essential"
            value={essential ? "essential" : "flexible"}
            onChange={(event) =>
              onEssentialChange(event.target.value === "essential")
            }
          >
            <option value="flexible">
              {translate(language, "flexibleYes")}
            </option>
            <option value="essential">
              {translate(language, "essentialNo")}
            </option>
          </select>
        </div>
        <div className="profile">
          <label htmlFor="busy-start">
            {translate(language, "commitmentStart")}
          </label>
          <input
            id="busy-start"
            type="datetime-local"
            value={busyStart}
            aria-describedby={
              invalidCommitment
                ? "busy-help busy-error"
                : partialCommitment && !busyStart
                  ? "busy-help busy-missing"
                  : "busy-help"
            }
            aria-invalid={
              invalidCommitment || (partialCommitment && !busyStart)
            }
            onChange={(event) => onBusyStartChange(event.target.value)}
          />
        </div>
        <div className="profile">
          <label htmlFor="busy-end">
            {translate(language, "commitmentEnd")}
          </label>
          <input
            id="busy-end"
            type="datetime-local"
            value={busyEnd}
            aria-describedby={
              invalidCommitment
                ? "busy-help busy-error"
                : partialCommitment && !busyEnd
                  ? "busy-help busy-missing"
                  : "busy-help"
            }
            aria-invalid={invalidCommitment || (partialCommitment && !busyEnd)}
            onChange={(event) => onBusyEndChange(event.target.value)}
          />
        </div>
      </div>
      {suggestedRange && (
        <div className="planner-quick-range">
          <button
            className="action-button"
            type="button"
            onClick={() => onUseSuggestedRange(suggestedRange)}
          >
            {translate(language, "useForecastRange")}
          </button>
          <p className="fine">{translate(language, "forecastRangeHelp")}</p>
        </div>
      )}
      <p id="busy-help" className="fine">
        {translate(language, "commitmentHelp")}
      </p>
    </>
  );
}
