"use client";

import { useEffect, useState } from "react";
import { isFresh } from "@/lib/freshness";
import { airResponseSchema } from "@/lib/schemas";
import type { Air, City } from "@/types/air";

type AirState =
  | { kind: "loading" }
  | { kind: "error" }
  | {
      kind: "success";
      data: Air;
      retrievedAt: string;
      fresh: boolean;
      checkedAt: number;
    };

export function useAirQuality(city: City): AirState {
  const key = `${city.latitude},${city.longitude}`;
  const [result, setResult] = useState<{ key: string; state: AirState }>({
    key,
    state: { kind: "loading" },
  });
  const state: AirState =
    result.key === key ? result.state : { kind: "loading" };
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/air?lat=${city.latitude}&lon=${city.longitude}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Air data unavailable");
        return airResponseSchema.parse(await response.json());
      })
      .then(({ data, retrievedAt }) => {
        const now = Date.now();
        if (!controller.signal.aborted)
          setResult({
            key,
            state: {
              kind: "success",
              data,
              retrievedAt,
              checkedAt: now,
              fresh: isFresh(
                retrievedAt,
                data.current.time,
                data.utc_offset_seconds,
                now,
              ),
            },
          });
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setResult({ key, state: { kind: "error" } });
      });
    return () => controller.abort();
  }, [city.latitude, city.longitude, key]);
  useEffect(() => {
    const state = result.key === key ? result.state : null;
    if (!state || state.kind !== "success" || !state.fresh) return;
    const timer = window.setInterval(() => {
      const now = Date.now();
      setResult((previous) =>
        previous.key === key && previous.state.kind === "success"
          ? {
              ...previous,
              state: {
                ...previous.state,
                checkedAt: now,
                fresh: isFresh(
                  previous.state.retrievedAt,
                  previous.state.data.current.time,
                  previous.state.data.utc_offset_seconds,
                  now,
                ),
              },
            }
          : previous,
      );
    }, 60_000);
    return () => window.clearInterval(timer);
  }, [result, key]);
  return state;
}
