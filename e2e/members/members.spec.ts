import { test, expect } from "../fixtures/auth";
import { createTestIdea, addCollaborator, cleanupTestData } from "../fixtures/test-data";
import { supabaseAdmin } from "../fixtures/supabase-admin";

let userAId: string;
let userBId: string;
let adminId: string;

test.beforeAll(async () => {
  const { data: users } = await supabaseAdmin
    .from("users")
    .select("id, full_name, is_admin")
    .in("full_name", ["Test User A", "Test User B", "Test Admin"]);

  const userA = users?.find((u) => u.full_name === "Test User A");
  const userB = users?.find((u) => u.full_name === "Test User B");
  const admin = users?.find((u) => u.full_name === "Test Admin");
  if (!userA || !userB || !admin)
    throw new Error("Test users not found — run global setup first");

  userAId = userA.id;
  userBId = userB.id;
  adminId = admin.id;

  // Create some ideas so idea counts are nonzero for sort tests
  await createTestIdea(userAId, {
    title: "[E2E] Members Idea A1",
    description: "[E2E] Idea for member sorting tests",
    tags: ["e2e-test"],
  });
  await createTestIdea(userAId, {
    title: "[E2E] Members Idea A2",
    description: "[E2E] Second idea for member sorting tests",
    tags: ["e2e-test"],
  });
});

test.afterAll(async () => {
  await cleanupTestData();
});

test.describe("Members page", () => {
  test("displays member cards with name and avatar", async ({ userAPage }) => {
    await userAPage.goto("/members");

    // Heading should be visible
    await expect(userAPage.getByRole("heading", { name: "Members" })).toBeVisible({ timeout: 15_000 });

    // At least one member card with a name should be visible (our test users exist)
    await expect(userAPage.getByText("Test User A")).toBeVisible({ timeout: 15_000 });

    // Avatar should render (either an image or fallback initials)
    const memberCards = userAPage.locator(".grid a[href^='/profile/']");
    await expect(memberCards.first()).toBeVisible();
  });

  test("search by name filters results", async ({ userAPage }) => {
    await userAPage.goto("/members");
    await expect(userAPage.getByRole("heading", { name: "Members" })).toBeVisible({ timeout: 15_000 });

    // Type in the search input — try label first, fall back to placeholder
    const searchInput = userAPage.getByPlaceholder(/search/i).or(userAPage.getByLabel("Search members")).first();
    await expect(searchInput).toBeVisible({ timeout: 15_000 });
    await searchInput.fill("Test User A");

    // Submit the search — press Enter to trigger form submission
    await searchInput.press("Enter");

    // Wait for URL to update with search param (router.push is async)
    await userAPage.waitForURL(/q=/, { timeout: 15_000 });

    // Test User A should be visible (use .first() — search pill text also contains "Test User A")
    await expect(userAPage.getByText("Test User A").first()).toBeVisible();

    // Active search pill should show
    await expect(userAPage.getByText(/showing results for/i)).toBeVisible();
  });

  test("sort by newest", async ({ userAPage }) => {
    await userAPage.goto("/members");
    await expect(userAPage.getByRole("heading", { name: "Members" })).toBeVisible({ timeout: 15_000 });

    // The sort dropdown should be visible with default "Newest"
    const sortTrigger = userAPage.getByLabel("Sort members");
    await expect(sortTrigger).toBeVisible({ timeout: 15_000 });
    await expect(sortTrigger).toHaveText(/Newest/);
  });

  test("sort by most ideas", async ({ userAPage }) => {
    await userAPage.goto("/members");
    await expect(userAPage.getByRole("heading", { name: "Members" })).toBeVisible({ timeout: 15_000 });

    // Open the sort dropdown
    const sortTrigger = userAPage.getByLabel("Sort members");
    await sortTrigger.click();

    // Select "Most Ideas"
    await userAPage.getByRole("option", { name: "Most Ideas" }).click();

    // URL should update with sort param
    await userAPage.waitForURL(/sort=most_ideas/, { timeout: 10_000 });

    // Member cards should still be visible (page re-renders with new sort)
    await expect(
      userAPage.locator(".grid a[href^='/profile/']").first()
    ).toBeVisible({ timeout: 15_000 });
  });

  test("sort by most collaborations", async ({ userAPage }) => {
    await userAPage.goto("/members");
    await expect(userAPage.getByRole("heading", { name: "Members" })).toBeVisible({ timeout: 15_000 });

    // Open the sort dropdown
    const sortTrigger = userAPage.getByLabel("Sort members");
    await sortTrigger.click();

    // Select "Most Collaborations"
    await userAPage.getByRole("option", { name: "Most Collaborations" }).click();

    // URL should update with sort param
    await userAPage.waitForURL(/sort=most_collabs/, { timeout: 10_000 });

    // Member cards should still be visible
    await expect(
      userAPage.locator(".grid a[href^='/profile/']").first()
    ).toBeVisible({ timeout: 15_000 });
  });

  test("paginate when 12+ members exist", async ({ userAPage }) => {
    // The members page shows 12 per page. With only 4 test users, pagination
    // will not appear. We verify pagination controls are absent when few members exist.
    await userAPage.goto("/members");
    await expect(userAPage.getByRole("heading", { name: "Members" })).toBeVisible({ timeout: 15_000 });

    // With fewer than 12 members, pagination should not be visible
    const memberCards = userAPage.locator(".grid a[href^='/profile/']");
    await expect(memberCards.first()).toBeVisible({ timeout: 15_000 });
    const count = await memberCards.count();

    if (count >= 12) {
      // If the environment has 12+ members, pagination should appear
      await expect(
        userAPage.getByRole("button", { name: /next/i })
      ).toBeVisible();
      await expect(userAPage.getByText(/page 1 of/i)).toBeVisible();
    } else {
      // Fewer than 12 — no pagination buttons
      await expect(
        userAPage.getByRole("button", { name: /next/i })
      ).not.toBeVisible();
    }
  });

  test("navigate to profile on member card click", async ({ userAPage }) => {
    await userAPage.goto("/members");
    await expect(userAPage.getByRole("heading", { name: "Members" })).toBeVisible({ timeout: 15_000 });

    // Find the card link for Test User A
    const cardLink = userAPage
      .locator(`a[href^="/profile/${userAId}"]`)
      .first();
    await expect(cardLink).toBeVisible({ timeout: 15_000 });

    // Click the card
    await cardLink.click();

    // Should navigate to the profile page
    await userAPage.waitForURL(`**/profile/${userAId}`, { timeout: 15_000 });
    expect(userAPage.url()).toContain(`/profile/${userAId}`);
  });

  test("bot users are excluded from member listing", async ({ userAPage }) => {
    await userAPage.goto("/members");
    await expect(userAPage.getByRole("heading", { name: "Members" })).toBeVisible({ timeout: 15_000 });

    // The bot user email (bot@vibecodes.local) should NOT appear in the listing
    // Even the bot's name should not appear as a member card
    // We check that no link goes to the bot user profile
    const botUserId = "a0000000-0000-4000-a000-000000000001";
    const botLink = userAPage.locator(`a[href="/profile/${botUserId}"]`);
    await expect(botLink).toHaveCount(0);
  });

  test("admin can see delete button on non-admin user card", async ({
    adminPage,
  }) => {
    await adminPage.goto("/members");

    // Admin should see member cards
    await expect(adminPage.getByText("Test User A")).toBeVisible({ timeout: 15_000 });

    // Admin should see a "Delete User" button on non-admin user cards
    const deleteButtons = adminPage.getByRole("button", { name: /delete user/i });
    await expect(deleteButtons.first()).toBeVisible();
  });
});
