import { test, expect } from "../fixtures/auth";
import {
  createTestIdea,
  createTestBoardWithTasks,
  cleanupTestData,
} from "../fixtures/test-data";
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

test.describe("Board Columns", () => {
  let userAId: string;
  let ideaId: string;
  let columns: Awaited<ReturnType<typeof createTestBoardWithTasks>>["columns"];

  test.beforeAll(async () => {
    userAId = await getUserId("Test User A");

    // Create test idea with board (3 default columns + 3 tasks in "To Do")
    const idea = await createTestIdea(userAId, {
      title: "[E2E] Board Columns Test Idea",
      description: "[E2E] Idea for testing board column operations",
      tags: ["e2e-test"],
    });
    ideaId = idea.id;

    const board = await createTestBoardWithTasks(ideaId, 3);
    columns = board.columns;
  });

  test.afterAll(async () => {
    await cleanupTestData();
  });

  test("should create a new column via the Add Column button", async ({
    userAPage,
  }) => {
    await userAPage.goto(`/ideas/${ideaId}/board`);

    // Wait for the board to fully render before interacting
    await expect(
      userAPage.locator('[data-testid^="column-"]').first()
    ).toBeVisible({ timeout: 15_000 });

    // Click the "Add Column" button at the end of the board
    const addColumnButton = userAPage.getByRole("button", {
      name: /add column/i,
    });
    await expect(addColumnButton).toBeVisible({ timeout: 15_000 });
    await addColumnButton.click();

    // Type the column name in the input that appears
    const columnNameInput = userAPage.getByPlaceholder("Column name...");
    await expect(columnNameInput).toBeVisible({ timeout: 5_000 });
    await columnNameInput.fill("Review");

    // Submit the form by pressing Enter (more reliable than finding the "Add" button)
    await columnNameInput.press("Enter");

    // New column should appear on the board (optimistic UI)
    await expect(userAPage.getByText("Review")).toBeVisible({ timeout: 15_000 });

    // The "Add Column" button should reappear (form resets)
    await expect(addColumnButton).toBeVisible({ timeout: 10_000 });
  });

  test("should edit a column name via the column menu", async ({
    userAPage,
  }) => {
    await userAPage.goto(`/ideas/${ideaId}/board`);

    // Find the "To Do" column and open its menu (MoreHorizontal button)
    const todoColumn = userAPage.locator(
      `[data-testid="column-${columns.find((c) => c.title === "To Do")!.id}"]`
    );
    await expect(todoColumn).toBeVisible({ timeout: 15_000 });

    // Click the column menu button (3 dots / MoreHorizontal icon)
    const menuButton = todoColumn.locator("button").filter({
      has: userAPage.locator("svg.lucide-ellipsis"),
    });
    await menuButton.click();

    // Click "Edit" in the dropdown menu
    await userAPage.getByRole("menuitem", { name: "Edit" }).click();

    // The edit dialog should appear
    const dialog = userAPage.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 5_000 });
    await expect(dialog.getByText("Edit Column")).toBeVisible();

    // Clear and type new name
    const nameInput = dialog.getByLabel("Column Name");
    await nameInput.clear();
    await nameInput.fill("Backlog");

    // Save
    await dialog.getByRole("button", { name: "Save" }).click();

    // Dialog should close and column name should update
    await expect(dialog).not.toBeVisible({ timeout: 5_000 });
    await expect(userAPage.getByText("Backlog")).toBeVisible({ timeout: 5_000 });
  });

  test("should toggle done column status and show green checkmark", async ({
    userAPage,
  }) => {
    await userAPage.goto(`/ideas/${ideaId}/board`);

    // Find the "In Progress" column (which is not a done column by default)
    const inProgressColumn = userAPage.locator(
      `[data-testid="column-${columns.find((c) => c.title === "In Progress")!.id}"]`
    );
    await expect(inProgressColumn).toBeVisible({ timeout: 15_000 });

    // Open its column menu (3 dots / MoreHorizontal icon)
    const menuButton = inProgressColumn.locator("button").filter({
      has: userAPage.locator("svg.lucide-ellipsis"),
    });
    await menuButton.click();

    // Click "Edit"
    await userAPage.getByRole("menuitem", { name: "Edit" }).click();

    // The edit dialog should appear
    const dialog = userAPage.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 5_000 });

    // Toggle the "Done column" switch
    const doneSwitch = dialog.locator("#done-column");
    await doneSwitch.click();

    // Save
    await dialog.getByRole("button", { name: "Save" }).click();

    // Dialog should close
    await expect(dialog).not.toBeVisible({ timeout: 5_000 });

    // The column header should now show a green checkmark icon (CircleCheckBig)
    // The emerald-colored SVG appears next to the column title
    const checkIcon = inProgressColumn.locator("svg.text-emerald-500");
    await expect(checkIcon).toBeVisible({ timeout: 5_000 });
  });

  test("should delete an empty column and show undo toast", async ({
    userAPage,
  }) => {
    // Create an empty column directly in the DB for deletion
    const { data: newCol } = await supabaseAdmin
      .from("board_columns")
      .insert({
        idea_id: ideaId,
        title: "Temp Column",
        position: 9000,
        is_done_column: false,
      })
      .select()
      .single();

    if (!newCol) throw new Error("Failed to create temp column");

    await userAPage.goto(`/ideas/${ideaId}/board`);

    // Wait for the temp column to appear
    const tempColumn = userAPage.locator(`[data-testid="column-${newCol.id}"]`);
    await expect(tempColumn).toBeVisible({ timeout: 15_000 });

    // Click the column menu button (3 dots / MoreHorizontal icon)
    const menuButton = tempColumn.locator("button").filter({
      has: userAPage.locator("svg.lucide-ellipsis"),
    });
    await menuButton.click();

    // Click "Delete"
    await userAPage.getByRole("menuitem", { name: "Delete" }).click();

    // Undo toast should appear
    const toast = userAPage
      .locator("[data-sonner-toast]")
      .filter({ hasText: /deleted/i });
    await expect(toast).toBeVisible({ timeout: 10_000 });

    // Toast should contain an Undo button
    await expect(toast.getByRole("button", { name: "Undo" })).toBeVisible();

    // Column should be removed from the board
    await expect(tempColumn).not.toBeVisible({ timeout: 5_000 });
  });

  test("should archive all tasks in a done column", async ({ userAPage }) => {
    // The "Done" column (is_done_column = true) should have an "Archive all" option
    const doneColumn = columns.find((c) => c.title === "Done")!;

    // Seed a non-archived task directly into the Done column
    const { error: insertError } = await supabaseAdmin.from("board_tasks").insert({
      column_id: doneColumn.id,
      idea_id: ideaId,
      title: "[E2E] Done Task for Archive",
      position: 1000,
      archived: false,
    });
    if (insertError) throw new Error(`Failed to seed done task: ${insertError.message}`);

    await userAPage.goto(`/ideas/${ideaId}/board`);

    // Find the Done column and wait for the task to appear inside it
    const doneColumnElement = userAPage.locator(
      `[data-testid="column-${doneColumn.id}"]`
    );
    await expect(doneColumnElement).toBeVisible({ timeout: 15_000 });

    // Wait for the seeded task to appear in the Done column
    await expect(
      doneColumnElement.getByText("[E2E] Done Task for Archive")
    ).toBeVisible({ timeout: 10_000 });

    // Open the column menu (3 dots / MoreHorizontal icon)
    const menuButton = doneColumnElement.locator("button").filter({
      has: userAPage.locator("svg.lucide-ellipsis"),
    });
    await menuButton.click();

    // "Archive all" should be available (only shown for done columns with tasks)
    const archiveItem = userAPage.getByRole("menuitem", {
      name: /archive all/i,
    });
    await expect(archiveItem).toBeVisible({ timeout: 5_000 });
    await archiveItem.click();

    // Success toast should appear
    const toast = userAPage
      .locator("[data-sonner-toast]")
      .filter({ hasText: /archived/i });
    await expect(toast).toBeVisible({ timeout: 10_000 });
  });
});
