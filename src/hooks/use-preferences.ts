"use client";
import { useSyncExternalStore } from "react";
import type { City } from "@/types/air";
import type { HouseholdProfile } from "@/features/recommendations/engine";
import type { Language } from "@/features/i18n/messages";
import {
  parseStoredCity,
  parseStoredHousehold,
} from "@/features/preferences/parse";

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
const languageKey = "saafsky:language";
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
let fallbackLanguage: Language = "en";

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
function readLanguage(): Language {
  try {
    const value = localStorage.getItem(languageKey);
    return value === "hi" ? "hi" : "en";
  } catch {
    return fallbackLanguage;
  }
}
function notify(): void {
  window.dispatchEvent(new Event(eventName));
}
export function useCity(): [City, (city: City) => void, boolean] {
  const ready = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const value = useSyncExternalStore(
    subscribe,
    readCity,
    () => defaultCityJson,
  );
  const city = parseStoredCity(value) ?? defaultCity;
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
    ready,
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
  const rest = parseStoredHousehold(raw) ?? defaultHousehold;
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
export function useLanguage(): [Language, (language: Language) => void] {
  const language = useSyncExternalStore<Language>(
    subscribe,
    readLanguage,
    () => "en",
  );
  return [
    language,
    (next) => {
      fallbackLanguage = next;
      try {
        localStorage.setItem(languageKey, next);
      } catch {
        /* Use in-memory state. */
      }
      notify();
    },
  ];
}
export function clearPreferences(): void {
  fallbackCity = defaultCityJson;
  fallbackSensitive = "false";
  fallbackHousehold = defaultHouseholdJson;
  fallbackLanguage = "en";
  try {
    localStorage.removeItem(cityKey);
    localStorage.removeItem(languageKey);
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
