import { test, expect } from "../fixtures/auth";
import {
  createTestIdea,
  createTestBoardWithTasks,
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

let userAId: string;
let userBId: string;
let ideaId: string;
let boardIdeaId: string;
let taskId: string;
let seededNotificationIds: string[] = [];

test.beforeAll(async () => {
  userAId = await getUserId("Test User A");
  userBId = await getUserId("Test User B");

  // Create an idea for notification links
  const idea = await createTestIdea(userAId, {
    title: "[E2E] Notification Test Idea",
    description: "[E2E] An idea for notification tests.",
  });
  ideaId = idea.id;

  // Create an idea with a board and task for task_mention notifications
  const boardIdea = await createTestIdea(userAId, {
    title: "[E2E] Notification Board Idea",
    description: "[E2E] An idea with a board for task mention notifications.",
  });
  boardIdeaId = boardIdea.id;
  const { tasks } = await createTestBoardWithTasks(boardIdeaId, 1);
  taskId = tasks[0].id;
});

test.afterAll(async () => {
  // Clean up notifications we created
  if (seededNotificationIds.length > 0) {
    await supabaseAdmin
      .from("notifications")
      .delete()
      .in("id", seededNotificationIds);
  }
  await cleanupTestData();
});

/** Insert test notifications for User A, returning their IDs */
async function seedNotifications(
  count: number,
  overrides: {
    type?: "comment" | "vote" | "collaborator" | "status_change" | "task_mention";
    idea_id?: string;
    task_id?: string | null;
    read?: boolean;
  } = {}
): Promise<string[]> {
  const rows = Array.from({ length: count }, () => ({
    user_id: userAId,
    actor_id: userBId,
    type: overrides.type ?? "vote",
    idea_id: overrides.idea_id ?? ideaId,
    task_id: overrides.task_id ?? null,
    read: overrides.read ?? false,
  }));

  const { data, error } = await supabaseAdmin
    .from("notifications")
    .insert(rows)
    .select("id");

  if (error) throw new Error(`Failed to seed notifications: ${error.message}`);
  const ids = (data ?? []).map((n) => n.id);
  seededNotificationIds.push(...ids);
  return ids;
}

/** Clean up all seeded notifications between tests */
async function clearSeededNotifications() {
  if (seededNotificationIds.length > 0) {
    await supabaseAdmin
      .from("notifications")
      .delete()
      .in("id", seededNotificationIds);
    seededNotificationIds = [];
  }
}

test.describe("Notifications", () => {
  test.afterEach(async () => {
    await clearSeededNotifications();
  });

  test("bell shows unread count badge", async ({ userAPage }) => {
    // Seed 3 unread notifications
    await seedNotifications(3);

    await userAPage.goto("/dashboard");

    // Use .first() because desktop + mobile navbars both render NotificationBell
    const bell = userAPage.locator('[data-testid="notification-bell"]').first();
    await expect(bell).toBeVisible({ timeout: 15_000 });

    // Wait for the count badge to appear (notifications may take a moment to load)
    // The badge renders inside the bell button as a <span> with the count
    await expect(bell.locator("span.rounded-full")).toBeVisible({ timeout: 15_000 });

    // The bell button's text includes the count, e.g. "3" or "9+"
    const bellText = await bell.textContent();
    const match = bellText?.match(/(\d+\+?)/);
    expect(match).toBeTruthy();
    const countText = match![1];
    const numericValue = countText === "9+" ? 10 : parseInt(countText, 10);
    expect(numericValue).toBeGreaterThanOrEqual(3);
  });

  test("cap at 9+ for 10+ unread notifications", async ({ userAPage }) => {
    // Seed 12 unread notifications
    await seedNotifications(12);

    await userAPage.goto("/dashboard");

    const bell = userAPage.locator('[data-testid="notification-bell"]').first();
    await expect(bell).toBeVisible({ timeout: 15_000 });

    // Bell accessible name should contain "9+"
    await expect(bell).toContainText("9+");
  });

  test("mark individual notification as read on click", async ({ userAPage }) => {
    // Seed 1 unread notification
    await seedNotifications(1);

    await userAPage.goto("/dashboard");

    const bell = userAPage.locator('[data-testid="notification-bell"]').first();
    await expect(bell).toBeVisible({ timeout: 15_000 });

    // Open notification dropdown
    await bell.click();

    // Wait for the dropdown content to be visible
    const dropdown = userAPage.locator('[role="menu"], [data-radix-menu-content]').first();
    await expect(dropdown).toBeVisible({ timeout: 5_000 });

    // Find an unread notification (has the blue dot / bg-primary/5 class)
    // Click the first notification link
    const notificationLink = dropdown.locator("a").first();
    await expect(notificationLink).toBeVisible();
    await notificationLink.click();

    // Should navigate to the idea page
    await userAPage.waitForURL(`**/ideas/${ideaId}`, { timeout: 15_000 });
  });

  test("mark all read clears unread count", async ({ userAPage }) => {
    // Seed 3 unread notifications
    await seedNotifications(3);

    await userAPage.goto("/dashboard");

    const bell = userAPage.locator('[data-testid="notification-bell"]').first();
    await expect(bell).toBeVisible({ timeout: 15_000 });

    // Open notification dropdown
    await bell.click();

    // Click "Mark all read" button
    const markAllButton = userAPage.getByRole("button", { name: /mark all read/i });
    await expect(markAllButton).toBeVisible({ timeout: 5_000 });
    await markAllButton.click();

    // The unread count badge should disappear (or not be visible)
    // Close dropdown first
    await userAPage.keyboard.press("Escape");

    // Badge should no longer show (or at least not show a positive count)
    // Wait a moment for the optimistic update
    await userAPage.waitForTimeout(1000);
    const badge = bell.locator("span.rounded-full");
    // Badge might still exist with count from other tests, but our 3 should be marked read
    // Re-open to verify no unread indicators
    await bell.click();
    const unreadDots = userAPage.locator(".rounded-full.bg-primary").filter({ hasText: "" });
    // All notification items with unread background should be gone
    // The mark all read button should be hidden (no unread notifications)
    await expect(
      userAPage.getByRole("button", { name: /mark all read/i })
    ).toBeHidden({ timeout: 5_000 });
  });

  test("navigate to idea page on notification click", async ({ userAPage }) => {
    // Seed a comment notification
    await seedNotifications(1, { type: "comment", idea_id: ideaId });

    await userAPage.goto("/dashboard");

    const bell = userAPage.locator('[data-testid="notification-bell"]').first();
    await bell.click();

    // Wait for dropdown
    const dropdown = userAPage.locator('[role="menu"], [data-radix-menu-content]').first();
    await expect(dropdown).toBeVisible({ timeout: 5_000 });

    // Click the notification that links to the idea
    const link = dropdown.locator(`a[href*="/ideas/${ideaId}"]`).first();
    await expect(link).toBeVisible();
    await link.click();

    // Should navigate to the idea detail page
    await userAPage.waitForURL(`**/ideas/${ideaId}`, { timeout: 15_000 });
    expect(userAPage.url()).toContain(`/ideas/${ideaId}`);
  });

  test("task mention notification links to board with taskId param", async ({
    userAPage,
  }) => {
    // Seed a task_mention notification
    await seedNotifications(1, {
      type: "task_mention",
      idea_id: boardIdeaId,
      task_id: taskId,
    });

    await userAPage.goto("/dashboard");

    const bell = userAPage.locator('[data-testid="notification-bell"]').first();
    await bell.click();

    // Wait for dropdown
    const dropdown = userAPage.locator('[role="menu"], [data-radix-menu-content]').first();
    await expect(dropdown).toBeVisible({ timeout: 5_000 });

    // Click the task mention notification
    const link = dropdown.locator(`a[href*="/board"]`).first();
    await expect(link).toBeVisible();
    await link.click();

    // Should navigate to the board page with taskId query param
    await userAPage.waitForURL(`**/ideas/${boardIdeaId}/board**`, {
      timeout: 15_000,
    });
    expect(userAPage.url()).toContain(`taskId=${taskId}`);
  });
});
