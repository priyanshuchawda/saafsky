import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parseStoredCity,
  parseStoredHousehold,
} from "../src/features/preferences/parse.ts";

test("saved city validation preserves valid details and rejects invalid coordinates", () => {
  const city = {
    name: "Pune",
    latitude: 18.52,
    longitude: 73.85,
    country: "India",
    admin1: "Maharashtra",
  };
  assert.deepEqual(parseStoredCity(JSON.stringify(city)), city);
  assert.equal(parseStoredCity("{"), null);
  assert.equal(
    parseStoredCity(JSON.stringify({ ...city, latitude: 91 })),
    null,
  );
  assert.equal(parseStoredCity(JSON.stringify({ ...city, name: " " })), null);
  assert.deepEqual(parseStoredCity(JSON.stringify({ ...city, country: 42 })), {
    name: "Pune",
    latitude: 18.52,
    longitude: 73.85,
    admin1: "Maharashtra",
  });
});

test("saved household validation accepts supported choices and rejects malformed records", () => {
  const household = {
    children: true,
    outdoorExercise: false,
    cookingSmoke: true,
    commute: "public",
  };
  assert.deepEqual(parseStoredHousehold(JSON.stringify(household)), household);
  assert.equal(parseStoredHousehold("null"), null);
  assert.equal(
    parseStoredHousehold(JSON.stringify({ ...household, commute: "plane" })),
    null,
  );
  assert.equal(
    parseStoredHousehold(JSON.stringify({ ...household, children: "yes" })),
    null,
  );
});
