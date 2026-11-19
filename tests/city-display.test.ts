import { test } from "node:test";
import assert from "node:assert/strict";
import { displayCity } from "../src/features/i18n/city.ts";

test("transliterates known Indian cities only in Hindi", () => {
  const city = {
    name: "Pune",
    country: "India",
    latitude: 18.52,
    longitude: 73.85,
  };
  assert.equal(displayCity(city, "hi"), "पुणे");
  assert.equal(displayCity(city, "en"), "Pune");
  assert.equal(
    displayCity({ ...city, country: "United States" }, "hi"),
    "Pune",
  );
  assert.equal(displayCity({ ...city, name: "Unknown" }, "hi"), "Unknown");
});
