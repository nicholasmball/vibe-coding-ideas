import { test, expect } from "../fixtures/auth";
import {
  createTestIdea,
  createTestBoardWithTasks,
  cleanupTestData,
} from "../fixtures/test-data";
import { supabaseAdmin } from "../fixtures/supabase-admin";

let userAId: string;
let testIdeaId: string;

test.beforeAll(async () => {
  const { data: users } = await supabaseAdmin
    .from("users")
    .select("id, full_name")
    .in("full_name", ["Test User A"]);

  const userA = users?.find((u) => u.full_name === "Test User A");
  if (!userA) throw new Error("Test User A not found -- run global setup first");
  userAId = userA.id;

  // Create a test idea with board and multiple tasks
  const idea = await createTestIdea(userAId, {
    title: "[E2E] Mobile Board Test Idea",
    description: "[E2E] Idea for mobile board layout testing.",
  });
  testIdeaId = idea.id;
  await createTestBoardWithTasks(testIdeaId, 5);
});

test.afterAll(async () => {
  await cleanupTestData();
});

test.describe("Mobile Board", () => {
  test("board has a horizontally scrollable container for columns", async ({
    userAPage,
  }) => {
    await userAPage.goto(`/ideas/${testIdeaId}/board`);

    // Wait for columns to load
    await userAPage
      .locator('[data-testid^="column-"]')
      .first()
      .waitFor({ timeout: 15_000 });

    // The board should have 3 columns (To Do, In Progress, Done)
    const columns = userAPage.locator('[data-testid^="column-"]');
    await expect(columns).toHaveCount(3);

    // Find the scrollable container (has overflow-x-auto class)
    const scrollContainer = userAPage.locator(".overflow-x-auto");
    await expect(scrollContainer.first()).toBeVisible();

    // On mobile viewport (390px wide), the container's scrollWidth should exceed its clientWidth
    // because 3 columns cannot fit in 390px
    const isScrollable = await scrollContainer.first().evaluate((el) => {
      return el.scrollWidth > el.clientWidth;
    });

    expect(isScrollable).toBe(true);
  });

  test("task drag handles are always visible on mobile (not hover-only)", async ({
    userAPage,
  }) => {
    await userAPage.goto(`/ideas/${testIdeaId}/board`);

    // Wait for columns and tasks to load
    await userAPage
      .locator('[data-testid^="column-"]')
      .first()
      .waitFor({ timeout: 15_000 });

    // Wait for task cards to render
    const taskCards = userAPage.locator('[data-testid^="task-card-"]');
    await taskCards.first().waitFor({ timeout: 10_000 });

    // Get the first drag handle
    const dragHandle = userAPage.locator('[data-testid="task-drag-handle"]').first();
    await expect(dragHandle).toBeVisible();

    // On mobile, the drag handle should have opacity-100 class (always visible)
    // The CSS class is "opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
    // At mobile viewport (<640px), only opacity-100 applies, making it visible
    const hasOpacity100 = await dragHandle.evaluate((el) => {
      return el.classList.contains("opacity-100");
    });
    expect(hasOpacity100).toBe(true);

    // Verify the handle is actually visible (computed opacity is 1)
    const computedOpacity = await dragHandle.evaluate((el) => {
      return window.getComputedStyle(el).opacity;
    });
    expect(computedOpacity).toBe("1");
  });

  test("task cards are fully visible and tappable", async ({
    userAPage,
  }) => {
    await userAPage.goto(`/ideas/${testIdeaId}/board`);

    // Wait for columns and tasks to load
    await userAPage
      .locator('[data-testid^="column-"]')
      .first()
      .waitFor({ timeout: 15_000 });

    const taskCards = userAPage.locator('[data-testid^="task-card-"]');
    await taskCards.first().waitFor({ timeout: 10_000 });

    const firstCard = taskCards.first();

    // Card should be visible
    await expect(firstCard).toBeVisible();

    // Card should have a bounding box (not zero-sized)
    const box = await firstCard.boundingBox();
    expect(box).toBeTruthy();
    expect(box!.width).toBeGreaterThan(0);
    expect(box!.height).toBeGreaterThan(0);

    // Tapping the card should open the task detail dialog
    await firstCard.click();

    // Task detail dialog should open
    const dialog = userAPage.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 10_000 });
  });

  test("columns use snap scrolling on mobile", async ({
    userAPage,
  }) => {
    await userAPage.goto(`/ideas/${testIdeaId}/board`);

    // Wait for columns to load
    await userAPage
      .locator('[data-testid^="column-"]')
      .first()
      .waitFor({ timeout: 15_000 });

    // The scroll container should have snap-x snap-mandatory classes for mobile
    const scrollContainer = userAPage.locator(".overflow-x-auto.snap-x.snap-mandatory");
    await expect(scrollContainer.first()).toBeVisible();
  });
});
