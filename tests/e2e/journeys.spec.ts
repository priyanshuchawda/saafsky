import { expect, test } from "@playwright/test";

test("dashboard forecast presents accessible values and opens the planner", async ({
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
            time: [time(0), time(1), time(2)],
            us_aqi: [120, null, 180],
          },
        },
      },
    }),
  );
  await page.goto("/", { waitUntil: "networkidle" });
  const forecast = page.getByRole("list", {
    name: "Hourly forecast comparison",
  });
  await expect(forecast.locator("li")).toHaveCount(3);
  await expect(forecast.locator("li").nth(0)).toContainText("120");
  await expect(forecast.locator("li").nth(1)).toContainText("—");
  await expect(
    forecast.locator("li").nth(1).locator(".forecast-bar"),
  ).toHaveCount(0);
  await expect(
    page.getByText("Bar scale: 0 to 200 US AQI; values are model estimates."),
  ).toBeVisible();
  await page.getByRole("link", { name: "Compare outing times" }).click();
  await expect(page).toHaveURL(/\/planner\/?$/);
});

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
  await page.getByLabel("SAMPLE US AQI").selectOption("180");
  await page.getByLabel("COMMUTE", { exact: true }).selectOption("bike");
  await expect(
    page.getByText("Review your commute", { exact: true }),
  ).toBeVisible();
});

