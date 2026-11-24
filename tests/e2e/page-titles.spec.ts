import { expect, test } from "@playwright/test";

test("assistant dashboard link follows the selected language", async ({
  page,
}) => {
  await page.route("**/api/air?**", (route) =>
    route.fulfill({ status: 503, json: { error: "Unavailable" } }),
  );
  await page.goto("/assistant", { waitUntil: "networkidle" });
  await expect(
    page.getByRole("link", { name: "← Back to dashboard" }),
  ).toBeVisible();
  await page.locator("#site-language").selectOption("hi");
  await expect(
    page.getByRole("link", { name: "← डैशबोर्ड पर वापस जाएँ" }),
  ).toBeVisible();
});

const pages = [
  ["/", "SaafSky — Personal Air Quality Planner"],
  ["/planner", "Daily Planner | SaafSky"],
  ["/indoor", "Indoor Air | SaafSky"],
  ["/impact", "Commute Impact | SaafSky"],
  ["/assistant", "Ask SaafSky | SaafSky"],
  ["/scenarios", "Scenarios | SaafSky"],
  ["/settings", "Preferences | SaafSky"],
] as const;

test("each page has a distinctive title", async ({ page }) => {
  for (const [path, title] of pages) {
    await page.goto(path, { waitUntil: "domcontentloaded" });
    await expect(page).toHaveTitle(title);
  }
});

test("titles follow in-app navigation", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await page.locator('nav.desktop-nav a[href="/planner"]').click();
  await expect(page).toHaveTitle("Daily Planner | SaafSky");
  await page.locator('nav.desktop-nav a[href="/indoor"]').click();
  await expect(page).toHaveTitle("Indoor Air | SaafSky");
});
