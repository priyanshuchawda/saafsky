import { test } from "node:test";
import assert from "node:assert/strict";
import { readBoundedJson, RequestBodyTooLarge } from "../src/lib/request-body.ts";

test("bounded request reader parses JSON and rejects oversized bodies", async () => {
  assert.deepEqual(await readBoundedJson(new Request("https://example.test", { method: "POST", body: '{"x":1}' }), 32), { x: 1 });
  await assert.rejects(readBoundedJson(new Request("https://example.test", { method: "POST", body: '"123456789"' }), 5), RequestBodyTooLarge);
  await assert.rejects(readBoundedJson(new Request("https://example.test", { method: "POST", body: "broken" }), 32), SyntaxError);
});
