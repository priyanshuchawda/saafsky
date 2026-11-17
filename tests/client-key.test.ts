import { test } from "node:test";
import assert from "node:assert/strict";
import { trustedClientKey } from "../src/server/client-key.ts";

test("only platform-supplied valid addresses produce pseudonymous keys", () => {
  const headers = new Headers({ "x-vercel-forwarded-for": "192.0.2.12" });
  assert.equal(trustedClientKey(headers, false, "secret"), null);
  assert.equal(
    trustedClientKey(
      new Headers({ "x-vercel-forwarded-for": "invalid" }),
      true,
      "secret",
    ),
    null,
  );
  const key = trustedClientKey(headers, true, "secret");
  assert.ok(key);
  assert.notEqual(key, "192.0.2.12");
  assert.equal(key, trustedClientKey(headers, true, "secret"));
  assert.notEqual(key, trustedClientKey(headers, true, "other-secret"));
});
