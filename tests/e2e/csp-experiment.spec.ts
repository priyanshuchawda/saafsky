import { expect, test } from "@playwright/test";

test("candidate CSP observes violations without disrupting navigation", async ({
  page,
}) => {
  test.setTimeout(90_000);
  await page.addInitScript(() => {
    const state = window as Window & { cspViolations?: string[] };
    state.cspViolations = [];
    document.addEventListener("securitypolicyviolation", (event) => {
      if (event.disposition === "report") {
        state.cspViolations?.push(event.effectiveDirective);
      }
    });
  });
  await page.route("**/*", async (route) => {
    if (route.request().resourceType() !== "document") return route.fallback();
    const response = await route.fetch();
    await route.fulfill({
      response,
      headers: {
        ...response.headers(),
        "content-security-policy-report-only":
          "base-uri 'self'; form-action 'self'; object-src 'none'; frame-ancestors 'none'; report-uri /csp-test-report",
      },
    });
  });
  await page.route("**/csp-test-report", (route) =>
    route.fulfill({ status: 204 }),
  );
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
    await page.goto(path, { waitUntil: "networkidle" });
    await expect(page.locator("#main-content")).toBeVisible();
    const violations = await page.evaluate(
      () =>
        (window as Window & { cspViolations?: string[] }).cspViolations ?? [],
    );
    expect(violations, path).toEqual([]);
  }
  await page.evaluate(() => {
    const base = document.createElement("base");
    base.href = "https://other.example/";
    document.head.append(base);
  });
  await expect
    .poll(() => page.evaluate(() => document.baseURI))
    .not.toMatch(/^https:\/\/other\.example/);
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as Window & { cspViolations?: string[] }).cspViolations ?? [],
      ),
    )
    .toContain("base-uri");
});
