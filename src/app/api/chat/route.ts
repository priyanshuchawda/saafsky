import { NextResponse } from "next/server";
import { z } from "zod";
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
import { loadAir } from "@/server/air-provider";
import { isFresh } from "@/lib/freshness";
import { generateRecommendations } from "@/features/recommendations/engine";
import { explainPlan } from "@/server/chat";
import { allowPublicRequest } from "@/server/rate-limit";
import { readBoundedJson, RequestBodyTooLarge } from "@/lib/request-body";
import { householdSchema } from "@/lib/schemas";

const input = z
  .object({
    question: z.string().trim().min(1).max(500),
    latitude: z.number().finite().min(-90).max(90),
    longitude: z.number().finite().min(-180).max(180),
    profile: householdSchema,
  })
  .strict();
export async function POST(request: Request) {
  let parsed;
  try {
    parsed = input.safeParse(await readBoundedJson(request, 4096));
  } catch (error) {
    if (error instanceof RequestBodyTooLarge)
      return NextResponse.json({ error: "Request too large" }, { status: 413 });
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  if (!(await allowPublicRequest("chat")))
    return NextResponse.json(
      { error: "Request limit reached or protection unavailable." },
      { status: 503 },
    );
  const { question, latitude, longitude, profile } = parsed.data;
  let aqi: number | null = null;
  try {
    const { data, retrievedAt } = await loadAir(
      Math.round(latitude * 1000) / 1000,
      Math.round(longitude * 1000) / 1000,
    );
    if (
      isFresh(
        retrievedAt,
        data.current.time,
        data.utc_offset_seconds,
        Date.now(),
      )
    )
      aqi = data.current.us_aqi;
  } catch {
    /* Deterministic fallback handles missing environmental data. */
  }
  const actions = generateRecommendations(aqi, profile);
  const fallback = {
    answer: actions.map((action) => action.description).join(" "),
    referencedActionIds: actions.map((action) => action.id),
    uncertainty: "AI explanation is unavailable; this is the rule-based plan.",
    mode: "fallback",
  };
  if (
    aqi === null ||
    !process.env.GEMINI_API_KEY ||
    !process.env.UPSTASH_REDIS_REST_URL ||
    !process.env.UPSTASH_REDIS_REST_TOKEN
  )
    return NextResponse.json(fallback);
  try {
    const redis = Redis.fromEnv();
    const daily = new Ratelimit({
      redis,
      limiter: Ratelimit.fixedWindow(20, "1 d"),
      prefix: "saafsky:chat:day",
    });
    const minute = new Ratelimit({
      redis,
      limiter: Ratelimit.fixedWindow(3, "1 m"),
      prefix: "saafsky:chat:minute",
    });
    const [day, short] = await Promise.all([
      daily.limit("global"),
      minute.limit("global"),
    ]);
    if (!day.success || !short.success) return NextResponse.json(fallback);
    return NextResponse.json({
      ...(await explainPlan(question, aqi, actions)),
      mode: "ai",
    });
  } catch {
    return NextResponse.json(fallback);
  }
}
