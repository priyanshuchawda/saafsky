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
          {
            name: "Pune",
            admin1: "Maharashtra",
            country: "India",
            latitude: 18.52,
            longitude: 73.85,
          },
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
  await page.getByRole("button", { name: "Pune, Maharashtra, India" }).click();
  await page.getByLabel("YOUR HOUSEHOLD").selectOption("sensitive");
  await page.goto("/planner", { waitUntil: "networkidle" });
  await expect(page.getByLabel("HOUSEHOLD")).toHaveValue("sensitive");
  await expect(page.getByText("FORECAST FOR PUNE")).toBeVisible();
  await page.goto("/settings", { waitUntil: "networkidle" });
  await expect(
    page.getByText("Pune, Maharashtra, India", { exact: true }),
  ).toBeVisible();
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
  await expect(page.getByText("Delhi, India", { exact: true })).toBeVisible();
});

test("stale model values are not presented as current air measurements", async ({
  page,
}) => {
  await page.route("**/api/air?**", (route) =>
    route.fulfill({
      json: {
        retrievedAt: new Date().toISOString(),
        data: {
          timezone: "UTC",
          utc_offset_seconds: 0,
          current: {
            time: "2020-01-01T10:00",
            us_aqi: 180,
            pm2_5: 123.4,
            pm10: 234.5,
          },
          hourly: { time: [], us_aqi: [] },
        },
      },
    }),
  );
  await page.goto("/", { waitUntil: "networkidle" });
  await expect(
    page.getByRole("status").filter({ hasText: "stale" }),
  ).toBeVisible();
  await expect(page.getByText("123.4", { exact: true })).toHaveCount(0);
  await expect(page.getByText("234.5", { exact: true })).toHaveCount(0);
  await expect(
    page.getByText("Reduce indoor smoke", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Check current conditions", { exact: true }),
  ).toBeVisible();
});

test("planner respects activity duration and distinguishes elevated conditions", async ({
  page,
}) => {
  const now = new Date();
  const firstHour =
    Math.floor(now.getTime() / 3_600_000) * 3_600_000 + 3_600_000;
  const time = (index: number) =>
    new Date(firstHour + index * 3_600_000).toISOString().slice(0, 16);
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
          hourly: {
            time: [time(0), time(1), time(2), time(3)],
            us_aqi: [120, 80, 90, 180],
          },
        },
      },
    }),
  );
  await page.goto("/planner", { waitUntil: "networkidle" });
  await page.getByLabel("HOUSEHOLD").selectOption("sensitive");
  await page.getByLabel("EARLIEST TIME").fill(time(0));
  await page.getByLabel("LATEST TIME (EXCLUSIVE)").fill(time(4));
  await page.getByLabel("TIME NEEDED").selectOption("2");
  await expect(page.getByText(/peak US AQI 90/)).toBeVisible();
  await page.getByLabel("FIXED COMMITMENT START (OPTIONAL)").fill(time(1));
  await expect(page.getByText(/Enter both commitment times/)).toBeVisible();
  await page.getByLabel("FIXED COMMITMENT END (OPTIONAL)").fill(time(2));
  await expect(
    page.getByText(/All complete forecast windows exceed/),
  ).toBeVisible();
  await page.getByLabel("FIXED COMMITMENT START (OPTIONAL)").fill("");
  await page.getByLabel("FIXED COMMITMENT END (OPTIONAL)").fill("");
  await page.getByLabel("LATEST TIME (EXCLUSIVE)").fill(time(1));
  await page.getByLabel("TIME NEEDED").selectOption("1");
  await expect(
    page.getByText(/All complete forecast windows exceed/),
  ).toBeVisible();
  await page
    .getByLabel("CAN THE OUTING BE POSTPONED?")
    .selectOption("essential");
  await expect(page.getByText(/All complete options exceed/)).toBeVisible();
});

test("indoor advice uses the selected outdoor estimate without claiming an indoor measurement", async ({
  page,
}) => {
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
  await page.goto("/indoor", { waitUntil: "networkidle" });
  await expect(
    page.getByText(/Outdoor model estimate for Delhi: US AQI 120/),
  ).toBeVisible();
  await expect(
    page.getByText(/Reduce polluted outdoor air entry/),
  ).toBeVisible();
  await page.getByLabel("COOKING SMOKE?").selectOption("yes");
  await expect(
    page.getByText(/Reduce cooking smoke where possible/),
  ).toBeVisible();
  await page.getByLabel("OUTDOOR AIR CONTEXT").selectOption("unknown");
  await expect(
    page.getByText(/Check current outdoor conditions and maintain/),
  ).toBeVisible();
});

test("room sizing updates from area and rejects invalid values", async ({ page }) => {
  await page.goto("/indoor", { waitUntil: "domcontentloaded" });
  const area = page.getByLabel("ROOM FLOOR AREA (m²)");
  await area.fill("20");
  await expect(page.getByText("Suggested minimum smoke CADR: 244 m³/h")).toBeVisible();
  await area.fill("501");
  await expect(area).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByText(/Suggested minimum smoke CADR:/)).toHaveCount(0);
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
        referencedActionIds: ["air-unavailable", "indoor-smoke"],
        sourceIds: ["airnow-aqi", "epa-indoor"],
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
  await page.getByText("Sources for this answer").first().click();
  await expect(page.getByRole("link", { name: "AirNow: US AQI basics" })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "US EPA: improving indoor air" }),
  ).toBeVisible();
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
  await expect(
    page.getByLabel("CURRENT TRAVEL").locator('option[value="car"]'),
  ).toHaveText("UK average petrol car");
  await expect(page.getByRole("heading", { name: /11\.77 kg/ })).toBeVisible();
  await page.getByLabel("PEOPLE IN CAR").fill("2");
  await expect(
    page.getByRole("heading", { name: /4\.50 kg.*more/ }),
  ).toBeVisible();
  await page.getByLabel("CURRENT TRAVEL").selectOption("custom");
  await page.getByLabel("BASELINE FACTOR (KG CO₂E / PASSENGER-KM)").fill("0.2");
  await expect(page.getByRole("heading", { name: /19\.23 kg/ })).toBeVisible();
});

test("commute comparison uses current modeled air and handles a provider outage", async ({ page }) => {
  const now = new Date();
  await page.route("**/api/air?**", (route) => route.fulfill({
    json: {
      retrievedAt: now.toISOString(),
      data: {
        timezone: "UTC", utc_offset_seconds: 0,
        current: { time: now.toISOString().slice(0, 16), us_aqi: 180, pm2_5: 80, pm10: 100 },
        hourly: { time: [], us_aqi: [] },
      },
    },
  }));
  await page.goto("/impact", { waitUntil: "networkidle" });
  await expect(page.getByText(/Current modeled US AQI in Delhi: 180/)).toBeVisible();
  await expect(page.getByText(/Consider reducing prolonged or strenuous outdoor activity/)).toBeVisible();
  await page.unrouteAll({ behavior: "wait" });
  await page.route("**/api/air?**", (route) => route.fulfill({ status: 503, json: { error: "unavailable" } }));
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.getByText(/Current city air data is unavailable or stale/)).toBeVisible();
  await expect(page.getByRole("heading", { name: /11\.77 kg/ })).toBeVisible();
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
