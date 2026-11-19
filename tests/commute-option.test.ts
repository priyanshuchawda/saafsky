import { test } from "node:test";
import assert from "node:assert/strict";
import { parseCommuteMode } from "../src/features/preferences/commute.ts";

test("commute form values are checked against supported modes", () => {
  for (const value of ["none", "walk", "bike", "public", "car"])
    assert.equal(parseCommuteMode(value), value);
  assert.equal(parseCommuteMode("flight"), null);
  assert.equal(parseCommuteMode(""), null);
});