test("scenario compares two households using the same illustrative air", async ({
  page,
}) => {
  let apiRequests = 0;
  page.on("request", (request) => {
    if (new URL(request.url()).pathname.startsWith("/api/")) apiRequests += 1;
  });
  await page.goto("/scenarios", { waitUntil: "networkidle" });
  const toggle = page.getByRole("button", {
    name: "Compare another household",
  });
  await toggle.click();
  await expect(
    page.getByRole("button", { name: "Hide household comparison" }),
  ).toHaveAttribute("aria-expanded", "true");
  const first = page.getByRole("article", { name: "Selected household plan" });
  const second = page.getByRole("article", {
    name: "Comparison household plan",
  });
  await expect(first.getByText("Consider sensitive people")).toBeVisible();
  await expect(second.getByText("Reduce outdoor exertion")).toBeVisible();
  await second.getByText("Why this action?").first().click();
  await expect(
    second.getByRole("link", { name: "AirNow: US AQI basics" }),
  ).toBeVisible();
  await page.getByLabel("SAMPLE US AQI").selectOption("180");
  await page.getByLabel("COMPARE WITH").selectOption("cyclist");
  await expect(second.getByText("Review your commute")).toBeVisible();
  await expect(first.getByText("Review your commute")).toHaveCount(0);
  await page.getByRole("button", { name: "Hide household comparison" }).click();
  await expect(second).toHaveCount(0);
  expect(apiRequests).toBe(0);
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
  await page
    .getByRole("button", { name: "Use next available forecast hours" })
    .click();
  await expect(page.getByLabel("EARLIEST TIME")).toHaveValue(time(0));
  await expect(page.getByLabel("LATEST TIME (EXCLUSIVE)")).toHaveValue(time(3));
  await page.getByLabel("HOUSEHOLD").selectOption("sensitive");
  await page.getByLabel("EARLIEST TIME").fill(time(0));
  await page.getByLabel("LATEST TIME (EXCLUSIVE)").fill(time(4));
  await page.getByLabel("TIME NEEDED").selectOption("2");
  await expect(page.getByText(/peak US AQI 90/)).toBeVisible();
  await page.getByLabel("FIXED COMMITMENT START (OPTIONAL)").fill(time(1));
  await expect(page.getByText(/Enter both commitment times/)).toBeVisible();
  await page.getByLabel("FIXED COMMITMENT END (OPTIONAL)").fill(time(2));
  await page
    .getByRole("button", { name: "Use next available forecast hours" })
    .click();
  await expect(
    page.getByLabel("FIXED COMMITMENT START (OPTIONAL)"),
  ).toHaveValue(time(1));
  await expect(page.getByLabel("FIXED COMMITMENT END (OPTIONAL)")).toHaveValue(
    time(2),
  );
  await page.getByLabel("LATEST TIME (EXCLUSIVE)").fill(time(4));
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

test("changing the planner city clears city-local schedule times", async ({
  page,
}) => {
  await page.route("**/api/air?**", (route) =>
    route.fulfill({ status: 503, json: { error: "Unavailable" } }),
  );
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
  await page.goto("/planner", { waitUntil: "networkidle" });
  const fields = [
    "EARLIEST TIME",
    "LATEST TIME (EXCLUSIVE)",
    "FIXED COMMITMENT START (OPTIONAL)",
    "FIXED COMMITMENT END (OPTIONAL)",
  ];
  for (const field of fields)
    await page.getByLabel(field).fill("2026-11-20T09:00");
  await page.getByLabel("YOUR LOCATION").fill("Pune");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await page.getByRole("button", { name: "Pune, Maharashtra, India" }).click();
  for (const field of fields)
    await expect(page.getByLabel(field)).toHaveValue("");
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

test("room sizing updates from area and rejects invalid values", async ({
  page,
}) => {
  await page.goto("/indoor", { waitUntil: "domcontentloaded" });
  const area = page.getByLabel("ROOM FLOOR AREA (m²)");
  await area.fill("20");
  await expect(
    page.getByText("Suggested minimum smoke CADR: 244 m³/h"),
  ).toBeVisible();
  const purifier = page.getByLabel(
    "YOUR PURIFIER'S SMOKE CADR (m³/h, optional)",
  );
  await purifier.fill("200");
  await expect(
    page.getByText("The reported smoke CADR is below this room-size estimate."),
  ).toBeVisible();
  await purifier.fill("244");
  await expect(
    page.getByText("The reported smoke CADR meets this room-size estimate."),
  ).toBeVisible();
  await purifier.fill("-1");
  await purifier.blur();
  await expect(purifier).toHaveAttribute("aria-invalid", "true");
  await expect(
    page.getByText("The reported smoke CADR meets this room-size estimate."),
  ).toHaveCount(0);
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
  await expect(
    page.locator("section.plan").getByText("Check local conditions."),
  ).toBeVisible();
  await page.getByText("Sources for this answer").first().click();
  await expect(
    page.getByRole("link", { name: "AirNow: US AQI basics" }),
  ).toBeVisible();
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
  await page.getByLabel("ALTERNATIVE").selectOption("underground");
  await expect(page.getByRole("heading", { name: /26\.98 kg/ })).toBeVisible();
  await page.getByLabel("ALTERNATIVE").selectOption("bus");
  await page.getByLabel("PEOPLE IN CAR").fill("2");
  await expect(
    page.getByRole("heading", { name: /4\.50 kg.*more/ }),
  ).toBeVisible();
  await page.getByLabel("CURRENT TRAVEL").selectOption("custom");
  await page.getByLabel("BASELINE FACTOR (KG CO₂E / PASSENGER-KM)").fill("0.2");
  await expect(page.getByRole("heading", { name: /19\.23 kg/ })).toBeVisible();
});

test("commute comparison uses current modeled air and handles a provider outage", async ({
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
            us_aqi: 180,
            pm2_5: 80,
            pm10: 100,
          },
          hourly: { time: [], us_aqi: [] },
        },
      },
    }),
  );
  await page.goto("/impact", { waitUntil: "networkidle" });
  await expect(
    page.getByText(/Current modeled US AQI in Delhi: 180/),
  ).toBeVisible();
  await expect(
    page.getByText(/Consider reducing prolonged or strenuous outdoor activity/),
  ).toBeVisible();
  await page.unrouteAll({ behavior: "wait" });
  await page.route("**/api/air?**", (route) =>
    route.fulfill({ status: 503, json: { error: "unavailable" } }),
  );
  await page.reload({ waitUntil: "networkidle" });
  await expect(
    page.getByText(/Current city air data is unavailable or stale/),
  ).toBeVisible();
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

test("restores the saved city without requesting the default city", async ({
  page,
}) => {
  const requestedAir: string[] = [];
  await page.addInitScript(() => {
    localStorage.setItem(
      "saafsky:city",
      JSON.stringify({
        name: "Pune",
        country: "India",
        latitude: 18.52,
        longitude: 73.85,
      }),
    );
    localStorage.setItem("saafsky:language", "hi");
  });
  await page.route("**/api/air?**", async (route) => {
    requestedAir.push(route.request().url());
    await route.fulfill({ status: 503, json: {} });
  });
  await page.goto("/", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: /पुणे/ })).toBeVisible();
  expect(requestedAir).toHaveLength(1);
  expect(requestedAir[0]).toContain("lat=18.52");
  await page.locator('a[href="/assistant"]').first().click();
  await expect(page.getByLabel(/पुणे/)).toBeVisible();
});

