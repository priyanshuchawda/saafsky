"use client";
import { useSyncExternalStore } from "react";
import type { City } from "@/types/air";
import type { HouseholdProfile } from "@/features/recommendations/engine";

const defaultCity: City = {
  name: "Delhi",
  country: "India",
  latitude: 28.6519,
  longitude: 77.2315,
};
const defaultCityJson = JSON.stringify(defaultCity);
const cityKey = "saafsky:city";
const sensitiveKey = "saafsky:sensitive";
const householdKey = "saafsky:household";
const eventName = "saafsky:preferences";
let fallbackCity = defaultCityJson;
let fallbackSensitive = "false";
const defaultHousehold = {
  children: false,
  outdoorExercise: false,
  commute: "none",
  cookingSmoke: false,
} as const;
const defaultHouseholdJson = JSON.stringify(defaultHousehold);
let fallbackHousehold = defaultHouseholdJson;

function subscribe(callback: () => void): () => void {
  window.addEventListener("storage", callback);
  window.addEventListener(eventName, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(eventName, callback);
  };
}
function readCity(): string {
  try {
    return localStorage.getItem(cityKey) ?? defaultCityJson;
  } catch {
    return fallbackCity;
  }
}
function readSensitive(): string {
  try {
    return sessionStorage.getItem(sensitiveKey) ?? "false";
  } catch {
    return fallbackSensitive;
  }
}
function readHousehold(): string {
  try {
    return sessionStorage.getItem(householdKey) ?? defaultHouseholdJson;
  } catch {
    return fallbackHousehold;
  }
}
function notify(): void {
  window.dispatchEvent(new Event(eventName));
}
export function useCity(): [City, (city: City) => void] {
  const value = useSyncExternalStore(
    subscribe,
    readCity,
    () => defaultCityJson,
  );
  let city = defaultCity;
  try {
    const item: unknown = JSON.parse(value);
    if (
      item &&
      typeof item === "object" &&
      "name" in item &&
      typeof item.name === "string" &&
      item.name.length <= 100 &&
      "latitude" in item &&
      typeof item.latitude === "number" &&
      Number.isFinite(item.latitude) &&
      Math.abs(item.latitude) <= 90 &&
      "longitude" in item &&
      typeof item.longitude === "number" &&
      Number.isFinite(item.longitude) &&
      Math.abs(item.longitude) <= 180
    )
      city = {
        name: item.name,
        latitude: item.latitude,
        longitude: item.longitude,
      };
  } catch {
    /* Use the default if stored data is malformed. */
  }
  return [
    city,
    (next) => {
      fallbackCity = JSON.stringify(next);
      try {
        localStorage.setItem(cityKey, fallbackCity);
      } catch {
        /* Use in-memory state. */
      }
      notify();
    },
  ];
}
export function useSensitivity(): [boolean, (sensitive: boolean) => void] {
  const value = useSyncExternalStore(subscribe, readSensitive, () => "false");
  return [
    value === "true",
    (next) => {
      fallbackSensitive = String(next);
      try {
        sessionStorage.setItem(sensitiveKey, fallbackSensitive);
      } catch {
        /* Use in-memory state. */
      }
      notify();
    },
  ];
}
export function useHousehold(): [
  HouseholdProfile,
  (profile: HouseholdProfile) => void,
] {
  const [sensitive, setSensitive] = useSensitivity();
  const raw = useSyncExternalStore(
    subscribe,
    readHousehold,
    () => defaultHouseholdJson,
  );
  let rest: Omit<HouseholdProfile, "sensitive"> = defaultHousehold;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === "object" &&
      "children" in parsed &&
      typeof parsed.children === "boolean" &&
      "outdoorExercise" in parsed &&
      typeof parsed.outdoorExercise === "boolean" &&
      "cookingSmoke" in parsed &&
      typeof parsed.cookingSmoke === "boolean" &&
      "commute" in parsed &&
      typeof parsed.commute === "string" &&
      ["none", "walk", "bike", "public", "car"].includes(parsed.commute)
    ) {
      rest = {
        children: parsed.children,
        outdoorExercise: parsed.outdoorExercise,
        cookingSmoke: parsed.cookingSmoke,
        commute: parsed.commute as HouseholdProfile["commute"],
      };
    }
  } catch {
    /* Invalid stored preferences revert to safe defaults. */
  }
  return [
    { ...rest, sensitive },
    (profile) => {
      const { sensitive: nextSensitive, ...other } = profile;
      fallbackHousehold = JSON.stringify(other);
      try {
        sessionStorage.setItem(householdKey, fallbackHousehold);
      } catch {
        /* Use in-memory state. */
      }
      setSensitive(nextSensitive);
    },
  ];
}
export function clearPreferences(): void {
  fallbackCity = defaultCityJson;
  fallbackSensitive = "false";
  fallbackHousehold = defaultHouseholdJson;
  try {
    localStorage.removeItem(cityKey);
  } catch {
    /* Storage is optional. */
  }
  try {
    sessionStorage.removeItem(sensitiveKey);
    sessionStorage.removeItem(householdKey);
  } catch {
    /* Storage is optional. */
  }
  notify();
}
