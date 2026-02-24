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

test.describe("Voting on idea detail page", () => {
  let userAId: string;
  let ideaId: string;

  test.beforeAll(async () => {
    userAId = await getUserId("Test User A");

    const idea = await createTestIdea(userAId, {
      title: "[E2E] Voting Test Idea",
      description: "[E2E] An idea to test voting interactions on the detail page.",
      tags: ["e2e-test", "voting"],
    });
    ideaId = idea.id;
  });

  test.afterAll(async () => {
    await cleanupTestData();
  });

  test("click vote button increments count and applies active styling", async ({
    userAPage,
  }) => {
    await userAPage.goto(`/ideas/${ideaId}`);

    const voteButton = userAPage.locator('[data-testid="vote-button"]');
    await expect(voteButton).toBeVisible({ timeout: 15_000 });
    // Wait for the button to be enabled (disabled during useTransition)
    await expect(voteButton).toBeEnabled({ timeout: 15_000 });

    // Get the initial vote count
    const initialText = await voteButton.innerText();
    const initialCount = parseInt(initialText.replace(/\D/g, ""), 10) || 0;

    // Click to upvote
    await voteButton.click();

    // Optimistic UI: count should increment by 1
    await expect(voteButton).toContainText(String(initialCount + 1));

    // Button should gain active styling (primary border class from the cn() call)
    await expect(voteButton).toHaveClass(/border-primary/);
  });

  test("click vote button again removes vote and decrements count", async ({
    userAPage,
  }) => {
    await userAPage.goto(`/ideas/${ideaId}`);

    const voteButton = userAPage.locator('[data-testid="vote-button"]');
    await expect(voteButton).toBeVisible({ timeout: 15_000 });
    await expect(voteButton).toBeEnabled({ timeout: 15_000 });

    // Ensure we start from a known state: vote first if not already voted
    const hasActiveClass = await voteButton.evaluate((el) =>
      el.className.includes("border-primary")
    );

    if (!hasActiveClass) {
      await voteButton.click();
      await expect(voteButton).toHaveClass(/border-primary/);
      // Wait for transition to complete
      await expect(voteButton).toBeEnabled({ timeout: 15_000 });
    }

    // Get the count while voted
    const votedText = await voteButton.innerText();
    const votedCount = parseInt(votedText.replace(/\D/g, ""), 10) || 0;

    // Click again to remove vote
    await voteButton.click();

    // Count should decrement
    await expect(voteButton).toContainText(String(votedCount - 1));

    // Active styling should be removed
    await expect(voteButton).not.toHaveClass(/border-primary/);
  });

  test("vote persists after page reload", async ({ userAPage }) => {
    await userAPage.goto(`/ideas/${ideaId}`);

    const voteButton = userAPage.locator('[data-testid="vote-button"]');
    await expect(voteButton).toBeVisible({ timeout: 15_000 });
    await expect(voteButton).toBeEnabled({ timeout: 15_000 });

    // Ensure we start un-voted
    const hasActiveClass = await voteButton.evaluate((el) =>
      el.className.includes("border-primary")
    );
    if (hasActiveClass) {
      await voteButton.click();
      await expect(voteButton).not.toHaveClass(/border-primary/);
      await expect(voteButton).toBeEnabled({ timeout: 15_000 });
    }

    // Get initial count
    const initialText = await voteButton.innerText();
    const initialCount = parseInt(initialText.replace(/\D/g, ""), 10) || 0;

    // Vote and wait for server action to complete
    const actionPromise = userAPage.waitForResponse(
      (resp) => resp.url().includes("ideas") && resp.request().method() === "POST",
      { timeout: 15_000 }
    );
    await voteButton.click();
    await actionPromise;
    await expect(voteButton).toContainText(String(initialCount + 1));
    await expect(voteButton).toHaveClass(/border-primary/);

    // Navigate away to dashboard
    await userAPage.goto("/dashboard");
    await userAPage.waitForURL("**/dashboard", { timeout: 15_000 });

    // Navigate back to the idea
    await userAPage.goto(`/ideas/${ideaId}`);

    const voteButtonAfterReload = userAPage.locator(
      '[data-testid="vote-button"]'
    );
    await expect(voteButtonAfterReload).toBeVisible({ timeout: 15_000 });

    // Vote should still be active
    await expect(voteButtonAfterReload).toHaveClass(/border-primary/);

    // Count should reflect the vote
    await expect(voteButtonAfterReload).toContainText(
      String(initialCount + 1)
    );

    // Clean up: remove the vote so tests are idempotent
    await expect(voteButtonAfterReload).toBeEnabled({ timeout: 15_000 });
    await voteButtonAfterReload.click();
    await expect(voteButtonAfterReload).not.toHaveClass(/border-primary/);
  });
});
