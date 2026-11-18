import { z } from "zod";

const pollutant = z.number().finite().nonnegative().nullable();
const localTimestamp = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)
  .refine((value) => {
    const instant = Date.parse(`${value}:00Z`);
    return (
      Number.isFinite(instant) &&
      new Date(instant).toISOString().slice(0, 16) === value
    );
  }, "Invalid forecast timestamp");
const timeZone = z
  .string()
  .min(1)
  .max(100)
  .refine((value) => {
    try {
      new Intl.DateTimeFormat("en", { timeZone: value });
      return true;
    } catch {
      return false;
    }
  }, "Invalid time zone");
export const householdSchema = z
  .object({
    sensitive: z.boolean(),
    children: z.boolean(),
    outdoorExercise: z.boolean(),
    commute: z.enum(["none", "walk", "bike", "public", "car"]),
    cookingSmoke: z.boolean(),
  })
  .strict();
export const chatInputSchema = z
  .object({
    question: z.string().trim().min(1).max(500),
    latitude: z.number().finite().min(-90).max(90),
    longitude: z.number().finite().min(-180).max(180),
    profile: householdSchema,
    language: z.enum(["en", "hi"]).default("en"),
    history: z
      .array(
        z
          .object({
            role: z.enum(["user", "assistant"]),
            text: z.string().max(500),
          })
          .strict(),
      )
      .max(4)
      .default([]),
  })
  .strict();
export const airSchema = z
  .object({
    timezone: timeZone,
    utc_offset_seconds: z.number().int().min(-50400).max(50400),
    current: z.object({
      time: localTimestamp,
      us_aqi: pollutant,
      pm2_5: pollutant,
      pm10: pollutant,
    }),
    hourly: z.object({
      time: z.array(localTimestamp).max(72),
      us_aqi: z.array(pollutant).max(72),
    }),
  })
  .refine(
    (data) => data.hourly.time.length === data.hourly.us_aqi.length,
    "Hourly series must have equal lengths",
  );
export const airResponseSchema = z.object({
  data: airSchema,
  retrievedAt: z.iso.datetime(),
});
export const locationSchema = z.object({
  results: z
    .array(
      z.object({
        name: z.string().min(1).max(100),
        country: z.string().max(100).optional(),
        admin1: z.string().max(100).optional(),
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
      }),
    )
    .max(8)
    .optional(),
});
