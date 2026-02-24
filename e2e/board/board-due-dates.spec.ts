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

test.describe("Board Due Dates", () => {
  let userAId: string;
  let ideaId: string;
  let tasks: Array<{ id: string; title: string }>;

  test.beforeAll(async () => {
    userAId = await getUserId("Test User A");

    const idea = await createTestIdea(userAId, {
      title: "[E2E] Due Dates Board Test Idea",
      description: "[E2E] Idea for testing due date features on the board.",
      tags: ["e2e-test", "due-dates"],
    });
    ideaId = idea.id;

    const board = await createTestBoardWithTasks(ideaId, 4);
    tasks = board.tasks;
  });

  test.afterAll(async () => {
    await cleanupTestData();
  });

  test("set a due date via the date picker in task detail", async ({
    userAPage,
  }) => {
    const taskId = tasks[0].id;

    // Ensure the task has NO due date (clean starting state)
    await supabaseAdmin
      .from("board_tasks")
      .update({ due_date: null })
      .eq("id", taskId);

    await userAPage.goto(`/ideas/${ideaId}/board`);

    // Open the task detail dialog
    const taskCard = userAPage.locator(`[data-testid="task-card-${taskId}"]`);
    await expect(taskCard).toBeVisible({ timeout: 15_000 });
    await taskCard.click();

    // Use first() since calendar popover also creates a [role="dialog"]
    const dialog = userAPage.getByRole("dialog").first();
    await expect(dialog).toBeVisible({ timeout: 10_000 });

    // Click the "Set due date" button to open the calendar popover
    const dueDateButton = dialog.getByRole("button", { name: /set due date/i });
    await expect(dueDateButton).toBeVisible({ timeout: 5_000 });
    await dueDateButton.click();

    // The shadcn Calendar should appear — wait for the calendar table
    const calendar = userAPage.locator("table").first();
    await expect(calendar).toBeVisible({ timeout: 10_000 });

    // Click day 15 — accessible name is the full date e.g. "Sunday, February 15th, 2026"
    // Use a button filter matching the visible text "15"
    const dayButton = calendar.locator("button").filter({ hasText: /^15$/ }).first();

    if (await dayButton.isVisible().catch(() => false)) {
      await dayButton.click();
    } else {
      // If day 15 isn't visible (might be disabled), try 20
      const fallback = calendar.locator("button").filter({ hasText: /^20$/ }).first();
      await fallback.click();
    }

    // After selecting a date, the popover closes (setOpen(false)) and the button text changes
    // Wait for the "Set due date" text to disappear from the task detail dialog
    await expect(
      userAPage.getByRole("button", { name: /set due date/i })
    ).not.toBeVisible({ timeout: 15_000 });

    // Close the task detail dialog
    await userAPage.keyboard.press("Escape");
    // Wait for the dialog to close
    await userAPage.waitForTimeout(500);

    // The card should now show a DueDateBadge
    const refreshedCard = userAPage.locator(
      `[data-testid="task-card-${taskId}"]`
    );
    await expect(refreshedCard).toBeVisible({ timeout: 15_000 });

    // DueDateBadge renders a span with the formatted date (e.g. "Feb 28")
    await expect(
      refreshedCard.locator("span").filter({ hasText: /[A-Z][a-z]{2}\s\d+/ })
    ).toBeVisible({ timeout: 10_000 });
  });

  test("remove a due date", async ({ userAPage }) => {
    const taskId = tasks[1].id;

    // Seed a due date on this task (must complete before navigating)
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    const { error } = await supabaseAdmin
      .from("board_tasks")
      .update({ due_date: futureDate.toISOString() })
      .eq("id", taskId);
    if (error) throw new Error(`Failed to seed due date: ${error.message}`);

    await userAPage.goto(`/ideas/${ideaId}/board`);

    // Open the task detail dialog
    const taskCard = userAPage.locator(`[data-testid="task-card-${taskId}"]`);
    await expect(taskCard).toBeVisible({ timeout: 15_000 });
    await taskCard.click();

    // Use first() since calendar popover also creates a [role="dialog"]
    const dialog = userAPage.getByRole("dialog").first();
    await expect(dialog).toBeVisible({ timeout: 10_000 });

    // The due date button should show the formatted date (not "Set due date")
    // Wait for a button with a month-day pattern like "Mar 3"
    const dueDateButton = dialog.locator("button").filter({
      hasText: /(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s\d/,
    }).first();
    await expect(dueDateButton).toBeVisible({ timeout: 15_000 });

    // Click to open the calendar popover
    await dueDateButton.click();

    // Click the "Remove due date" button (from due-date-picker.tsx)
    const removeButton = userAPage.getByRole("button", {
      name: /remove due date/i,
    });
    await expect(removeButton).toBeVisible({ timeout: 10_000 });
    await removeButton.click();

    // The button should revert to "Set due date" (popover auto-closes)
    await expect(
      userAPage.getByRole("button", { name: /set due date/i })
    ).toBeVisible({ timeout: 15_000 });

    // Close the task detail dialog
    await userAPage.keyboard.press("Escape");
    await userAPage.waitForTimeout(500);

    const refreshedCard = userAPage.locator(
      `[data-testid="task-card-${taskId}"]`
    );
    await expect(refreshedCard).toBeVisible({ timeout: 15_000 });

    // DueDateBadge should not be present on the card
    await expect(
      refreshedCard.locator("span").filter({ hasText: /[A-Z][a-z]{2}\s\d+/ })
    ).not.toBeVisible();
  });

  test("overdue due date shows red styling", async ({ userAPage }) => {
    const taskId = tasks[2].id;

    // Set a past due date (3 days ago)
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 3);
    await supabaseAdmin
      .from("board_tasks")
      .update({ due_date: pastDate.toISOString() })
      .eq("id", taskId);

    await userAPage.goto(`/ideas/${ideaId}/board`);

    // The task card should show a DueDateBadge with red/overdue styling
    const taskCard = userAPage.locator(`[data-testid="task-card-${taskId}"]`);
    await expect(taskCard).toBeVisible({ timeout: 15_000 });

    // DueDateBadge for overdue dates uses "text-red-400" and "bg-red-400/20"
    const dueDateBadge = taskCard.locator("span").filter({
      hasText: /[A-Z][a-z]{2}\s\d+/,
    });
    await expect(dueDateBadge).toBeVisible({ timeout: 10_000 });

    // Verify the red styling class is applied
    await expect(dueDateBadge).toHaveClass(/text-red-400/, { timeout: 15_000 });
  });

  test("due-soon date shows amber styling", async ({ userAPage }) => {
    const taskId = tasks[3].id;

    // Set a due date to a few hours from now (within 24h = due_soon)
    const soonDate = new Date();
    soonDate.setHours(soonDate.getHours() + 6);
    await supabaseAdmin
      .from("board_tasks")
      .update({ due_date: soonDate.toISOString() })
      .eq("id", taskId);

    await userAPage.goto(`/ideas/${ideaId}/board`);

    // The task card should show a DueDateBadge with amber/due-soon styling
    const taskCard = userAPage.locator(`[data-testid="task-card-${taskId}"]`);
    await expect(taskCard).toBeVisible({ timeout: 15_000 });

    // DueDateBadge for due-soon dates uses "text-amber-400" and "bg-amber-400/20"
    const dueDateBadge = taskCard.locator("span").filter({
      hasText: /[A-Z][a-z]{2}\s\d+/,
    });
    await expect(dueDateBadge).toBeVisible({ timeout: 10_000 });

    // Verify the amber styling class is applied
    await expect(dueDateBadge).toHaveClass(/text-amber-400/, {
      timeout: 15_000,
    });
  });
});
