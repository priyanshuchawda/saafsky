import { z } from "zod";
import type { City } from "../../types/air.ts";
import type { HouseholdProfile } from "../recommendations/engine.ts";

const storedCitySchema = z.object({
  name: z
    .string()
    .max(100)
    .refine((value) => value.trim().length > 0),
  latitude: z.number().finite().min(-90).max(90),
  longitude: z.number().finite().min(-180).max(180),
  country: z.unknown().optional(),
  admin1: z.unknown().optional(),
});

const storedHouseholdSchema = z.object({
  children: z.boolean(),
  outdoorExercise: z.boolean(),
  cookingSmoke: z.boolean(),
  commute: z.enum(["none", "walk", "bike", "public", "car"]),
});

function readJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** Parse persisted data independently from browser storage and React. */
export function parseStoredCity(raw: string): City | null {
  const parsed = storedCitySchema.safeParse(readJson(raw));
  if (!parsed.success) return null;
  const { name, latitude, longitude, country, admin1 } = parsed.data;
  return {
    name,
    latitude,
    longitude,
    ...(typeof country === "string" && country.length <= 100
      ? { country }
      : {}),
    ...(typeof admin1 === "string" && admin1.length <= 100 ? { admin1 } : {}),
  };
}

export function parseStoredHousehold(
  raw: string,
): Omit<HouseholdProfile, "sensitive"> | null {
  const parsed = storedHouseholdSchema.safeParse(readJson(raw));
  return parsed.success ? parsed.data : null;
}
