import { test } from "node:test";
import assert from "node:assert/strict";
import {
  RateLimitError,
  retryMessage,
  throwIfHttpError,
} from "../src/lib/api-errors.ts";
import {
  localizeAirError,
  localizeRateLimit,
} from "../src/features/i18n/errors.ts";

test("rate-limit messages use structured retry metadata in English and Hindi", () => {
  let issue: unknown;
  try {
    throwIfHttpError(
      new Response(null, { status: 429, headers: { "Retry-After": "120" } }),
    );
  } catch (error) {
    issue = error;
  }
  assert.ok(issue instanceof RateLimitError);
  assert.equal(issue.retryAfterSeconds, 120);
  assert.equal(localizeAirError("hi", issue), localizeRateLimit("hi", issue));
  assert.equal(
    localizeRateLimit("en", issue),
    "Request limit reached. Please try again in 2 minutes.",
  );
  assert.equal(
    localizeRateLimit("hi", issue),
    "अनुरोध की सीमा पूरी हो गई है। कृपया 2 मिनट बाद फिर कोशिश करें।",
  );
  let unknownDelay: unknown;
  try {
    throwIfHttpError(new Response(null, { status: 429 }));
  } catch (error) {
    unknownDelay = error;
  }
  assert.ok(unknownDelay instanceof RateLimitError);
  assert.equal(unknownDelay.retryAfterSeconds, null);
  assert.match(localizeRateLimit("hi", unknownDelay), /कृपया/);
  assert.equal(
    localizeAirError("en", null),
    "Air data is unavailable. Please try again later.",
  );
  assert.equal(
    localizeAirError("hi", null),
    "हवा का डेटा अभी उपलब्ध नहीं है। कृपया थोड़ी देर बाद फिर कोशिश करें।",
  );
  assert.equal(
    localizeRateLimit("hi", new RateLimitError("example", 1)),
    "अनुरोध की सीमा पूरी हो गई है। कृपया 1 सेकंड बाद फिर कोशिश करें।",
  );
});

test("rate limits have bounded, user-readable retry messages", () => {
  assert.match(retryMessage("1"), /1 second\./);
  assert.match(retryMessage("2"), /2 seconds\./);
  assert.match(retryMessage("0"), /1 second\./);
  assert.match(retryMessage("60"), /1 minute\./);
  assert.match(retryMessage("120"), /2 minutes\./);
  assert.match(retryMessage("9999999"), /later/);
  assert.match(retryMessage("86401"), /1440 minutes\./);
  assert.match(retryMessage("bad"), /later/);
  assert.match(retryMessage(null), /later/);
  assert.throws(
    () =>
      throwIfHttpError(
        new Response(null, { status: 429, headers: { "Retry-After": "120" } }),
      ),
    RateLimitError,
  );
  assert.doesNotThrow(() =>
    throwIfHttpError(new Response(null, { status: 200 })),
  );
  assert.throws(
    () => throwIfHttpError(new Response(null, { status: 503 })),
    /Request unavailable/,
  );
});
