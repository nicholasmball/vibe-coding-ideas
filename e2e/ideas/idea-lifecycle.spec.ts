import { test, expect } from "../fixtures/auth";
import { createTestIdea, cleanupTestData } from "../fixtures/test-data";
import { supabaseAdmin } from "../fixtures/supabase-admin";

let userAId: string;
let adminId: string;

test.beforeAll(async () => {
  // Look up test user IDs
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

test.afterAll(async () => {
  await cleanupTestData();
});

test.describe("Idea Lifecycle", () => {
  test.describe("Status changes", () => {
    test("should change status from Open to In Progress", async ({
      userAPage,
    }) => {
      const idea = await createTestIdea(userAId, {
        title: "[E2E] Status Open to InProgress",
        description: "[E2E] Testing status transition",
        status: "open",
      });

      await userAPage.goto(`/ideas/${idea.id}`);

      // Author sees a status select dropdown — find the trigger via data-testid
      const statusTrigger = userAPage.locator('[data-testid="status-select"]');
      await expect(statusTrigger).toBeVisible({ timeout: 15_000 });
      // Wait for hydration to complete — the select may be temporarily disabled
      await userAPage.waitForTimeout(2000);
      await expect(statusTrigger).toBeEnabled({ timeout: 15_000 });
      await expect(statusTrigger).toHaveText(/Open/);

      // Click to open the dropdown
      await statusTrigger.click();

      // Select "In Progress"
      await userAPage.getByRole("option", { name: /In Progress/i }).click();

      // Wait for the server action to complete
      await userAPage.waitForTimeout(2000);

      // Verify the status updated
      await expect(statusTrigger).toHaveText(/In Progress/);

      // Reload and verify persistence
      await userAPage.reload();
      const reloadedTrigger = userAPage.locator('[data-testid="status-select"]');
      await expect(reloadedTrigger).toHaveText(/In Progress/, { timeout: 15_000 });
    });

    test("should change status from In Progress to Completed", async ({
      userAPage,
    }) => {
      const idea = await createTestIdea(userAId, {
        title: "[E2E] Status InProgress to Completed",
        description: "[E2E] Testing second status transition",
        status: "in_progress",
      });

      await userAPage.goto(`/ideas/${idea.id}`);

      const statusTrigger = userAPage.locator('[data-testid="status-select"]');
      await expect(statusTrigger).toBeVisible({ timeout: 15_000 });
      // Wait for React hydration and any pending transitions to complete
      await userAPage.waitForFunction(
        () => !document.querySelector('[data-testid="status-select"]')?.hasAttribute("disabled"),
        { timeout: 15_000 }
      );
      await expect(statusTrigger).toHaveText(/In Progress/);

      await statusTrigger.click();
      await userAPage.getByRole("option", { name: /Completed/i }).click();

      await userAPage.waitForTimeout(2000);
      await expect(statusTrigger).toHaveText(/Completed/);
    });

    test("should archive an idea via status dropdown", async ({
      userAPage,
    }) => {
      const idea = await createTestIdea(userAId, {
        title: "[E2E] Status to Archived",
        description: "[E2E] Testing archive transition",
        status: "open",
      });

      await userAPage.goto(`/ideas/${idea.id}`);

      const statusTrigger = userAPage.locator('[data-testid="status-select"]');
      await expect(statusTrigger).toBeVisible({ timeout: 15_000 });
      await userAPage.waitForFunction(
        () => !document.querySelector('[data-testid="status-select"]')?.hasAttribute("disabled"),
        { timeout: 15_000 }
      );
      await expect(statusTrigger).toHaveText(/Open/);

      await statusTrigger.click();
      await userAPage.getByRole("option", { name: /Archived/i }).click();

      await userAPage.waitForTimeout(2000);
      await expect(statusTrigger).toHaveText(/Archived/);

      // Verify in the database
      const { data: updated } = await supabaseAdmin
        .from("ideas")
        .select("status")
        .eq("id", idea.id)
        .single();
      expect(updated?.status).toBe("archived");
    });
  });

  test.describe("Deleting ideas", () => {
    test("author should delete their own idea and be redirected to /ideas", async ({
      userAPage,
    }) => {
      const idea = await createTestIdea(userAId, {
        title: "[E2E] Idea to Delete (Author)",
        description: "[E2E] This idea will be deleted by its author",
      });

      await userAPage.goto(`/ideas/${idea.id}`);

      // Click the Delete button (desktop view)
      const deleteButton = userAPage
        .getByRole("button", { name: /delete/i })
        .first();
      await expect(deleteButton).toBeVisible();
      await deleteButton.click();

      // Confirmation dialog should appear
      const dialog = userAPage.getByRole("alertdialog");
      await expect(dialog).toBeVisible();
      await expect(
        dialog.getByText("Delete this idea?")
      ).toBeVisible();
      await expect(
        dialog.getByText(/this action cannot be undone/i)
      ).toBeVisible();

      // Confirm deletion
      await dialog.getByRole("button", { name: /^delete$/i }).click();

      // Should redirect to /ideas
      await userAPage.waitForURL("**/ideas", { timeout: 15_000 });
      expect(userAPage.url()).toContain("/ideas");

      // Verify the idea no longer exists in the database
      const { data: deleted } = await supabaseAdmin
        .from("ideas")
        .select("id")
        .eq("id", idea.id)
        .maybeSingle();
      expect(deleted).toBeNull();
    });

    test("author can cancel deletion via the Cancel button in the dialog", async ({
      userAPage,
    }) => {
      const idea = await createTestIdea(userAId, {
        title: "[E2E] Idea Cancel Delete",
        description: "[E2E] This idea should survive cancellation",
      });

      await userAPage.goto(`/ideas/${idea.id}`);

      // Click Delete to open the dialog
      const deleteButton = userAPage
        .getByRole("button", { name: /delete/i })
        .first();
      await deleteButton.click();

      // Dialog appears
      const dialog = userAPage.getByRole("alertdialog");
      await expect(dialog).toBeVisible();

      // Click Cancel
      await dialog.getByRole("button", { name: /cancel/i }).click();

      // Dialog should close
      await expect(dialog).not.toBeVisible();

      // Should still be on the idea page
      expect(userAPage.url()).toContain(`/ideas/${idea.id}`);

      // Idea should still exist
      const { data: stillExists } = await supabaseAdmin
        .from("ideas")
        .select("id")
        .eq("id", idea.id)
        .maybeSingle();
      expect(stillExists).not.toBeNull();
    });

    test("admin should be able to delete another user's idea", async ({
      adminPage,
    }) => {
      // Create an idea owned by User A
      const idea = await createTestIdea(userAId, {
        title: "[E2E] Idea for Admin Delete",
        description: "[E2E] Admin should be able to delete this",
      });

      await adminPage.goto(`/ideas/${idea.id}`);

      // Admin should see a Delete button even though they are not the author
      const deleteButton = adminPage
        .getByRole("button", { name: /delete/i })
        .first();
      await expect(deleteButton).toBeVisible();
      await deleteButton.click();

      // Confirmation dialog
      const dialog = adminPage.getByRole("alertdialog");
      await expect(dialog).toBeVisible();

      // Confirm deletion
      await dialog.getByRole("button", { name: /^delete$/i }).click();

      // Should redirect to /ideas
      await adminPage.waitForURL("**/ideas", { timeout: 15_000 });
      expect(adminPage.url()).toContain("/ideas");

      // Verify it's gone from the database
      const { data: deleted } = await supabaseAdmin
        .from("ideas")
        .select("id")
        .eq("id", idea.id)
        .maybeSingle();
      expect(deleted).toBeNull();
    });
  });
});
