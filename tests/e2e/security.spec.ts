import { test, expect } from "@playwright/test";

test("responses send security headers and reject cross-origin chat", async ({
  request,
}) => {
  const page = await request.get("/");
  expect(page.headers()["x-content-type-options"]).toBe("nosniff");
  expect(page.headers()["x-frame-options"]).toBe("DENY");
  expect(page.headers()["cross-origin-opener-policy"]).toBe("same-origin");
  expect(page.headers()["strict-transport-security"]).toBe("max-age=31536000");
  const policy = page.headers()["content-security-policy"];
  expect(policy).toContain("default-src 'self'");
  expect(policy).toContain("script-src 'self' 'unsafe-inline'");
  expect(policy).toContain("style-src 'self' 'unsafe-inline'");
  expect(policy).toContain("base-uri 'self'");
  expect(policy).toContain("form-action 'self'");
  expect(policy).toContain("object-src 'none'");
  expect(policy).toContain("frame-ancestors 'none'");
  expect(policy).toContain("connect-src 'self'");
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

test("compatible script policy permits hydration and client navigation", async ({
  page,
}) => {
  const policyErrors: string[] = [];
  page.on("console", (message) => {
    if (
      /violates the following content security policy|refused to execute/i.test(
        message.text(),
      )
    ) {
      policyErrors.push(message.text());
    }
  });

  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.getByRole("link", { name: "Daily planner" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  expect(policyErrors).toEqual([]);
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
