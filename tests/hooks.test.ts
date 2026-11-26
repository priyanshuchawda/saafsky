import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost",
});
Object.defineProperties(globalThis, {
  window: { configurable: true, value: dom.window },
  document: { configurable: true, value: dom.window.document },
  navigator: { configurable: true, value: dom.window.navigator },
  localStorage: { configurable: true, value: dom.window.localStorage },
  sessionStorage: { configurable: true, value: dom.window.sessionStorage },
  Event: { configurable: true, value: dom.window.Event },
  IS_REACT_ACT_ENVIRONMENT: { configurable: true, value: true, writable: true },
});

const { act, cleanup, renderHook, waitFor } =
  await import("@testing-library/react");
const { useAirQuality } = await import("@/hooks/use-air-quality");
const { useAssistant } = await import("@/hooks/use-assistant");
const { useImpactCalculator } = await import("@/hooks/use-impact-calculator");
const { clearPreferences, useCity, useHousehold, useLanguage, useSensitivity } =
  await import("@/hooks/use-preferences");
const { localMinuteAt } = await import("@/lib/freshness");
const { parseStoredCity } = await import("@/features/preferences/parse");

afterEach(() => {
  cleanup();
  dom.window.localStorage.clear();
  dom.window.sessionStorage.clear();
});

test("impact hook calculates defaults and updates transport and input state", () => {
  const { result } = renderHook(() => useImpactCalculator());
  assert.ok(result.current.result);
  assert.ok(Math.abs(result.current.result.baseline - 48.6) < 1e-9);
  assert.ok(Math.abs(result.current.result.alternative - 5.6) < 1e-9);
  assert.ok(Math.abs(result.current.result.difference - 43) < 1e-9);

  act(() => {
    result.current.setMode("custom");
    result.current.setCustom("0.1");
    result.current.setDistance("15");
    result.current.setDays("10");
  });
  assert.ok(result.current.result);
  assert.ok(Math.abs(result.current.result.baseline - 36.45) < 1e-9);
  assert.ok(Math.abs(result.current.result.alternative - 15) < 1e-9);
  assert.ok(Math.abs(result.current.result.difference - 21.45) < 1e-9);

  act(() => result.current.setCustom("invalid"));
  assert.equal(result.current.result, null);
});

test("preference hooks share updates and restore defaults after reset", () => {
  const { result } = renderHook(() => ({
    city: useCity(),
    household: useHousehold(),
    sensitivity: useSensitivity(),
    language: useLanguage(),
  }));
  assert.equal(result.current.city[0].name, "Delhi");
  assert.equal(result.current.city[2], true);
  assert.equal(result.current.language[0], "en");

  act(() => {
    result.current.city[1]({
      name: "Pune",
      country: "India",
      latitude: 18.52,
      longitude: 73.85,
    });
    result.current.language[1]("hi");
    result.current.household[1]({
      sensitive: true,
      children: true,
      outdoorExercise: true,
      commute: "walk",
      cookingSmoke: true,
    });
  });
  assert.equal(result.current.city[0].name, "Pune");
  assert.equal(result.current.language[0], "hi");
  assert.equal(result.current.household[0].children, true);
  assert.equal(result.current.sensitivity[0], true);

  act(() => clearPreferences());
  assert.equal(result.current.city[0].name, "Delhi");
  assert.equal(result.current.language[0], "en");
  assert.equal(result.current.household[0].children, false);
  assert.equal(result.current.sensitivity[0], false);
});

test("preference hooks recover from blocked storage and invalid persisted values", () => {
  dom.window.localStorage.setItem("saafsky:city", "not-json");
  Object.defineProperty(dom.window.localStorage, "setItem", {
    configurable: true,
    value: () => {
      throw new Error("storage blocked");
    },
  });
  const { result } = renderHook(() => ({
    city: useCity(),
    language: useLanguage(),
  }));
  assert.equal(result.current.city[0].name, "Delhi");
  act(() => {
    result.current.city[1]({
      name: "Mumbai",
      country: "India",
      latitude: 19.07,
      longitude: 72.87,
    });
    result.current.language[1]("hi");
  });
  assert.equal(result.current.city[0].name, "Mumbai");
  assert.equal(result.current.language[0], "hi");
  assert.equal(parseStoredCity("{}"), null);
});

