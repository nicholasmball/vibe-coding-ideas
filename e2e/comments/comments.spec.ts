import { test, expect } from "../fixtures/auth";
import {
  createTestIdea,
  createTestComment,
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

test.describe("Comments", () => {
  let userAId: string;
  let userBId: string;
  let ideaId: string;

  test.beforeAll(async () => {
    userAId = await getUserId("Test User A");
    userBId = await getUserId("Test User B");

    const idea = await createTestIdea(userAId, {
      title: "[E2E] Comments Test Idea",
      description: "[E2E] An idea to test comment functionality.",
      tags: ["e2e-test", "comments"],
    });
    ideaId = idea.id;
  });

  test.afterAll(async () => {
    await cleanupTestData();
  });

  // Clean up comments between tests to prevent accumulation/flakiness
  test.beforeEach(async () => {
    await supabaseAdmin.from("comments").delete().eq("idea_id", ideaId);
  });

  test.describe("Posting comments", () => {
    test("post a comment with default type", async ({ userAPage }) => {
      await userAPage.goto(`/ideas/${ideaId}`);

      // Wait for the comment form to be visible
      const commentTextarea = userAPage.getByPlaceholder(/add a comment/i);
      await expect(commentTextarea).toBeVisible({ timeout: 15_000 });

      // Type a comment — click first to focus, then fill
      await commentTextarea.click();
      await commentTextarea.fill("[E2E] This is a test comment from User A");
      await userAPage.waitForTimeout(300);

      // The default type should already be "Comment" — just click Post
      const postButton = userAPage.getByRole("button", { name: "Post" }).first();
      await expect(postButton).toBeEnabled({ timeout: 5_000 });
      await postButton.click();

      // The comment should appear in the thread
      await expect(
        userAPage.getByText("[E2E] This is a test comment from User A")
      ).toBeVisible({ timeout: 15_000 });

      // Author name should be shown
      await expect(
        userAPage.getByText("Test User A").first()
      ).toBeVisible();
    });

    test("post a suggestion comment", async ({ userAPage }) => {
      await userAPage.goto(`/ideas/${ideaId}`);

      const commentTextarea = userAPage.getByPlaceholder(/add a comment/i);
      await expect(commentTextarea).toBeVisible({ timeout: 15_000 });

      // Ensure Post button is in its default disabled state (empty textarea)
      const postButton = userAPage.getByRole("button", { name: "Post" }).first();
      await expect(postButton).toBeDisabled();

      // Change the comment type to Suggestion via the Radix Select
      const commentForm = userAPage.locator("form").filter({ has: commentTextarea }).first();
      const typeSelect = commentForm.getByRole("combobox").first();
      await typeSelect.click();
      // Wait for the dropdown option to appear then click it
      const suggestionOption = userAPage.getByRole("option", { name: "Suggestion" });
      await expect(suggestionOption).toBeVisible({ timeout: 5_000 });
      await suggestionOption.click();
      // Verify the select now shows "Suggestion"
      await expect(typeSelect).toHaveText(/Suggestion/);

      // Fill the textarea (Post button is disabled until content is non-empty)
      await commentTextarea.click();
      await commentTextarea.fill(
        "[E2E] This is a suggestion for improving the idea"
      );
      await userAPage.waitForTimeout(300);

      // Submit — button should now be enabled since textarea has content
      await expect(postButton).toBeEnabled({ timeout: 5_000 });

      // Wait for the server action response
      const actionPromise = userAPage.waitForResponse(
        (resp) => resp.url().includes("ideas") && resp.request().method() === "POST",
        { timeout: 15_000 }
      );
      await postButton.click();
      await actionPromise;

      // Reload for fresh server data
      await userAPage.reload();

      // Comment should appear after reload
      const commentText = userAPage.getByText(
        "[E2E] This is a suggestion for improving the idea"
      );
      await expect(commentText).toBeVisible({ timeout: 15_000 });

      // The Suggestion badge should be visible near the comment
      await expect(
        userAPage.locator('[data-slot="badge"]').filter({ hasText: "Suggestion" }).first()
      ).toBeVisible({ timeout: 15_000 });
    });

    test("post a question comment", async ({ userAPage }) => {
      await userAPage.goto(`/ideas/${ideaId}`);

      const commentTextarea = userAPage.getByPlaceholder(/add a comment/i);
      await expect(commentTextarea).toBeVisible({ timeout: 15_000 });

      // Ensure Post button is in its default disabled state (empty textarea)
      const postButton = userAPage.getByRole("button", { name: "Post" }).first();
      await expect(postButton).toBeDisabled();

      // Change type to Question via the Radix Select
      const commentForm = userAPage.locator("form").filter({ has: commentTextarea }).first();
      const typeSelect = commentForm.getByRole("combobox").first();
      await typeSelect.click();
      // Wait for the dropdown option to appear then click it
      const questionOption = userAPage.getByRole("option", { name: "Question" });
      await expect(questionOption).toBeVisible({ timeout: 5_000 });
      await questionOption.click();
      // Verify the select now shows "Question"
      await expect(typeSelect).toHaveText(/Question/);

      // Fill the textarea (Post button is disabled until content is non-empty)
      await commentTextarea.click();
      await commentTextarea.fill(
        "[E2E] What is the expected timeline for this idea?"
      );
      await userAPage.waitForTimeout(300);

      // Submit — button should now be enabled since textarea has content
      await expect(postButton).toBeEnabled({ timeout: 5_000 });

      // Wait for the server action response
      const actionPromise = userAPage.waitForResponse(
        (resp) => resp.url().includes("ideas") && resp.request().method() === "POST",
        { timeout: 15_000 }
      );
      await postButton.click();
      await actionPromise;

      // Reload for fresh server data
      await userAPage.reload();

      // Comment should appear with Question badge
      await expect(
        userAPage.getByText(
          "[E2E] What is the expected timeline for this idea?"
        )
      ).toBeVisible({ timeout: 15_000 });

      // The Question badge should be visible
      await expect(
        userAPage.locator('[data-slot="badge"]').filter({ hasText: "Question" }).first()
      ).toBeVisible({ timeout: 15_000 });
    });

    test("comment appears in thread with author name and content", async ({
      userBPage,
    }) => {
      // Seed a comment from User A via the API
      await createTestComment(ideaId, userAId, {
        content: "[E2E] Seeded comment for thread verification",
        type: "comment",
      });

      await userBPage.goto(`/ideas/${ideaId}`);

      // The seeded comment should be visible
      await expect(
        userBPage.getByText("[E2E] Seeded comment for thread verification")
      ).toBeVisible({ timeout: 15_000 });

      // Author name should be displayed
      await expect(userBPage.getByText("Test User A").first()).toBeVisible();
    });
  });

  test.describe("Replying to comments", () => {
    test("reply to a comment creates a nested reply", async ({
      userBPage,
    }) => {
      // Seed a top-level comment from User A
      await createTestComment(ideaId, userAId, {
        content: "[E2E] Parent comment for reply test",
        type: "comment",
      });

      await userBPage.goto(`/ideas/${ideaId}`);

      // Find the parent comment and click Reply
      const parentComment = userBPage.getByText(
        "[E2E] Parent comment for reply test"
      );
      await expect(parentComment).toBeVisible({ timeout: 15_000 });

      // The Reply button is in the same comment item container
      const commentContainer = parentComment
        .locator("xpath=ancestor::div[contains(@class, 'py-3')]")
        .first();
      const replyButton = commentContainer.getByRole("button", {
        name: "Reply",
      });
      await replyButton.click();

      // Reply form should appear with "Write a reply..." placeholder
      const replyTextarea = userBPage.getByPlaceholder(/write a reply/i);
      await expect(replyTextarea).toBeVisible();

      // Type and submit a reply — scope the Post button to the reply form
      await replyTextarea.fill("[E2E] This is a reply from User B");
      const replyForm = userBPage.locator("form").filter({ has: replyTextarea });
      await replyForm.getByRole("button", { name: "Post" }).click();

      // The reply should appear (nested under the parent, indented via ml-6)
      await expect(
        userBPage.getByText("[E2E] This is a reply from User B")
      ).toBeVisible({ timeout: 15_000 });

      // Reply author
      await expect(userBPage.getByText("Test User B").first()).toBeVisible();
    });
  });

  test.describe("Deleting comments", () => {
    test("delete own comment shows undo toast", async ({ userAPage }) => {
      // Seed a comment from User A
      await createTestComment(ideaId, userAId, {
        content: "[E2E] Comment to be deleted by author",
        type: "comment",
      });

      await userAPage.goto(`/ideas/${ideaId}`);

      // Find the comment
      const comment = userAPage.getByText(
        "[E2E] Comment to be deleted by author"
      );
      await expect(comment).toBeVisible({ timeout: 15_000 });

      // Find the Delete button in the same comment item
      const commentContainer = comment
        .locator("xpath=ancestor::div[contains(@class, 'py-3')]")
        .first();
      const deleteButton = commentContainer.getByRole("button", {
        name: "Delete",
      });
      await expect(deleteButton).toBeVisible();
      await deleteButton.click();

      // Comment should disappear (optimistic removal)
      await expect(comment).not.toBeVisible();

      // Undo toast should appear
      const toast = userAPage
        .locator("[data-sonner-toast]")
        .filter({ hasText: /comment deleted/i });
      await expect(toast).toBeVisible({ timeout: 15_000 });

      // Toast should have Undo button
      await expect(
        toast.getByRole("button", { name: "Undo" })
      ).toBeVisible();
    });

    test("cannot delete another user's comment (no delete button)", async ({
      userBPage,
    }) => {
      // Seed a comment from User A
      await createTestComment(ideaId, userAId, {
        content: "[E2E] User A comment that User B should not delete",
        type: "comment",
      });

      await userBPage.goto(`/ideas/${ideaId}`);

      // Find the comment
      const comment = userBPage.getByText(
        "[E2E] User A comment that User B should not delete"
      );
      await expect(comment).toBeVisible({ timeout: 15_000 });

      // The comment container should NOT have a Delete button for User B
      const commentContainer = comment
        .locator("xpath=ancestor::div[contains(@class, 'py-3')]")
        .first();

      // There should be a Reply button but no Delete button
      await expect(
        commentContainer.getByRole("button", { name: "Reply" })
      ).toBeVisible();
      await expect(
        commentContainer.getByRole("button", { name: "Delete" })
      ).not.toBeVisible();
    });
  });

  test.describe("Incorporating suggestions", () => {
    test("author marks suggestion as incorporated", async ({
      userAPage,
    }) => {
      // Seed a suggestion comment from User B
      await createTestComment(ideaId, userBId, {
        content: "[E2E] Suggestion to incorporate",
        type: "suggestion",
      });

      await userAPage.goto(`/ideas/${ideaId}`);

      // Find the suggestion comment
      const suggestion = userAPage.getByText(
        "[E2E] Suggestion to incorporate"
      );
      await expect(suggestion).toBeVisible({ timeout: 15_000 });

      // Find the "Mark as incorporated" button — it lives in the same comment item
      // The button is a sibling within the comment's button area
      const incorporateButton = userAPage.getByRole("button", {
        name: /mark as incorporated/i,
      });
      await expect(incorporateButton).toBeVisible({ timeout: 10_000 });
      await incorporateButton.click();

      // After incorporating, the "Incorporated" badge should appear
      await expect(
        userAPage.getByText("Incorporated", { exact: true }).first()
      ).toBeVisible({ timeout: 15_000 });

      // The "Mark as incorporated" button should no longer be visible
      await expect(incorporateButton).not.toBeVisible();
    });
  });
});