test("planner associates an incomplete commitment with the missing field", async ({
  page,
}) => {
  await page.goto("/planner", { waitUntil: "networkidle" });
  const start = page.locator("#busy-start");
  const end = page.locator("#busy-end");
  await start.fill("2026-11-20T09:00");
  await expect(end).toHaveAttribute("aria-invalid", "true");
  await expect(end).toHaveAccessibleDescription(/Enter both commitment times/);
  await end.fill("2026-11-20T10:00");
  await expect(end).toHaveAttribute("aria-invalid", "false");
  await start.fill("");
  await expect(start).toHaveAttribute("aria-invalid", "true");
  await expect(start).toHaveAccessibleDescription(
    /Enter both commitment times/,
  );
});

test("preferences remain usable when browser storage rejects writes", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = function () {
      throw new DOMException("Storage is full", "QuotaExceededError");
    };
    Storage.prototype.removeItem = function () {
      throw new DOMException("Storage is unavailable", "SecurityError");
    };
  });
  await page.route("**/api/air?**", (route) =>
    route.fulfill({ status: 503, json: {} }),
  );
  await page.route("**/api/locations?**", (route) =>
    route.fulfill({
      json: {
        results: [
          { name: "Pune", country: "India", latitude: 18.52, longitude: 73.85 },
        ],
      },
    }),
  );
  await page.goto("/", { waitUntil: "networkidle" });
  await page.locator("#profile").selectOption("sensitive");
  await expect(page.locator("#profile")).toHaveValue("sensitive");
  await page.locator("#city").fill("Pune");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await page.getByRole("button", { name: "Pune, India" }).click();
  await expect(
    page.getByRole("heading", { name: /Today in Pune/ }),
  ).toBeVisible();
  await page.getByLabel("Language").selectOption("hi");
  await expect(page.getByRole("heading", { name: /थोड़ा खुलकर/ })).toBeVisible();
  await expect(page.locator("#site-language")).toHaveValue("hi");
  await page.locator('a[href="/settings"]').first().click();
  await page.getByRole("button", { name: "प्राथमिकताएँ मिटाएँ" }).click();
  await expect(page.locator("#site-language")).toHaveValue("en");
  await expect(page.getByText(/Delhi, India/)).toBeVisible();
});

test("assistant keeps an active request pending when language changes", async ({
  page,
}) => {
  let requests = 0;
  let release = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/chat", async (route) => {
    requests++;
    await gate;
    await route.fulfill({
      json: {
        mode: "fallback",
        referencedActionIds: [],
        sourceIds: [],
        answer: "Check local conditions.",
        uncertainty: "AI is unavailable.",
      },
    });
  });
  try {
    await page.goto("/assistant", { waitUntil: "networkidle" });
    await page.locator("#question").fill("How should I plan my commute?");
    const submit = page.locator(
      'form[aria-label="Ask SaafSky"] button[type="submit"], form[aria-label="Ask SaafSky"] button:not([type])',
    );
    await submit.click();
    await expect(submit).toBeDisabled();
    await expect(submit).toBeFocused();
    await expect.poll(() => requests).toBe(1);
    await submit.evaluate((button) => button.closest("form")?.requestSubmit());
    expect(requests).toBe(1);
    await page.locator("#site-language").selectOption("hi");
    const hindiSubmit = page.getByRole("button", { name: "साफ़स्काई से पूछें" });
    await expect(hindiSubmit).toBeDisabled();
    await expect(
      page
        .locator("#assistant-announcement")
        .getByText("आपका उत्तर तैयार हो रहा है…"),
    ).toBeVisible();
    release();
    await expect(hindiSubmit).toBeEnabled();
  } finally {
    release();
  }
});
