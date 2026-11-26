import { expect, test } from "@playwright/test";

test("all routes and core interactive controls work in this browser engine", async ({
  page,
}) => {
  await page.route("**/api/air?**", (route) =>
    route.fulfill({ status: 503, json: { error: "Unavailable" } }),
  );

  for (const path of [
    "/",
    "/planner",
    "/indoor",
    "/impact",
    "/assistant",
    "/settings",
    "/scenarios",
  ]) {
    await page.goto(path, { waitUntil: "domcontentloaded" });
    await expect(
      page.locator("#main-content").getByRole("heading", { level: 1 }),
    ).toBeVisible();
  }

  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.getByRole("link", { name: "Daily planner" }).click();
  await expect(page).toHaveURL(/\/planner\/?$/);

  await page.goto("/scenarios", { waitUntil: "domcontentloaded" });
  await page.getByLabel("SAMPLE US AQI").selectOption("250");
  await expect(page.getByRole("status")).toContainText("US AQI 250");

  await page.goto("/impact", { waitUntil: "domcontentloaded" });
  await page.getByLabel("ALTERNATIVE").selectOption("metro");
  await expect(page.getByRole("heading", { name: /43\.80 kg/ })).toBeVisible();
  await page.locator("#site-language").selectOption("hi");
  await expect(page.locator("html")).toHaveAttribute("lang", "hi");
  await expect(page.locator("#main-content h1")).toContainText("अपने विकल्पों");
});
