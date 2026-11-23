import { test } from "node:test";
import assert from "node:assert/strict";
import { isValidAqi } from "../src/lib/aqi-validity.ts";

test("AQI validity rejects missing, negative and non-finite values", () => {
  for (const value of [null, NaN, Infinity, -Infinity, -1]) {
    assert.equal(isValidAqi(value), false);
  }
  for (const value of [0, 50, 51, 100, 101, 150, 151, 200, 201, 300, 301]) {
    assert.equal(isValidAqi(value), true);
  }
});
