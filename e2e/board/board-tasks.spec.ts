import { test, expect } from "../fixtures/auth";
import {
  createTestIdea,
  createTestBoardWithTasks,
  addCollaborator,
  cleanupTestData,
} from "../fixtures/test-data";
import { supabaseAdmin } from "../fixtures/supabase-admin";

let userAId: string;
let userBId: string;
let ideaId: string;

test.beforeAll(async () => {
  const { data: users } = await supabaseAdmin
    .from("users")
    .select("id, full_name")
    .in("full_name", ["Test User A", "Test User B"]);

  const userA = users?.find((u) => u.full_name === "Test User A");
  const userB = users?.find((u) => u.full_name === "Test User B");
  if (!userA || !userB) throw new Error("Test users not found -- run global setup first");

  userAId = userA.id;
  userBId = userB.id;

  // Create idea with board + 3 tasks in To Do column
  const idea = await createTestIdea(userAId, {
    title: "[E2E] Board Tasks Idea",
    description: "[E2E] Idea for board task CRUD tests.",
  });
  ideaId = idea.id;
  await createTestBoardWithTasks(ideaId, 3);

  // Add User B as collaborator (needed for assignee tests)
  await addCollaborator(ideaId, userBId);
});

test.afterAll(async () => {
  await cleanupTestData();
});

