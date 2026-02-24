import { test, expect } from "../fixtures/auth";
import {
  createTestIdea,
  createTestBoardWithTasks,
  addCollaborator,
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

test.describe("Board Task Comments", () => {
  let userAId: string;
  let userBId: string;
  let ideaId: string;
  let tasks: Array<{ id: string; title: string }>;

  test.beforeAll(async () => {
    userAId = await getUserId("Test User A");
    userBId = await getUserId("Test User B");

    const idea = await createTestIdea(userAId, {
      title: "[E2E] Board Comments Test Idea",
      description: "[E2E] Idea for testing board task comment features.",
      tags: ["e2e-test", "board-comments"],
    });
    ideaId = idea.id;

    const board = await createTestBoardWithTasks(ideaId, 3);
    tasks = board.tasks;

    // Add User B as a collaborator so they appear in the team members list
    // and can be mentioned
    await addCollaborator(ideaId, userBId);
  });

  test.afterAll(async () => {
    await cleanupTestData();
  });

  test("post a task comment", async ({ userAPage }) => {
    const taskId = tasks[0].id;

    await userAPage.goto(`/ideas/${ideaId}/board`);

    // Open task detail dialog
    const taskCard = userAPage.locator(`[data-testid="task-card-${taskId}"]`);
    await expect(taskCard).toBeVisible({ timeout: 15_000 });
    await taskCard.click();

    const dialog = userAPage.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 10_000 });

    // Switch to the Comments tab
    const commentsTab = dialog.getByRole("tab", { name: /comments/i });
    await commentsTab.click();

    // Wait for the comments section to load (it shows "Loading..." then the form)
    const commentTextarea = dialog.getByPlaceholder(
      /write a comment.*@ to mention/i
    );
    await expect(commentTextarea).toBeVisible({ timeout: 10_000 });

    // Type a comment
    await commentTextarea.fill("[E2E] This is a task comment from User A");

    // Click the send button (the submit button with Send icon)
    const sendButton = dialog.locator("form button[type='submit']");
    await expect(sendButton).toBeEnabled();
    await sendButton.click();

    // The comment should appear in the comments list (optimistic)
    await expect(
      dialog.getByText("[E2E] This is a task comment from User A")
    ).toBeVisible({ timeout: 10_000 });

    // Author name should be displayed
    await expect(dialog.getByText("Test User A").first()).toBeVisible();
  });

  test("delete own task comment shows undo toast", async ({ userAPage }) => {
    const taskId = tasks[1].id;

    // Seed a comment from User A on this task
    await supabaseAdmin.from("board_task_comments").insert({
      task_id: taskId,
      idea_id: ideaId,
      author_id: userAId,
      content: "[E2E] Comment to delete on task",
    });

    await userAPage.goto(`/ideas/${ideaId}/board`);

    // Open task detail dialog
    const taskCard = userAPage.locator(`[data-testid="task-card-${taskId}"]`);
    await expect(taskCard).toBeVisible({ timeout: 15_000 });
    await taskCard.click();

    const dialog = userAPage.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 10_000 });

    // Switch to Comments tab
    const commentsTab = dialog.getByRole("tab", { name: /comments/i });
    await commentsTab.click();

    // Wait for the comment to appear
    const commentText = dialog.getByText("[E2E] Comment to delete on task");
    await expect(commentText).toBeVisible({ timeout: 10_000 });

    // Find the delete button (Trash2 icon) next to the comment.
    // The comment item has: avatar, author name + timestamp + delete button, content
    // The delete button is a <button> with a Trash2 icon inside the author row
    const commentItem = commentText
      .locator("xpath=ancestor::div[contains(@class, 'flex gap-2')]")
      .first();
    const deleteButton = commentItem.locator("button").filter({
      has: userAPage.locator("svg"),
    });
    await expect(deleteButton).toBeVisible();
    await deleteButton.click();

    // Comment should disappear (optimistic removal)
    await expect(commentText).not.toBeVisible({ timeout: 5_000 });

    // Undo toast should appear
    const toast = userAPage
      .locator("[data-sonner-toast]")
      .filter({ hasText: /comment deleted/i });
    await expect(toast).toBeVisible({ timeout: 5_000 });

    // Toast should have Undo button
    await expect(toast.getByRole("button", { name: "Undo" })).toBeVisible();
  });

  test("@mention autocomplete appears when typing @", async ({
    userAPage,
  }) => {
    const taskId = tasks[2].id;

    await userAPage.goto(`/ideas/${ideaId}/board`);

    // Open task detail dialog
    const taskCard = userAPage.locator(`[data-testid="task-card-${taskId}"]`);
    await expect(taskCard).toBeVisible({ timeout: 15_000 });
    await taskCard.click();

    const dialog = userAPage.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 10_000 });

    // Switch to Comments tab
    const commentsTab = dialog.getByRole("tab", { name: /comments/i });
    await commentsTab.click();

    // Find the comment textarea
    const commentTextarea = dialog.getByPlaceholder(
      /write a comment.*@ to mention/i
    );
    await expect(commentTextarea).toBeVisible({ timeout: 10_000 });

    // Type "@" to trigger the mention autocomplete
    await commentTextarea.fill("@");

    // The mention autocomplete dropdown should appear.
    // MentionAutocomplete renders a popover-like div with team member names.
    // It shows buttons with user names.
    const autocompleteDropdown = dialog.locator(
      "div.absolute.bottom-full"
    );
    await expect(autocompleteDropdown).toBeVisible({ timeout: 5_000 });

    // User B should appear in the autocomplete list (they are a collaborator)
    await expect(
      autocompleteDropdown.getByText("Test User B")
    ).toBeVisible();

    // User A (the author, also a team member) should appear too
    await expect(
      autocompleteDropdown.getByText("Test User A")
    ).toBeVisible();
  });

  test("selecting a mention inserts @Name in the textarea", async ({
    userAPage,
  }) => {
    const taskId = tasks[2].id;

    await userAPage.goto(`/ideas/${ideaId}/board`);

    // Open task detail dialog
    const taskCard = userAPage.locator(`[data-testid="task-card-${taskId}"]`);
    await expect(taskCard).toBeVisible({ timeout: 15_000 });
    await taskCard.click();

    const dialog = userAPage.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 10_000 });

    // Switch to Comments tab
    const commentsTab = dialog.getByRole("tab", { name: /comments/i });
    await commentsTab.click();

    // Find the comment textarea
    const commentTextarea = dialog.getByPlaceholder(
      /write a comment.*@ to mention/i
    );
    await expect(commentTextarea).toBeVisible({ timeout: 10_000 });

    // Type "@" to trigger autocomplete
    await commentTextarea.fill("@");

    // Wait for autocomplete to appear
    const autocompleteDropdown = dialog.locator(
      "div.absolute.bottom-full"
    );
    await expect(autocompleteDropdown).toBeVisible({ timeout: 5_000 });

    // Click on User B's name in the autocomplete.
    // The MentionAutocomplete uses onMouseDown (not onClick) to prevent blur,
    // so we use mousedown event via click().
    const userBOption = autocompleteDropdown.getByText("Test User B");
    await expect(userBOption).toBeVisible();
    await userBOption.click();

    // After selection, the textarea should contain "@Test User B "
    // (the mention text plus a trailing space)
    await expect(commentTextarea).toHaveValue(/@Test User B\s/, {
      timeout: 5_000,
    });

    // The autocomplete dropdown should be dismissed
    await expect(autocompleteDropdown).not.toBeVisible({ timeout: 3_000 });
  });
});
