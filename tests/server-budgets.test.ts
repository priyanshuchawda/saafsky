import assert from "node:assert/strict";
import { test } from "node:test";
import { SERVER_BUDGETS } from "../src/config/server-budgets.ts";

test("server request and AI budgets preserve the configured safety limits", () => {
  assert.deepEqual(SERVER_BUDGETS.requests, {
    air: { minute: 30, day: 1000, visitorMinute: 15 },
    locations: { minute: 30, day: 1000, visitorMinute: 15 },
    chat: { minute: 5, day: 50, visitorMinute: 3, visitorDay: 5 },
  });
  assert.deepEqual(SERVER_BUDGETS.ai, {
    minute: 3,
    day: 20,
    maxOutputTokens: 500,
  });
});

test("provider timeouts and cache lifetimes remain bounded", () => {
  assert.deepEqual(SERVER_BUDGETS.timeouts, {
    airForecastMs: 8000,
    geocodingMs: 8000,
    geminiMs: 12000,
  });
  assert.deepEqual(SERVER_BUDGETS.cache, {
    air: { staleSeconds: 1800, revalidateSeconds: 1800, expireSeconds: 3600 },
    locationsRevalidateSeconds: 86400,
  });
  assert.equal(SERVER_BUDGETS.chatBodyBytes, 12_288);
});
