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

test.describe("Feed filters", () => {
  let userAId: string;
  const createdIdeaIds: string[] = [];

  test.beforeAll(async () => {
    userAId = await getUserId("Test User A");

    // Create diverse ideas for filter testing
    const ideas = [
      {
        title: "[E2E] Searchable Unique Alpha",
        description: "[E2E] Alpha description for search testing",
        tags: ["e2e-test", "alpha"],
        status: "open",
      },
      {
        title: "[E2E] Searchable Unique Beta",
        description: "[E2E] Beta description for search testing",
        tags: ["e2e-test", "beta"],
        status: "in_progress",
      },
      {
        title: "[E2E] Filter Gamma Idea",
        description: "[E2E] Gamma description for filter testing",
        tags: ["e2e-test", "gamma"],
        status: "completed",
      },
    ];

    for (const ideaData of ideas) {
      const idea = await createTestIdea(userAId, ideaData);
      createdIdeaIds.push(idea.id);
    }
  });

  test.afterAll(async () => {
    await cleanupTestData();
  });

  test("search by title", async ({ userAPage }) => {
    await userAPage.goto("/feed");
    await expect(userAPage.locator('[data-testid^="idea-card-"]').first()).toBeVisible({ timeout: 15_000 });

    // Type in search input
    const searchInput = userAPage.getByPlaceholder("Search ideas...");
    await expect(searchInput).toBeVisible({ timeout: 15_000 });
    await searchInput.fill("Unique Alpha");

    // Wait for debounced search to trigger URL update
    await userAPage.waitForURL(/q=Unique/, { timeout: 10_000 });

    // Should show the matching idea
    await expect(
      userAPage.getByText("[E2E] Searchable Unique Alpha")
    ).toBeVisible({ timeout: 10_000 });

    // Should NOT show the non-matching idea
    await expect(
      userAPage.getByText("[E2E] Filter Gamma Idea")
    ).not.toBeVisible();

    // "Showing results for" indicator should appear
    await expect(userAPage.getByText(/showing results for/i)).toBeVisible();
  });

  test("filter by status", async ({ userAPage }) => {
    await userAPage.goto("/feed");

    // Wait for cards to load
    await expect(
      userAPage.locator('[data-testid^="idea-card-"]').first()
    ).toBeVisible({ timeout: 15_000 });

    // Open the status dropdown
    // The first SelectTrigger is the status filter (w-[150px])
    const statusTrigger = userAPage
      .getByRole("combobox")
      .first();
    await statusTrigger.click();

    // Select "In Progress"
    await userAPage.getByRole("option", { name: "In Progress" }).click();

    // Wait for URL to update with status parameter
    await userAPage.waitForURL(/status=in_progress/, { timeout: 10_000 });

    // The In Progress idea should be visible
    await expect(
      userAPage.getByText("[E2E] Searchable Unique Beta")
    ).toBeVisible({ timeout: 10_000 });
  });

  test("sort by newest/popular/discussed", async ({ userAPage }) => {
    await userAPage.goto("/feed");

    await expect(
      userAPage.locator('[data-testid^="idea-card-"]').first()
    ).toBeVisible({ timeout: 15_000 });

    // Open the sort dropdown (second combobox)
    const sortTrigger = userAPage
      .getByRole("combobox")
      .nth(1);

    // Select "Most Popular"
    await sortTrigger.click();
    await userAPage.getByRole("option", { name: "Most Popular" }).click();
    await userAPage.waitForURL(/sort=popular/, { timeout: 10_000 });

    // Cards should still be visible (just reordered)
    await expect(
      userAPage.locator('[data-testid^="idea-card-"]').first()
    ).toBeVisible({ timeout: 10_000 });

    // Switch to "Most Discussed"
    await sortTrigger.click();
    await userAPage.getByRole("option", { name: "Most Discussed" }).click();
    await userAPage.waitForURL(/sort=discussed/, { timeout: 10_000 });

    await expect(
      userAPage.locator('[data-testid^="idea-card-"]').first()
    ).toBeVisible({ timeout: 10_000 });

    // Switch back to "Newest"
    await sortTrigger.click();
    await userAPage.getByRole("option", { name: "Newest" }).click();

    // "Newest" is the default so the sort param may be removed
    await expect(
      userAPage.locator('[data-testid^="idea-card-"]').first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test("view tabs: All / My Ideas / Collaborating", async ({ userAPage }) => {
    await userAPage.goto("/feed");

    await expect(
      userAPage.locator('[data-testid^="idea-card-"]').first()
    ).toBeVisible({ timeout: 15_000 });

    // "All Ideas" tab should be active by default (has background shadow)
    const allTab = userAPage.getByRole("button", { name: "All Ideas" });
    const myTab = userAPage.getByRole("button", { name: "My Ideas" });
    const collabTab = userAPage.getByRole("button", {
      name: "Collaborating",
    });

    await expect(allTab).toBeVisible();
    await expect(myTab).toBeVisible();
    await expect(collabTab).toBeVisible();

    // Click "My Ideas"
    await myTab.click();
    await userAPage.waitForURL(/view=mine/, { timeout: 10_000 });

    // Should show user A's E2E ideas
    await expect(
      userAPage.getByText("[E2E] Searchable Unique Alpha")
    ).toBeVisible({ timeout: 10_000 });

    // Click "Collaborating"
    await collabTab.click();
    await userAPage.waitForURL(/view=collaborating/, { timeout: 10_000 });

    // User may not be collaborating on anything, so either cards or empty state
    // Just wait for the page to finish loading by checking the tab is still visible
    await expect(collabTab).toBeVisible();

    // Click back to "All Ideas"
    await allTab.click();

    // URL should no longer have view param (or view=all which is default)
    await expect(
      userAPage.locator('[data-testid^="idea-card-"]').first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test("clear filters resets results", async ({ userAPage }) => {
    // Start with a search filter applied
    await userAPage.goto("/feed?q=Unique+Alpha");

    // "Showing results for" indicator should be visible
    await expect(
      userAPage.getByText(/showing results for/i)
    ).toBeVisible({ timeout: 15_000 });

    // The search badge should show the search term
    const searchBadge = userAPage.getByText('"Unique Alpha"');
    await expect(searchBadge).toBeVisible();

    // Click the X button on the search badge to clear
    const clearButton = searchBadge.locator("..").locator("button");
    await clearButton.click();

    // URL should no longer have the q param
    await userAPage.waitForURL((url) => !url.searchParams.has("q"), {
      timeout: 10_000,
    });

    // "Showing results for" should disappear
    await expect(
      userAPage.getByText(/showing results for/i)
    ).not.toBeVisible();

    // All ideas should be visible again
    await expect(
      userAPage.locator('[data-testid^="idea-card-"]').first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test("empty state message when no results match", async ({ userAPage }) => {
    await userAPage.goto("/feed");

    // Wait for feed to load
    const searchInput = userAPage.getByPlaceholder("Search ideas...");
    await expect(searchInput).toBeVisible({ timeout: 15_000 });
    await searchInput.fill("zzz_nonexistent_xyz_12345");

    // Wait for debounced search
    await userAPage.waitForURL(/q=zzz_nonexistent/, { timeout: 10_000 });

    // Empty state message should appear
    await expect(
      userAPage.getByText(/no ideas match your filters/i)
    ).toBeVisible({ timeout: 10_000 });

    // No idea cards should be shown
    await expect(
      userAPage.locator('[data-testid^="idea-card-"]')
    ).toHaveCount(0);
  });
});
