import { mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@playwright/test";

const pages = [
  "/",
  "/planner",
  "/indoor",
  "/impact",
  "/assistant",
  "/scenarios",
  "/settings",
];
const viewports = [
  { name: "mobile-320", width: 320, height: 800 },
  { name: "mobile-390", width: 390, height: 844 },
  { name: "desktop", width: 1440, height: 960 },
];

test("all pages render at mobile and desktop widths without horizontal overflow", async ({
  page,
}) => {
  test.setTimeout(90_000);
  const screenshotDirectory = join(tmpdir(), "saafsky-visual-review");
  await mkdir(screenshotDirectory, { recursive: true });

  const now = new Date();
  const start = new Date(now);
  start.setUTCMinutes(0, 0, 0);
  const hourly = Array.from({ length: 24 }, (_, index) => {
    const hour = new Date(start);
    hour.setUTCHours(start.getUTCHours() + index);
    return hour.toISOString().slice(0, 16);
  });

  await page.route("**/api/air**", (route) =>
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
          hourly: { time: hourly, us_aqi: hourly.map(() => 120) },
        },
      },
    }),
  );

  for (const viewport of viewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    for (const path of pages) {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      await expect(page.locator("#main-content")).toBeVisible();
      if (path === "/") {
        await expect(page.getByText(/Model estimate for Delhi/)).toBeVisible();
      } else if (path === "/planner") {
        await expect(page.getByText(/Enter both times in UTC/)).toBeVisible();
      } else if (path === "/indoor") {
        await expect(
          page.getByText(/Outdoor model estimate for Delhi: US AQI 120/),
        ).toBeVisible();
      }
      if (path === "/assistant") {
        await expect(page.locator("section[aria-live='polite']")).toHaveCount(
          0,
        );
      }
      const undersizedTargets = await page
        .locator(
          "button, input, select, textarea, .nav-link, .quick-nav a, .action-reason summary",
        )
        .evaluateAll((elements) =>
          elements.flatMap((element) => {
            const bounds = element.getBoundingClientRect();
            const style = getComputedStyle(element);
            if (
              element.closest("nextjs-portal") ||
              bounds.height === 0 ||
              style.display === "none" ||
              style.visibility === "hidden"
            ) {
              return [];
            }
            return bounds.height < 48
              ? [
                  `${element.tagName.toLowerCase()}#${element.id}.${element.getAttribute("class") ?? ""} ${element.textContent?.trim() ?? ""} ${bounds.height}px (min ${style.minHeight})`,
                ]
              : [];
          }),
        );
      expect(
        undersizedTargets,
        `${path} has touch targets below 48px at ${viewport.width}px`,
      ).toEqual([]);
      const scrollWidth = await page.evaluate(
        () => document.documentElement.scrollWidth,
      );
      expect(
        scrollWidth,
        `${path} overflows at ${viewport.width}px (${scrollWidth}px)`,
      ).toBeLessThanOrEqual(viewport.width);
      const slug = path === "/" ? "dashboard" : path.slice(1);
      await page.screenshot({
        path: join(screenshotDirectory, `${viewport.name}-${slug}.png`),
        fullPage: true,
      });
    }
  }
});
