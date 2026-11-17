import { expect, test } from "@playwright/test";

test.use({ hasTouch: true });

test("mobile city search supports keyboard selection and announces the result", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.route("**/api/air?**", (route) => route.fulfill({ status: 503, json: { error: "Unavailable" } }));
  await page.route("**/api/locations?**", (route) => route.fulfill({ json: { results: [{ name: "Pune", admin1: "Maharashtra", country: "India", latitude: 18.52, longitude: 73.85 }] } }));
  await page.goto("/");
  const city = page.getByLabel("YOUR LOCATION");
  await city.focus();
  await city.fill("Pune");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("status").filter({ hasText: "1 city found" })).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Search", exact: true })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Pune, Maharashtra, India" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(city).toBeFocused();
  await expect(page.getByRole("status").filter({ hasText: "Pune selected" })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Today in Pune/ })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});

test("mobile touch can select a city and change household preferences", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.route("**/api/air?**", (route) => route.fulfill({ status: 503, json: { error: "Unavailable" } }));
  await page.route("**/api/locations?**", (route) => route.fulfill({ json: { results: [{ name: "Pune", country: "India", latitude: 18.52, longitude: 73.85 }] } }));
  await page.goto("/");
  await page.getByLabel("YOUR LOCATION").fill("Pune");
  await page.getByRole("button", { name: "Search", exact: true }).tap();
  await page.getByRole("button", { name: "Pune, India" }).tap();
  await page.getByRole("link", { name: "My preferences" }).tap();
  await expect(page.getByText("Pune, India", { exact: true })).toBeVisible();
  await page.getByLabel("CHILDREN IN HOUSEHOLD").selectOption("yes");
  await page.getByRole("button", { name: "Clear preferences" }).tap();
  await expect(page.getByText("Preferences cleared.")).toBeVisible();
});
