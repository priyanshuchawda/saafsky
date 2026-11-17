import type { z } from "zod";
import type { airSchema, locationSchema } from "@/lib/schemas";

export type Air = z.infer<typeof airSchema>;
export type City = NonNullable<
  z.infer<typeof locationSchema>["results"]
>[number];
