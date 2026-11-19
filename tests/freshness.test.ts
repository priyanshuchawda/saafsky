import { test } from "node:test";
import assert from "node:assert/strict";
import { isFresh, localMinuteAt } from "../src/lib/freshness.ts";

test("freshness checks both retrieval and model time", () => {
  const now = Date.parse("2026-01-01T06:30:00Z");
  assert.equal(
    isFresh("2026-01-01T06:20:00Z", "2026-01-01T12:00", 19800, now),
    true,
  );
  assert.equal(
    isFresh("2026-01-01T06:20:00Z", "2026-01-01T08:00", 19800, now),
    false,
  );
  assert.equal(
    isFresh("2026-01-01T04:00:00Z", "2026-01-01T12:00", 19800, now),
    false,
  );
  assert.equal(isFresh("invalid", "2026-01-01T12:00", 19800, now), false);
  assert.equal(
    isFresh("2026-01-01T06:35:01Z", "2026-01-01T12:00", 19800, now),
    false,
  );
  assert.equal(
    isFresh("2026-01-01T06:30:00Z", "2026-01-01T12:00", Number.NaN, now),
    false,
  );
  assert.equal(isFresh("2026-01-01T06:30:00Z", "bad timestamp", 0, now), false);
});

test("local forecast time uses the selected city's time zone and DST", () => {
  const instant = Date.parse("2026-03-08T07:30:00Z");
  assert.equal(localMinuteAt(instant, "America/New_York"), "2026-03-08T03:30");
  assert.equal(localMinuteAt(instant, "Asia/Kolkata"), "2026-03-08T13:00");
  assert.equal(localMinuteAt(Number.NaN, "Asia/Kolkata"), null);
  assert.equal(localMinuteAt(instant, "invalid/timezone"), null);
});
