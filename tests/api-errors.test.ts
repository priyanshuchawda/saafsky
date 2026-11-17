import { test } from "node:test";
import assert from "node:assert/strict";
import {
  RateLimitError,
  retryMessage,
  throwIfHttpError,
} from "../src/lib/api-errors.ts";

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
