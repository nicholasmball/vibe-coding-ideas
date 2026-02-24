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

  // Create a test idea with board and tasks
  const idea = await createTestIdea(userAId, {
    title: "[E2E] AI Generate Board Idea",
    description: "[E2E] An idea for testing AI board generation features.",
  });
  testIdeaId = idea.id;
  await createTestBoardWithTasks(testIdeaId, 2);
});

test.afterAll(async () => {
  // Reset ai_enabled to default
  await supabaseAdmin
    .from("users")
    .update({ ai_enabled: false, ai_daily_limit: 10 })
    .eq("id", userAId);

  await cleanupTestData();
});

test.describe("AI Generate - Board Toolbar", () => {
  test('shows "AI Generate" button on board toolbar when ai_enabled', async ({
    userAPage,
  }) => {
    // Enable AI for User A
    await supabaseAdmin
      .from("users")
      .update({ ai_enabled: true, ai_daily_limit: 10 })
      .eq("id", userAId);

    await userAPage.goto(`/ideas/${testIdeaId}/board`);

    // Wait for board columns to load
    await userAPage
      .locator('[data-testid^="column-"]')
      .first()
      .waitFor({ timeout: 15_000 });

    // AI Generate button should be visible
    const aiButton = userAPage.getByRole("button", { name: /ai generate/i });
    await expect(aiButton).toBeVisible();
  });

  test("hides AI Generate button when ai_enabled is false", async ({
    userAPage,
  }) => {
    // Disable AI for User A
    await supabaseAdmin
      .from("users")
      .update({ ai_enabled: false })
      .eq("id", userAId);

    await userAPage.goto(`/ideas/${testIdeaId}/board`);

    // Wait for board columns to load
    await userAPage
      .locator('[data-testid^="column-"]')
      .first()
      .waitFor({ timeout: 15_000 });

    // AI Generate button should not be present
    const aiButtons = userAPage.getByRole("button", { name: /ai generate/i });
    await expect(aiButtons).toHaveCount(0);
  });

  test("opens AI Generate dialog with prompt field and mode selector", async ({
    userAPage,
  }) => {
    // Enable AI for User A
    await supabaseAdmin
      .from("users")
      .update({ ai_enabled: true, ai_daily_limit: 10 })
      .eq("id", userAId);

    await userAPage.goto(`/ideas/${testIdeaId}/board`);

    // Wait for board columns to load
    await userAPage
      .locator('[data-testid^="column-"]')
      .first()
      .waitFor({ timeout: 15_000 });

    // Click AI Generate button
    await userAPage.getByRole("button", { name: /ai generate/i }).click();

    // Dialog should open
    const dialog = userAPage.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 10_000 });

    // Dialog title
    await expect(dialog.getByText("AI Generate Board")).toBeVisible();

    // Prompt textarea should be present
    const promptTextarea = dialog.locator("textarea");
    await expect(promptTextarea).toBeVisible();
    await expect(promptTextarea).not.toBeEmpty();

    // Mode radio buttons should be present
    await expect(dialog.getByText("Add to existing board")).toBeVisible();
    await expect(dialog.getByText("Replace existing board")).toBeVisible();

    // Generate button should be visible
    await expect(dialog.getByRole("button", { name: /generate/i })).toBeVisible();
  });

  test("replace mode shows destructive warning", async ({
    userAPage,
  }) => {
    // Enable AI for User A
    await supabaseAdmin
      .from("users")
      .update({ ai_enabled: true, ai_daily_limit: 10 })
      .eq("id", userAId);

    await userAPage.goto(`/ideas/${testIdeaId}/board`);

    // Wait for board columns to load
    await userAPage
      .locator('[data-testid^="column-"]')
      .first()
      .waitFor({ timeout: 15_000 });

    // Open dialog
    await userAPage.getByRole("button", { name: /ai generate/i }).click();
    const dialog = userAPage.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 10_000 });

    // Select "Replace existing board" mode
    await dialog.getByLabel(/replace existing board/i).click();

    // Destructive warning should appear
    await expect(
      dialog.getByText(/will delete all existing tasks/i)
    ).toBeVisible();
  });

  test("AI Generate dialog shows credit info when on platform key", async ({
    userAPage,
  }) => {
    // Enable AI with known limit
    await supabaseAdmin
      .from("users")
      .update({ ai_enabled: true, ai_daily_limit: 10 })
      .eq("id", userAId);

    await userAPage.goto(`/ideas/${testIdeaId}/board`);

    // Wait for board columns to load
    await userAPage
      .locator('[data-testid^="column-"]')
      .first()
      .waitFor({ timeout: 15_000 });

    // Open dialog
    await userAPage.getByRole("button", { name: /ai generate/i }).click();
    const dialog = userAPage.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 10_000 });

    // Should show credit info
    await expect(dialog.getByText(/credits remaining today/)).toBeVisible();
  });
});
