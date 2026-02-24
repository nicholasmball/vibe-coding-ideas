import { test, expect } from "../fixtures/auth";

test.describe("Forgot password page", () => {
  test.describe("Form display", () => {
    test("should display forgot-password form with email field", async ({
      anonPage,
    }) => {
      await anonPage.goto("/forgot-password");

      // Page heading
      await expect(anonPage.getByText("Reset your password")).toBeVisible();

      // Email field
      await expect(anonPage.getByLabel("Email")).toBeVisible();

      // Submit button
      await expect(
        anonPage.getByRole("button", { name: /send reset link/i })
      ).toBeVisible();

      // Back to login link
      await expect(
        anonPage.getByRole("link", { name: /back to login/i })
      ).toBeVisible();
    });
  });

  test.describe("Reset request", () => {
    test.fixme("should show confirmation message after submitting reset request", async ({
      anonPage,
    }) => {
      // fixme: Supabase email rate limiting prevents consistent test execution
      await anonPage.goto("/forgot-password");

      // Use an existing test user email so Supabase processes it
      const email =
        process.env.TEST_USER_A_EMAIL ?? "test-user-a@vibecodes-test.local";

      await anonPage.getByLabel("Email").fill(email);
      await anonPage.getByRole("button", { name: /send reset link/i }).click();

      // Success message should appear
      await expect(
        anonPage.getByText(/check your email for a password reset link/i)
      ).toBeVisible({ timeout: 10_000 });

      // After success, a "Back to login" link should still be visible
      await expect(
        anonPage.getByRole("link", { name: /back to login/i })
      ).toBeVisible();
    });
  });

  test.describe("Navigation", () => {
    test("should navigate back to login page", async ({ anonPage }) => {
      await anonPage.goto("/forgot-password");

      await anonPage.getByRole("link", { name: /back to login/i }).click();
      await anonPage.waitForURL("**/login");
      expect(anonPage.url()).toContain("/login");
    });
  });
});
