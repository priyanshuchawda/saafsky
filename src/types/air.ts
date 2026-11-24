import type { z } from "zod";
import type {
  airSchema,
  airResponseSchema,
  locationSchema,
} from "@/lib/schemas";

export type Air = z.infer<typeof airSchema>;
export type AirResponse = z.infer<typeof airResponseSchema>;
export type City = NonNullable<
  z.infer<typeof locationSchema>["results"]
>[number];
