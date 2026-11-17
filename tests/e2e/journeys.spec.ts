import { expect, test } from "@playwright/test";

test("scenario changes for children and outdoor commuters", async ({
  page,
}) => {
  await page.goto("/scenarios", { waitUntil: "networkidle" });
  await page.getByLabel("CHILDREN IN HOUSEHOLD").selectOption("yes");
  await expect(
    page.getByText("Reduce outdoor exertion", { exact: true }),
  ).toBeVisible();
  const action = page
    .locator(".plan > ol > li")
    .filter({ hasText: "Reduce outdoor exertion" });
  await action.getByText("Why this action?").click();
  await expect(
    action.getByText(
      "The household includes a child or someone more sensitive to air pollution.",
    ),
  ).toBeVisible();
  await expect(
    action.getByRole("link", { name: "AirNow: US AQI basics" }),
  ).toHaveAttribute("href", "https://www.airnow.gov/aqi/aqi-basics/");
  await page.getByLabel("ILLUSTRATIVE US AQI").selectOption("180");
  await page.getByLabel("COMMUTE", { exact: true }).selectOption("bike");
  await expect(
    page.getByText("Review your commute", { exact: true }),
  ).toBeVisible();
});

test("city and sensitivity follow the user and can be cleared", async ({
  page,
}) => {
  await page.route("**/api/locations?**", (route) =>
    route.fulfill({
      json: {
        results: [
          { name: "Pune", country: "India", latitude: 18.52, longitude: 73.85 },
        ],
      },
    }),
  );
  const now = new Date();
  await page.route("**/api/air?**", (route) =>
    route.fulfill({
      json: {
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
          hourly: { time: [], us_aqi: [] },
        },
      },
    }),
  );
  await page.goto("/", { waitUntil: "networkidle" });
  await page.getByLabel("YOUR LOCATION").fill("Pune");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await page.getByRole("button", { name: "Pune, India" }).click();
  await page.getByLabel("YOUR HOUSEHOLD").selectOption("sensitive");
  await page.goto("/planner", { waitUntil: "networkidle" });
  await expect(page.getByLabel("HOUSEHOLD")).toHaveValue("sensitive");
  await expect(page.getByText("FORECAST FOR PUNE")).toBeVisible();
  await page.goto("/settings", { waitUntil: "networkidle" });
  await page.getByLabel("CHILDREN IN HOUSEHOLD").selectOption("yes");
  await page.getByLabel("OUTDOOR EXERCISE").selectOption("yes");
  expect(
    await page.evaluate(() => localStorage.getItem("saafsky:household")),
  ).toBeNull();
  await page.goto("/", { waitUntil: "networkidle" });
  await expect(
    page.getByText("Move planned strenuous outdoor exercise indoors", {
      exact: false,
    }),
  ).toBeVisible();
  await page.goto("/settings", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Clear preferences" }).click();
  await expect(page.getByText("Preferences cleared.")).toBeVisible();
  await expect(page.getByText("Delhi", { exact: true })).toBeVisible();
});

test("assistant shows deterministic fallback without calling Gemini", async ({
  page,
}) => {
  const requests: unknown[] = [];
  await page.route("**/api/chat", (route) => {
    requests.push(route.request().postDataJSON());
    return route.fulfill({
      json: {
        mode: "fallback",
        answer: "Check local conditions.",
        uncertainty: "AI is unavailable.",
      },
    });
  });
  await page.goto("/assistant", { waitUntil: "networkidle" });
  await page
    .getByLabel("YOUR QUESTION ABOUT DELHI")
    .fill("How should I plan a trip?");
  await page.getByRole("button", { name: "Ask SaafSky" }).click();
  await expect(page.getByText("RULE-BASED FALLBACK")).toBeVisible();
  await expect(page.getByText("Check local conditions.")).toBeVisible();
  await page
    .getByLabel("YOUR QUESTION ABOUT DELHI")
    .fill("What about tomorrow?");
  await page.getByRole("button", { name: "Ask SaafSky" }).click();
  await expect(page.getByText("RULE-BASED FALLBACK")).toHaveCount(2);
  expect(requests[1]).toMatchObject({
    history: [
      { role: "user", text: "How should I plan a trip?" },
      { role: "assistant", text: "Check local conditions." },
    ],
  });
  await page.getByRole("button", { name: "Clear conversation" }).click();
  await expect(page.getByText("RULE-BASED FALLBACK")).toHaveCount(0);
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
