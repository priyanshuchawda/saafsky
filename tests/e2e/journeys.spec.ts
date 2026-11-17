import { expect, test } from "@playwright/test";

test("scenario changes for children and outdoor commuters", async ({
  page,
}) => {
  await page.goto("/scenarios", { waitUntil: "networkidle" });
  await page.getByLabel("CHILDREN IN HOUSEHOLD").selectOption("yes");
  await expect(
    page.getByText("Reduce outdoor exertion", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("ILLUSTRATIVE US AQI").selectOption("180");
  await page.getByLabel("COMMUTE", { exact: true }).selectOption("bike");
  await expect(
    page.getByText("Review your commute", { exact: true }),
  ).toBeVisible();
});

test("assistant shows deterministic fallback without calling Gemini", async ({
  page,
}) => {
  await page.route("**/api/chat", (route) =>
    route.fulfill({
      json: {
        mode: "fallback",
        answer: "Check local conditions.",
        uncertainty: "AI is unavailable.",
      },
    }),
  );
  await page.goto("/assistant", { waitUntil: "networkidle" });
  await page
    .getByLabel("YOUR QUESTION ABOUT DELHI")
    .fill("How should I plan a trip?");
  await page.getByRole("button", { name: "Ask SaafSky" }).click();
  await expect(page.getByText("RULE-BASED FALLBACK")).toBeVisible();
  await expect(page.getByText("Check local conditions.")).toBeVisible();
});

test("impact calculator displays a sourced-factor comparison", async ({
  page,
}) => {
  await page.goto("/impact", { waitUntil: "networkidle" });
  await page.getByLabel("BASELINE FACTOR (KG CO₂E / PASSENGER-KM)").fill("0.2");
  await expect(page.getByRole("heading", { name: /19\.23 kg/ })).toBeVisible();
});

test("planner personalizes the daily plan from a mocked fresh forecast", async ({
  page,
}) => {
  const now = new Date();
  const localTime = now.toISOString().slice(0, 16);
  await page.route("**/api/air?**", (route) =>
    route.fulfill({
      json: {
        retrievedAt: now.toISOString(),
        data: {
          timezone: "UTC",
          utc_offset_seconds: 0,
          current: { time: localTime, us_aqi: 180, pm2_5: 90, pm10: 100 },
          hourly: { time: [localTime], us_aqi: [180] },
        },
      },
    }),
  );
  await page.goto("/planner", { waitUntil: "networkidle" });
  await page.getByLabel("COMMUTE", { exact: true }).selectOption("bike");
  await expect(
    page.getByText(
      "Consider practical alternatives that reduce time near heavy traffic",
      { exact: false },
    ),
  ).toBeVisible();
});
