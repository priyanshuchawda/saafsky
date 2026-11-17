import { test } from "node:test";
import assert from "node:assert/strict";
import {
  RateLimitError,
  retryMessage,
  throwIfHttpError,
} from "../src/lib/api-errors.ts";

test("rate limits have bounded, user-readable retry messages", () => {
  assert.match(retryMessage("1"), /1 second\./);
  assert.match(retryMessage("120"), /2 minutes\./);
  assert.match(retryMessage("bad"), /later/);
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
});
