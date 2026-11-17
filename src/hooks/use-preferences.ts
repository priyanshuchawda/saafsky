"use client";
import { useSyncExternalStore } from "react";
import type { City } from "@/types/air";

const defaultCity: City = {
  name: "Delhi",
  country: "India",
  latitude: 28.6519,
  longitude: 77.2315,
};
const defaultCityJson = JSON.stringify(defaultCity);
const cityKey = "saafsky:city";
const sensitiveKey = "saafsky:sensitive";
const eventName = "saafsky:preferences";
let fallbackCity = defaultCityJson;
let fallbackSensitive = "false";

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
    return localStorage.getItem(cityKey) ?? fallbackCity;
  } catch {
    return fallbackCity;
  }
}
function readSensitive(): string {
  try {
    return sessionStorage.getItem(sensitiveKey) ?? fallbackSensitive;
  } catch {
    return fallbackSensitive;
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
export function clearPreferences(): void {
  fallbackCity = defaultCityJson;
  fallbackSensitive = "false";
  try {
    localStorage.removeItem(cityKey);
    sessionStorage.removeItem(sensitiveKey);
  } catch {
    /* Storage is optional. */
  }
  notify();
}
