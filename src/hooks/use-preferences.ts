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
const defaultHousehold = {
  children: false,
  outdoorExercise: false,
  commute: "none",
  cookingSmoke: false,
} as const;
const defaultHouseholdJson = JSON.stringify(defaultHousehold);
const memoryValues = new Map<string, string>();
const unsavedKeys = new Set<string>();

function subscribe(callback: () => void): () => void {
  window.addEventListener("storage", callback);
  window.addEventListener(eventName, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(eventName, callback);
  };
}
type StorageAccess = () => Storage;
const local = (): Storage => localStorage;
const session = (): Storage => sessionStorage;

/** A failed write must not be overwritten by a later successful read. */
function readPreference(
  storage: StorageAccess,
  key: string,
  fallback: string,
): string {
  if (unsavedKeys.has(key)) return memoryValues.get(key) ?? fallback;
  try {
    return storage().getItem(key) ?? fallback;
  } catch {
    return memoryValues.get(key) ?? fallback;
  }
}

function writePreference(
  storage: StorageAccess,
  key: string,
  value: string,
): void {
  memoryValues.set(key, value);
  try {
    storage().setItem(key, value);
    unsavedKeys.delete(key);
  } catch {
    unsavedKeys.add(key);
  }
}

function removePreference(
  storage: StorageAccess,
  key: string,
  fallback: string,
): void {
  memoryValues.set(key, fallback);
  try {
    storage().removeItem(key);
    unsavedKeys.delete(key);
  } catch {
    unsavedKeys.add(key);
  }
}

function readCity(): string {
  return readPreference(local, cityKey, defaultCityJson);
}
function readSensitive(): string {
  return readPreference(session, sensitiveKey, "false");
}
function readHousehold(): string {
  return readPreference(session, householdKey, defaultHouseholdJson);
}
function readLanguage(): Language {
  return readPreference(local, languageKey, "en") === "hi" ? "hi" : "en";
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
      writePreference(local, cityKey, JSON.stringify(next));
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
      writePreference(session, sensitiveKey, String(next));
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
      writePreference(session, householdKey, JSON.stringify(other));
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
      writePreference(local, languageKey, next);
      notify();
    },
  ];
}
export function clearPreferences(): void {
  removePreference(local, cityKey, defaultCityJson);
  removePreference(local, languageKey, "en");
  removePreference(session, sensitiveKey, "false");
  removePreference(session, householdKey, defaultHouseholdJson);
  notify();
}
