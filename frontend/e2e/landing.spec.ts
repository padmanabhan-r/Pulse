import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("@smoke landing page", () => {
  test("renders hero, ticker, and sign-in link", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/Speak it/i);
    await expect(page.getByRole("log")).toBeAttached();
    await expect(page.getByRole("link", { name: /Sign in/i })).toBeVisible();
  });

  test("has no critical a11y violations", async ({ page }) => {
    await page.goto("/");
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    const critical = results.violations.filter((v) => ["critical", "serious"].includes(v.impact ?? ""));
    expect(critical, JSON.stringify(critical, null, 2)).toEqual([]);
  });
});
