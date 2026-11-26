"use client";

import { useEffect, useState } from "react";
import { isFresh } from "@/lib/freshness";
import { airResponseSchema } from "@/lib/schemas";
import { RateLimitError, throwIfHttpError } from "@/lib/api-errors";
import { createRequestCache } from "@/lib/request-cache";
import type { Air, City } from "@/types/air";

const REFRESH_INTERVAL_MS = 30 * 60_000;
const REQUEST_TIMEOUT_MS = 10_000;
type AirResponse = ReturnType<typeof airResponseSchema.parse>;
const airResponseCache = createRequestCache<AirResponse>(REFRESH_INTERVAL_MS);

type AirState =
  | { kind: "loading" }
  | {
      kind: "error";
      message: string;
      rateLimit: RateLimitError | null;
      retryAt: number | null;
    }
  | {
      kind: "success";
      data: Air;
      retrievedAt: string;
      fresh: boolean;
      checkedAt: number;
    };

type AirQualityResource = {
  state: AirState;
  retry(): void;
  retryDisabled: boolean;
};

async function fetchAirResponse(
  key: string,
  latitude: number,
  longitude: number,
): Promise<AirResponse> {
  return airResponseCache.load(key, async () => {
    const controller = new AbortController();
    const timeout = window.setTimeout(
      () => controller.abort(),
      REQUEST_TIMEOUT_MS,
    );
    try {
      const response = await fetch(
        `/api/air?lat=${latitude}&lon=${longitude}`,
        { signal: controller.signal },
      );
      throwIfHttpError(response);
      return airResponseSchema.parse(await response.json());
    } finally {
      window.clearTimeout(timeout);
    }
  });
}

export function useAirQuality(city: City | null): AirQualityResource {
  const rawLatitude = city?.latitude;
  const rawLongitude = city?.longitude;
  const latitude =
    rawLatitude === undefined
      ? undefined
      : Math.round(rawLatitude * 1000) / 1000;
  const longitude =
    rawLongitude === undefined
      ? undefined
      : Math.round(rawLongitude * 1000) / 1000;
  const key =
    latitude !== undefined && longitude !== undefined
      ? `${latitude},${longitude}`
      : "pending";
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [result, setResult] = useState<{ key: string; state: AirState }>({
    key,
    state: { kind: "loading" },
  });
  const state: AirState =
    result.key === key ? result.state : { kind: "loading" };

  useEffect(() => {
    const currentLatitude = latitude;
    const currentLongitude = longitude;
    if (currentLatitude === undefined || currentLongitude === undefined) return;
    let lastAttempt = 0;
    let requestPending = false;
    let disposed = false;
    function refresh(force = false) {
      if (
        disposed ||
        requestPending ||
        currentLatitude === undefined ||
        currentLongitude === undefined
      )
        return;
      if (force) airResponseCache.invalidate(key);
      lastAttempt = Date.now();
      requestPending = true;
      void fetchAirResponse(key, currentLatitude, currentLongitude)
        .then(({ data, retrievedAt }) => {
          const now = Date.now();
          if (!disposed)
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
          if (disposed) return;
          const rateLimit = error instanceof RateLimitError ? error : null;
          const retryAfterSeconds = rateLimit?.retryAfterSeconds;
          setResult({
            key,
            state: {
              kind: "error",
              rateLimit,
              message:
                rateLimit?.message ??
                "Air data is unavailable. Please try again later.",
              retryAt:
                retryAfterSeconds == null
                  ? null
                  : Date.now() + retryAfterSeconds * 1000,
            },
          });
        })
        .finally(() => {
          requestPending = false;
        });
    }
    function refreshWhenVisible() {
      if (
        document.visibilityState === "visible" &&
        Date.now() - lastAttempt >= REFRESH_INTERVAL_MS
      )
        refresh(true);
    }
    refresh();
    const timer = window.setInterval(refreshWhenVisible, 60_000);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      disposed = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [latitude, longitude, key, retryAttempt]);

  useEffect(() => {
    const current = result.key === key ? result.state : null;
    if (!current || current.kind !== "error" || current.retryAt === null)
      return;
    const retryAt = current.retryAt;
    const delay = Math.max(0, retryAt - Date.now());
    const timer = window.setTimeout(() => {
      setResult((previous) =>
        previous.key === key &&
        previous.state.kind === "error" &&
        previous.state.retryAt === retryAt
          ? { ...previous, state: { ...previous.state, retryAt: null } }
          : previous,
      );
    }, delay);
    return () => window.clearTimeout(timer);
  }, [result, key]);

  useEffect(() => {
    const current = result.key === key ? result.state : null;
    if (!current || current.kind !== "success" || !current.fresh) return;
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

  const retryDisabled = state.kind === "error" && state.retryAt !== null;
  function retry() {
    if (
      retryDisabled ||
      (state.kind === "error" &&
        state.retryAt !== null &&
        Date.now() < state.retryAt) ||
      latitude === undefined ||
      longitude === undefined
    )
      return;
    airResponseCache.invalidate(key);
    setResult({ key, state: { kind: "loading" } });
    setRetryAttempt((attempt) => attempt + 1);
  }

  return { state, retry, retryDisabled };
}
