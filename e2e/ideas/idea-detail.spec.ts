import { test, expect } from "../fixtures/auth";
import {
  createTestIdea,
  createTestBoardWithTasks,
  cleanupTestData,
} from "../fixtures/test-data";
import { supabaseAdmin } from "../fixtures/supabase-admin";

let userAId: string;
let userBId: string;
let testIdeaId: string;
let ideaWithBoardId: string;
let markdownIdeaId: string;

test.beforeAll(async () => {
  // Look up test user IDs from the database
  const { data: users } = await supabaseAdmin
    .from("users")
    .select("id, full_name")
    .in("full_name", ["Test User A", "Test User B"]);

  const userA = users?.find((u) => u.full_name === "Test User A");
  const userB = users?.find((u) => u.full_name === "Test User B");
  if (!userA || !userB) throw new Error("Test users not found — run global setup first");

  userAId = userA.id;
  userBId = userB.id;

  // Create a standard test idea owned by User A
  const idea = await createTestIdea(userAId, {
    title: "[E2E] Detail Page Idea",
    description: "[E2E] A test idea for detail page tests",
    tags: ["testing", "playwright"],
    visibility: "public",
    status: "open",
  });
  testIdeaId = idea.id;

  // Create an idea with board tasks for board link test
  const boardIdea = await createTestIdea(userAId, {
    title: "[E2E] Idea With Board",
    description: "[E2E] Idea that has board tasks for the board link test",
  });
  ideaWithBoardId = boardIdea.id;
  await createTestBoardWithTasks(boardIdea.id, 2);

  // Create an idea with markdown content
  const mdIdea = await createTestIdea(userAId, {
    title: "[E2E] Markdown Idea",
    description:
      "[E2E] This idea has **bold text** and a [link](https://example.com) for testing markdown rendering.",
  });
  markdownIdeaId = mdIdea.id;
});

test.afterAll(async () => {
  await cleanupTestData();
});

test.describe("Idea Detail Page", () => {
  test.describe("Content rendering", () => {
    test("should render the full idea detail page with title, description, author, tags, and status", async ({
      userAPage,
    }) => {
      await userAPage.goto(`/ideas/${testIdeaId}`);

      // Title — author sees an <input> with the title as its value
      await expect(
        userAPage.locator("input[value='[E2E] Detail Page Idea']")
      ).toBeVisible({ timeout: 15_000 });

      // Author name
      await expect(userAPage.getByText("Test User A")).toBeVisible();

      // Tags
      await expect(userAPage.getByText("testing")).toBeVisible();
      await expect(userAPage.getByText("playwright")).toBeVisible();

      // Status badge — author sees StatusSelect, so look for the select trigger
      await expect(
        userAPage.locator("button").filter({ hasText: "Open" })
      ).toBeVisible();

      // Description
      await expect(
        userAPage.getByText("A test idea for detail page tests")
      ).toBeVisible();
    });

    test("should show vote button and collaborator button for non-author", async ({
      userBPage,
    }) => {
      await userBPage.goto(`/ideas/${testIdeaId}`);

      // Vote button
      await expect(
        userBPage.locator('[data-testid="vote-button"]')
      ).toBeVisible();

      // Collaborator button — non-author sees "I want to build this"
      await expect(
        userBPage.getByRole("button", { name: /i want to build this/i })
      ).toBeVisible();
    });

    test("should render markdown in the description (bold, links)", async ({
      userBPage,
    }) => {
      await userBPage.goto(`/ideas/${markdownIdeaId}`);

      // Bold text should be rendered as <strong>
      const boldElement = userBPage.locator("strong").filter({ hasText: "bold text" });
      await expect(boldElement).toBeVisible();

      // Link should be rendered as an anchor
      const linkElement = userBPage.locator('a[href="https://example.com"]');
      await expect(linkElement).toBeVisible();
    });
  });

  test.describe("Author vs non-author controls", () => {
    test("non-author should NOT see edit or delete buttons", async ({
      userBPage,
    }) => {
      await userBPage.goto(`/ideas/${testIdeaId}`);

      // No Edit button
      await expect(
        userBPage.getByRole("link", { name: /edit/i })
      ).not.toBeVisible();

      // No Delete button (neither inline nor in dropdown)
      await expect(
        userBPage.getByRole("button", { name: /delete/i })
      ).not.toBeVisible();
    });

    test("author should see status select, edit link, and delete button", async ({
      userAPage,
    }) => {
      await userAPage.goto(`/ideas/${testIdeaId}`);

      // Status select (author sees a <select> instead of a badge)
      const statusTrigger = userAPage
        .locator("button")
        .filter({ hasText: "Open" })
        .first();
      await expect(statusTrigger).toBeVisible();

      // Edit button (desktop, hidden on mobile via sm:inline-flex)
      const editLink = userAPage
        .getByRole("link", { name: /edit/i })
        .first();
      // Might be hidden on mobile viewport — check it exists in DOM
      await expect(editLink).toHaveCount(1);

      // Delete button (desktop, hidden on mobile via sm:inline-flex)
      const deleteButton = userAPage
        .getByRole("button", { name: /delete/i })
        .first();
      await expect(deleteButton).toHaveCount(1);
    });

    test("author should NOT see the collaborator join button", async ({
      userAPage,
    }) => {
      await userAPage.goto(`/ideas/${testIdeaId}`);

      // Author should not see "I want to build this" since they own the idea
      await expect(
        userAPage.getByRole("button", { name: /i want to build this/i })
      ).not.toBeVisible();
    });
  });

  test.describe("Board link", () => {
    test("should show Board button for idea author/collaborator", async ({
      userAPage,
    }) => {
      await userAPage.goto(`/ideas/${ideaWithBoardId}`);

      // Scope to main content to avoid matching navbar links
      const boardButton = userAPage.locator("main").getByRole("link", { name: /board/i });
      await expect(boardButton).toBeVisible();

      // Clicking should navigate to the board page
      await boardButton.click();
      await userAPage.waitForURL(`**/ideas/${ideaWithBoardId}/board`, {
        timeout: 15_000,
      });
      expect(userAPage.url()).toContain(`/ideas/${ideaWithBoardId}/board`);
    });
  });
});
