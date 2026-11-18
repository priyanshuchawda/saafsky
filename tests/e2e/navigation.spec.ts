import { expect, test } from "@playwright/test";

const pages = [
  { label: "Dashboard", path: "/", heading: "Breathe a little" },
  { label: "Daily planner", path: "/planner", heading: "Find a" },
  { label: "Indoor air", path: "/indoor", heading: "Care for the air" },
  { label: "Commute impact", path: "/impact", heading: "Compare your" },
  { label: "Ask SaafSky", path: "/assistant", heading: "Ask a" },
  { label: "My preferences", path: "/settings", heading: "Make it" },
  { label: "Scenarios", path: "/scenarios", heading: "See the plan" },
];

test("shared navigation works from every page on desktop and mobile", async ({
  page,
}) => {
  await page.route("**/api/air**", (route) =>
    route.fulfill({ status: 503, json: { error: "Unavailable" } }),
  );

  for (const width of [320, 1440]) {
    await page.setViewportSize({ width, height: 850 });

    for (const [index, source] of pages.entries()) {
      await page.goto(source.path, { waitUntil: "domcontentloaded" });
      const mobile = width <= 700;
      const menu = page.locator(mobile ? ".mobile-nav" : ".desktop-nav");
      if (mobile) await menu.locator("summary").click();
      const navigation = mobile ? menu.locator("nav") : menu;
      await expect(navigation.getByRole("link")).toHaveCount(pages.length);

      const destination = pages[(index + 1) % pages.length];
      if (!destination) throw new Error("Navigation destination is missing.");
      await navigation
        .getByRole("link", { name: destination.label, exact: true })
        .click();
      await expect(page).toHaveURL(new RegExp(`${destination.path}/?$`));
      await expect(page.getByRole("heading", { level: 1 }).first()).toContainText(
        destination.heading,
      );
    }
  }
});
