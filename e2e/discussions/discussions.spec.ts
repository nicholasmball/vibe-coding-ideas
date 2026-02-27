import { test, expect } from "../fixtures/auth";
import {
  createTestIdea,
  createTestBoardColumns,
  createTestDiscussion,
  createTestDiscussionReply,
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

test.describe("Discussions", () => {
  let userAId: string;
  let userBId: string;
  let ideaId: string;

  test.beforeAll(async () => {
    userAId = await getUserId("Test User A");
    userBId = await getUserId("Test User B");

    const idea = await createTestIdea(userAId, {
      title: "[E2E] Discussions Test Idea",
      description: "[E2E] An idea for testing discussion features.",
      tags: ["e2e-test", "discussions"],
    });
    ideaId = idea.id;

    // Add User B as collaborator so they can participate
    await addCollaborator(ideaId, userBId);
  });

  test.afterAll(async () => {
    await cleanupTestData();
  });

  test.describe("Empty state and navigation", () => {
    // Clean up discussions to show empty state
    test.beforeEach(async () => {
      await supabaseAdmin
        .from("idea_discussions")
        .delete()
        .eq("idea_id", ideaId);
    });

    test("shows empty state when no discussions exist", async ({ userAPage }) => {
      await userAPage.goto(`/ideas/${ideaId}/discussions`);

      await expect(
        userAPage.getByText("No discussions yet")
      ).toBeVisible({ timeout: 15_000 });

      // CTA button should be visible for team member
      await expect(
        userAPage.getByRole("link", { name: /start a discussion/i })
      ).toBeVisible();
    });

    test("Discussions button on idea detail links to discussions page", async ({ userAPage }) => {
      await userAPage.goto(`/ideas/${ideaId}`);

      const discussionsButton = userAPage.getByRole("link", { name: /discussions/i });
      await expect(discussionsButton).toBeVisible({ timeout: 15_000 });
      await discussionsButton.click();

      await userAPage.waitForURL(`**/ideas/${ideaId}/discussions`, { timeout: 15_000 });
      await expect(
        userAPage.getByRole("heading", { name: "Discussions" })
      ).toBeVisible({ timeout: 10_000 });
    });

    test("New Discussion button navigates to form", async ({ userAPage }) => {
      await userAPage.goto(`/ideas/${ideaId}/discussions`);

      const newButton = userAPage.getByRole("link", { name: /new discussion/i });
      await expect(newButton).toBeVisible({ timeout: 15_000 });
      await newButton.click();

      await userAPage.waitForURL(`**/ideas/${ideaId}/discussions/new`, { timeout: 15_000 });
      await expect(
        userAPage.getByLabel("Title")
      ).toBeVisible({ timeout: 10_000 });
    });
  });

  test.describe("Creating discussions", () => {
    test.beforeEach(async () => {
      await supabaseAdmin
        .from("idea_discussions")
        .delete()
        .eq("idea_id", ideaId);
    });

    test("author creates a discussion and is redirected to the thread", async ({ userAPage }) => {
      await userAPage.goto(`/ideas/${ideaId}/discussions/new`);

      // Fill in the form
      const titleInput = userAPage.getByLabel("Title");
      await expect(titleInput).toBeVisible({ timeout: 15_000 });
      await titleInput.fill("[E2E] Architecture Discussion");

      const bodyInput = userAPage.getByLabel("Body");
      await bodyInput.fill("[E2E] We need to decide on the database schema for this feature.");

      // Submit
      await userAPage.getByRole("button", { name: "Create Discussion" }).click();

      // Should redirect to the discussion thread page
      await userAPage.waitForURL(/\/discussions\/[a-f0-9-]{36}$/, { timeout: 30_000 });

      // Thread page should show the title and body
      await expect(
        userAPage.getByRole("heading", { name: "[E2E] Architecture Discussion" })
      ).toBeVisible({ timeout: 15_000 });

      await expect(
        userAPage.getByText("We need to decide on the database schema")
      ).toBeVisible();

      // Status badge should show "Open"
      await expect(
        userAPage.locator('[data-slot="badge"]').filter({ hasText: "Open" }).first()
      ).toBeVisible();
    });

    test("collaborator can create a discussion", async ({ userBPage }) => {
      await userBPage.goto(`/ideas/${ideaId}/discussions/new`);

      const titleInput = userBPage.getByLabel("Title");
      await expect(titleInput).toBeVisible({ timeout: 15_000 });
      await titleInput.fill("[E2E] Collaborator Discussion");

      const bodyInput = userBPage.getByLabel("Body");
      await bodyInput.fill("[E2E] A collaborator's discussion topic.");

      await userBPage.getByRole("button", { name: "Create Discussion" }).click();

      await userBPage.waitForURL(/\/discussions\/[a-f0-9-]{36}$/, { timeout: 30_000 });
      await expect(
        userBPage.getByRole("heading", { name: "[E2E] Collaborator Discussion" })
      ).toBeVisible({ timeout: 15_000 });
    });

    test("submit button is disabled when title or body is empty", async ({ userAPage }) => {
      await userAPage.goto(`/ideas/${ideaId}/discussions/new`);

      const submitButton = userAPage.getByRole("button", { name: "Create Discussion" });
      await expect(submitButton).toBeVisible({ timeout: 15_000 });

      // Initially disabled (both empty)
      await expect(submitButton).toBeDisabled();

      // Fill only title — still disabled
      await userAPage.getByLabel("Title").fill("Some title");
      await expect(submitButton).toBeDisabled();

      // Fill body too — now enabled
      await userAPage.getByLabel("Body").fill("Some body");
      await expect(submitButton).toBeEnabled();

      // Clear title — disabled again
      await userAPage.getByLabel("Title").clear();
      await expect(submitButton).toBeDisabled();
    });
  });

  test.describe("Discussion list", () => {
    test.beforeEach(async () => {
      // Clean and seed discussions
      await supabaseAdmin
        .from("idea_discussions")
        .delete()
        .eq("idea_id", ideaId);
    });

    test("shows discussion items with status and metadata", async ({ userAPage }) => {
      // Seed discussions
      await createTestDiscussion(ideaId, userAId, {
        title: "[E2E] Open Discussion",
        body: "[E2E] An open discussion body.",
        status: "open",
      });
      await createTestDiscussion(ideaId, userAId, {
        title: "[E2E] Resolved Discussion",
        body: "[E2E] A resolved discussion body.",
        status: "resolved",
      });

      await userAPage.goto(`/ideas/${ideaId}/discussions`);

      // Both should be visible
      await expect(
        userAPage.getByText("[E2E] Open Discussion")
      ).toBeVisible({ timeout: 15_000 });
      await expect(
        userAPage.getByText("[E2E] Resolved Discussion")
      ).toBeVisible();

      // Status badges
      await expect(
        userAPage.locator('[data-slot="badge"]').filter({ hasText: "Open" }).first()
      ).toBeVisible();
      await expect(
        userAPage.locator('[data-slot="badge"]').filter({ hasText: "Resolved" }).first()
      ).toBeVisible();
    });

    test("filters discussions by status tab", async ({ userAPage }) => {
      await createTestDiscussion(ideaId, userAId, {
        title: "[E2E] Open For Filter",
        body: "[E2E] Body",
        status: "open",
      });
      await createTestDiscussion(ideaId, userAId, {
        title: "[E2E] Resolved For Filter",
        body: "[E2E] Body",
        status: "resolved",
      });

      await userAPage.goto(`/ideas/${ideaId}/discussions`);
      await expect(
        userAPage.getByText("[E2E] Open For Filter")
      ).toBeVisible({ timeout: 15_000 });

      // Click "Open" filter — only open discussions visible
      await userAPage.getByRole("button", { name: /^Open/ }).click();
      await expect(
        userAPage.getByText("[E2E] Open For Filter")
      ).toBeVisible();
      await expect(
        userAPage.getByText("[E2E] Resolved For Filter")
      ).not.toBeVisible();

      // Click "Resolved" filter
      await userAPage.getByRole("button", { name: /^Resolved/ }).click();
      await expect(
        userAPage.getByText("[E2E] Resolved For Filter")
      ).toBeVisible();
      await expect(
        userAPage.getByText("[E2E] Open For Filter")
      ).not.toBeVisible();

      // Click "All" — both visible again
      await userAPage.getByRole("button", { name: /^All/ }).click();
      await expect(
        userAPage.getByText("[E2E] Open For Filter")
      ).toBeVisible();
      await expect(
        userAPage.getByText("[E2E] Resolved For Filter")
      ).toBeVisible();
    });

    test("searches discussions by title", async ({ userAPage }) => {
      await createTestDiscussion(ideaId, userAId, {
        title: "[E2E] Alpha Feature",
        body: "[E2E] Some alpha body.",
      });
      await createTestDiscussion(ideaId, userAId, {
        title: "[E2E] Beta Feature",
        body: "[E2E] Some beta body.",
      });

      await userAPage.goto(`/ideas/${ideaId}/discussions`);
      await expect(
        userAPage.getByText("[E2E] Alpha Feature")
      ).toBeVisible({ timeout: 15_000 });

      // Search for "Alpha"
      const searchInput = userAPage.getByPlaceholder("Search discussions...");
      await searchInput.fill("Alpha");

      await expect(
        userAPage.getByText("[E2E] Alpha Feature")
      ).toBeVisible();
      await expect(
        userAPage.getByText("[E2E] Beta Feature")
      ).not.toBeVisible();

      // Clear search
      await searchInput.clear();
      await expect(
        userAPage.getByText("[E2E] Beta Feature")
      ).toBeVisible();
    });

    test("pinned discussions appear at the top", async ({ userAPage }) => {
      await createTestDiscussion(ideaId, userAId, {
        title: "[E2E] Regular Discussion",
        body: "[E2E] Not pinned.",
      });
      await createTestDiscussion(ideaId, userAId, {
        title: "[E2E] Pinned Discussion",
        body: "[E2E] This one is pinned.",
        pinned: true,
      });

      await userAPage.goto(`/ideas/${ideaId}/discussions`);

      // Wait for both to appear
      await expect(
        userAPage.getByText("[E2E] Pinned Discussion")
      ).toBeVisible({ timeout: 15_000 });
      await expect(
        userAPage.getByText("[E2E] Regular Discussion")
      ).toBeVisible();

      // The pinned badge should be visible
      await expect(
        userAPage.locator('[data-slot="badge"]').filter({ hasText: "Pinned" }).first()
      ).toBeVisible();

      // Pinned should come first in the list
      const items = userAPage.locator("a[href*='/discussions/']");
      const firstItemText = await items.first().textContent();
      expect(firstItemText).toContain("[E2E] Pinned Discussion");
    });

    test("clicking a discussion navigates to thread detail", async ({ userAPage }) => {
      const discussion = await createTestDiscussion(ideaId, userAId, {
        title: "[E2E] Clickable Discussion",
        body: "[E2E] Click me to see detail.",
      });

      await userAPage.goto(`/ideas/${ideaId}/discussions`);

      const link = userAPage.getByText("[E2E] Clickable Discussion");
      await expect(link).toBeVisible({ timeout: 15_000 });
      await link.click();

      await userAPage.waitForURL(
        `**/ideas/${ideaId}/discussions/${discussion.id}`,
        { timeout: 15_000 }
      );
      await expect(
        userAPage.getByRole("heading", { name: "[E2E] Clickable Discussion" })
      ).toBeVisible({ timeout: 10_000 });
    });
  });

  test.describe("Discussion thread actions", () => {
    test("author resolves and reopens a discussion", async ({ userAPage }) => {
      const discussion = await createTestDiscussion(ideaId, userAId, {
        title: "[E2E] Resolve Me",
        body: "[E2E] Body for resolve test.",
      });

      await userAPage.goto(`/ideas/${ideaId}/discussions/${discussion.id}`);

      // Initially open — resolve button should be visible
      const resolveButton = userAPage.getByRole("button", { name: "Resolve" });
      await expect(resolveButton).toBeVisible({ timeout: 15_000 });
      await resolveButton.click();

      // Wait for the "Resolved" badge to appear
      await expect(
        userAPage.locator('[data-slot="badge"]').filter({ hasText: "Resolved" }).first()
      ).toBeVisible({ timeout: 15_000 });

      // Success toast
      await expect(
        userAPage.locator("[data-sonner-toast]").filter({ hasText: /resolved/i })
      ).toBeVisible({ timeout: 5_000 });

      // Now reopen
      const reopenButton = userAPage.getByRole("button", { name: "Reopen" });
      await expect(reopenButton).toBeVisible({ timeout: 10_000 });
      await reopenButton.click();

      // "Open" badge should reappear
      await expect(
        userAPage.locator('[data-slot="badge"]').filter({ hasText: "Open" }).first()
      ).toBeVisible({ timeout: 15_000 });

      await expect(
        userAPage.locator("[data-sonner-toast]").filter({ hasText: /reopened/i })
      ).toBeVisible({ timeout: 5_000 });
    });

    test("author pins and unpins a discussion", async ({ userAPage }) => {
      const discussion = await createTestDiscussion(ideaId, userAId, {
        title: "[E2E] Pin Me",
        body: "[E2E] Body for pin test.",
      });

      await userAPage.goto(`/ideas/${ideaId}/discussions/${discussion.id}`);

      // Pin button should be visible
      const pinButton = userAPage.getByRole("button", { name: "Pin" });
      await expect(pinButton).toBeVisible({ timeout: 15_000 });
      await pinButton.click();

      // "Pinned" badge should appear
      await expect(
        userAPage.locator('[data-slot="badge"]').filter({ hasText: "Pinned" }).first()
      ).toBeVisible({ timeout: 15_000 });

      // Button text should change to "Unpin"
      const unpinButton = userAPage.getByRole("button", { name: "Unpin" });
      await expect(unpinButton).toBeVisible({ timeout: 10_000 });
      await unpinButton.click();

      // "Pinned" badge should disappear
      await expect(
        userAPage.locator('[data-slot="badge"]').filter({ hasText: "Pinned" })
      ).not.toBeVisible({ timeout: 10_000 });
    });

    test("author deletes a discussion and is redirected to list", async ({ userAPage }) => {
      const discussion = await createTestDiscussion(ideaId, userAId, {
        title: "[E2E] Delete Me",
        body: "[E2E] Body for delete test.",
      });

      await userAPage.goto(`/ideas/${ideaId}/discussions/${discussion.id}`);

      // Accept the confirm dialog
      userAPage.on("dialog", (dialog) => dialog.accept());

      const deleteButton = userAPage.getByRole("button", { name: "Delete" });
      await expect(deleteButton).toBeVisible({ timeout: 15_000 });
      await deleteButton.click();

      // Should redirect to discussions list
      await userAPage.waitForURL(
        `**/ideas/${ideaId}/discussions`,
        { timeout: 15_000 }
      );

      // The deleted discussion should not appear
      await expect(
        userAPage.getByText("[E2E] Delete Me")
      ).not.toBeVisible({ timeout: 5_000 });
    });

    test("collaborator cannot see action buttons on author's discussion", async ({ userBPage }) => {
      const discussion = await createTestDiscussion(ideaId, userAId, {
        title: "[E2E] Author Only Actions",
        body: "[E2E] User B should not see Resolve/Pin/Delete.",
      });

      await userBPage.goto(`/ideas/${ideaId}/discussions/${discussion.id}`);

      // The thread should load with the title
      await expect(
        userBPage.getByRole("heading", { name: "[E2E] Author Only Actions" })
      ).toBeVisible({ timeout: 15_000 });

      // Action buttons should NOT be visible (only author/owner sees them)
      await expect(
        userBPage.getByRole("button", { name: "Resolve" })
      ).not.toBeVisible();
      await expect(
        userBPage.getByRole("button", { name: "Pin" })
      ).not.toBeVisible();
      await expect(
        userBPage.getByRole("button", { name: "Delete" })
      ).not.toBeVisible();
    });

    test("idea owner can manage collaborator's discussion", async ({ userAPage }) => {
      // User B (collaborator) creates a discussion
      const discussion = await createTestDiscussion(ideaId, userBId, {
        title: "[E2E] Collab Discussion For Owner",
        body: "[E2E] Idea owner (User A) should be able to manage this.",
      });

      await userAPage.goto(`/ideas/${ideaId}/discussions/${discussion.id}`);

      // Idea owner should see action buttons even though they're not the discussion author
      await expect(
        userAPage.getByRole("button", { name: "Resolve" })
      ).toBeVisible({ timeout: 15_000 });
      await expect(
        userAPage.getByRole("button", { name: "Pin" })
      ).toBeVisible();
      await expect(
        userAPage.getByRole("button", { name: "Delete" })
      ).toBeVisible();
    });
  });

  test.describe("Replies", () => {
    test("team member posts a reply that appears in the thread", async ({ userAPage }) => {
      const discussion = await createTestDiscussion(ideaId, userAId, {
        title: "[E2E] Reply Test Discussion",
        body: "[E2E] Post a reply here.",
      });

      await userAPage.goto(`/ideas/${ideaId}/discussions/${discussion.id}`);

      // Reply form should be visible
      const replyTextarea = userAPage.getByPlaceholder(/write a reply/i);
      await expect(replyTextarea).toBeVisible({ timeout: 15_000 });

      // Type a reply
      await replyTextarea.fill("[E2E] This is a test reply from User A");

      // Submit
      const replyButton = userAPage.getByRole("button", { name: "Reply", exact: true });
      await expect(replyButton).toBeEnabled();
      await replyButton.click();

      // Success toast
      await expect(
        userAPage.locator("[data-sonner-toast]").filter({ hasText: /reply posted/i })
      ).toBeVisible({ timeout: 10_000 });

      // The reply should appear in the thread (after refresh)
      await expect(
        userAPage.getByText("[E2E] This is a test reply from User A")
      ).toBeVisible({ timeout: 15_000 });
    });

    test("collaborator posts a reply", async ({ userBPage }) => {
      const discussion = await createTestDiscussion(ideaId, userAId, {
        title: "[E2E] Collab Reply Test",
        body: "[E2E] Collaborator should be able to reply.",
      });

      await userBPage.goto(`/ideas/${ideaId}/discussions/${discussion.id}`);

      const replyTextarea = userBPage.getByPlaceholder(/write a reply/i);
      await expect(replyTextarea).toBeVisible({ timeout: 15_000 });

      await replyTextarea.fill("[E2E] Reply from collaborator");

      const replyButton = userBPage.getByRole("button", { name: "Reply", exact: true });
      await expect(replyButton).toBeEnabled();
      await replyButton.click();

      await expect(
        userBPage.getByText("[E2E] Reply from collaborator")
      ).toBeVisible({ timeout: 15_000 });

      // Author name should be visible
      await expect(
        userBPage.getByText("Test User B").first()
      ).toBeVisible();
    });

    test("reply count updates after posting", async ({ userAPage }) => {
      const discussion = await createTestDiscussion(ideaId, userAId, {
        title: "[E2E] Reply Count Test",
        body: "[E2E] Check reply count updates.",
      });

      await userAPage.goto(`/ideas/${ideaId}/discussions/${discussion.id}`);

      // Initially 0 replies
      await expect(
        userAPage.getByText("0 replies")
      ).toBeVisible({ timeout: 15_000 });

      // Post a reply
      const replyTextarea = userAPage.getByPlaceholder(/write a reply/i);
      await replyTextarea.fill("[E2E] A reply to count");
      const replyButton = userAPage.getByRole("button", { name: "Reply", exact: true });
      await expect(replyButton).toBeEnabled();
      await replyButton.click();

      // Reply count should update to "1 reply" (singular)
      await expect(
        userAPage.getByText("1 reply")
      ).toBeVisible({ timeout: 15_000 });
    });

    test("author can delete a reply", async ({ userAPage }) => {
      const discussion = await createTestDiscussion(ideaId, userAId, {
        title: "[E2E] Delete Reply Test",
        body: "[E2E] Test reply deletion.",
      });
      await createTestDiscussionReply(discussion.id, userBId, {
        content: "[E2E] Reply to be deleted",
      });

      await userAPage.goto(`/ideas/${ideaId}/discussions/${discussion.id}`);

      // The reply should be visible
      await expect(
        userAPage.getByText("[E2E] Reply to be deleted")
      ).toBeVisible({ timeout: 15_000 });

      // Accept the confirm dialog
      userAPage.on("dialog", (dialog) => dialog.accept());

      // Click the delete button on the reply (Trash2 icon with title "Delete reply")
      const deleteButton = userAPage.locator('button[title="Delete reply"]');
      await expect(deleteButton).toBeVisible({ timeout: 5_000 });
      await deleteButton.click();

      // Reply should be removed after refresh
      await expect(
        userAPage.getByText("[E2E] Reply to be deleted")
      ).not.toBeVisible({ timeout: 15_000 });
    });
  });

  test.describe("Editing discussions", () => {
    test("author edits discussion title and body", async ({ userAPage }) => {
      const discussion = await createTestDiscussion(ideaId, userAId, {
        title: "[E2E] Edit Me Discussion",
        body: "[E2E] Original body content.",
      });

      await userAPage.goto(`/ideas/${ideaId}/discussions/${discussion.id}`);

      // Click Edit button on the original post
      const editButton = userAPage.locator("button").filter({ hasText: "Edit" });
      await expect(editButton).toBeVisible({ timeout: 15_000 });
      await editButton.click();

      // Title input should appear with current value
      const titleInput = userAPage.locator("input").filter({ hasText: "" }).first();
      await expect(titleInput).toBeVisible({ timeout: 5_000 });
      await expect(titleInput).toHaveValue("[E2E] Edit Me Discussion");

      // Clear and type new title
      await titleInput.clear();
      await titleInput.fill("[E2E] Edited Discussion Title");

      // Body textarea should appear with current value
      const bodyTextarea = userAPage.locator("textarea");
      await expect(bodyTextarea).toBeVisible();
      await bodyTextarea.clear();
      await bodyTextarea.fill("[E2E] Updated body content after editing.");

      // Save
      await userAPage.getByRole("button", { name: "Save" }).click();

      // Success toast
      await expect(
        userAPage.locator("[data-sonner-toast]").filter({ hasText: /updated/i })
      ).toBeVisible({ timeout: 10_000 });

      // Title should be updated
      await expect(
        userAPage.getByRole("heading", { name: "[E2E] Edited Discussion Title" })
      ).toBeVisible({ timeout: 15_000 });

      // Body should be updated
      await expect(
        userAPage.getByText("Updated body content after editing")
      ).toBeVisible();
    });

    test("cancel edit restores original content", async ({ userAPage }) => {
      const discussion = await createTestDiscussion(ideaId, userAId, {
        title: "[E2E] Cancel Edit Test",
        body: "[E2E] Original body for cancel test.",
      });

      await userAPage.goto(`/ideas/${ideaId}/discussions/${discussion.id}`);

      // Click Edit
      const editButton = userAPage.locator("button").filter({ hasText: "Edit" });
      await expect(editButton).toBeVisible({ timeout: 15_000 });
      await editButton.click();

      // Modify the body
      const bodyTextarea = userAPage.locator("textarea");
      await expect(bodyTextarea).toBeVisible({ timeout: 5_000 });
      await bodyTextarea.clear();
      await bodyTextarea.fill("[E2E] This change should be discarded.");

      // Cancel
      await userAPage.getByRole("button", { name: "Cancel" }).click();

      // Original body should still be visible
      await expect(
        userAPage.getByText("Original body for cancel test")
      ).toBeVisible({ timeout: 10_000 });

      // Modified text should not be visible
      await expect(
        userAPage.getByText("This change should be discarded")
      ).not.toBeVisible();
    });

    test("collaborator cannot edit author's discussion", async ({ userBPage }) => {
      const discussion = await createTestDiscussion(ideaId, userAId, {
        title: "[E2E] No Edit For Collab",
        body: "[E2E] User B should not see Edit button.",
      });

      await userBPage.goto(`/ideas/${ideaId}/discussions/${discussion.id}`);

      await expect(
        userBPage.getByRole("heading", { name: "[E2E] No Edit For Collab" })
      ).toBeVisible({ timeout: 15_000 });

      // Edit button should not be visible for non-author collaborator
      await expect(
        userBPage.locator("button").filter({ hasText: "Edit" })
      ).not.toBeVisible();
    });
  });

  test.describe("Editing replies", () => {
    test("reply author can edit their own reply", async ({ userAPage }) => {
      const discussion = await createTestDiscussion(ideaId, userAId, {
        title: "[E2E] Edit Reply Test",
        body: "[E2E] Discussion for editing replies.",
      });
      await createTestDiscussionReply(discussion.id, userAId, {
        content: "[E2E] Original reply content",
      });

      await userAPage.goto(`/ideas/${ideaId}/discussions/${discussion.id}`);

      // The reply should be visible
      await expect(
        userAPage.getByText("[E2E] Original reply content")
      ).toBeVisible({ timeout: 15_000 });

      // Click the edit button (Pencil icon with title "Edit reply")
      const editReplyButton = userAPage.locator('button[title="Edit reply"]');
      await expect(editReplyButton).toBeVisible({ timeout: 5_000 });
      await editReplyButton.click();

      // Textarea should appear with current content
      const replyTextarea = userAPage.locator("textarea").filter({ hasText: "[E2E] Original reply content" });
      await expect(replyTextarea).toBeVisible({ timeout: 5_000 });

      // Edit the content
      await replyTextarea.clear();
      await replyTextarea.fill("[E2E] Edited reply content");

      // Save
      await userAPage.getByRole("button", { name: "Save" }).click();

      // Success toast
      await expect(
        userAPage.locator("[data-sonner-toast]").filter({ hasText: /reply updated/i })
      ).toBeVisible({ timeout: 10_000 });

      // Updated reply should be visible
      await expect(
        userAPage.getByText("[E2E] Edited reply content")
      ).toBeVisible({ timeout: 15_000 });

      // Original text should no longer be visible
      await expect(
        userAPage.getByText("[E2E] Original reply content")
      ).not.toBeVisible();
    });

    test("non-author cannot edit another user's reply", async ({ userBPage }) => {
      const discussion = await createTestDiscussion(ideaId, userAId, {
        title: "[E2E] Reply Edit Permission",
        body: "[E2E] Testing edit permission on replies.",
      });
      await createTestDiscussionReply(discussion.id, userAId, {
        content: "[E2E] User A's reply",
      });

      await userBPage.goto(`/ideas/${ideaId}/discussions/${discussion.id}`);

      // The reply should be visible
      await expect(
        userBPage.getByText("[E2E] User A's reply")
      ).toBeVisible({ timeout: 15_000 });

      // Edit button should NOT be visible (User B didn't author this reply)
      await expect(
        userBPage.locator('button[title="Edit reply"]')
      ).not.toBeVisible();
    });
  });

  test.describe("Nested replies", () => {
    test("user can post a nested reply to a specific reply", async ({ userAPage }) => {
      const discussion = await createTestDiscussion(ideaId, userAId, {
        title: "[E2E] Nested Reply Test",
        body: "[E2E] Discussion for testing nested replies.",
      });
      await createTestDiscussionReply(discussion.id, userBId, {
        content: "[E2E] Top-level reply from User B",
      });

      await userAPage.goto(`/ideas/${ideaId}/discussions/${discussion.id}`);

      // The top-level reply should be visible
      await expect(
        userAPage.getByText("[E2E] Top-level reply from User B")
      ).toBeVisible({ timeout: 15_000 });

      // Click the inline reply button (Reply icon with title "Reply")
      const replyIcon = userAPage.locator('button[title="Reply"]');
      await expect(replyIcon).toBeVisible({ timeout: 5_000 });
      await replyIcon.click();

      // Inline reply form should appear
      const inlineTextarea = userAPage.getByPlaceholder("Write a reply...");
      await expect(inlineTextarea).toBeVisible({ timeout: 5_000 });

      // Type a nested reply
      await inlineTextarea.fill("[E2E] This is a nested reply to User B");

      // Submit the inline reply
      const inlineReplyButton = userAPage.getByRole("button", { name: "Reply", exact: true }).last();
      await expect(inlineReplyButton).toBeEnabled();
      await inlineReplyButton.click();

      // Success toast
      await expect(
        userAPage.locator("[data-sonner-toast]").filter({ hasText: /reply posted/i })
      ).toBeVisible({ timeout: 10_000 });

      // The nested reply should appear (inside the indented child section)
      await expect(
        userAPage.getByText("[E2E] This is a nested reply to User B")
      ).toBeVisible({ timeout: 15_000 });
    });
  });

  test.describe("Discussion voting", () => {
    test("team member can upvote and remove upvote", async ({ userBPage }) => {
      const discussion = await createTestDiscussion(ideaId, userAId, {
        title: "[E2E] Voting Test Discussion",
        body: "[E2E] Discussion for testing upvotes.",
      });

      await userBPage.goto(`/ideas/${ideaId}/discussions/${discussion.id}`);

      // Wait for the discussion to load
      await expect(
        userBPage.getByRole("heading", { name: "[E2E] Voting Test Discussion" })
      ).toBeVisible({ timeout: 15_000 });

      // Find the vote button (ChevronUp icon + count)
      const voteButton = userBPage.locator("button").filter({ hasText: "0" }).first();
      await expect(voteButton).toBeVisible({ timeout: 5_000 });

      // Click to upvote
      await voteButton.click();

      // Count should update to 1 (optimistic)
      await expect(
        userBPage.locator("button").filter({ hasText: "1" }).first()
      ).toBeVisible({ timeout: 5_000 });

      // Click again to remove upvote
      await userBPage.locator("button").filter({ hasText: "1" }).first().click();

      // Count should go back to 0
      await expect(
        userBPage.locator("button").filter({ hasText: "0" }).first()
      ).toBeVisible({ timeout: 5_000 });
    });
  });

  test.describe("Guest access", () => {
    test("non-team member can view public discussion but cannot reply", async ({ freshPage }) => {
      const discussion = await createTestDiscussion(ideaId, userAId, {
        title: "[E2E] Guest View Discussion",
        body: "[E2E] A guest should see this but not interact.",
      });

      await freshPage.goto(`/ideas/${ideaId}/discussions/${discussion.id}`);

      // The discussion title and body should be visible
      await expect(
        freshPage.getByRole("heading", { name: "[E2E] Guest View Discussion" })
      ).toBeVisible({ timeout: 15_000 });
      await expect(
        freshPage.getByText("A guest should see this but not interact")
      ).toBeVisible();

      // Reply form should NOT be visible (non-team member)
      await expect(
        freshPage.getByPlaceholder(/write a reply/i)
      ).not.toBeVisible();

      // Action buttons (Resolve, Pin, Delete, Edit) should NOT be visible
      await expect(
        freshPage.getByRole("button", { name: "Resolve" })
      ).not.toBeVisible();
      await expect(
        freshPage.getByRole("button", { name: "Pin" })
      ).not.toBeVisible();
      await expect(
        freshPage.getByRole("button", { name: "Delete" })
      ).not.toBeVisible();
    });

    test("non-team member can view discussion list", async ({ freshPage }) => {
      await createTestDiscussion(ideaId, userAId, {
        title: "[E2E] Listed For Guest",
        body: "[E2E] Guests should see this in the list.",
      });

      await freshPage.goto(`/ideas/${ideaId}/discussions`);

      // Discussion should be visible in the list
      await expect(
        freshPage.getByText("[E2E] Listed For Guest")
      ).toBeVisible({ timeout: 15_000 });

      // "New Discussion" button should NOT be visible for non-team members
      await expect(
        freshPage.getByRole("link", { name: /new discussion/i })
      ).not.toBeVisible();
    });
  });

  test.describe("Convert to task", () => {
    let boardColumns: { id: string; title: string }[];

    test.beforeAll(async () => {
      // Ensure board columns exist
      const { data: existingColumns } = await supabaseAdmin
        .from("board_columns")
        .select("id, title")
        .eq("idea_id", ideaId);

      if (!existingColumns || existingColumns.length === 0) {
        const columns = await createTestBoardColumns(ideaId);
        boardColumns = columns.map((c) => ({ id: c.id, title: c.title }));
      } else {
        boardColumns = existingColumns;
      }
    });

    test("converts discussion to a board task", async ({ userAPage }) => {
      const discussion = await createTestDiscussion(ideaId, userAId, {
        title: "[E2E] Convert Me To Task",
        body: "[E2E] This discussion should become a task.",
      });

      await userAPage.goto(`/ideas/${ideaId}/discussions/${discussion.id}`);

      // Click "Convert to Task" button
      const convertButton = userAPage.getByRole("button", { name: /convert to task/i });
      await expect(convertButton).toBeVisible({ timeout: 15_000 });
      await convertButton.click();

      // Dialog should open
      const dialog = userAPage.getByRole("dialog");
      await expect(dialog).toBeVisible({ timeout: 5_000 });
      await expect(
        dialog.getByText("Convert Discussion to Task")
      ).toBeVisible();

      // Title should be pre-filled from discussion
      const taskTitleInput = dialog.getByLabel("Task Title");
      await expect(taskTitleInput).toHaveValue("[E2E] Convert Me To Task");

      // Column should be pre-selected (first column)
      // Click "Create Task" to convert
      await dialog.getByRole("button", { name: "Create Task" }).click();

      // Success toast
      await expect(
        userAPage.locator("[data-sonner-toast]").filter({ hasText: /converted to task/i })
      ).toBeVisible({ timeout: 10_000 });

      // Status should change to "Converted"
      await expect(
        userAPage.locator('[data-slot="badge"]').filter({ hasText: "Converted" }).first()
      ).toBeVisible({ timeout: 15_000 });

      // The converted banner should appear with a link to the board
      await expect(
        userAPage.getByText("This discussion was converted to a board task.")
      ).toBeVisible();

      // Action buttons (Resolve, Pin, Delete) should no longer be visible
      await expect(
        userAPage.getByRole("button", { name: "Resolve" })
      ).not.toBeVisible();

      // Reply form should no longer be visible
      await expect(
        userAPage.getByPlaceholder(/write a reply/i)
      ).not.toBeVisible();
    });
  });
});
