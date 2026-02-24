import { test, expect } from "../fixtures/auth";

test.describe("Mobile Navigation", () => {
  test("hamburger menu button is visible on mobile viewport", async ({
    userAPage,
  }) => {
    await userAPage.goto("/dashboard");

    // The hamburger menu button should be visible (it has aria-label "Open navigation menu")
    const menuButton = userAPage.getByRole("button", {
      name: /open navigation menu/i,
    });
    await expect(menuButton).toBeVisible({ timeout: 10_000 });
  });

  test("open and close mobile menu", async ({ userAPage }) => {
    await userAPage.goto("/dashboard");

    const menuButton = userAPage.getByRole("button", {
      name: /open navigation menu/i,
    });
    await expect(menuButton).toBeVisible({ timeout: 10_000 });

    // Open menu
    await menuButton.click();

    // Nav links should now be visible in the mobile menu
    await expect(userAPage.getByRole("button", { name: /^ideas$/i })).toBeVisible();
    await expect(userAPage.getByRole("button", { name: /^agents$/i })).toBeVisible();

    // Close menu by clicking hamburger again
    await menuButton.click();

    // Wait a moment for the menu to close
    await userAPage.waitForTimeout(300);

    // The mobile menu content (Sign Out button which is only in mobile menu for logged-in users)
    // should no longer be visible. We check that the Sign Out button disappears.
    const signOutButton = userAPage.locator("button").filter({ hasText: /sign out/i });
    await expect(signOutButton).not.toBeVisible();
  });

  test("mobile menu auto-closes on navigation", async ({ userAPage }) => {
    await userAPage.goto("/dashboard");

    const menuButton = userAPage.getByRole("button", {
      name: /open navigation menu/i,
    });
    await expect(menuButton).toBeVisible({ timeout: 10_000 });

    // Open menu
    await menuButton.click();

    // Click "Ideas" link in the mobile menu (href is still /feed)
    const feedLink = userAPage.locator("a[href='/feed']");
    await feedLink.click();

    // Wait for navigation
    await userAPage.waitForURL("**/feed", { timeout: 15_000 });

    // Menu should be auto-closed (the mobile-only sign out button should not be visible)
    const signOutButton = userAPage.locator("button").filter({ hasText: /sign out/i });
    await expect(signOutButton).not.toBeVisible();
  });

  test("all expected nav links are present in mobile menu", async ({
    userAPage,
  }) => {
    await userAPage.goto("/dashboard");

    const menuButton = userAPage.getByRole("button", {
      name: /open navigation menu/i,
    });
    await expect(menuButton).toBeVisible({ timeout: 10_000 });

    // Open menu
    await menuButton.click();

    // Verify all expected nav links are present in the mobile menu
    // The mobile menu uses <Link> wrapping <Button>, so we check for the button text
    await expect(
      userAPage.getByRole("button", { name: /^ideas$/i })
    ).toBeVisible();
    await expect(
      userAPage.getByRole("button", { name: /^agents$/i })
    ).toBeVisible();
    await expect(
      userAPage.getByRole("button", { name: /new idea/i })
    ).toBeVisible();
    await expect(
      userAPage.getByRole("button", { name: /guide/i })
    ).toBeVisible();
    await expect(
      userAPage.getByRole("button", { name: /members/i })
    ).toBeVisible();
  });
});
