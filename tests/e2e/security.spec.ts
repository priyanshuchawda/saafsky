import { test, expect } from "@playwright/test";

test("responses send security headers and reject cross-origin chat", async ({
  request,
}) => {
  const page = await request.get("/");
  expect(page.headers()["x-content-type-options"]).toBe("nosniff");
  expect(page.headers()["x-frame-options"]).toBe("DENY");
  const blocked = await request.post("/api/chat", {
    headers: {
      origin: "https://other.example",
      "content-type": "application/json",
    },
    data: {},
  });
  expect(blocked.status()).toBe(403);
  expect(blocked.headers()["cache-control"]).toContain("no-store");
});

test("API rejects invalid coordinates and oversized chat bodies", async ({
  request,
}) => {
  const empty = await request.get("/api/air?lat=&lon=77");
  expect(empty.status()).toBe(400);
  const outOfRange = await request.get("/api/air?lat=91&lon=77");
  expect(outOfRange.status()).toBe(400);
  const oversized = await request.post("/api/chat", {
    headers: { "content-type": "application/json" },
    data: { question: "x".repeat(13_000) },
  });
  expect(oversized.status()).toBe(413);
  expect(oversized.headers()["cache-control"]).toContain("no-store");
  const invalidEncoding = await request.post("/api/chat", {
    headers: { "content-type": "application/json" },
    data: Buffer.from([0x7b, 0x22, 0x78, 0x22, 0x3a, 0x22, 0xff, 0x22, 0x7d]),
  });
  expect(invalidEncoding.status()).toBe(400);
  expect(invalidEncoding.headers()["cache-control"]).toContain("no-store");
});
