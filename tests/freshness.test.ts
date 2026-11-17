import { test } from "node:test";
import assert from "node:assert/strict";
import { isFresh } from "../src/lib/freshness.ts";

test("freshness checks both retrieval and model time", () => {
  const now = Date.parse("2026-01-01T06:30:00Z");
  assert.equal(isFresh("2026-01-01T06:20:00Z", "2026-01-01T12:00", 19800, now), true);
  assert.equal(isFresh("2026-01-01T06:20:00Z", "2026-01-01T08:00", 19800, now), false);
  assert.equal(isFresh("2026-01-01T04:00:00Z", "2026-01-01T12:00", 19800, now), false);
  assert.equal(isFresh("invalid", "2026-01-01T12:00", 19800, now), false);
});
