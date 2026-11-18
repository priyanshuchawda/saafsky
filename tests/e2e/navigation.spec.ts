import { expect, test } from "@playwright/test";

const destinations = [
  { label: "Daily planner", path: "/planner", heading: "Find a" },
  { label: "Indoor air", path: "/indoor", heading: "Care for the air" },
  {
    label: "Commute impact",
    path: "/impact",
    heading: "Compare your",
  },
  { label: "Ask SaafSky", path: "/assistant", heading: "Ask a" },
  { label: "My preferences", path: "/settings", heading: "Make it" },
  {
    label: "Explore scenarios",
    path: "/scenarios",
    heading: "See the plan",
  },
];

test("dashboard navigation reaches every product page on desktop and mobile", async ({
  page,
}) => {
  await page.route("**/api/air**", (route) =>
    route.fulfill({ status: 503, json: { error: "Unavailable" } }),
  );

  for (const width of [320, 1440]) {
    await page.setViewportSize({ width, height: 850 });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    for (const destination of destinations) {
      const link =
        destination.path === "/scenarios"
          ? page.locator('.top .nav-link[href="/scenarios"]')
          : page
              .locator(".quick-nav")
              .getByRole("link", { name: destination.label, exact: true });
      await link.click();
      await expect(page).toHaveURL(new RegExp(`${destination.path}/?$`));
      await expect(
        page.getByRole("heading", { level: 1 }).first(),
        `${destination.path} should render its page heading`,
      ).toContainText(destination.heading);
      await page.locator(".top .brand").first().click();
      await expect(page).toHaveURL(/\/$/);
    }
  }
});
