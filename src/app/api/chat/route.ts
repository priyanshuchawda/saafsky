import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
import { loadAir } from "@/server/air-provider";
import { isFresh } from "@/lib/freshness";
import { createAssistantReply } from "@/features/assistant/orchestrate";
import { buildForecastContext } from "@/features/assistant/forecast-context";
import type { ForecastContext } from "@/features/assistant/forecast-context";
import { explainPlan } from "@/server/chat";
import { checkPublicRequest } from "@/server/rate-limit";
import { rateLimitResponse } from "@/server/rate-limit-result";
import { decideLimits } from "@/server/rate-limit-result";
import { readBoundedJson, RequestBodyTooLarge } from "@/lib/request-body";
import { hasAllowedJsonOrigin } from "@/lib/request-origin";
import { chatInputSchema } from "@/lib/schemas";
import { reportServiceFailure } from "@/server/diagnostics";

function privateJson(body: unknown, status = 200): NextResponse {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(request: Request) {
  if (!hasAllowedJsonOrigin(request))
    return privateJson(
      { error: "Invalid request origin or content type." },
      403,
    );
  let parsed;
  try {
    parsed = chatInputSchema.safeParse(await readBoundedJson(request, 12_288));
  } catch (error) {
    if (error instanceof RequestBodyTooLarge)
      return privateJson({ error: "Request too large" }, 413);
    return privateJson({ error: "Invalid request" }, 400);
  }
  if (!parsed.success) return privateJson({ error: "Invalid request" }, 400);
  const protection = await checkPublicRequest("chat", request);
  if (!protection.allowed) {
    const response = rateLimitResponse(protection);
    response.headers.set("Cache-Control", "no-store");
    return response;
  }
  const { question, latitude, longitude, profile, history, language } =
    parsed.data;
  let forecast: ForecastContext | null = null;
  const getAqi = async (): Promise<number | null> => {
    const { data, retrievedAt } = await loadAir(
      Math.round(latitude * 1000) / 1000,
      Math.round(longitude * 1000) / 1000,
    );
    const now = Date.now();
    if (isFresh(retrievedAt, data.current.time, data.utc_offset_seconds, now)) {
      forecast = buildForecastContext(data, now);
      return data.current.us_aqi;
    }
    return null;
  };
  const checkAiBudget = async (): Promise<boolean> => {
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
    return decideLimits([day, short], Date.now()).allowed;
  };
  return privateJson(
    await createAssistantReply(profile, {
      onFailure: reportServiceFailure,
      language,
      getAqi,
      aiConfigured: Boolean(
        process.env.GEMINI_API_KEY &&
        process.env.UPSTASH_REDIS_REST_URL &&
        process.env.UPSTASH_REDIS_REST_TOKEN,
      ),
      checkAiBudget,
      explain: (aqi, actions) =>
        explainPlan(
          question,
          aqi,
          actions,
          history,
          checkAiBudget,
          forecast,
          language,
        ),
    }),
  );
}
