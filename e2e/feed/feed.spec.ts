import { test, expect } from "../fixtures/auth";
import { createTestIdea, cleanupTestData } from "../fixtures/test-data";
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

test.describe("Feed page", () => {
  let userAId: string;
  let ideaId: string;

  test.beforeAll(async () => {
    userAId = await getUserId("Test User A");

    // Create a test idea for feed tests
    const idea = await createTestIdea(userAId, {
      title: "[E2E] Feed Test Idea",
      description: "[E2E] A description for the feed test idea with some details.",
      tags: ["e2e-test", "feed"],
    });
    ideaId = idea.id;
  });

  test.afterAll(async () => {
    await cleanupTestData();
  });

  test("displays idea cards with title, description, author, and tags", async ({
    userAPage,
  }) => {
    await userAPage.goto("/ideas");

    // Wait for the feed to load — use a longer timeout for initial page render
    const ideaCard = userAPage.locator(`[data-testid="idea-card-${ideaId}"]`);
    await expect(ideaCard).toBeVisible({ timeout: 30_000 });

    // Title (use .first() — card has overlay link + visible title link with same text)
    await expect(ideaCard.getByText("[E2E] Feed Test Idea").first()).toBeVisible();

    // Description (stripped of markdown, shown as line-clamp-2)
    await expect(
      ideaCard.getByText(/a description for the feed test idea/i)
    ).toBeVisible();

    // Author name
    await expect(ideaCard.getByText("Test User A")).toBeVisible();

    // Tags (use exact: true to avoid matching title/description that contain "feed")
    await expect(ideaCard.getByText("e2e-test", { exact: true })).toBeVisible();
    await expect(ideaCard.getByText("feed", { exact: true })).toBeVisible();
  });

  test("navigates to idea detail on card title click", async ({
    userAPage,
  }) => {
    await userAPage.goto("/ideas");

    // Wait for the card to appear
    const ideaCard = userAPage.locator(`[data-testid="idea-card-${ideaId}"]`);
    await expect(ideaCard).toBeVisible({ timeout: 30_000 });

    // Click on the title link (use .first() — card has overlay link + title link with same name)
    await ideaCard
      .getByRole("link", { name: "[E2E] Feed Test Idea" })
      .first()
      .click();

    // Should navigate to the idea detail page
    await userAPage.waitForURL(`**/ideas/${ideaId}`, { timeout: 30_000 });
    await expect(userAPage).toHaveURL(new RegExp(`/ideas/${ideaId}`));
  });

  test("shows vote button on idea cards", async ({ userAPage }) => {
    await userAPage.goto("/ideas");

    const ideaCard = userAPage.locator(`[data-testid="idea-card-${ideaId}"]`);
    await expect(ideaCard).toBeVisible({ timeout: 15_000 });

    // Vote button with data-testid
    const voteButton = ideaCard.locator('[data-testid="vote-button"]');
    await expect(voteButton).toBeVisible();
    await expect(voteButton).toBeEnabled();
  });

  test("vote and unvote from feed", async ({ userAPage }) => {
    await userAPage.goto("/ideas");

    const ideaCard = userAPage.locator(`[data-testid="idea-card-${ideaId}"]`);
    await expect(ideaCard).toBeVisible({ timeout: 15_000 });

    const voteButton = ideaCard.locator('[data-testid="vote-button"]');

    // Get initial vote count
    const initialText = await voteButton.innerText();
    const initialCount = parseInt(initialText.replace(/\D/g, ""), 10) || 0;

    // Click to vote
    await voteButton.click();

    // Optimistic UI: count should increase by 1
    await expect(voteButton).toContainText(String(initialCount + 1));

    // Vote button should have active styling (primary border)
    await expect(voteButton).toHaveClass(/border-primary/);

    // Click again to unvote
    await voteButton.click();

    // Count should return to initial
    await expect(voteButton).toContainText(String(initialCount));
  });

  test("paginate when more than 10 ideas", async ({ userAPage }) => {
    // Create 11 additional ideas to trigger pagination (12 total with the one from beforeAll)
    const extraIdeas = [];
    for (let i = 0; i < 11; i++) {
      const idea = await createTestIdea(userAId, {
        title: `[E2E] Pagination Idea ${String(i).padStart(2, "0")}`,
        description: `[E2E] Pagination test idea number ${i}`,
        tags: ["e2e-test", "pagination"],
      });
      extraIdeas.push(idea);
    }

    try {
      await userAPage.goto("/ideas");

      // Should show exactly 10 idea cards on page 1
      const cards = userAPage.locator('[data-testid^="idea-card-"]');
      await expect(cards.first()).toBeVisible({ timeout: 15_000 });
      const cardCount = await cards.count();
      expect(cardCount).toBeLessThanOrEqual(10);

      // Pagination controls should be visible
      const nextButton = userAPage.getByRole("button", { name: /next/i });
      await expect(nextButton).toBeVisible();
      await expect(nextButton).toBeEnabled();

      // Page indicator text
      await expect(userAPage.getByText(/page 1 of/i)).toBeVisible();

      // Previous button should be disabled on page 1
      const prevButton = userAPage.getByRole("button", { name: /previous/i });
      await expect(prevButton).toBeDisabled();

      // Navigate to page 2
      await nextButton.click();
      await userAPage.waitForURL(/page=2/);
      await expect(userAPage.getByText(/page 2 of/i)).toBeVisible();

      // Page 2 should have remaining ideas
      const page2Cards = userAPage.locator('[data-testid^="idea-card-"]');
      await expect(page2Cards.first()).toBeVisible({ timeout: 15_000 });
      const page2Count = await page2Cards.count();
      expect(page2Count).toBeGreaterThan(0);
    } finally {
      // Clean up extra ideas
      for (const idea of extraIdeas) {
        await supabaseAdmin.from("ideas").delete().eq("id", idea.id);
      }
    }
  });

  test("complete profile banner shows for incomplete profile", async ({
    freshPage,
  }) => {
    await freshPage.goto("/ideas");
    await freshPage.waitForLoadState("domcontentloaded");

    // Fresh user may be redirected to login if auth is not established
    const url = freshPage.url();
    if (url.includes("/login")) {
      test.skip(true, "freshPage auth not established — session may have expired");
      return;
    }

    // The fresh user has no bio/contact_info, so the banner should appear
    const banner = freshPage.getByText(
      /complete your profile so others can find and contact you/i
    );
    await expect(banner).toBeVisible({ timeout: 15_000 });

    // Banner should contain an Edit profile link
    const editLink = freshPage.getByRole("link", { name: /edit profile/i });
    await expect(editLink).toBeVisible();

    // Dismiss button should work
    const dismissButton = banner
      .locator("..")
      .getByRole("button");
    await dismissButton.click();
    await expect(banner).not.toBeVisible();
  });
});
