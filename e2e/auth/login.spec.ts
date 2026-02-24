import { test, expect } from "../fixtures/auth";

test.describe("Login page", () => {
  test.describe("Form display", () => {
    test("should display login form with email, password, OAuth buttons, and links", async ({
      anonPage,
    }) => {
      await anonPage.goto("/login");

      // Email and password fields
      await expect(anonPage.getByLabel("Email")).toBeVisible();
      await expect(anonPage.getByLabel("Password")).toBeVisible();

      // Submit button
      await expect(
        anonPage.getByRole("button", { name: /sign in with email/i })
      ).toBeVisible();

      // OAuth buttons
      await expect(
        anonPage.getByRole("button", { name: /continue with github/i })
      ).toBeVisible();
      await expect(
        anonPage.getByRole("button", { name: /continue with google/i })
      ).toBeVisible();

      // Navigation links
      await expect(anonPage.getByRole("link", { name: /sign up/i })).toBeVisible();
      await expect(
        anonPage.getByRole("link", { name: /forgot password/i })
      ).toBeVisible();
    });
  });

  test.describe("Email/password login", () => {
    test("should redirect to /dashboard on valid credentials", async ({
      anonPage,
    }) => {
      await anonPage.goto("/login");

      const email =
        process.env.TEST_USER_A_EMAIL ?? "test-user-a@vibecodes-test.local";
      const password = process.env.TEST_USER_A_PASSWORD ?? "TestPassword123!";

      await anonPage.getByLabel("Email").fill(email);
      await anonPage.getByLabel("Password").fill(password);
      await anonPage.getByRole("button", { name: /sign in with email/i }).click();

      await anonPage.waitForURL("**/dashboard", { timeout: 15_000 });
      expect(anonPage.url()).toContain("/dashboard");
    });

    test("should show error on invalid credentials", async ({ anonPage }) => {
      await anonPage.goto("/login");

      await anonPage.getByLabel("Email").fill("nonexistent@example.com");
      await anonPage.getByLabel("Password").fill("WrongPassword999!");
      await anonPage.getByRole("button", { name: /sign in with email/i }).click();

      // Supabase returns "Invalid login credentials" on bad email/password
      await expect(anonPage.getByText(/invalid login credentials/i)).toBeVisible({
        timeout: 10_000,
      });
    });
  });

  test.describe("Navigation links", () => {
    test("should navigate to signup page via link", async ({ anonPage }) => {
      await anonPage.goto("/login");

      await anonPage.getByRole("link", { name: /sign up/i }).click();
      await anonPage.waitForURL("**/signup");
      expect(anonPage.url()).toContain("/signup");
    });

    test("should navigate to forgot-password page via link", async ({
      anonPage,
    }) => {
      await anonPage.goto("/login");

      await anonPage.getByRole("link", { name: /forgot password/i }).click();
      await anonPage.waitForURL("**/forgot-password");
      expect(anonPage.url()).toContain("/forgot-password");
    });
  });

  test.describe("OAuth buttons", () => {
    test("should render GitHub OAuth button", async ({ anonPage }) => {
      await anonPage.goto("/login");

      const githubButton = anonPage.getByRole("button", {
        name: /continue with github/i,
      });
      await expect(githubButton).toBeVisible();
      await expect(githubButton).toBeEnabled();
    });

    test("should render Google OAuth button", async ({ anonPage }) => {
      await anonPage.goto("/login");

      const googleButton = anonPage.getByRole("button", {
        name: /continue with google/i,
      });
      await expect(googleButton).toBeVisible();
      await expect(googleButton).toBeEnabled();
    });
  });
});
