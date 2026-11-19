"use client";

import { useEffect, useState } from "react";
import { isFresh } from "@/lib/freshness";
import { airResponseSchema } from "@/lib/schemas";
import { RateLimitError, throwIfHttpError } from "@/lib/api-errors";
import type { Air, City } from "@/types/air";

const REFRESH_INTERVAL_MS = 30 * 60_000;

type AirState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | {
      kind: "success";
      data: Air;
      retrievedAt: string;
      fresh: boolean;
      checkedAt: number;
    };

export function useAirQuality(city: City | null): AirState {
  const latitude = city?.latitude;
  const longitude = city?.longitude;
  const key = latitude !== undefined && longitude !== undefined ? `${latitude},${longitude}` : "pending";
  const [result, setResult] = useState<{ key: string; state: AirState }>({
    key,
    state: { kind: "loading" },
  });
  const state: AirState =
    result.key === key ? result.state : { kind: "loading" };
  useEffect(() => {
    if (latitude === undefined || longitude === undefined) return;
    let controller: AbortController | null = null;
    let lastAttempt = 0;
    let disposed = false;
    function refresh() {
      if (disposed || controller) return;
      lastAttempt = Date.now();
      const current = new AbortController();
      controller = current;
      fetch(`/api/air?lat=${latitude}&lon=${longitude}`, {
        signal: current.signal,
      })
        .then(async (response) => {
          throwIfHttpError(response);
          return airResponseSchema.parse(await response.json());
        })
        .then(({ data, retrievedAt }) => {
          const now = Date.now();
          if (!current.signal.aborted)
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
        .catch((error: unknown) => {
          if (!current.signal.aborted)
            setResult({
              key,
              state: {
                kind: "error",
                message:
                  error instanceof RateLimitError
                    ? error.message
                    : "Air data is unavailable. Please try again later.",
              },
            });
        })
        .finally(() => {
          if (controller === current) controller = null;
        });
    }
    function refreshWhenVisible() {
      if (
        document.visibilityState === "visible" &&
        Date.now() - lastAttempt >= REFRESH_INTERVAL_MS
      )
        refresh();
    }
    refresh();
    const timer = window.setInterval(refreshWhenVisible, 60_000);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      disposed = true;
      controller?.abort();
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [latitude, longitude, key]);
  useEffect(() => {
    const state = result.key === key ? result.state : null;
    if (!state || state.kind !== "success" || !state.fresh) return;
    function updateFreshness() {
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
    }
    const timer = window.setInterval(updateFreshness, 60_000);
    document.addEventListener("visibilitychange", updateFreshness);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", updateFreshness);
    };
  }, [result, key]);
  return state;
}
