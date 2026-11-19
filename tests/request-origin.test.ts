import { test } from "node:test";
import assert from "node:assert/strict";
import { hasAllowedJsonOrigin } from "../src/lib/request-origin.ts";

test("chat accepts JSON from its own origin or a direct API client", () => {
  const url = "https://saafsky.example/api/chat";
  assert.equal(
    hasAllowedJsonOrigin(
      new Request(url, {
        headers: {
          origin: "https://saafsky.example",
          "content-type": "application/json; charset=utf-8",
        },
      }),
    ),
    true,
  );
  assert.equal(
    hasAllowedJsonOrigin(
      new Request(url, { headers: { "content-type": "application/json" } }),
    ),
    true,
  );
  assert.equal(
    hasAllowedJsonOrigin(
      new Request(url, {
        headers: {
          origin: "https://other.example",
          "content-type": "application/json",
        },
      }),
    ),
    false,
  );
  assert.equal(
    hasAllowedJsonOrigin(
      new Request(url, { headers: { "content-type": "text/plain" } }),
    ),
    false,
  );
  assert.equal(
    hasAllowedJsonOrigin(
      new Request(url, {
        headers: {
          origin: "not a url",
          "content-type": "application/json",
        },
      }),
    ),
    false,
  );
  assert.equal(
    hasAllowedJsonOrigin(
      new Request(url, {
        headers: { "content-type": " Application/JSON ; charset=utf-8 " },
      }),
    ),
    true,
  );
});
