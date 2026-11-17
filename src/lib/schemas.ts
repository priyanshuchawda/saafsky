import { z } from "zod";

const pollutant = z.number().finite().nonnegative().nullable();
export const householdSchema = z
  .object({
    sensitive: z.boolean(),
    children: z.boolean(),
    outdoorExercise: z.boolean(),
    commute: z.enum(["none", "walk", "bike", "public", "car"]),
    cookingSmoke: z.boolean(),
  })
  .strict();
export const airSchema = z
  .object({
    timezone: z.string(),
    utc_offset_seconds: z.number().int().min(-50400).max(50400),
    current: z.object({
      time: z.string(),
      us_aqi: pollutant,
      pm2_5: pollutant,
      pm10: pollutant,
    }),
    hourly: z.object({ time: z.array(z.string()), us_aqi: z.array(pollutant) }),
  })
  .refine(
    (data) => data.hourly.time.length === data.hourly.us_aqi.length,
    "Hourly series must have equal lengths",
  );
export const locationSchema = z.object({
  results: z
    .array(
      z.object({
        name: z.string(),
        country: z.string().optional(),
        admin1: z.string().optional(),
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
      }),
    )
    .optional(),
});
