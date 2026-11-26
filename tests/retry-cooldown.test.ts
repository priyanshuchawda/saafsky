import { test } from "node:test";
import assert from "node:assert/strict";
import { createRetryCooldownStore } from "../src/lib/retry-cooldown.ts";

test("retry cooldown remains active across consumers and expires at its deadline", () => {
  let now = 100;
  const cooldown = createRetryCooldownStore(() => now);
  cooldown.set("city", 500);

  assert.equal(cooldown.get("city"), 500);
  now = 500;
  assert.equal(cooldown.get("city"), null);
});

test("retry cooldown bounds keys and evicts least-recently-used entries", () => {
  const cooldown = createRetryCooldownStore(Date.now, 2);
  cooldown.set("one", Date.now() + 60_000);
  cooldown.set("two", Date.now() + 60_000);
  cooldown.get("one");
  cooldown.set("three", Date.now() + 60_000);

  assert.equal(cooldown.get("two"), null);
  assert.notEqual(cooldown.get("one"), null);
  assert.notEqual(cooldown.get("three"), null);
});
