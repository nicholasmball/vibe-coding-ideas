import { test, expect } from "../fixtures/auth";
import {
  createTestIdea,
  createTestBoardWithTasks,
  cleanupTestData,
} from "../fixtures/test-data";
import { supabaseAdmin } from "../fixtures/supabase-admin";

let userAId: string;
let guestIdeaId: string;

test.beforeAll(async () => {
  const { data: users } = await supabaseAdmin
    .from("users")
    .select("id, full_name")
    .in("full_name", ["Test User A"]);

  const userA = users?.find((u) => u.full_name === "Test User A");
  if (!userA) throw new Error("Test User A not found — run global setup first");
  userAId = userA.id;

  // Create idea owned by User A with board + tasks (User B is NOT a collaborator)
  const idea = await createTestIdea(userAId, {
    title: "[E2E] Guest Board Idea",
    description: "[E2E] Idea for testing guest read-only board access.",
  });
  guestIdeaId = idea.id;
  await createTestBoardWithTasks(guestIdeaId, 2);
});

test.afterAll(async () => {
  await cleanupTestData();
});

test.describe("Guest Board — Read-Only Access", () => {
  test("guest banner is displayed with Request Access button", async ({
    userBPage,
  }) => {
    await userBPage.goto(`/ideas/${guestIdeaId}/board`);

    // Guest banner should be visible
    await expect(
      userBPage.getByText(/viewing this board in read-only mode/i)
    ).toBeVisible({ timeout: 15_000 });

    // Request Access button should be visible
    await expect(
      userBPage.getByRole("button", { name: /request access/i })
    ).toBeVisible();

    // View Idea link should be visible
    await expect(
      userBPage.getByRole("link", { name: /view idea/i })
    ).toBeVisible();
  });

  test("columns and tasks are visible but Add Column button is hidden", async ({
    userBPage,
  }) => {
    await userBPage.goto(`/ideas/${guestIdeaId}/board`);

    // Wait for board to load
    await expect(
      userBPage.getByText(/viewing this board in read-only mode/i)
    ).toBeVisible({ timeout: 15_000 });

    // Columns should be visible (read access works)
    const columns = userBPage.locator("h3").filter({ hasText: /To Do|In Progress|Done/ });
    await expect(columns).toHaveCount(3, { timeout: 15_000 });

    // Task cards should be visible
    const taskCards = userBPage.locator('[data-testid^="task-card-"]');
    await expect(taskCards).toHaveCount(2, { timeout: 10_000 });

    // Add Column button should NOT be visible
    await expect(
      userBPage.getByRole("button", { name: /add column/i })
    ).toHaveCount(0);
  });

  test("Add Task button is hidden in columns", async ({ userBPage }) => {
    await userBPage.goto(`/ideas/${guestIdeaId}/board`);

    await expect(
      userBPage.getByText(/viewing this board in read-only mode/i)
    ).toBeVisible({ timeout: 15_000 });

    // The "+" add task button at the bottom of columns should not exist
    // In read-only mode, the add task form is not rendered
    const addTaskButtons = userBPage.locator(
      'button[aria-label="Add task"], button:has-text("Add a task")'
    );
    await expect(addTaskButtons).toHaveCount(0);
  });

  test("column menu (edit/delete) is hidden for guests", async ({
    userBPage,
  }) => {
    await userBPage.goto(`/ideas/${guestIdeaId}/board`);

    await expect(
      userBPage.getByText(/viewing this board in read-only mode/i)
    ).toBeVisible({ timeout: 15_000 });

    // Column header dropdown triggers should not exist in read-only mode
    const columnMenuButtons = userBPage.locator(
      '[data-testid^="column-"] button[aria-label="Column options"], [data-testid^="column-"] button:has(.lucide-ellipsis-vertical)'
    );
    await expect(columnMenuButtons).toHaveCount(0);
  });

  test("toolbar hides write actions (Import, AI Generate) for guests", async ({
    userBPage,
  }) => {
    await userBPage.goto(`/ideas/${guestIdeaId}/board`);

    await expect(
      userBPage.getByText(/viewing this board in read-only mode/i)
    ).toBeVisible({ timeout: 15_000 });

    // Import button should not be visible
    await expect(
      userBPage.getByRole("button", { name: /import/i })
    ).toHaveCount(0);

    // AI Generate button should not be visible
    await expect(
      userBPage.getByRole("button", { name: /ai generate/i })
    ).toHaveCount(0);
  });

  test("clicking a task card opens read-only task detail dialog", async ({
    userBPage,
  }) => {
    await userBPage.goto(`/ideas/${guestIdeaId}/board`);

    await expect(
      userBPage.getByText(/viewing this board in read-only mode/i)
    ).toBeVisible({ timeout: 15_000 });

    // Click the first task card
    const firstTask = userBPage.locator('[data-testid^="task-card-"]').first();
    await expect(firstTask).toBeVisible({ timeout: 10_000 });
    await firstTask.click();

    // Task detail dialog should open
    const dialog = userBPage.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 10_000 });

    // Title should be displayed as plain text (not editable input)
    // In read-only mode, the title is rendered as an h2 instead of an input
    const titleHeading = dialog.locator("h2").filter({ hasText: /\[E2E\] Task/ });
    await expect(titleHeading).toBeVisible({ timeout: 5_000 });

    // Delete button should NOT be visible
    await expect(
      dialog.getByRole("button", { name: /delete/i })
    ).toHaveCount(0);
  });

  test("request access sends collaboration request and shows pending state", async ({
    userBPage,
  }) => {
    await userBPage.goto(`/ideas/${guestIdeaId}/board`);

    await expect(
      userBPage.getByText(/viewing this board in read-only mode/i)
    ).toBeVisible({ timeout: 15_000 });

    // Click Request Access
    const requestButton = userBPage.getByRole("button", { name: /request access/i });
    await expect(requestButton).toBeVisible();
    await requestButton.click();

    // Should show success toast
    await expect(
      userBPage.locator("[data-sonner-toast]").filter({ hasText: /request sent/i })
    ).toBeVisible({ timeout: 5_000 });

    // Banner should update to show pending state
    await expect(
      userBPage.getByText(/pending approval/i)
    ).toBeVisible({ timeout: 10_000 });

    // Request Access button should be replaced with disabled Pending button
    await expect(
      userBPage.getByRole("button", { name: /pending/i })
    ).toBeVisible();
    await expect(
      userBPage.getByRole("button", { name: /request access/i })
    ).toHaveCount(0);

    // Clean up: withdraw the request so it doesn't affect other tests
    // (done via supabaseAdmin since there's no withdraw button on the board)
    const { data: userB } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("full_name", "Test User B")
      .single();
    if (userB) {
      await supabaseAdmin
        .from("collaboration_requests")
        .delete()
        .eq("idea_id", guestIdeaId)
        .eq("requester_id", userB.id);
    }
  });
});
