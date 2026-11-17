import { expect, test } from "@playwright/test";

test("rate limits show separate retry messages for air, search and assistant", async ({
  page,
}) => {
  await page.route("**/api/air?**", (route) =>
    route.fulfill({
      status: 429,
      headers: { "Retry-After": "120" },
      json: { error: "limited" },
    }),
  );
  await page.route("**/api/locations?**", (route) =>
    route.fulfill({
      status: 429,
      headers: { "Retry-After": "15" },
      json: { error: "limited" },
    }),
  );
  await page.goto("/", { waitUntil: "networkidle" });
  await expect(
    page.getByText("Request limit reached. Please try again in 2 minutes."),
  ).toBeVisible();
  await page.getByLabel("YOUR LOCATION").fill("Pune");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(
    page.getByText("Request limit reached. Please try again in 15 seconds."),
  ).toBeVisible();
  await expect(
    page.getByText("Request limit reached. Please try again in 2 minutes."),
  ).toBeVisible();
  await page.route("**/api/chat", (route) =>
    route.fulfill({
      status: 429,
      headers: { "Retry-After": "60" },
      json: { error: "limited" },
    }),
  );
  await page.goto("/assistant", { waitUntil: "networkidle" });
  await page.getByLabel("YOUR QUESTION ABOUT DELHI").fill("What should I do?");
  await page.getByRole("button", { name: "Ask SaafSky" }).click();
  await expect(
    page.getByText("Request limit reached. Please try again in 1 minute."),
  ).toBeVisible();
});
