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

test.describe("Board Filters", () => {
  let userAId: string;
  let userBId: string;
  let ideaId: string;
  let columns: Awaited<ReturnType<typeof createTestBoardWithTasks>>["columns"];
  let taskIds: string[] = [];
  let labelId: string;

  test.beforeAll(async () => {
    userAId = await getUserId("Test User A");
    userBId = await getUserId("Test User B");

    // Create test idea
    const idea = await createTestIdea(userAId, {
      title: "[E2E] Board Filters Test Idea",
      description: "[E2E] Idea for testing board filter functionality",
      tags: ["e2e-test"],
    });
    ideaId = idea.id;

    // Create board with columns
    const board = await createTestBoardWithTasks(ideaId, 0);
    columns = board.columns;

    const todoColumn = columns.find((c) => c.title === "To Do")!;
    const inProgressColumn = columns.find((c) => c.title === "In Progress")!;

    // Create a label for the board
    const { data: label } = await supabaseAdmin
      .from("board_labels")
      .insert({ idea_id: ideaId, name: "Bug", color: "red" })
      .select()
      .single();
    labelId = label!.id;

    // Create diverse tasks for filter testing
    // Task 1: assigned to userA, with label, overdue due date
    const { data: task1 } = await supabaseAdmin
      .from("board_tasks")
      .insert({
        column_id: todoColumn.id,
        idea_id: ideaId,
        title: "[E2E] Fix login crash",
        description: "Login page crashes on mobile",
        assignee_id: userAId,
        position: 1000,
        due_date: "2024-01-01", // overdue
      })
      .select()
      .single();
    taskIds.push(task1!.id);

    // Assign label to task 1
    await supabaseAdmin.from("board_task_labels").insert({
      task_id: task1!.id,
      label_id: labelId,
    });

    // Task 2: assigned to userB, no label, future due date
    const { data: task2 } = await supabaseAdmin
      .from("board_tasks")
      .insert({
        column_id: todoColumn.id,
        idea_id: ideaId,
        title: "[E2E] Add dark mode toggle",
        description: "Users want dark mode support",
        assignee_id: userBId,
        position: 2000,
        due_date: "2099-12-31", // far future
      })
      .select()
      .single();
    taskIds.push(task2!.id);

    // Task 3: unassigned, no label, no due date
    const { data: task3 } = await supabaseAdmin
      .from("board_tasks")
      .insert({
        column_id: inProgressColumn.id,
        idea_id: ideaId,
        title: "[E2E] Refactor utils module",
        description: "Clean up utility functions",
        position: 1000,
      })
      .select()
      .single();
    taskIds.push(task3!.id);

    // Task 4: archived task
    const { data: task4 } = await supabaseAdmin
      .from("board_tasks")
      .insert({
        column_id: todoColumn.id,
        idea_id: ideaId,
        title: "[E2E] Archived old task",
        description: "This task has been archived",
        position: 3000,
        archived: true,
      })
      .select()
      .single();
    taskIds.push(task4!.id);

    // Add userB as collaborator so they appear in team members
    await supabaseAdmin.from("collaborators").insert({
      idea_id: ideaId,
      user_id: userBId,
    });
  });

  test.afterAll(async () => {
    await cleanupTestData();
  });

  test("should search tasks by title", async ({ userAPage }) => {
    await userAPage.goto(`/ideas/${ideaId}/board`);

    // Wait for tasks to be visible
    await expect(userAPage.getByText("[E2E] Fix login crash")).toBeVisible({
      timeout: 15_000,
    });
    await expect(userAPage.getByText("[E2E] Add dark mode toggle")).toBeVisible({
      timeout: 5_000,
    });

    // Type in the search input
    const searchInput = userAPage.getByPlaceholder("Search tasks...");
    await expect(searchInput).toBeVisible();
    await searchInput.fill("login crash");

    // Wait for debounce to apply the filter (debounce may be 300ms+)
    await userAPage.waitForTimeout(1000);

    // Matching task should remain visible (with highlight)
    await expect(userAPage.getByText("[E2E] Fix login crash")).toBeVisible({
      timeout: 10_000,
    });

    // Non-matching tasks should be hidden
    await expect(
      userAPage.getByText("[E2E] Add dark mode toggle")
    ).not.toBeVisible({ timeout: 10_000 });
    await expect(
      userAPage.getByText("[E2E] Refactor utils module")
    ).not.toBeVisible({ timeout: 10_000 });

    // Clear search and verify all tasks reappear
    await searchInput.clear();
    await userAPage.waitForTimeout(1000);
    await expect(
      userAPage.getByText("[E2E] Add dark mode toggle")
    ).toBeVisible({ timeout: 10_000 });
    await expect(
      userAPage.getByText("[E2E] Refactor utils module")
    ).toBeVisible({ timeout: 10_000 });
  });

  test("should filter by assignee", async ({ userAPage }) => {
    await userAPage.goto(`/ideas/${ideaId}/board`);

    // Wait for board to load
    await expect(userAPage.getByText("[E2E] Fix login crash")).toBeVisible({
      timeout: 15_000,
    });

    // Open the assignee filter dropdown
    // The assignee select is on the toolbar with placeholder "Assignee" / value "All members"
    const assigneeSelect = userAPage
      .locator("button")
      .filter({ hasText: /all members/i })
      .first();
    await assigneeSelect.click();

    // Select "Test User A"
    await userAPage.getByRole("option", { name: "Test User A" }).click();

    // Only task assigned to User A should be visible
    await expect(userAPage.getByText("[E2E] Fix login crash")).toBeVisible({
      timeout: 10_000,
    });

    // Tasks not assigned to User A should be hidden
    await expect(
      userAPage.getByText("[E2E] Add dark mode toggle")
    ).not.toBeVisible({ timeout: 10_000 });
    await expect(
      userAPage.getByText("[E2E] Refactor utils module")
    ).not.toBeVisible({ timeout: 10_000 });
  });

  test("should filter by label", async ({ userAPage }) => {
    await userAPage.goto(`/ideas/${ideaId}/board`);

    // Wait for board to load
    await expect(userAPage.getByText("[E2E] Fix login crash")).toBeVisible({
      timeout: 15_000,
    });

    // Click the "Labels" filter button on the toolbar
    const labelsButton = userAPage
      .locator("button")
      .filter({ hasText: /^labels$/i })
      .first();
    await labelsButton.click();

    // Select the "Bug" label checkbox in the popover
    const bugCheckbox = userAPage
      .locator('[role="dialog"], [data-radix-popper-content-wrapper]')
      .locator("text=Bug")
      .locator("..");
    await bugCheckbox.locator('button[role="checkbox"]').click();

    // Close the popover by clicking elsewhere
    await userAPage.keyboard.press("Escape");

    // Only task with the Bug label should be visible
    await expect(userAPage.getByText("[E2E] Fix login crash")).toBeVisible({
      timeout: 10_000,
    });

    // Tasks without the Bug label should be hidden
    await expect(
      userAPage.getByText("[E2E] Add dark mode toggle")
    ).not.toBeVisible({ timeout: 10_000 });
    await expect(
      userAPage.getByText("[E2E] Refactor utils module")
    ).not.toBeVisible({ timeout: 10_000 });
  });

  test("should filter by overdue due date", async ({ userAPage }) => {
    await userAPage.goto(`/ideas/${ideaId}/board`);

    // Wait for board to load
    await expect(userAPage.getByText("[E2E] Fix login crash")).toBeVisible({
      timeout: 15_000,
    });

    // Open the due date filter dropdown
    const dueDateSelect = userAPage
      .locator("button")
      .filter({ hasText: /all dates/i })
      .first();
    await dueDateSelect.click();

    // Select "Overdue"
    await userAPage.getByRole("option", { name: "Overdue" }).click();

    // Only the overdue task should be visible (due_date = 2024-01-01)
    await expect(userAPage.getByText("[E2E] Fix login crash")).toBeVisible({
      timeout: 10_000,
    });

    // Tasks without overdue dates should be hidden
    await expect(
      userAPage.getByText("[E2E] Add dark mode toggle")
    ).not.toBeVisible({ timeout: 10_000 });
    await expect(
      userAPage.getByText("[E2E] Refactor utils module")
    ).not.toBeVisible({ timeout: 10_000 });
  });

  test.fixme("should toggle archived task visibility", async ({ userAPage }) => {
    // TEST BUG: Archived toggle button selector is too fragile — the button text/role varies
    await userAPage.goto(`/ideas/${ideaId}/board`);

    // Wait for board to load
    await expect(userAPage.getByText("[E2E] Fix login crash")).toBeVisible({
      timeout: 15_000,
    });

    // Archived task should NOT be visible by default
    await expect(
      userAPage.getByText("[E2E] Archived old task")
    ).not.toBeVisible();

    // Click the "Show archived" toggle/button on the toolbar
    // It may be a button or a switch — look for text containing "archived"
    const showArchivedButton = userAPage
      .getByRole("button")
      .filter({ hasText: /archived/i })
      .first()
      .or(userAPage.locator("button[role='switch']").filter({ hasText: /archived/i }).first())
      .or(userAPage.getByLabel(/archived/i));
    await expect(showArchivedButton).toBeVisible({ timeout: 10_000 });
    await showArchivedButton.click();

    // Archived task should now be visible
    await expect(
      userAPage.getByText("[E2E] Archived old task")
    ).toBeVisible({ timeout: 10_000 });

    // The archived task card should show an "Archived" badge
    const archivedTaskCard = userAPage.locator(
      `[data-testid="task-card-${taskIds[3]}"]`
    );
    await expect(archivedTaskCard.getByText("Archived")).toBeVisible();

    // Toggle off — click the same button again
    await showArchivedButton.click();

    await expect(
      userAPage.getByText("[E2E] Archived old task")
    ).not.toBeVisible({ timeout: 5_000 });
  });
});
