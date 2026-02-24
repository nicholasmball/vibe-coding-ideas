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

test.describe("Board Labels", () => {
  let userAId: string;
  let ideaId: string;
  let columns: Awaited<ReturnType<typeof createTestBoardWithTasks>>["columns"];
  let tasks: Awaited<ReturnType<typeof createTestBoardWithTasks>>["tasks"];

  test.beforeAll(async () => {
    userAId = await getUserId("Test User A");

    // Create test idea with board and tasks
    const idea = await createTestIdea(userAId, {
      title: "[E2E] Board Labels Test Idea",
      description: "[E2E] Idea for testing board label operations",
      tags: ["e2e-test"],
    });
    ideaId = idea.id;

    const board = await createTestBoardWithTasks(ideaId, 3);
    columns = board.columns;
    tasks = board.tasks;
  });

  test.afterAll(async () => {
    await cleanupTestData();
  });

  test("should create a new label from the label picker", async ({
    userAPage,
  }) => {
    await userAPage.goto(`/ideas/${ideaId}/board`);

    // Click the first task card to open the task detail dialog
    const firstTaskCard = userAPage.locator(
      `[data-testid="task-card-${tasks[0].id}"]`
    );
    await expect(firstTaskCard).toBeVisible({ timeout: 15_000 });
    await firstTaskCard.click();

    // Wait for the task detail dialog to open
    const dialog = userAPage.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 5_000 });

    // Click the "Edit" button next to Labels to open the label picker
    const labelEditButton = dialog
      .locator("button")
      .filter({ hasText: "Edit" })
      .first();
    await labelEditButton.click();

    // Click "Create a label" button in the label picker popover
    const createLabelButton = userAPage.getByText("Create a label");
    await expect(createLabelButton).toBeVisible({ timeout: 5_000 });
    await createLabelButton.click();

    // Fill in the label name
    const labelNameInput = userAPage
      .getByPlaceholder("Label name")
      .last();
    await expect(labelNameInput).toBeVisible();
    await labelNameInput.fill("Bug");

    // Select the red color swatch (first one in the LABEL_COLORS list)
    // The red swatch has a specific bg class — click the first color button
    const colorSwatches = userAPage.locator(
      "button.h-5.w-5.rounded-sm"
    );
    // Red is the first color in LABEL_COLORS
    await colorSwatches.first().click();

    // Click "Create" button
    const createButton = userAPage
      .getByRole("button", { name: "Create" })
      .last();
    await createButton.click();

    // The new "Bug" label should appear in the label picker list
    await expect(
      userAPage.getByText("Bug").last()
    ).toBeVisible({ timeout: 15_000 });
  });

  test("should assign a label to a task", async ({ userAPage }) => {
    // Ensure a label exists for this board
    const { data: existingLabels } = await supabaseAdmin
      .from("board_labels")
      .select()
      .eq("idea_id", ideaId);

    let labelId: string;
    let labelName: string;
    if (!existingLabels || existingLabels.length === 0) {
      const { data: label } = await supabaseAdmin
        .from("board_labels")
        .insert({ idea_id: ideaId, name: "Feature", color: "blue" })
        .select()
        .single();
      labelId = label!.id;
      labelName = "Feature";
    } else {
      labelId = existingLabels[0].id;
      labelName = existingLabels[0].name;
    }

    // Ensure the label is NOT assigned to the task (clean starting state)
    await supabaseAdmin
      .from("board_task_labels")
      .delete()
      .eq("task_id", tasks[0].id)
      .eq("label_id", labelId);

    await userAPage.goto(`/ideas/${ideaId}/board`);

    // Click the first task card to open the task detail dialog
    const firstTaskCard = userAPage.locator(
      `[data-testid="task-card-${tasks[0].id}"]`
    );
    await expect(firstTaskCard).toBeVisible({ timeout: 15_000 });
    await firstTaskCard.click();

    // Wait for dialog
    const dialog = userAPage.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 5_000 });

    // Click "Edit" button next to Labels
    const labelEditButton = dialog
      .locator("button")
      .filter({ hasText: "Edit" })
      .first();
    await labelEditButton.click();

    // Wait for the label picker popover to appear
    await expect(
      userAPage.getByText("Create a label")
    ).toBeVisible({ timeout: 5_000 });

    // In the label picker, find the unchecked checkbox next to the label and click it
    const uncheckedCheckbox = userAPage.locator(
      'button[role="checkbox"][data-state="unchecked"]'
    ).first();
    await expect(uncheckedCheckbox).toBeVisible({ timeout: 5_000 });
    await uncheckedCheckbox.click();

    // Close the label picker by clicking its X button (aria-label="Close")
    // Use getByLabel to target the label picker's close button specifically
    const closeButton = userAPage.getByLabel("Close").first();
    await expect(closeButton).toBeVisible({ timeout: 5_000 });
    await closeButton.click();

    // Close the dialog
    await userAPage.keyboard.press("Escape");

    // The task card should now show the label badge
    await expect(firstTaskCard.getByText(labelName)).toBeVisible({
      timeout: 15_000,
    });
  });

  test("should remove a label from a task", async ({ userAPage }) => {
    // Ensure task has a label assigned (create one if needed, then assign it)
    const { data: existingLabels } = await supabaseAdmin
      .from("board_labels")
      .select()
      .eq("idea_id", ideaId);

    let labelId: string;
    let labelName: string;
    if (!existingLabels || existingLabels.length === 0) {
      const { data: label } = await supabaseAdmin
        .from("board_labels")
        .insert({ idea_id: ideaId, name: "Cleanup", color: "green" })
        .select()
        .single();
      labelId = label!.id;
      labelName = "Cleanup";
    } else {
      labelId = existingLabels[0].id;
      labelName = existingLabels[0].name;
    }

    // Force-assign the label to the second task (ensure known starting state)
    await supabaseAdmin
      .from("board_task_labels")
      .upsert(
        { task_id: tasks[1].id, label_id: labelId },
        { onConflict: "task_id,label_id" }
      );

    await userAPage.goto(`/ideas/${ideaId}/board`);

    // Click the second task card
    const secondTaskCard = userAPage.locator(
      `[data-testid="task-card-${tasks[1].id}"]`
    );
    await expect(secondTaskCard).toBeVisible({ timeout: 15_000 });

    // Verify the label badge IS visible on the card before removal
    await expect(secondTaskCard.getByText(labelName)).toBeVisible({
      timeout: 10_000,
    });

    await secondTaskCard.click();

    // Wait for dialog
    const dialog = userAPage.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 5_000 });

    // Click "Edit" button next to Labels
    const labelEditButton = dialog
      .locator("button")
      .filter({ hasText: "Edit" })
      .first();
    await labelEditButton.click();

    // Wait for label picker to appear
    await expect(
      userAPage.getByText("Create a label")
    ).toBeVisible({ timeout: 5_000 });

    // Find the checked checkbox and uncheck it
    const checkedCheckbox = userAPage.locator(
      'button[role="checkbox"][data-state="checked"]'
    ).first();
    await expect(checkedCheckbox).toBeVisible({ timeout: 5_000 });
    await checkedCheckbox.click();

    // Close the label picker by clicking its X button (aria-label="Close")
    // Use getByLabel to target the label picker's close button specifically
    const closeButton = userAPage.getByLabel("Close").first();
    await expect(closeButton).toBeVisible({ timeout: 5_000 });
    await closeButton.click();

    // Close the dialog
    await userAPage.keyboard.press("Escape");

    // Reload to verify the label was removed
    await userAPage.reload();

    // The task card should no longer show the label badge
    const secondTaskCardAfter = userAPage.locator(
      `[data-testid="task-card-${tasks[1].id}"]`
    );
    await expect(secondTaskCardAfter).toBeVisible({ timeout: 15_000 });

    // The label name should NOT be visible on the task card
    await expect(secondTaskCardAfter.getByText(labelName)).not.toBeVisible({
      timeout: 5_000,
    });
  });

  test("should filter tasks by label using toolbar filter", async ({
    userAPage,
  }) => {
    // Ensure a label exists and is assigned to the first task
    let labelName: string;
    const { data: existingLabels } = await supabaseAdmin
      .from("board_labels")
      .select()
      .eq("idea_id", ideaId);

    let labelId: string;
    if (!existingLabels || existingLabels.length === 0) {
      const { data: label } = await supabaseAdmin
        .from("board_labels")
        .insert({ idea_id: ideaId, name: "Priority", color: "orange" })
        .select()
        .single();
      labelId = label!.id;
      labelName = "Priority";
    } else {
      labelId = existingLabels[0].id;
      labelName = existingLabels[0].name;
    }

    // Assign label to first task
    await supabaseAdmin
      .from("board_task_labels")
      .upsert(
        { task_id: tasks[0].id, label_id: labelId },
        { onConflict: "task_id,label_id" }
      );

    await userAPage.goto(`/ideas/${ideaId}/board`);

    // Wait for all tasks to be visible
    await expect(userAPage.getByText("[E2E] Task 1")).toBeVisible({
      timeout: 15_000,
    });
    await expect(userAPage.getByText("[E2E] Task 2")).toBeVisible();

    // Click the "Labels" filter button on the toolbar
    const labelsButton = userAPage
      .locator("button")
      .filter({ hasText: /^labels$/i })
      .first();
    await expect(labelsButton).toBeVisible({ timeout: 5_000 });
    await labelsButton.click();

    // Select the label in the filter popover
    const filterPopover = userAPage.locator(
      "[data-radix-popper-content-wrapper]"
    );
    await expect(filterPopover).toBeVisible({ timeout: 5_000 });

    const labelCheckbox = filterPopover
      .getByText(labelName)
      .locator("..")
      .locator('button[role="checkbox"]');
    await labelCheckbox.click();

    // Close the popover
    await userAPage.keyboard.press("Escape");

    // Only the task with the label should be visible
    await expect(userAPage.getByText("[E2E] Task 1")).toBeVisible({
      timeout: 5_000,
    });

    // Tasks without the label should be hidden
    await expect(userAPage.getByText("[E2E] Task 2")).not.toBeVisible();
    await expect(userAPage.getByText("[E2E] Task 3")).not.toBeVisible();
  });
});
