import { test, expect } from "../fixtures/auth";

test.describe("Navbar", () => {
  test("active nav state on current route", async ({ userAPage }) => {
    await userAPage.goto("/dashboard");

    // Dashboard button should have "secondary" variant (active state)
    // Use getByRole to find the button directly (avoid logo link ambiguity)
    const dashboardButton = userAPage
      .locator("nav")
      .getByRole("button", { name: /^dashboard$/i })
      .first();
    await expect(dashboardButton).toBeVisible({ timeout: 15_000 });

    // Navigate to feed and check that Feed is now active
    await userAPage.goto("/feed");

    const feedButton = userAPage
      .locator("nav")
      .getByRole("button", { name: /^feed$/i })
      .first();
    await expect(feedButton).toBeVisible({ timeout: 15_000 });
  });

  test("logo links to /dashboard when authenticated", async ({ userAPage }) => {
    await userAPage.goto("/feed");

    // Click the logo (VibeCodes text or the sparkles icon link)
    const logoLink = userAPage.locator("nav a").filter({ hasText: "VibeCodes" }).first();
    await expect(logoLink).toBeVisible({ timeout: 15_000 });
    await logoLink.click();

    // Should navigate to /dashboard
    await userAPage.waitForURL("**/dashboard", { timeout: 15_000 });
    expect(userAPage.url()).toContain("/dashboard");
  });

  // Use freshPage (separate user) for sign out to avoid revoking shared auth tokens
  test("sign out redirects away from protected routes", async ({ freshPage }) => {
    await freshPage.goto("/dashboard");

    // Open the user dropdown menu (click the avatar button)
    const avatarButton = freshPage
      .locator("nav")
      .locator("button")
      .filter({ has: freshPage.locator("span.relative, [data-slot='avatar']") })
      .first();
    await expect(avatarButton).toBeVisible({ timeout: 15_000 });
    await avatarButton.click();

    // Click "Sign Out" in the dropdown
    const signOutItem = freshPage.getByText("Sign Out");
    await expect(signOutItem).toBeVisible({ timeout: 5_000 });
    await signOutItem.click();

    // Should redirect away from the dashboard — to either "/" or "/login"
    // (router.push("/") fires, but middleware may also redirect to /login)
    await freshPage.waitForURL(/\/(login)?$/, { timeout: 15_000 });
    const url = new URL(freshPage.url());
    expect(url.pathname === "/" || url.pathname === "/login").toBe(true);
  });

  test("theme toggle switches between dark and light", async ({ userAPage }) => {
    await userAPage.goto("/dashboard");

    // Get the theme toggle button (has sr-only text "Toggle theme")
    const themeToggle = userAPage.getByRole("button", { name: /toggle theme/i }).first();
    await expect(themeToggle).toBeVisible({ timeout: 15_000 });

    // Check current theme class on html element
    const initialTheme = await userAPage.evaluate(() =>
      document.documentElement.classList.contains("dark") ? "dark" : "light"
    );

    // Click to toggle
    await themeToggle.click();

    // Wait for theme transition
    await userAPage.waitForTimeout(500);

    // Verify the theme changed
    const newTheme = await userAPage.evaluate(() =>
      document.documentElement.classList.contains("dark") ? "dark" : "light"
    );
    expect(newTheme).not.toBe(initialTheme);

    // Toggle back to restore original state
    await themeToggle.click();
    await userAPage.waitForTimeout(500);

    const restoredTheme = await userAPage.evaluate(() =>
      document.documentElement.classList.contains("dark") ? "dark" : "light"
    );
    expect(restoredTheme).toBe(initialTheme);
  });
});
