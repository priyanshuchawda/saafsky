import { test } from "node:test";
import assert from "node:assert/strict";
import { smokeCadrForArea } from "../src/features/indoor/room-sizing.ts";

test("smoke CADR follows the EPA area rule and unit conversion", () => {
  const areaM2 = 120 / 10.7639104167;
  assert.ok(Math.abs(smokeCadrForArea(areaM2)! - 80 * 1.69901082) < 0.001);
  assert.ok(Math.abs(smokeCadrForArea(20)! - 2 * smokeCadrForArea(10)!) < 1e-9);
});

test("smoke CADR rejects missing, unreasonable and non-finite areas", () => {
  for (const value of [0, -1, 501, Number.NaN, Number.POSITIVE_INFINITY]) {
    assert.equal(smokeCadrForArea(value), null);
  }
});
