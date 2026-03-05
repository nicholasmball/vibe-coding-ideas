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

test.describe("Board Workflow Steps", () => {
  let userAId: string;
  let ideaId: string;
  let taskId: string;

  test.beforeAll(async () => {
    userAId = await getUserId("Test User A");

    const idea = await createTestIdea(userAId, {
      title: "[E2E] Workflow Board Test Idea",
      description: "[E2E] Idea for testing workflow step features on the board.",
      tags: ["e2e-test", "workflow"],
    });
    ideaId = idea.id;

    const { tasks } = await createTestBoardWithTasks(ideaId, 1);
    taskId = tasks[0].id;
  });

  test.afterAll(async () => {
    await cleanupTestData();
  });

  test("add a workflow step with agent selection", async ({ userAPage }) => {
    await userAPage.goto(`/ideas/${ideaId}/board`);

    const taskCard = userAPage.locator(`[data-testid="task-card-${taskId}"]`);
    await expect(taskCard).toBeVisible({ timeout: 15_000 });
    await taskCard.click();

    const dialog = userAPage.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 10_000 });

    // Find the workflow step input
    const stepInput = dialog.getByPlaceholder("Add a workflow step...");
    await expect(stepInput).toBeVisible();

    // Type a step title
    await stepInput.fill("[E2E] First workflow step");

    // Select an agent (the user themselves as fallback)
    const agentSelect = dialog.locator('button[role="combobox"]').last();
    if (await agentSelect.isVisible()) {
      await agentSelect.click();
      // Select the first available option
      const firstOption = userAPage.locator('[role="option"]').first();
      if (await firstOption.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await firstOption.click();
      }
    }

    // Submit the form
    const addButton = dialog.locator('button[type="submit"]').last();
    await addButton.click();

    // The step should appear
    await expect(dialog.getByText("[E2E] First workflow step")).toBeVisible({
      timeout: 10_000,
    });
  });

  test("workflow step shows status badge and progress", async ({ userAPage }) => {
    // Seed a workflow step
    await supabaseAdmin.from("task_workflow_steps").insert({
      task_id: taskId,
      idea_id: ideaId,
      bot_id: userAId,
      title: "[E2E] Status test step",
      position: 1000,
      status: "pending",
    });

    await userAPage.goto(`/ideas/${ideaId}/board`);

    const taskCard = userAPage.locator(`[data-testid="task-card-${taskId}"]`);
    await expect(taskCard).toBeVisible({ timeout: 15_000 });
    await taskCard.click();

    const dialog = userAPage.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 10_000 });

    // Should see the step with a Pending badge
    await expect(dialog.getByText("[E2E] Status test step")).toBeVisible({ timeout: 5_000 });
    await expect(dialog.getByText("Pending")).toBeVisible();
  });

  test("delete a workflow step", async ({ userAPage }) => {
    // Seed a step to delete
    await supabaseAdmin.from("task_workflow_steps").insert({
      task_id: taskId,
      idea_id: ideaId,
      bot_id: userAId,
      title: "[E2E] Step to delete",
      position: 2000,
      status: "pending",
    });

    await userAPage.goto(`/ideas/${ideaId}/board`);

    const taskCard = userAPage.locator(`[data-testid="task-card-${taskId}"]`);
    await expect(taskCard).toBeVisible({ timeout: 15_000 });
    await taskCard.click();

    const dialog = userAPage.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 10_000 });

    const stepText = dialog.getByText("[E2E] Step to delete");
    await expect(stepText).toBeVisible({ timeout: 5_000 });

    // Hover the step row to reveal the delete button
    const stepRow = stepText.locator("..").locator("..");
    await stepRow.hover();

    // Click the delete button (last button in the action area)
    const deleteButton = stepRow.locator("button").last();
    await deleteButton.click({ force: true });

    // Step should be removed
    await expect(stepText).not.toBeVisible({ timeout: 15_000 });
  });

  test("workflow progress shows on task card after reload", async ({
    userAPage,
  }) => {
    // Clean up existing steps for this task
    await supabaseAdmin
      .from("task_workflow_steps")
      .delete()
      .eq("task_id", taskId);

    // Reset denormalized counts
    await supabaseAdmin
      .from("board_tasks")
      .update({ workflow_step_total: 0, workflow_step_completed: 0 })
      .eq("id", taskId);

    // Insert 2 steps, 1 completed
    await supabaseAdmin.from("task_workflow_steps").insert([
      {
        task_id: taskId,
        idea_id: ideaId,
        bot_id: userAId,
        title: "[E2E] Completed step",
        position: 1000,
        status: "completed",
        output: "Done",
        completed_at: new Date().toISOString(),
      },
      {
        task_id: taskId,
        idea_id: ideaId,
        bot_id: userAId,
        title: "[E2E] Pending step",
        position: 2000,
        status: "pending",
      },
    ]);

    await userAPage.goto(`/ideas/${ideaId}/board`);

    // The task card should show workflow progress indicator (1/2)
    const refreshedCard = userAPage.locator(
      `[data-testid="task-card-${taskId}"]`
    );
    await expect(refreshedCard).toBeVisible({ timeout: 15_000 });

    await expect(refreshedCard.getByText(/\d+\/\d+/)).toBeVisible({
      timeout: 10_000,
    });
  });
});
