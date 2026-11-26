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
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
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

test("accessibility scan detects a deliberately introduced low-contrast state", async ({
  page,
}) => {
  await page.setContent(`
    <html lang="en">
      <head><title>Contrast regression probe</title></head>
      <body>
        <main><p style="color:#aaa;background:#fff">Low contrast text</p></main>
      </body>
    </html>
  `);
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2aa"])
    .analyze();

  expect(results.violations.map((violation) => violation.id)).toContain(
    "color-contrast",
  );
});

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

test("missing forecast values have readable text for assistive technology", async ({
  page,
}) => {
  const now = new Date();
  const start = new Date(now);
  start.setUTCMinutes(0, 0, 0);
  const hours = Array.from({ length: 24 }, (_, index) => {
    const hour = new Date(start);
    hour.setUTCHours(start.getUTCHours() + index);
    return hour.toISOString().slice(0, 16);
  });
  await page.route("**/api/air?**", (route) =>
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
          hourly: {
            time: hours,
            us_aqi: hours.map((_, index) => (index === 1 ? null : 120)),
          },
        },
      },
    }),
  );
  await page.goto("/", { waitUntil: "networkidle" });
  await expect(page.locator(".hours strong .sr-only")).toHaveText(
    "Unavailable",
  );
});

test("pages with a current forecast pass automated accessibility checks", async ({
  page,
}) => {
  test.setTimeout(90_000);
  const now = new Date();
  const start = new Date(now);
  start.setUTCMinutes(0, 0, 0);
  const hours = Array.from({ length: 24 }, (_, index) => {
    const hour = new Date(start);
    hour.setUTCHours(start.getUTCHours() + index);
    return hour.toISOString().slice(0, 16);
  });
  await page.route("**/api/air?**", (route) =>
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
          hourly: { time: hours, us_aqi: hours.map(() => 120) },
        },
      },
    }),
  );
  const paths = [
    "/",
    "/planner",
    "/indoor",
    "/impact",
    "/assistant",
    "/settings",
    "/scenarios",
  ];
  for (const language of ["en", "hi"]) {
    if (language === "hi")
      await page.locator("#site-language").selectOption("hi");
    for (const path of paths) {
      await page.goto(path, { waitUntil: "networkidle" });
      await expect(page.locator("html")).toHaveAttribute("lang", language);
      if (path === "/" && language === "en") {
        await expect(page.getByText(/Model estimate for Delhi/)).toBeVisible();
        await expect(page.getByText("120").first()).toBeVisible();
      }
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        .analyze();
      expect(
        results.violations.map((violation) => ({
          id: violation.id,
          nodes: violation.nodes.map((node) => ({
            target: node.target,
            summary: node.failureSummary,
          })),
        })),
        `${language}: ${path}`,
      ).toEqual([]);
    }
  }
});

test("mobile navigation opens and moves by keyboard", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.route("**/api/air?**", (route) =>
    route.fulfill({ status: 503, json: { error: "Unavailable" } }),
  );
  await page.goto("/", { waitUntil: "networkidle" });
  const menu = page.locator(".mobile-nav");
  const summary = menu.locator("summary");

  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await expect(summary).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(menu).toHaveAttribute("open", "");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await expect(menu.getByRole("link", { name: "Daily planner" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/planner\/?$/);
  await expect(menu).not.toHaveAttribute("open", "");
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
        referencedActionIds: ["air-unavailable", "indoor-smoke"],
        sourceIds: ["airnow-aqi", "epa-indoor"],
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
  await page.getByText("Sources for this answer").click();
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
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
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(
    results.violations.map((violation) => ({
      id: violation.id,
      targets: violation.nodes.map((node) => node.target),
    })),
  ).toEqual([]);
});

test("household comparison remains accessible on a narrow screen", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/scenarios", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Compare another household" }).click();
  await expect(page.getByLabel("COMPARE WITH")).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(320);
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(results.violations.map((violation) => violation.id)).toEqual([]);
});

test("form control borders have sufficient contrast against their surfaces", async ({
  page,
}) => {
  await page.route("**/api/air?**", (route) =>
    route.fulfill({ status: 503, json: { error: "Unavailable" } }),
  );
  for (const route of ["/", "/planner", "/impact", "/assistant"]) {
    await page.goto(route, { waitUntil: "networkidle" });
    const lowContrast = await page
      .locator(
        ".search input, .profile select, .profile input, .impact-form input, .plan textarea, .language-selector select",
      )
      .evaluateAll((elements) => {
        const luminance = (color: string) => {
          const values = color
            .match(/[\d.]+/g)
            ?.slice(0, 3)
            .map(Number);
          if (!values || values.length !== 3) return NaN;
          const channels = values.map((value) => {
            const channel = value / 255;
            return channel <= 0.04045
              ? channel / 12.92
              : ((channel + 0.055) / 1.055) ** 2.4;
          });
          return (
            0.2126 * channels[0]! +
            0.7152 * channels[1]! +
            0.0722 * channels[2]!
          );
        };
        return elements.flatMap((element) => {
          const style = getComputedStyle(element);
          if (
            !element.getClientRects().length ||
            style.borderTopWidth === "0px"
          )
            return [];
          const border = luminance(style.borderTopColor);
          const background = luminance(style.backgroundColor);
          const ratio =
            (Math.max(border, background) + 0.05) /
            (Math.min(border, background) + 0.05);
          return Number.isFinite(ratio) && ratio >= 3
            ? []
            : [`${element.tagName} ${element.id}: ${ratio.toFixed(2)}`];
        });
      });
    expect(lowContrast, route).toEqual([]);
  }
});