test.describe("Board Tasks", () => {
  test("create a new task via Add task button", async ({ userAPage }) => {
    await userAPage.goto(`/ideas/${ideaId}/board`);

    // Wait for columns to load
    await userAPage
      .locator('[data-testid^="column-"]')
      .first()
      .waitFor({ timeout: 15_000 });

    const columns = userAPage.locator('[data-testid^="column-"]');
    const todoColumn = columns.nth(0);

    // Count tasks before adding
    const tasksBefore = await todoColumn
      .locator('[data-testid^="task-card-"]')
      .count();

    // Click "Add task" button in the first column
    const addButton = todoColumn.getByRole("button", { name: "Add task" });
    await expect(addButton).toBeVisible();
    await addButton.click();

    // Dialog should appear with "New Task" title
    const dialog = userAPage.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 5_000 });
    await expect(dialog.getByText("New Task")).toBeVisible();

    // Fill in the title
    const titleInput = dialog.locator("#task-title");
    await titleInput.fill("[E2E] New Test Task");

    // Submit the form
    await dialog.getByRole("button", { name: "Create" }).click();

    // Dialog should close
    await expect(dialog).not.toBeVisible({ timeout: 5_000 });

    // New task card should appear in the column (optimistic UI)
    const tasksAfter = todoColumn.locator('[data-testid^="task-card-"]');
    await expect(tasksAfter).toHaveCount(tasksBefore + 1, { timeout: 10_000 });

    // Verify the new task title is visible
    await expect(todoColumn.getByText("[E2E] New Test Task")).toBeVisible();
  });

  test("open task detail dialog by clicking a task card", async ({
    userAPage,
  }) => {
    await userAPage.goto(`/ideas/${ideaId}/board`);

    await userAPage
      .locator('[data-testid^="column-"]')
      .first()
      .waitFor({ timeout: 15_000 });

    const columns = userAPage.locator('[data-testid^="column-"]');
    const todoColumn = columns.nth(0);

    // Click the first task card
    const firstTask = todoColumn.locator('[data-testid^="task-card-"]').first();
    const taskTitle = await firstTask.locator("p.font-medium").textContent();
    expect(taskTitle).toBeTruthy();

    await firstTask.click();

    // Dialog should open
    const dialog = userAPage.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 5_000 });

    // Dialog should contain the task title in an input field
    const titleInput = dialog.locator("input").first();
    await expect(titleInput).toHaveValue(taskTitle!.trim());
  });

  test("edit task title in detail dialog", async ({ userAPage }) => {
    await userAPage.goto(`/ideas/${ideaId}/board`);

    await userAPage
      .locator('[data-testid^="column-"]')
      .first()
      .waitFor({ timeout: 15_000 });

    const columns = userAPage.locator('[data-testid^="column-"]');
    const todoColumn = columns.nth(0);

    // Open the first task
    const firstTask = todoColumn.locator('[data-testid^="task-card-"]').first();
    await firstTask.click();

    const dialog = userAPage.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 5_000 });

    // Edit the title
    const titleInput = dialog.locator("input").first();
    await titleInput.click();
    await titleInput.fill("[E2E] Renamed Task Title");
    await titleInput.blur();

    // Wait for save to complete
    await userAPage.waitForTimeout(1000);

    // Close dialog
    await userAPage.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible({ timeout: 5_000 });

    // The renamed task should be visible on the board
    await expect(
      todoColumn.getByText("[E2E] Renamed Task Title")
    ).toBeVisible({ timeout: 10_000 });
  });

  test("edit task description in detail dialog", async ({ userAPage }) => {
    await userAPage.goto(`/ideas/${ideaId}/board`);

    await userAPage
      .locator('[data-testid^="column-"]')
      .first()
      .waitFor({ timeout: 15_000 });

    const columns = userAPage.locator('[data-testid^="column-"]');
    const todoColumn = columns.nth(0);

    // Open the second task (avoid the one we renamed)
    const secondTask = todoColumn
      .locator('[data-testid^="task-card-"]')
      .nth(1);
    await secondTask.click();

    const dialog = userAPage.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 5_000 });

    // Tasks are created WITH descriptions (e.g. "Task 2 description").
    // Click the "Edit" button next to Description to enter edit mode.
    const descEditButton = dialog
      .locator("button")
      .filter({ hasText: "Edit" })
      .last(); // The last "Edit" is for Description (first is for Labels)
    await expect(descEditButton).toBeVisible({ timeout: 5_000 });
    await descEditButton.click();

    // A textarea should appear with the existing description
    const textarea = dialog.locator("textarea");
    await expect(textarea).toBeVisible({ timeout: 3_000 });

    // Clear and type a new description
    await textarea.fill("[E2E] This is a new task description.");
    await textarea.blur();

    // Wait for save
    await userAPage.waitForTimeout(1000);

    // The description should now render as markdown
    await expect(
      dialog.getByText("[E2E] This is a new task description.")
    ).toBeVisible({ timeout: 5_000 });
  });

  test("change assignee in detail dialog", async ({ userAPage }) => {
    await userAPage.goto(`/ideas/${ideaId}/board`);

    await userAPage
      .locator('[data-testid^="column-"]')
      .first()
      .waitFor({ timeout: 15_000 });

    const columns = userAPage.locator('[data-testid^="column-"]');
    const todoColumn = columns.nth(0);

    // Open the first task
    const firstTask = todoColumn.locator('[data-testid^="task-card-"]').first();
    await firstTask.click();

    const dialog = userAPage.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 5_000 });

    // Find the assignee select trigger
    const assigneeSection = dialog.locator("text=Assignee").first();
    await expect(assigneeSection).toBeVisible();

    // Click the select trigger to open the dropdown
    const selectTrigger = dialog
      .locator('[role="combobox"]')
      .filter({ hasText: /unassigned/i })
      .first();
    await selectTrigger.click();

    // Select User B from the dropdown
    const option = userAPage.getByRole("option", { name: "Test User B" });
    await expect(option).toBeVisible({ timeout: 5_000 });
    await option.click();

    // Wait for save
    await userAPage.waitForTimeout(1000);

    // The select trigger should now show User B's name
    await expect(
      dialog.locator('[role="combobox"]').filter({ hasText: "Test User B" })
    ).toBeVisible({ timeout: 5_000 });
  });

  test("delete task with two-click confirmation", async ({ userAPage }) => {
    await userAPage.goto(`/ideas/${ideaId}/board`);

    await userAPage
      .locator('[data-testid^="column-"]')
      .first()
      .waitFor({ timeout: 15_000 });

    const columns = userAPage.locator('[data-testid^="column-"]');
    const todoColumn = columns.nth(0);

    const tasksBefore = await todoColumn
      .locator('[data-testid^="task-card-"]')
      .count();
    expect(tasksBefore).toBeGreaterThan(0);

    // Open the last task
    const lastTask = todoColumn
      .locator('[data-testid^="task-card-"]')
      .last();
    await lastTask.click();

    const dialog = userAPage.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 5_000 });

    // First click on delete -- should show confirmation text
    const deleteButton = dialog.getByRole("button", { name: "Delete task" });
    await expect(deleteButton).toBeVisible();
    await deleteButton.click();

    // Button text should change to "Are you sure?"
    const confirmButton = dialog.getByRole("button", {
      name: "Are you sure?",
    });
    await expect(confirmButton).toBeVisible({ timeout: 3_000 });

    // Second click confirms deletion
    await confirmButton.click();

    // Dialog should close (optimistic delete)
    await expect(dialog).not.toBeVisible({ timeout: 5_000 });

    // Task count should decrease
    const tasksAfter = todoColumn.locator('[data-testid^="task-card-"]');
    await expect(tasksAfter).toHaveCount(tasksBefore - 1, { timeout: 10_000 });
  });

  test("archive task hides it from default view", async ({ userAPage }) => {
    await userAPage.goto(`/ideas/${ideaId}/board`);

    await userAPage
      .locator('[data-testid^="column-"]')
      .first()
      .waitFor({ timeout: 15_000 });

    const columns = userAPage.locator('[data-testid^="column-"]');
    const todoColumn = columns.nth(0);

    const tasksBefore = await todoColumn
      .locator('[data-testid^="task-card-"]')
      .count();
    expect(tasksBefore).toBeGreaterThan(0);

    // Open the first task
    const firstTask = todoColumn.locator('[data-testid^="task-card-"]').first();
    const taskTitle = await firstTask.locator("p.font-medium").textContent();
    await firstTask.click();

    const dialog = userAPage.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 5_000 });

    // Click the Archive button in the dialog footer
    const archiveButton = dialog.getByRole("button", { name: /^archive$/i });
    await expect(archiveButton).toBeVisible();
    await archiveButton.click();

    // The button text should change to "Unarchive"
    await expect(
      dialog.getByRole("button", { name: /unarchive/i })
    ).toBeVisible({ timeout: 5_000 });

    // Close dialog
    await userAPage.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible({ timeout: 5_000 });

    // The archived task should disappear from the default view
    // (archived tasks are hidden by default)
    await userAPage.waitForTimeout(1000);
    const tasksAfter = todoColumn.locator('[data-testid^="task-card-"]');
    await expect(tasksAfter).toHaveCount(tasksBefore - 1, { timeout: 10_000 });
  });

  test("unarchive task via archived filter toggle", async ({ userAPage }) => {
    await userAPage.goto(`/ideas/${ideaId}/board`);

    await userAPage
      .locator('[data-testid^="column-"]')
      .first()
      .waitFor({ timeout: 15_000 });

    // Toggle "Show archived" in the toolbar
    // The button text is "Show archived (N)" where N is the count
    const showArchivedButton = userAPage.getByRole("button", {
      name: /show archived/i,
    });
    await expect(showArchivedButton).toBeVisible({ timeout: 10_000 });
    await showArchivedButton.click();

    // Wait for archived tasks to appear
    await userAPage.waitForTimeout(500);

    // Find an archived task -- it will have an "Archived" label
    const archivedTask = userAPage
      .locator('[data-testid^="task-card-"]')
      .filter({ hasText: "Archived" })
      .first();
    await expect(archivedTask).toBeVisible({ timeout: 5_000 });

    // Click to open the detail dialog
    await archivedTask.click();

    const dialog = userAPage.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 5_000 });

    // Click "Unarchive" button
    const unarchiveButton = dialog.getByRole("button", {
      name: /unarchive/i,
    });
    await expect(unarchiveButton).toBeVisible();
    await unarchiveButton.click();

    // Button should change back to "Archive"
    await expect(
      dialog.getByRole("button", { name: /^archive$/i })
    ).toBeVisible({ timeout: 5_000 });

    // Close dialog
    await userAPage.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible({ timeout: 5_000 });
  });
});
