import { test } from "node:test";
import assert from "node:assert/strict";
import {
  compareSmokeCadr,
  smokeCadrForArea,
} from "../src/features/indoor/room-sizing.ts";

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

test("purifier comparison uses the displayed rounded-up estimate", () => {
  const threshold = Math.ceil(smokeCadrForArea(20)!);
  assert.deepEqual(compareSmokeCadr(20, threshold), {
    kind: "meets",
    shortfall: 0,
  });
  assert.deepEqual(compareSmokeCadr(20, threshold - 1), {
    kind: "below",
    shortfall: 1,
  });
  assert.equal(compareSmokeCadr(20, -1), null);
  assert.equal(compareSmokeCadr(20, 10001), null);
  assert.equal(compareSmokeCadr(20, Number.NaN), null);
  assert.equal(compareSmokeCadr(0, 300), null);
});
