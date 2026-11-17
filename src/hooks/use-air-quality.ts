"use client";

import { useEffect, useState } from "react";
import { isFresh } from "@/lib/freshness";
import type { Air, City } from "@/types/air";

type AirState =
  | { kind: "loading" }
  | { kind: "error" }
  | { kind: "success"; data: Air; retrievedAt: string; fresh: boolean };

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
        return response.json() as Promise<{ data: Air; retrievedAt: string }>;
      })
      .then(({ data, retrievedAt }) => {
        if (!controller.signal.aborted)
          setResult({
            key,
            state: {
              kind: "success",
              data,
              retrievedAt,
              fresh: isFresh(
                retrievedAt,
                data.current.time,
                data.utc_offset_seconds,
                Date.now(),
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
      if (
        !isFresh(
          state.retrievedAt,
          state.data.current.time,
          state.data.utc_offset_seconds,
          Date.now(),
        )
      ) {
        setResult((previous) =>
          previous.key === key && previous.state.kind === "success"
            ? { ...previous, state: { ...previous.state, fresh: false } }
            : previous,
        );
      }
    }, 60_000);
    return () => window.clearInterval(timer);
  }, [result, key]);
  return state;
}
