import { test, expect } from "@playwright/test";

test("responses send security headers and reject cross-origin chat", async ({ request }) => {
  const page = await request.get("/");
  expect(page.headers()["x-content-type-options"]).toBe("nosniff");
  expect(page.headers()["x-frame-options"]).toBe("DENY");
  const blocked = await request.post("/api/chat", { headers: { origin: "https://other.example", "content-type": "application/json" }, data: {} });
  expect(blocked.status()).toBe(403);
});
