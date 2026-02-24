import { test, expect } from "../fixtures/auth";
import { createTestIdea, createTestBoardWithTasks, cleanupTestData } from "../fixtures/test-data";
import { supabaseAdmin } from "../fixtures/supabase-admin";

async function getUserId(fullName: string): Promise<string> {
  const { data } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("full_name", fullName)
    .single();
  if (!data) throw new Error(`Test user not found: ${fullName}`);
  return data.id;
}

let userAId: string;

test.beforeAll(async () => {
  userAId = await getUserId("Test User A");

  // Create an idea with a board so Active Boards section appears
  const idea = await createTestIdea(userAId, {
    title: "[E2E] Reorder Board Idea",
    description: "[E2E] Idea to ensure board section renders.",
  });
  await createTestBoardWithTasks(idea.id, 1);
});

test.afterAll(async () => {
  await cleanupTestData();
});

test.describe("Dashboard Reorder", () => {
  test.beforeEach(async ({ userAPage }) => {
    // Clear any stored panel order before each test
    await userAPage.goto("/dashboard");
    await expect(userAPage.getByRole("heading", { name: /dashboard/i })).toBeVisible({ timeout: 15_000 });
    await userAPage.evaluate(() => localStorage.removeItem("dashboard-panel-order"));
    await userAPage.reload();
    await expect(userAPage.getByRole("heading", { name: /dashboard/i })).toBeVisible({ timeout: 15_000 });
  });

  test.afterEach(async ({ userAPage }) => {
    // Clean up localStorage after each test
    await userAPage.evaluate(() => localStorage.removeItem("dashboard-panel-order"));
  });

  test("enter Customize mode shows control bars", async ({ userAPage }) => {
    // Click "Customize" button
    const customizeButton = userAPage.getByRole("button", { name: "Customize" });
    await expect(customizeButton).toBeVisible({ timeout: 15_000 });
    await customizeButton.click();

    // Should now show "Done" button instead
    await expect(
      userAPage.getByRole("button", { name: "Done" })
    ).toBeVisible();

    // Should show "Reset" button
    await expect(
      userAPage.getByRole("button", { name: "Reset" })
    ).toBeVisible();

    // Control bars with arrow buttons should be visible
    // Check for move-up button for one of the sections (e.g. "My Ideas")
    await expect(
      userAPage.getByRole("button", { name: /Move My Ideas down/i })
    ).toBeVisible();
  });

  test("move panel down within column", async ({ userAPage }) => {
    // Enter customize mode
    await userAPage.getByRole("button", { name: "Customize" }).click();

    // In the default order, right column has: My Ideas (first), Collaborations, Recent Activity
    // Move "My Ideas" down — should swap with "Collaborations"
    const moveDownButton = userAPage.getByRole("button", {
      name: /Move My Ideas down/i,
    });
    await expect(moveDownButton).toBeVisible();
    await moveDownButton.click();

    // After moving down, "My Ideas" should no longer be first in its column
    // The "Move My Ideas up" button should now be enabled (was disabled as first item)
    const moveUpButton = userAPage.getByRole("button", {
      name: /Move My Ideas up/i,
    });
    await expect(moveUpButton).toBeEnabled();
  });

  test("move panel up within column", async ({ userAPage }) => {
    // Enter customize mode
    await userAPage.getByRole("button", { name: "Customize" }).click();

    // First move "My Ideas" down so it is no longer first
    await userAPage
      .getByRole("button", { name: /Move My Ideas down/i })
      .click();

    // Now move it back up
    const moveUpButton = userAPage.getByRole("button", {
      name: /Move My Ideas up/i,
    });
    await expect(moveUpButton).toBeEnabled();
    await moveUpButton.click();

    // After moving up, "My Ideas" is first again — up button should be disabled
    await expect(moveUpButton).toBeDisabled();
  });

  test("persist reorder in localStorage across reload", async ({ userAPage }) => {
    // Enter customize mode
    await userAPage.getByRole("button", { name: "Customize" }).click();

    // Move "My Ideas" down
    await userAPage
      .getByRole("button", { name: /Move My Ideas down/i })
      .click();

    // Exit customize mode
    await userAPage.getByRole("button", { name: "Done" }).click();

    // Verify localStorage was written
    const storedOrder = await userAPage.evaluate(() =>
      localStorage.getItem("dashboard-panel-order")
    );
    expect(storedOrder).toBeTruthy();
    const parsed = JSON.parse(storedOrder!);
    expect(Array.isArray(parsed)).toBe(true);

    // In the stored order, find "my-ideas" — it should not be the first item in column 1
    const col1Items = parsed.filter(
      (p: { id: string; column: number }) => p.column === 1
    );
    expect(col1Items[0].id).not.toBe("my-ideas");

    // Reload the page
    await userAPage.reload();
    await expect(userAPage.getByRole("heading", { name: /dashboard/i })).toBeVisible({ timeout: 15_000 });

    // Re-enter customize mode to verify order persisted
    await userAPage.getByRole("button", { name: "Customize" }).click();

    // "My Ideas" up button should be enabled (not first in column)
    const moveUpButton = userAPage.getByRole("button", {
      name: /Move My Ideas up/i,
    });
    await expect(moveUpButton).toBeEnabled();
  });

  test("reset restores default order", async ({ userAPage }) => {
    // Enter customize mode and reorder
    await userAPage.getByRole("button", { name: "Customize" }).click();

    // Move "My Ideas" down
    await userAPage
      .getByRole("button", { name: /Move My Ideas down/i })
      .click();

    // Click "Reset" button
    await userAPage.getByRole("button", { name: "Reset" }).click();

    // After reset, "My Ideas" should be first in its column again — up button disabled
    const moveUpButton = userAPage.getByRole("button", {
      name: /Move My Ideas up/i,
    });
    await expect(moveUpButton).toBeDisabled();

    // localStorage should be cleared
    const storedOrder = await userAPage.evaluate(() =>
      localStorage.getItem("dashboard-panel-order")
    );
    expect(storedOrder).toBeNull();
  });
});
