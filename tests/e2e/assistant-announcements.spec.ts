import { expect, test } from "@playwright/test";

test("assistant announces only request status and the latest answer", async ({
  page,
}) => {
  let release = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let requests = 0;
  await page.route("**/api/air?**", (route) =>
    route.fulfill({ status: 503, json: { error: "Unavailable" } }),
  );
  await page.route("**/api/chat", async (route) => {
    requests++;
    if (requests === 2) await gate;
    await route.fulfill({
      json: {
        mode: "fallback",
        referencedActionIds: [],
        sourceIds: [],
        answer: requests === 1 ? "First answer." : "Second answer.",
        uncertainty: "Forecasts can change.",
      },
    });
  });
  try {
    await page.goto("/assistant", { waitUntil: "networkidle" });
    const announcer = page.locator("#assistant-announcement");
    await expect(announcer).toHaveAttribute("role", "status");
    await expect(announcer).toHaveText("");
    await page.locator("#question").fill("First question?");
    await page.getByRole("button", { name: "Ask SaafSky" }).click();
    await expect(announcer).toHaveText("First answer.");
    await page.locator("#question").fill("Second question?");
    await page.getByRole("button", { name: "Ask SaafSky" }).click();
    await expect(announcer).toHaveText("Preparing your answer…");
    release();
    await expect(announcer).toHaveText("Second answer.");
    await expect(
      page.locator("section.plan").getByText("First answer."),
    ).toBeVisible();
    await expect(page.locator("section.plan")).not.toHaveAttribute("aria-live");
    await page.getByRole("button", { name: "Clear conversation" }).click();
    await expect(announcer).toHaveText("");
  } finally {
    release();
  }
});

test("planner keeps its forecast updates in a focused status region", async ({
  page,
}) => {
  await page.route("**/api/air?**", (route) =>
    route.fulfill({ status: 503, json: { error: "Unavailable" } }),
  );
  await page.goto("/planner", { waitUntil: "networkidle" });

  await expect(page.locator("section.plan[aria-live]")).toHaveCount(0);
  await expect(
    page.locator("section.plan.scenario-result").last().getByRole("status"),
  ).toContainText(/unavailable/i);
});

test("dynamic result cards do not announce their complete content", async ({
  page,
}) => {
  for (const path of ["/indoor", "/impact", "/scenarios"]) {
    await page.goto(path, { waitUntil: "domcontentloaded" });
    await expect(page.locator("main section[aria-live]")).toHaveCount(0);
  }
  await page.goto("/scenarios", { waitUntil: "domcontentloaded" });
  const scenarioStatus = page.getByRole("status");
  await expect(scenarioStatus).toContainText("Scenario updated");
  await page.getByLabel("SAMPLE US AQI").selectOption("250");
  await expect(scenarioStatus).toContainText("US AQI 250");
});
