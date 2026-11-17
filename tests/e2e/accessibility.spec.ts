import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

for (const route of [
  "/",
  "/planner",
  "/scenarios",
  "/indoor",
  "/impact",
  "/assistant",
  "/settings",
]) {
  test(`automated accessibility checks: ${route}`, async ({ page }) => {
    await page.route("**/api/air?**", (route) =>
      route.fulfill({ status: 503, json: { error: "Unavailable" } }),
    );
    await page.goto(route, { waitUntil: "networkidle" });
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    expect(
      results.violations.map((violation) => ({
        id: violation.id,
        targets: violation.nodes.map((node) => node.target),
        details: violation.nodes.map((node) => node.failureSummary),
      })),
    ).toEqual([]);
  });
}

test("keyboard users can skip repeated navigation", async ({ page }) => {
  await page.route("**/api/air?**", (route) =>
    route.fulfill({ status: 503, json: { error: "Unavailable" } }),
  );
  await page.goto("/", { waitUntil: "networkidle" });
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Skip to main content" }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();
});

test("pages fit a narrow mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.route("**/api/air?**", (route) =>
    route.fulfill({ status: 503, json: { error: "Unavailable" } }),
  );
  for (const route of [
    "/",
    "/planner",
    "/scenarios",
    "/indoor",
    "/impact",
    "/assistant",
    "/settings",
  ]) {
    await page.goto(route, { waitUntil: "networkidle" });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
      route,
    ).toBeLessThanOrEqual(320);
  }
});

test("assistant response remains accessible after a conversation", async ({
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
    .fill("How should I plan my trip?");
  await page.getByRole("button", { name: "Ask SaafSky" }).click();
  await expect(page.getByText("RULE-BASED FALLBACK")).toBeVisible();
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(
    results.violations.map((violation) => ({
      id: violation.id,
      targets: violation.nodes.map((node) => node.target),
    })),
  ).toEqual([]);
});

test("expanded recommendation explanations remain accessible", async ({
  page,
}) => {
  await page.goto("/scenarios", { waitUntil: "networkidle" });
  await page.getByText("Why this action?").first().click();
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(
    results.violations.map((violation) => ({
      id: violation.id,
      targets: violation.nodes.map((node) => node.target),
    })),
  ).toEqual([]);
});
