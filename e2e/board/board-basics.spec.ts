import { test, expect } from "../fixtures/auth";
import {
  createTestIdea,
  createTestBoardWithTasks,
  addCollaborator,
  cleanupTestData,
} from "../fixtures/test-data";
import { supabaseAdmin } from "../fixtures/supabase-admin";

let userAId: string;
let userBId: string;

// Ideas seeded per test scenario
let bareIdeaId: string; // no board columns
let deepLinkIdeaId: string; // has board + tasks for deep-link test
let deepLinkTaskId: string;
let accessIdeaId: string; // for access-control tests

test.beforeAll(async () => {
  // Look up test user IDs
  const { data: users } = await supabaseAdmin
    .from("users")
    .select("id, full_name")
    .in("full_name", ["Test User A", "Test User B"]);

  const userA = users?.find((u) => u.full_name === "Test User A");
  const userB = users?.find((u) => u.full_name === "Test User B");
  if (!userA || !userB) throw new Error("Test users not found -- run global setup first");

  userAId = userA.id;
  userBId = userB.id;

  // 1. Bare idea with NO board columns (for auto-init test)
  const bareIdea = await createTestIdea(userAId, {
    title: "[E2E] Board Auto-Init Idea",
    description: "[E2E] Idea to verify default columns are created on first board visit.",
  });
  bareIdeaId = bareIdea.id;

  // 2. Idea with board + tasks (for deep-link test and header test)
  const deepLinkIdea = await createTestIdea(userAId, {
    title: "[E2E] Board Deep Link Idea",
    description: "[E2E] Idea with tasks for deep-link and header tests.",
  });
  deepLinkIdeaId = deepLinkIdea.id;
  const { tasks } = await createTestBoardWithTasks(deepLinkIdeaId, 3);
  deepLinkTaskId = tasks[0].id;

  // 3. Idea for access-control tests (User A is author, User B starts as non-member)
  const accessIdea = await createTestIdea(userAId, {
    title: "[E2E] Board Access Idea",
    description: "[E2E] Idea to verify board access restrictions.",
  });
  accessIdeaId = accessIdea.id;
  // Pre-create columns so redirect isn't confused with lazy-init
  await createTestBoardWithTasks(accessIdeaId, 1);
});

test.afterAll(async () => {
  await cleanupTestData();
});

test.describe("Board Basics", () => {
  test("first visit auto-initializes default columns (To Do, In Progress, Done)", async ({
    userAPage,
  }) => {
    await userAPage.goto(`/ideas/${bareIdeaId}/board`);

    // Wait for columns to render — auto-init may take longer than pre-existing columns
    // because it triggers a server action to create them
    // Use a regex that matches column-{uuid} but NOT column-drag-handle
    const columnSelector = /^column-[0-9a-f]{8}-/;
    await expect(
      userAPage.locator("[data-testid]").filter({ has: userAPage.locator("h3") }).first()
    ).toBeVisible({ timeout: 30_000 });

    // Should have exactly 3 default columns — count headings with column titles
    const columns = userAPage.locator("h3").filter({ hasText: /To Do|In Progress|Done/ });
    await expect(columns).toHaveCount(3, { timeout: 15_000 });

    // Verify their titles
    await expect(userAPage.getByText("To Do")).toBeVisible({ timeout: 5_000 });
    await expect(userAPage.getByText("In Progress")).toBeVisible({ timeout: 5_000 });
    await expect(userAPage.getByText("Done")).toBeVisible({ timeout: 5_000 });
  });

  test("non-member sees read-only guest view on the board", async ({
    userBPage,
  }) => {
    // User B is not author or collaborator on this idea
    await userBPage.goto(`/ideas/${accessIdeaId}/board`);

    // App shows a read-only guest view instead of redirecting
    // The guest banner should be visible
    await expect(
      userBPage.getByText(/viewing this board as a guest/i)
    ).toBeVisible({ timeout: 15_000 });

    // The "Request to Collaborate" link should be visible
    await expect(
      userBPage.getByRole("link", { name: /request to collaborate/i })
    ).toBeVisible();
  });

  test("collaborator can access the board", async ({ userBPage }) => {
    // Add User B as collaborator
    await addCollaborator(accessIdeaId, userBId);

    // Small delay to allow Supabase to propagate the collaborator record
    await userBPage.waitForTimeout(1000);

    await userBPage.goto(`/ideas/${accessIdeaId}/board`);

    // Wait for columns to load -- confirms board rendered successfully
    // May redirect to idea detail if collaborator hasn't propagated yet — retry once
    const firstHeading = userBPage.locator("h3").filter({ hasText: /To Do|In Progress|Done/ }).first();
    try {
      await expect(firstHeading).toBeVisible({ timeout: 15_000 });
    } catch {
      // If we got redirected to idea detail, try navigating again
      await userBPage.goto(`/ideas/${accessIdeaId}/board`);
      await expect(firstHeading).toBeVisible({ timeout: 30_000 });
    }

    const columns = userBPage.locator("h3").filter({ hasText: /To Do|In Progress|Done/ });
    await expect(columns).toHaveCount(3, { timeout: 15_000 });
  });

  test("displays header with idea title and Back link", async ({
    userAPage,
  }) => {
    await userAPage.goto(`/ideas/${deepLinkIdeaId}/board`);

    // Wait for board to load
    await userAPage
      .locator('[data-testid^="column-"]')
      .first()
      .waitFor({ timeout: 15_000 });

    // Header should contain the idea title
    await expect(
      userAPage.getByText("[E2E] Board Deep Link Idea — Board")
    ).toBeVisible();

    // "Back to idea" link should be visible and point to the idea detail page
    const backLink = userAPage.getByRole("link", { name: /back to idea/i });
    await expect(backLink).toBeVisible();

    // Click back link and verify navigation
    await backLink.click();
    await userAPage.waitForURL(`**/ideas/${deepLinkIdeaId}`, {
      timeout: 15_000,
    });
    expect(userAPage.url()).toContain(`/ideas/${deepLinkIdeaId}`);
    expect(userAPage.url()).not.toContain("/board");
  });

  test("deep-link to task via ?taskId= opens task detail dialog", async ({
    userAPage,
  }) => {
    await userAPage.goto(
      `/ideas/${deepLinkIdeaId}/board?taskId=${deepLinkTaskId}`
    );

    // Wait for columns to load
    await userAPage
      .locator('[data-testid^="column-"]')
      .first()
      .waitFor({ timeout: 15_000 });

    // Task detail dialog should open automatically
    const dialog = userAPage.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 10_000 });

    // Dialog should show the task title
    await expect(dialog.locator("input").first()).toHaveValue(
      /\[E2E\] Task 1/
    );
  });
});
