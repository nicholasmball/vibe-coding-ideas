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

test.describe("Board Task Priority", () => {
  let userAId: string;
  let ideaId: string;
  let tasks: Array<{ id: string; title: string }>;

  test.beforeAll(async () => {
    userAId = await getUserId("Test User A");

    const idea = await createTestIdea(userAId, {
      title: "[E2E] Priority Board Test Idea",
      description: "[E2E] Idea for testing task priority features.",
      tags: ["e2e-test", "priority"],
    });
    ideaId = idea.id;

    const board = await createTestBoardWithTasks(ideaId, 3);
    tasks = board.tasks;
  });

  test.afterAll(async () => {
    await cleanupTestData();
  });

  test("new tasks default to medium priority dot on card", async ({
    userAPage,
  }) => {
    await userAPage.goto(`/ideas/${ideaId}/board`);

    const taskCard = userAPage.locator(
      `[data-testid="task-card-${tasks[0].id}"]`
    );
    await expect(taskCard).toBeVisible({ timeout: 15_000 });

    // The priority dot is a span with bg-yellow-600/40 (medium default)
    const priorityDot = taskCard.locator("span.rounded-full.bg-yellow-600\\/40");
    await expect(priorityDot).toBeVisible({ timeout: 5_000 });
  });

  test("change priority from task detail dialog", async ({ userAPage }) => {
    const taskId = tasks[1].id;

    await userAPage.goto(`/ideas/${ideaId}/board`);

    // Open task detail
    const taskCard = userAPage.locator(`[data-testid="task-card-${taskId}"]`);
    await expect(taskCard).toBeVisible({ timeout: 15_000 });
    await taskCard.click();

    const dialog = userAPage.getByRole("dialog").first();
    await expect(dialog).toBeVisible({ timeout: 10_000 });

    // Verify the Priority label is visible
    await expect(dialog.getByText("Priority")).toBeVisible({ timeout: 5_000 });

    // The priority select trigger should show "Medium" by default
    const priorityTrigger = dialog
      .locator('[role="combobox"]')
      .filter({ hasText: "Medium" });
    await expect(priorityTrigger).toBeVisible({ timeout: 5_000 });

    // Open the priority select
    await priorityTrigger.click();

    // Select "High" from the dropdown
    const highOption = userAPage.getByRole("option", { name: "High" });
    await expect(highOption).toBeVisible({ timeout: 5_000 });
    await highOption.click();

    // The trigger should now show "High"
    await expect(
      dialog.locator('[role="combobox"]').filter({ hasText: "High" })
    ).toBeVisible({ timeout: 5_000 });

    // Wait for server save
    await userAPage.waitForTimeout(1000);

    // Close dialog
    await userAPage.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible({ timeout: 5_000 });

    // The card should now show the orange dot (high priority)
    const updatedCard = userAPage.locator(
      `[data-testid="task-card-${taskId}"]`
    );
    await expect(updatedCard).toBeVisible({ timeout: 15_000 });
    const highDot = updatedCard.locator("span.rounded-full.bg-orange-500");
    await expect(highDot).toBeVisible({ timeout: 10_000 });
  });

  test("change priority to urgent and verify red dot on card", async ({
    userAPage,
  }) => {
    const taskId = tasks[2].id;

    await userAPage.goto(`/ideas/${ideaId}/board`);

    // Open task detail
    const taskCard = userAPage.locator(`[data-testid="task-card-${taskId}"]`);
    await expect(taskCard).toBeVisible({ timeout: 15_000 });
    await taskCard.click();

    const dialog = userAPage.getByRole("dialog").first();
    await expect(dialog).toBeVisible({ timeout: 10_000 });

    // Open the priority select (currently Medium)
    const priorityTrigger = dialog
      .locator('[role="combobox"]')
      .filter({ hasText: "Medium" });
    await expect(priorityTrigger).toBeVisible({ timeout: 5_000 });
    await priorityTrigger.click();

    // Select "Urgent"
    const urgentOption = userAPage.getByRole("option", { name: "Urgent" });
    await expect(urgentOption).toBeVisible({ timeout: 5_000 });
    await urgentOption.click();

    // The trigger should now show "Urgent"
    await expect(
      dialog.locator('[role="combobox"]').filter({ hasText: "Urgent" })
    ).toBeVisible({ timeout: 5_000 });

    // Wait for server save
    await userAPage.waitForTimeout(1000);

    // Close dialog
    await userAPage.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible({ timeout: 5_000 });

    // The card should now show the red dot (urgent priority)
    const updatedCard = userAPage.locator(
      `[data-testid="task-card-${taskId}"]`
    );
    await expect(updatedCard).toBeVisible({ timeout: 15_000 });
    const urgentDot = updatedCard.locator("span.rounded-full.bg-red-500");
    await expect(urgentDot).toBeVisible({ timeout: 10_000 });
  });

  test("priority persists after page reload", async ({ userAPage }) => {
    const taskId = tasks[1].id;

    // Set priority to "low" directly in DB for a clean test
    await supabaseAdmin
      .from("board_tasks")
      .update({ priority: "low" })
      .eq("id", taskId);

    await userAPage.goto(`/ideas/${ideaId}/board`);

    // The card should show the zinc dot (low priority)
    const taskCard = userAPage.locator(`[data-testid="task-card-${taskId}"]`);
    await expect(taskCard).toBeVisible({ timeout: 15_000 });
    const lowDot = taskCard.locator("span.rounded-full.bg-zinc-500");
    await expect(lowDot).toBeVisible({ timeout: 10_000 });

    // Open detail dialog and verify the select shows "Low"
    await taskCard.click();
    const dialog = userAPage.getByRole("dialog").first();
    await expect(dialog).toBeVisible({ timeout: 10_000 });

    await expect(
      dialog.locator('[role="combobox"]').filter({ hasText: "Low" })
    ).toBeVisible({ timeout: 5_000 });
  });
});
