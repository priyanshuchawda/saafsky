import { parseCommuteMode } from "@/features/preferences/commute";
import { translate, type Language } from "@/features/i18n/messages";
import type { HouseholdProfile } from "@/features/recommendations/engine";

export function HouseholdSensitivitySelect({
  id,
  label,
  language,
  sensitive,
  onChange,
  generalValue = "general",
}: {
  id: string;
  label: string;
  language: Language;
  sensitive: boolean;
  onChange(sensitive: boolean): void;
  generalValue?: "general" | "adult";
}) {
  return (
    <div className="profile">
      <label htmlFor={id}>{label}</label>
      <select
        id={id}
        value={sensitive ? "sensitive" : generalValue}
        onChange={(event) => onChange(event.target.value === "sensitive")}
      >
        <option value={generalValue}>
          {translate(language, "generalGuidance")}
        </option>
        <option value="sensitive">
          {translate(language, "sensitiveHousehold")}
        </option>
      </select>
    </div>
  );
}

export function CommuteSelect({
  id,
  label,
  language,
  value,
  onChange,
}: {
  id: string;
  label: string;
  language: Language;
  value: HouseholdProfile["commute"];
  onChange(value: HouseholdProfile["commute"]): void;
}) {
  return (
    <div className="profile">
      <label htmlFor={id}>{label}</label>
      <select
        id={id}
        value={value}
        onChange={(event) => {
          const mode = parseCommuteMode(event.target.value);
          if (mode) onChange(mode);
        }}
      >
        <option value="none">{translate(language, "noneSelected")}</option>
        <option value="walk">{translate(language, "walk")}</option>
        <option value="bike">{translate(language, "bicycle")}</option>
        <option value="public">{translate(language, "publicTransport")}</option>
        <option value="car">{translate(language, "car")}</option>
      </select>
    </div>
  );
}
