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

    // Stats cards should be visible — check for their labels (use first() to avoid table header duplicates)
    await expect(adminPage.getByText("Total Calls").first()).toBeVisible();
    await expect(adminPage.getByText("Total Tokens").first()).toBeVisible();
    await expect(adminPage.getByText("Est. Cost").first()).toBeVisible();
    await expect(adminPage.getByText("Platform vs BYOK").first()).toBeVisible();
  });

  test("toggle AI enabled for a user", async ({ adminPage }) => {
    await adminPage.goto("/admin");

    // Wait for User Management section
    await expect(
      adminPage.getByText("User Management")
    ).toBeVisible({ timeout: 15_000 });

    // Find the table row containing Test User A
    const userRow = adminPage
      .locator("tr")
      .filter({ hasText: "Test User A" });
    await expect(userRow).toBeVisible();

    // Find the AI Enabled switch in that row
    const aiSwitch = userRow.locator("button[role='switch']");
    await expect(aiSwitch).toBeVisible();

    // Get initial state
    const initialState = await aiSwitch.getAttribute("data-state");

    // Toggle
    await aiSwitch.click();
    await adminPage.waitForTimeout(1000);

    // State should change
    const newState = await aiSwitch.getAttribute("data-state");
    expect(newState).not.toBe(initialState);

    // Toggle back to restore original state
    await aiSwitch.click();
    await adminPage.waitForTimeout(1000);

    const restoredState = await aiSwitch.getAttribute("data-state");
    expect(restoredState).toBe(initialState);
  });

  test("edit daily AI limit for a user", async ({ adminPage }) => {
    await adminPage.goto("/admin");

    // Wait for User Management section
    await expect(
      adminPage.getByText("User Management")
    ).toBeVisible({ timeout: 15_000 });

    // Find the table row containing Test User A
    const userRow = adminPage
      .locator("tr")
      .filter({ hasText: "Test User A" });
    await expect(userRow).toBeVisible();

    // Find the daily limit number input in that row
    const limitInput = userRow.locator('input[type="number"]');
    await expect(limitInput).toBeVisible();

    // Get initial value
    const initialValue = await limitInput.inputValue();

    // Change the limit
    await limitInput.clear();
    await limitInput.fill("25");
    await limitInput.blur();

    // Wait for server action
    await adminPage.waitForTimeout(1500);

    // Success toast should appear
    const toast = adminPage
      .locator("[data-sonner-toast]")
      .filter({ hasText: /daily limit set to 25/i });
    await expect(toast).toBeVisible({ timeout: 5_000 });

    // Restore original value
    await limitInput.clear();
    await limitInput.fill(initialValue);
    await limitInput.blur();
    await adminPage.waitForTimeout(1500);
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