test("assistant submits validated context, bounds history, and clears it", async () => {
  const originalFetch = globalThis.fetch;
  const payloads: unknown[] = [];
  globalThis.fetch = async (_input, init) => {
    payloads.push(JSON.parse(String(init?.body)) as unknown);
    return Response.json({
      answer: "Check the current forecast before choosing an outdoor activity.",
      uncertainty: "Conditions can vary locally.",
      mode: "fallback",
      referencedActionIds: [],
      sourceIds: [],
    });
  };
  try {
    const { result } = renderHook(() =>
      useAssistant(
        { name: "Pune", country: "India", latitude: 18.52, longitude: 73.85 },
        {
          sensitive: false,
          children: false,
          outdoorExercise: true,
          commute: "walk",
          cookingSmoke: false,
        },
        "en",
      ),
    );
    for (let index = 0; index < 6; index++) {
      act(() => result.current.setQuestion(`Question ${index}`));
      await act(async () => {
        await result.current.submit({ preventDefault() {} } as never);
      });
    }
    assert.equal(result.current.turns.length, 5);
    assert.equal(payloads.length, 6);
    const last = payloads.at(-1) as { history: Array<{ role: string }> };
    assert.equal(last.history.length, 4);
    assert.deepEqual(
      last.history.map(({ role }) => role),
      ["user", "assistant", "user", "assistant"],
    );
    act(() => result.current.clearConversation());
    assert.equal(result.current.turns.length, 0);
    assert.equal(result.current.status, "");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("assistant exposes a localized rate-limit state and prevents duplicate requests", async () => {
  const originalFetch = globalThis.fetch;
  let calls = 0;
  let release: ((response: Response) => void) | undefined;
  globalThis.fetch = () => {
    calls++;
    return new Promise<Response>((resolve) => {
      release = resolve;
    });
  };
  try {
    const { result } = renderHook(() =>
      useAssistant(
        { name: "Delhi", country: "India", latitude: 28.6, longitude: 77.2 },
        {
          sensitive: false,
          children: false,
          outdoorExercise: false,
          commute: "none",
          cookingSmoke: false,
        },
        "hi",
      ),
    );
    act(() => result.current.setQuestion("आज हवा कैसी है?"));
    let first: Promise<void> | undefined;
    act(() => {
      first = result.current.submit({ preventDefault() {} } as never);
    });
    await waitFor(() => assert.equal(result.current.isPending, true));
    await act(async () => {
      await result.current.submit({ preventDefault() {} } as never);
    });
    assert.equal(calls, 1);
    release?.(
      new Response("", { status: 429, headers: { "Retry-After": "7" } }),
    );
    await act(async () => first);
    assert.equal(result.current.isPending, false);
    assert.match(result.current.status, /7/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("assistant aborts an in-flight request when cleared or unmounted", async () => {
  const originalFetch = globalThis.fetch;
  let signal: AbortSignal | undefined;
  let release: ((response: Response) => void) | undefined;
  globalThis.fetch = (_input, init) => {
    signal = init?.signal as AbortSignal;
    return new Promise<Response>((resolve) => {
      release = resolve;
    });
  };
  try {
    const { result, unmount } = renderHook(() =>
      useAssistant(
        { name: "Pune", country: "India", latitude: 18.52, longitude: 73.85 },
        {
          sensitive: false,
          children: false,
          outdoorExercise: false,
          commute: "none",
          cookingSmoke: false,
        },
        "en",
      ),
    );
    act(() => result.current.setQuestion("Will this request be cancelled?"));
    let pending: Promise<void> | undefined;
    act(() => {
      pending = result.current.submit({ preventDefault() {} } as never);
    });
    act(() => result.current.clearConversation());
    assert.equal(signal?.aborted, true);
    release?.(
      Response.json({
        answer: "A response that should be ignored.",
        uncertainty: "",
        mode: "fallback",
        referencedActionIds: [],
        sourceIds: [],
      }),
    );
    await act(async () => pending);
    assert.equal(result.current.turns.length, 0);

    act(() => result.current.setQuestion("Abort on unmount"));
    act(() => {
      pending = result.current.submit({ preventDefault() {} } as never);
    });
    unmount();
    assert.equal(signal?.aborted, true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("air hook handles missing city, success, stale data, and deduplicated consumers", async () => {
  const originalFetch = globalThis.fetch;
  let calls = 0;
  const now = Date.now();
  const modelTime = localMinuteAt(now, "Asia/Kolkata");
  assert.ok(modelTime);
  globalThis.fetch = async () => {
    calls++;
    return Response.json({
      data: {
        timezone: "Asia/Kolkata",
        utc_offset_seconds: 19_800,
        current: { time: modelTime, us_aqi: 72, pm2_5: 18, pm10: 29 },
        hourly: { time: [modelTime], us_aqi: [72] },
      },
      retrievedAt: new Date().toISOString(),
    });
  };
  try {
    const city = {
      name: "Coverage City",
      country: "India",
      latitude: 51.507,
      longitude: -0.128,
    };
    const pending = renderHook(() => useAirQuality(null));
    assert.equal(pending.result.current.state.kind, "loading");
    pending.unmount();

    const first = renderHook(() => useAirQuality(city));
    const second = renderHook(() => useAirQuality(city));
    await waitFor(() =>
      assert.equal(first.result.current.state.kind, "success"),
    );
    await waitFor(() =>
      assert.equal(second.result.current.state.kind, "success"),
    );
    assert.equal(calls, 1);
    if (first.result.current.state.kind === "success") {
      assert.equal(first.result.current.state.fresh, true);
      assert.equal(first.result.current.state.data.current.us_aqi, 72);
    }
    first.unmount();
    second.unmount();
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("air hook exposes provider errors and allows retry recovery", async () => {
  const originalFetch = globalThis.fetch;
  let calls = 0;
  const now = Date.now();
  const modelTime = localMinuteAt(now, "Asia/Kolkata");
  assert.ok(modelTime);
  globalThis.fetch = async () => {
    calls++;
    if (calls === 1) return new Response("unavailable", { status: 503 });
    return Response.json({
      data: {
        timezone: "Asia/Kolkata",
        utc_offset_seconds: 19_800,
        current: { time: modelTime, us_aqi: null, pm2_5: null, pm10: null },
        hourly: { time: [modelTime], us_aqi: [null] },
      },
      retrievedAt: new Date().toISOString(),
    });
  };
  try {
    const { result } = renderHook(() =>
      useAirQuality({
        name: "Retry City",
        country: "India",
        latitude: -33.868,
        longitude: 151.209,
      }),
    );
    await waitFor(() => assert.equal(result.current.state.kind, "error"));
    assert.equal(result.current.retryDisabled, false);
    act(() => result.current.retry());
    await waitFor(() => assert.equal(result.current.state.kind, "success"));
    assert.equal(calls, 2);
    if (result.current.state.kind === "success") {
      assert.equal(result.current.state.fresh, true);
      assert.equal(result.current.state.data.current.us_aqi, null);
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});
