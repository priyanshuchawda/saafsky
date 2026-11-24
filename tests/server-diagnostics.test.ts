import { test } from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";
import {
  classifyFailure,
  reportServiceFailure,
  UpstreamHttpError,
} from "../src/server/diagnostics.ts";
import { handleAirRequest } from "../src/server/air-endpoint.ts";

test("service failures are categorized without exposing provider or user data", () => {
  const invalid = z.string().safeParse(1);
  assert.equal(invalid.success, false);
  if (invalid.success) return;
  assert.equal(
    classifyFailure(new DOMException("private", "TimeoutError")),
    "timeout",
  );
  assert.equal(classifyFailure(new UpstreamHttpError()), "upstream_http");
  assert.equal(classifyFailure(new UpstreamHttpError(429)), "quota");
  assert.equal(classifyFailure(invalid.error), "upstream_contract");
  assert.equal(
    classifyFailure(new Error("secret question and key")),
    "unexpected",
  );
  const entries: unknown[] = [];
  reportServiceFailure("air", new Error("secret question and key"), (entry) =>
    entries.push(entry),
  );
  assert.deepEqual(entries, [
    { event: "service_failure", service: "air", code: "unexpected" },
  ]);
  assert.doesNotMatch(JSON.stringify(entries), /secret question and key/);
});

test("air endpoint logs only a safe category while preserving its public error", async () => {
  const entries: string[] = [];
  const previous = console.error;
  console.error = (value: unknown) => entries.push(String(value));
  try {
    const response = await handleAirRequest(
      new Request("https://example.test/api/air?lat=28&lon=77"),
      {
        checkPublicRequest: async () => ({ allowed: true }),
        loadAir: async () => {
          throw new Error("private provider response");
        },
      },
    );
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), {
      error: "Air data is temporarily unavailable.",
    });
    assert.deepEqual(
      entries.map((entry) => JSON.parse(entry)),
      [{ event: "service_failure", service: "air", code: "unexpected" }],
    );
    assert.doesNotMatch(entries.join(" "), /private provider response|28|77/);
  } finally {
    console.error = previous;
  }
});
