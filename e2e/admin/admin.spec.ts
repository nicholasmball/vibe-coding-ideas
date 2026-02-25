import { test, expect } from "../fixtures/auth";
import { supabaseAdmin } from "../fixtures/supabase-admin";

let userAId: string;
let adminId: string;

test.beforeAll(async () => {
  const { data: users } = await supabaseAdmin
    .from("users")
    .select("id, full_name, is_admin")
    .in("full_name", ["Test User A", "Test Admin"]);

  const userA = users?.find((u) => u.full_name === "Test User A");
  const admin = users?.find((u) => u.full_name === "Test Admin");
  if (!userA || !admin)
    throw new Error("Test users not found — run global setup first");

  userAId = userA.id;
  adminId = admin.id;
});

test.describe("Admin page", () => {
  test("redirects non-admin to /dashboard", async ({ userAPage }) => {
    await userAPage.goto("/admin");

    // Non-admin user should be redirected to /dashboard
    await userAPage.waitForURL("**/dashboard", { timeout: 15_000 });
    expect(userAPage.url()).toContain("/dashboard");
    expect(userAPage.url()).not.toContain("/admin");
  });

  test("displays admin page heading for admin user", async ({ adminPage }) => {
    await adminPage.goto("/admin");

    // The heading "Admin: AI Usage" should be visible
    await expect(
      adminPage.getByRole("heading", { name: /admin/i })
    ).toBeVisible({ timeout: 15_000 });
  });

  test("AI usage stats cards render", async ({ adminPage }) => {
    await adminPage.goto("/admin");

    // Wait for the page to fully load
    await expect(
      adminPage.getByRole("heading", { name: /admin/i })
    ).toBeVisible({ timeout: 15_000 });

    // Stats cards should be visible — 3 cards in BYOK-only mode
    await expect(adminPage.getByText("Total Calls").first()).toBeVisible();
    await expect(adminPage.getByText("Total Tokens").first()).toBeVisible();
    // Cost card now says "Est. Cost (all BYOK)" instead of old "Platform vs BYOK"
    await expect(adminPage.getByText(/Est\. Cost/i).first()).toBeVisible();
  });

  test("Recent Activity table renders", async ({ adminPage }) => {
    await adminPage.goto("/admin");

    await expect(
      adminPage.getByRole("heading", { name: /admin/i })
    ).toBeVisible({ timeout: 15_000 });

    // Recent Activity section with table headers
    await expect(adminPage.getByText("Recent Activity")).toBeVisible();
    await expect(adminPage.getByText("User").first()).toBeVisible();
    await expect(adminPage.getByText("Action").first()).toBeVisible();
    await expect(adminPage.getByText("Tokens").first()).toBeVisible();
    await expect(adminPage.getByText("Time").first()).toBeVisible();
  });

  test("filter by date range", async ({ adminPage }) => {
    await adminPage.goto("/admin");

    await expect(
      adminPage.getByRole("heading", { name: /admin/i })
    ).toBeVisible({ timeout: 15_000 });

    // The filter bar should have "From" and "To" date inputs
    const fromInput = adminPage.locator('input[type="date"]').first();
    const toInput = adminPage.locator('input[type="date"]').nth(1);
    await expect(fromInput).toBeVisible();
    await expect(toInput).toBeVisible();

    // Set a date range
    await fromInput.fill("2026-01-01");

    // URL should update with the date filter
    await adminPage.waitForURL(/from=2026-01-01/, { timeout: 10_000 });

    // Set "to" date
    await toInput.fill("2026-12-31");
    await adminPage.waitForURL(/to=2026-12-31/, { timeout: 10_000 });

    // Stats cards should still render (may show 0 if no data in range)
    await expect(adminPage.getByText("Total Calls")).toBeVisible();
  });

  test("filter by action type", async ({ adminPage }) => {
    await adminPage.goto("/admin");

    await expect(
      adminPage.getByRole("heading", { name: /admin/i })
    ).toBeVisible({ timeout: 15_000 });

    // The action type dropdown should be visible
    const actionTrigger = adminPage.locator(".space-y-1").nth(2).locator("button").first();
    await expect(actionTrigger).toBeVisible();
    await actionTrigger.click();

    // Select "Enhance Description"
    await adminPage
      .getByRole("option", { name: "Enhance Description" })
      .click();

    // URL should update with the action filter
    await adminPage.waitForURL(/action=enhance_description/, {
      timeout: 10_000,
    });

    // Stats cards should still render
    await expect(adminPage.getByText("Total Calls")).toBeVisible();

    // Reset filter by selecting "All actions"
    const resetTrigger = adminPage.locator(".space-y-1").nth(2).locator("button").first();
    await resetTrigger.click();
    await adminPage.getByRole("option", { name: "All actions" }).click();

    // URL should no longer have the action param
    await adminPage.waitForURL(
      (url) => !url.searchParams.has("action"),
      { timeout: 10_000 }
    );
  });
});
