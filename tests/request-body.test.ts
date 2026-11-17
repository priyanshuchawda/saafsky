import { test } from "node:test";
import assert from "node:assert/strict";
import { readBoundedJson, RequestBodyTooLarge } from "../src/lib/request-body.ts";

test("bounded request reader parses JSON and rejects oversized bodies", async () => {
  assert.deepEqual(
    await readBoundedJson(
      new Request("https://example.test", {
        method: "POST",
        body: '{"x":1}',
      }),
      32,
    ),
    { x: 1 },
  );
  await assert.rejects(
    readBoundedJson(
      new Request("https://example.test", {
        method: "POST",
        body: '"123456789"',
      }),
      5,
    ),
    RequestBodyTooLarge,
  );
  await assert.rejects(
    readBoundedJson(
      new Request("https://example.test", { method: "POST", body: "broken" }),
      32,
    ),
    SyntaxError,
  );
});

test("bounded request reader rejects missing and dishonest body lengths", async () => {
  await assert.rejects(
    readBoundedJson(new Request("https://example.test", { method: "POST" }), 8),
    /Missing body/,
  );
  await assert.rejects(
    readBoundedJson(
      new Request("https://example.test", {
        method: "POST",
        headers: { "content-length": "9" },
        body: "{}",
      }),
      8,
    ),
    RequestBodyTooLarge,
  );
  await assert.rejects(
    readBoundedJson(
      new Request("https://example.test", {
        method: "POST",
        headers: { "content-length": "1" },
        body: "\"😀\"",
      }),
      5,
    ),
    RequestBodyTooLarge,
  );
  assert.deepEqual(
    await readBoundedJson(
      new Request("https://example.test", {
        method: "POST",
        headers: { "content-length": "unknown" },
        body: '{"valid":true}',
      }),
      32,
    ),
    { valid: true },
  );
});
