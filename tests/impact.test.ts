import { test } from "node:test";
import assert from "node:assert/strict";
import {
  monthlyImpact,
  petrolCarPassengerFactor,
} from "../src/features/sustainability/calculate.ts";

test("impact uses distance, days and per-passenger factors", () => {
  const result = monthlyImpact(10, 20, 0.2, "bus");
  assert.ok(result);
  assert.equal(result.baseline, 40);
  assert.ok(Math.abs(result.alternative - 5.6) < 1e-9);
  assert.ok(Math.abs(result.difference - 34.4) < 1e-9);
  assert.equal(monthlyImpact(0, 20, 0.2, "walk")?.difference, 0);
  assert.ok(monthlyImpact(10, 20, 0.01, "bus")!.difference < 0);
  assert.equal(monthlyImpact(10, 32, 0.2, "bus"), null);
});

test("India metro preset uses the documented passenger-kilometre factor", () => {
  assert.ok(
    Math.abs(monthlyImpact(10, 20, 0.2, "metro")!.alternative - 4.8) < 1e-9,
  );
});

test("car attribution accounts for occupancy and rejects invalid values", () => {
  assert.equal(petrolCarPassengerFactor(2), 0.243 / 2);
  assert.equal(petrolCarPassengerFactor(0), null);
  assert.equal(petrolCarPassengerFactor(1.5), null);
});

test("emission comparisons preserve arithmetic invariants", () => {
  for (const distance of [0, 1, 10, 100])
    for (const days of [0, 5, 20, 31]) {
      const result = monthlyImpact(distance, days, 0.2, "bus");
      assert.ok(result);
      assert.ok(
        Math.abs(result.difference - (result.baseline - result.alternative)) <
          1e-9,
      );
      assert.equal(
        monthlyImpact(distance, days, 0.2, "custom", 0.2)?.difference,
        0,
      );
    }
});

test("transport mode parsing rejects unsupported values", async () => {
  const { parseTransportMode } =
    await import("../src/features/sustainability/calculate.ts");
  assert.equal(parseTransportMode("bus"), "bus");
  assert.equal(parseTransportMode("flight"), null);
});
