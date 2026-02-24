import { test, expect } from "../fixtures/auth";

test.describe("Signup page", () => {
  test.describe("Form display", () => {
    test("should display signup form with email, password fields, and OAuth buttons", async ({
      anonPage,
    }) => {
      await anonPage.goto("/signup");

      // Email and password fields
      await expect(anonPage.getByLabel("Email")).toBeVisible();
      await expect(anonPage.getByLabel("Password")).toBeVisible();

      // Submit button
      await expect(
        anonPage.getByRole("button", { name: /create account/i })
      ).toBeVisible();

      // OAuth buttons
      await expect(
        anonPage.getByRole("button", { name: /continue with github/i })
      ).toBeVisible();
      await expect(
        anonPage.getByRole("button", { name: /continue with google/i })
      ).toBeVisible();

      // Link back to login
      await expect(anonPage.getByRole("link", { name: /log in/i })).toBeVisible();
    });
  });

  test.describe("Account creation", () => {
    test.fixme("should show confirmation message after valid signup", async ({
      anonPage,
    }) => {
      // fixme: Supabase email rate limiting prevents consistent test execution
      await anonPage.goto("/signup");

      // Use a unique email to avoid duplicate account conflicts
      const uniqueEmail = `e2e-signup-${Date.now()}@vibecodes-test.local`;

      await anonPage.getByLabel("Email").fill(uniqueEmail);
      await anonPage.getByLabel("Password").fill("TestPassword123!");
      await anonPage.getByRole("button", { name: /create account/i }).click();

      // Supabase returns a confirmation message on successful signup
      await expect(
        anonPage.getByText(/check your email to confirm your account/i)
      ).toBeVisible({ timeout: 10_000 });
    });
  });

  test.describe("Validation", () => {
    test("should enforce minimum password length", async ({ anonPage }) => {
      await anonPage.goto("/signup");

      await anonPage.getByLabel("Email").fill("short-pw-test@vibecodes-test.local");
      await anonPage.getByLabel("Password").fill("ab");

      // The password input has minLength=6, so browser validation should prevent submission.
      // Click submit and verify we stay on the signup page (no success message, no redirect).
      await anonPage.getByRole("button", { name: /create account/i }).click();

      // Should still be on signup page (browser native validation blocks submission)
      expect(anonPage.url()).toContain("/signup");

      // The confirmation message should NOT appear
      await expect(
        anonPage.getByText(/check your email to confirm your account/i)
      ).not.toBeVisible();
    });
  });
});
