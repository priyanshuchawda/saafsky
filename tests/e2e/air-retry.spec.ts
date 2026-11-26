import { expect, test } from "@playwright/test";

function airResponse() {
  const now = new Date();
  const start = new Date(now);
  start.setUTCMinutes(0, 0, 0);
  const times = Array.from({ length: 24 }, (_, index) => {
    const hour = new Date(start);
    hour.setUTCHours(start.getUTCHours() + index);
    return hour.toISOString().slice(0, 16);
  });
  return {
    retrievedAt: now.toISOString(),
    data: {
      timezone: "UTC",
      utc_offset_seconds: 0,
      current: {
        time: now.toISOString().slice(0, 16),
        us_aqi: 120,
        pm2_5: 40,
        pm10: 60,
      },
      hourly: { time: times, us_aqi: times.map(() => 120) },
    },
  };
}

test("air-data retry waits for Retry-After and recovers after the user retries", async ({
  page,
}) => {
  let requests = 0;
  await page.route("**/api/air?**", async (route) => {
    requests++;
    if (requests === 1) {
      await route.fulfill({
        status: 429,
        headers: { "Retry-After": "1" },
        json: { error: "Request limit reached." },
      });
      return;
    }
    await route.fulfill({ json: airResponse() });
  });

  await page.goto("/");
  const retry = page.getByRole("button", {
    name: /Retry air-quality update|Please wait before retrying/,
  });
  await expect(retry).toBeDisabled();
  await expect(retry).toBeEnabled({ timeout: 5000 });
  await retry.click();

  await expect(page.getByText("120", { exact: true }).first()).toBeVisible();
  await expect(retry).toHaveCount(0);
  expect(requests).toBe(2);
});

test("air-data Retry-After is preserved while navigating between pages", async ({
  page,
}) => {
  let requests = 0;
  await page.route("**/api/air?**", async (route) => {
    requests++;
    await route.fulfill({
      status: 429,
      headers: { "Retry-After": "5" },
      json: { error: "Request limit reached." },
    });
  });

  await page.goto("/");
  const retry = page.getByRole("button", {
    name: /Please wait before retrying/,
  });
  await expect(retry).toBeDisabled();
  await page.getByRole("link", { name: /Daily planner/ }).click();
  await page.getByRole("link", { name: /Dashboard/ }).click();
  await expect(
    page.getByRole("button", { name: /Please wait before retrying/ }),
  ).toBeDisabled();
  expect(requests).toBe(1);
});
