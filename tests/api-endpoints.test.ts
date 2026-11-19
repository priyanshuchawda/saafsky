import { test } from "node:test";
import assert from "node:assert/strict";
import { handleAirRequest } from "../src/server/air-endpoint.ts";
import { handleLocationsRequest } from "../src/server/locations-endpoint.ts";

const allowed = async () => ({ allowed: true as const });

test("air endpoint rejects invalid coordinates before rate-limit work", async () => {
  let limitChecks = 0;
  const response = await handleAirRequest(
    new Request("https://saafsky.example/api/air?lat=&lon=77"),
    {
      loadAir: async () => {
        throw new Error("Must not fetch air data");
      },
      checkPublicRequest: async () => {
        limitChecks++;
        return { allowed: true };
      },
    },
  );

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: "Invalid coordinates" });
  assert.equal(limitChecks, 0);
});

test("air endpoint normalizes coordinates and returns validated provider data", async () => {
  let coordinates: [number, number] | null = null;
  const response = await handleAirRequest(
    new Request("https://saafsky.example/api/air?lat=28.6136&lon=77.2304"),
    {
      checkPublicRequest: allowed,
      loadAir: async (latitude, longitude) => {
        coordinates = [latitude, longitude];
        return { retrievedAt: "2026-01-01T00:00:00.000Z" };
      },
    },
  );

  assert.equal(response.status, 200);
  assert.deepEqual(coordinates, [28.614, 77.23]);
  assert.deepEqual(await response.json(), {
    retrievedAt: "2026-01-01T00:00:00.000Z",
  });
});

test("air endpoint maps provider errors and rate-limit decisions safely", async () => {
  const unavailable = await handleAirRequest(
    new Request("https://saafsky.example/api/air?lat=28&lon=77"),
    {
      checkPublicRequest: allowed,
      loadAir: async () => {
        throw new Error("secret provider detail");
      },
    },
  );
  assert.equal(unavailable.status, 503);
  assert.deepEqual(await unavailable.json(), {
    error: "Air data is temporarily unavailable.",
  });

  const limited = await handleAirRequest(
    new Request("https://saafsky.example/api/air?lat=28&lon=77"),
    {
      checkPublicRequest: async () => ({
        allowed: false,
        reason: "limited",
        retryAfter: 30,
      }),
      loadAir: async () => {
        throw new Error("Must not fetch air data");
      },
    },
  );
  assert.equal(limited.status, 429);
  assert.equal(limited.headers.get("retry-after"), "30");
});

test("location endpoint skips invalid queries and rate-limits valid searches", async () => {
  let fetches = 0;
  let limitChecks = 0;
  const invalid = await handleLocationsRequest(
    new Request("https://saafsky.example/api/locations?q=x"),
    {
      checkPublicRequest: async () => {
        limitChecks++;
        return { allowed: true };
      },
      fetcher: async () => {
        fetches++;
        return Response.json({ results: [] });
      },
    },
  );
  assert.equal(invalid.status, 200);
  assert.deepEqual(await invalid.json(), { results: [] });

  const tooLong = await handleLocationsRequest(
    new Request(`https://saafsky.example/api/locations?q=${"a".repeat(81)}`),
    {
      checkPublicRequest: async () => {
        limitChecks++;
        return { allowed: true };
      },
      fetcher: async () => Response.json({ results: [] }),
    },
  );
  assert.equal(tooLong.status, 200);

  const blocked = await handleLocationsRequest(
    new Request("https://saafsky.example/api/locations?q=Delhi"),
    {
      checkPublicRequest: async () => ({
        allowed: false,
        reason: "limited",
        retryAfter: 15,
      }),
      fetcher: async () => {
        fetches++;
        return Response.json({ results: [] });
      },
    },
  );
  assert.equal(blocked.status, 429);
  assert.equal(blocked.headers.get("retry-after"), "15");
  assert.equal(limitChecks, 0);
  assert.equal(fetches, 0);
});

test("location endpoint encodes, bounds and validates provider searches", async () => {
  const requestedUrls: URL[] = [];
  const requestSignals: AbortSignal[] = [];
  const response = await handleLocationsRequest(
    new Request("https://saafsky.example/api/locations?q=%20New%20Delhi%20"),
    {
      checkPublicRequest: allowed,
      fetcher: async (url, init) => {
        requestedUrls.push(new URL(String(url)));
        if (init?.signal) requestSignals.push(init.signal as AbortSignal);
        return Response.json({
          results: [
            {
              name: "New Delhi",
              admin1: "Delhi",
              country: "India",
              latitude: 28.61,
              longitude: 77.23,
            },
          ],
        });
      },
    },
  );

  assert.equal(response.status, 200);
  assert.equal(
    requestedUrls[0]?.origin,
    "https://geocoding-api.open-meteo.com",
  );
  assert.equal(requestedUrls[0]?.searchParams.get("name"), "New Delhi");
  assert.equal(requestedUrls[0]?.searchParams.get("count"), "8");
  assert.ok(requestSignals[0] instanceof AbortSignal);
  assert.equal((await response.json()).results[0].name, "New Delhi");
});

test("location endpoint hides upstream errors and rejects malformed responses", async () => {
  for (const fetcher of [
    async () => new Response("Unavailable", { status: 503 }),
    async () => Response.json({ results: [{ name: "Bad", latitude: 1000 }] }),
    async () => {
      throw new Error("secret provider detail");
    },
  ]) {
    const response = await handleLocationsRequest(
      new Request("https://saafsky.example/api/locations?q=Delhi"),
      { checkPublicRequest: allowed, fetcher },
    );
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), {
      error: "Location search is unavailable.",
    });
  }
});
