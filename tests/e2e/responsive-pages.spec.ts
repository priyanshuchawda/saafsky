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
  { name: "tablet-768", width: 768, height: 1024 },
  { name: "laptop-1024", width: 1024, height: 900 },
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
          "button, input, select, textarea, .quick-nav a, .mobile-nav summary, .mobile-nav nav a, .action-reason summary",
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
      if (scrollWidth > viewport.width) {
        const overflowingElements = await page.locator("body *").evaluateAll(
          (elements) =>
            elements
              .map((element) => {
                const bounds = element.getBoundingClientRect();
                return {
                  tag: element.tagName.toLowerCase(),
                  className: typeof element.className === "string" ? element.className : "",
                  text: element.textContent?.trim().slice(0, 60) ?? "",
                  left: Math.round(bounds.left),
                  right: Math.round(bounds.right),
                  width: Math.round(bounds.width),
                };
              })
              .filter((element) => element.right > window.innerWidth + 1)
              .sort((left, right) => right.right - left.right)
              .slice(0, 20),
        );
        console.log(`${path} overflow details (${await page.evaluate(() => window.innerWidth)}px): ${JSON.stringify(overflowingElements)}`);
      }
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

test("Hindi language persists across routes and fits mobile and desktop layouts", async ({
  page,
}) => {
  const screenshotDirectory = join(tmpdir(), "saafsky-visual-review");
  await mkdir(screenshotDirectory, { recursive: true });
  const localizedPages = [
    ["/", "आपकी हवा एक नज़र में"],
    ["/planner", "ज़रूरी बाहर जाने की योजना"],
    ["/indoor", "घर के अंदर की हवा के सुझाव"],
    ["/impact", "आवागमन का प्रभाव"],
    ["/assistant", "आपका वायु सहायक"],
    ["/settings", "आपकी सेटिंग्स"],
    ["/scenarios", "परिदृश्य की तुलना"],
  ] as const;
  await page.route("**/api/air**", (route) =>
    route.fulfill({ status: 503, json: { error: "Unavailable" } }),
  );
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.getByLabel("Language").selectOption("hi");
  await expect(page.locator("html")).toHaveAttribute("lang", "hi");
  await expect(page).toHaveTitle("SaafSky");

  for (const viewport of [
    { width: 390, height: 844 },
    { width: 1440, height: 960 },
  ]) {
    await page.setViewportSize(viewport);
    for (const [path, heading] of localizedPages) {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      await expect(page.locator("html")).toHaveAttribute("lang", "hi");
      await expect(
        page.locator("#main-content").getByText(heading, { exact: true }),
      ).toBeVisible();
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
        `${path} overflows at ${viewport.width}px in Hindi`,
      ).toBeLessThanOrEqual(viewport.width);
      const slug = path === "/" ? "dashboard" : path.slice(1);
      await page.screenshot({
        path: join(screenshotDirectory, `hindi-${viewport.width}-${slug}.png`),
        fullPage: true,
      });
    }
  }

  let receivedLanguage: unknown;
  await page.route("**/api/chat", async (route) => {
    receivedLanguage = route.request().postDataJSON().language;
    await route.fulfill({
      json: {
        mode: "fallback",
        referencedActionIds: ["reduce-outdoor-exertion"],
        sourceIds: ["airnow-aqi"],
        answer: "बाहर की गतिविधि कम करें।",
        uncertainty: "पूर्वानुमान बदल सकता है।",
      },
    });
  });
  await page.goto("/assistant", { waitUntil: "domcontentloaded" });
  await page.getByLabel(/आपका सवाल/).fill("आज बाहर जाना ठीक है?");
  await page.getByRole("button", { name: "साफ़स्काई से पूछें" }).click();
  await expect(page.getByText("बाहर की गतिविधि कम करें।")).toBeVisible();
  expect(receivedLanguage).toBe("hi");
});
