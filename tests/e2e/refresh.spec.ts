import { expect, test } from "@playwright/test";

test("air data refreshes after the cache interval and updates the dashboard", async ({
  page,
}) => {
  const start = new Date("2026-01-01T10:00:00Z");
  await page.clock.install({ time: start });
  let requests = 0;
  await page.route("**/api/air?**", async (route) => {
    requests += 1;
    const now = new Date(await page.evaluate(() => Date.now()));
    await route.fulfill({
      json: {
        retrievedAt: now.toISOString(),
        data: {
          timezone: "UTC",
          utc_offset_seconds: 0,
          current: {
            time: now.toISOString().slice(0, 16),
            us_aqi: now.getTime() - start.getTime() < 30 * 60_000 ? 50 : 120,
            pm2_5: 20,
            pm10: 30,
          },
          hourly: { time: [], us_aqi: [] },
        },
      },
    });
  });
  await page.goto("/");
  await expect(page.locator(".number")).toContainText("50");
  const initialRequests = requests;
  await page.clock.fastForward(30 * 60_000);
  await expect(page.locator(".number")).toContainText("120");
  expect(requests).toBe(initialRequests + 1);
});
