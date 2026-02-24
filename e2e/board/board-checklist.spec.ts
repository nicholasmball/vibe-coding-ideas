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

test.describe("Board Checklist", () => {
  let userAId: string;
  let ideaId: string;
  let taskId: string;

  test.beforeAll(async () => {
    userAId = await getUserId("Test User A");

    const idea = await createTestIdea(userAId, {
      title: "[E2E] Checklist Board Test Idea",
      description: "[E2E] Idea for testing checklist features on the board.",
      tags: ["e2e-test", "checklist"],
    });
    ideaId = idea.id;

    const { tasks } = await createTestBoardWithTasks(ideaId, 1);
    taskId = tasks[0].id;
  });

  test.afterAll(async () => {
    await cleanupTestData();
  });

  test("add a checklist item by typing and pressing Enter", async ({
    userAPage,
  }) => {
    await userAPage.goto(`/ideas/${ideaId}/board`);

    // Click the task card to open the detail dialog
    const taskCard = userAPage.locator(`[data-testid="task-card-${taskId}"]`);
    await expect(taskCard).toBeVisible({ timeout: 15_000 });
    await taskCard.click();

    // Verify the detail dialog opened
    const dialog = userAPage.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 10_000 });

    // The Details tab should be active by default which contains the Checklist section
    // Find the checklist input
    const checklistInput = dialog.getByPlaceholder("Add an item...");
    await expect(checklistInput).toBeVisible();

    // Type a checklist item and press Enter
    await checklistInput.fill("[E2E] First checklist item");
    await checklistInput.press("Enter");

    // The item should appear in the checklist
    await expect(dialog.getByText("[E2E] First checklist item")).toBeVisible({
      timeout: 10_000,
    });
  });

  test.fixme("toggle checklist item completion", async ({ userAPage }) => {
    // TEST BUG: XPath ancestor::div selector for finding checklist item row is flaky
    // Seed a checklist item for this test
    await supabaseAdmin.from("board_checklist_items").insert({
      task_id: taskId,
      idea_id: ideaId,
      title: "[E2E] Toggle checklist item",
      completed: false,
      position: 1,
    });

    await userAPage.goto(`/ideas/${ideaId}/board`);

    // Open task detail dialog
    const taskCard = userAPage.locator(`[data-testid="task-card-${taskId}"]`);
    await expect(taskCard).toBeVisible({ timeout: 15_000 });
    await taskCard.click();

    const dialog = userAPage.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 10_000 });

    // Find the checklist item text
    const itemText = dialog.getByText("[E2E] Toggle checklist item");
    await expect(itemText).toBeVisible();

    // Find the checkbox in the same row as the checklist item.
    // The item row has: <Checkbox> <span>title</span> <button>delete</button>
    const itemRow = itemText.locator("xpath=ancestor::div[contains(@class, 'group')]").first();
    const checkbox = itemRow.getByRole("checkbox");
    await expect(checkbox).toBeVisible();

    // Initially unchecked
    await expect(checkbox).not.toBeChecked();

    // Toggle it
    await checkbox.click();

    // Should now be checked (optimistic update)
    await expect(checkbox).toBeChecked({ timeout: 15_000 });

    // The text should get strikethrough styling (line-through class)
    await expect(itemText).toHaveClass(/line-through/, { timeout: 15_000 });
  });

  test("delete a checklist item", async ({ userAPage }) => {
    // Seed a checklist item to delete
    await supabaseAdmin.from("board_checklist_items").insert({
      task_id: taskId,
      idea_id: ideaId,
      title: "[E2E] Item to delete",
      completed: false,
      position: 100,
    });

    await userAPage.goto(`/ideas/${ideaId}/board`);

    // Open task detail
    const taskCard = userAPage.locator(`[data-testid="task-card-${taskId}"]`);
    await expect(taskCard).toBeVisible({ timeout: 15_000 });
    await taskCard.click();

    const dialog = userAPage.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 10_000 });

    // Find the item
    const itemText = dialog.getByText("[E2E] Item to delete");
    await expect(itemText).toBeVisible({ timeout: 5_000 });

    // The delete button is hidden until hover (opacity-0 group-hover:opacity-100).
    // Find the parent row — the checklist item row is a div.group with the checkbox, text, and delete button.
    // The <span> containing the text is a direct child of the <div class="group"> row.
    const itemRow = itemText.locator("..");

    // Hover the row to reveal the delete button
    await itemRow.hover();

    // The delete button is a ghost icon button with a Trash2 icon inside the row.
    // Use force:true since the button may still have opacity-0 in CSS (Playwright can still click it)
    const deleteButton = itemRow.locator("button").last();
    await deleteButton.click({ force: true });

    // Item should be removed from the list (optimistic removal)
    await expect(itemText).not.toBeVisible({ timeout: 15_000 });
  });

  test("progress bar reflects completion ratio and card shows checklist indicator", async ({
    userAPage,
  }) => {
    // Clean up any existing checklist items for this task
    await supabaseAdmin
      .from("board_checklist_items")
      .delete()
      .eq("task_id", taskId);

    // Reset denormalized counts on the task
    await supabaseAdmin
      .from("board_tasks")
      .update({ checklist_total: 0, checklist_done: 0 })
      .eq("id", taskId);

    await userAPage.goto(`/ideas/${ideaId}/board`);

    // Open task detail dialog
    const taskCard = userAPage.locator(`[data-testid="task-card-${taskId}"]`);
    await expect(taskCard).toBeVisible({ timeout: 15_000 });
    await taskCard.click();

    const dialog = userAPage.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 10_000 });

    const checklistInput = dialog.getByPlaceholder("Add an item...");
    await expect(checklistInput).toBeVisible();

    // Add first item
    await checklistInput.fill("[E2E] Progress item 1");
    await checklistInput.press("Enter");
    await expect(dialog.getByText("[E2E] Progress item 1")).toBeVisible({
      timeout: 10_000,
    });

    // Add second item
    await checklistInput.fill("[E2E] Progress item 2");
    await checklistInput.press("Enter");
    await expect(dialog.getByText("[E2E] Progress item 2")).toBeVisible({
      timeout: 10_000,
    });

    // Progress should show 0/2
    await expect(dialog.getByText("0/2")).toBeVisible({ timeout: 15_000 });

    // Check the first item using the checkbox role directly
    // Find checkboxes in the dialog (unchecked ones)
    const checkboxes = dialog.getByRole("checkbox");
    // The first checkbox corresponds to the first checklist item
    const firstCheckbox = checkboxes.first();
    await expect(firstCheckbox).toBeVisible();
    await firstCheckbox.click();

    // Progress should now show 1/2 (optimistic update)
    await expect(dialog.getByText("1/2")).toBeVisible({ timeout: 15_000 });

    // Close the dialog
    await dialog.press("Escape");
    await expect(dialog).not.toBeVisible({ timeout: 5_000 });

    // Wait for the server to update the denormalized counts, then reload
    await userAPage.waitForTimeout(2000);
    await userAPage.reload();

    // The task card should show a checklist indicator
    const refreshedCard = userAPage.locator(
      `[data-testid="task-card-${taskId}"]`
    );
    await expect(refreshedCard).toBeVisible({ timeout: 15_000 });

    // Look for the checklist count text on the card (e.g. "1/2")
    await expect(refreshedCard.getByText(/\d+\/\d+/)).toBeVisible({
      timeout: 10_000,
    });
  });
});
