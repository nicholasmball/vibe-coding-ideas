import { test, expect } from "../fixtures/auth";

test.describe("Auth middleware redirects", () => {
  test.describe("Unauthenticated users — protected routes redirect to /login", () => {
    test("should redirect /dashboard to /login", async ({ anonPage }) => {
      await anonPage.goto("/dashboard");
      await anonPage.waitForURL("**/login**");
      expect(anonPage.url()).toContain("/login");
    });

    test("should redirect /feed to /login", async ({ anonPage }) => {
      await anonPage.goto("/feed");
      await anonPage.waitForURL("**/login**");
      expect(anonPage.url()).toContain("/login");
    });

    test("should redirect /ideas/new to /login", async ({ anonPage }) => {
      await anonPage.goto("/ideas/new");
      await anonPage.waitForURL("**/login**");
      expect(anonPage.url()).toContain("/login");
    });
  });

  test.describe("Authenticated users — auth pages redirect to /dashboard", () => {
    test("should redirect /login to /dashboard", async ({ userAPage }) => {
      await userAPage.goto("/login");
      await userAPage.waitForURL("**/dashboard");
      expect(userAPage.url()).toContain("/dashboard");
    });

    test("should redirect /signup to /dashboard", async ({ userAPage }) => {
      await userAPage.goto("/signup");
      await userAPage.waitForURL("**/dashboard");
      expect(userAPage.url()).toContain("/dashboard");
    });
  });

  test.describe("Public routes — accessible without authentication", () => {
    test("should allow unauthenticated access to / (landing page)", async ({
      anonPage,
    }) => {
      await anonPage.goto("/");
      await anonPage.waitForLoadState("domcontentloaded");

      // Should stay on landing page, NOT redirect to /login
      const url = anonPage.url();
      expect(url).not.toContain("/login");
      expect(url).not.toContain("/dashboard");

      // Landing page should have the VibeCodes branding
      await expect(anonPage.getByText("VibeCodes").first()).toBeVisible({ timeout: 15_000 });
    });

    test("should allow unauthenticated access to /guide", async ({
      anonPage,
    }) => {
      await anonPage.goto("/guide");
      await anonPage.waitForLoadState("domcontentloaded");

      // Should stay on guide page, NOT redirect to /login
      const url = anonPage.url();
      expect(url).not.toContain("/login");
      expect(url).toContain("/guide");
    });
  });
});
