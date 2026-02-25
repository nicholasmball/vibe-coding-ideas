import { test, expect } from "../fixtures/auth";
import {
  createTestIdea,
  createTestBoardWithTasks,
  cleanupTestData,
} from "../fixtures/test-data";
import { supabaseAdmin } from "../fixtures/supabase-admin";

let userAId: string;
let testIdeaId: string;

// Fake encrypted key — the UI only checks !!encrypted_anthropic_key, not its value
const FAKE_ENCRYPTED_KEY = "aabbccdd:eeff0011:22334455";

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
  // Remove fake API key
  await supabaseAdmin
    .from("users")
    .update({ encrypted_anthropic_key: null })
    .eq("id", userAId);

  await cleanupTestData();
});

test.describe("AI Generate - Board Toolbar", () => {
  test('shows "AI Generate" button on board toolbar for team member', async ({
    userAPage,
  }) => {
    await userAPage.goto(`/ideas/${testIdeaId}/board`);

    // Wait for board columns to load
    await userAPage
      .locator('[data-testid^="column-"]')
      .first()
      .waitFor({ timeout: 15_000 });

    // AI Generate button should be visible (always shown for team members)
    const aiButton = userAPage.getByRole("button", { name: /ai generate/i });
    await expect(aiButton).toBeVisible();
  });

  test("AI Generate button is disabled (opacity-50) when user has no API key", async ({
    userAPage,
  }) => {
    // Remove API key
    await supabaseAdmin
      .from("users")
      .update({ encrypted_anthropic_key: null })
      .eq("id", userAId);

    await userAPage.goto(`/ideas/${testIdeaId}/board`);

    // Wait for board columns to load
    await userAPage
      .locator('[data-testid^="column-"]')
      .first()
      .waitFor({ timeout: 15_000 });

    // AI Generate button should be visible but with opacity-50
    const aiButton = userAPage.getByRole("button", { name: /ai generate/i });
    await expect(aiButton).toBeVisible();
    await expect(aiButton).toHaveClass(/opacity-50/);
  });

  test("clicking disabled AI Generate button shows API key toast", async ({
    userAPage,
  }) => {
    // Remove API key
    await supabaseAdmin
      .from("users")
      .update({ encrypted_anthropic_key: null })
      .eq("id", userAId);

    await userAPage.goto(`/ideas/${testIdeaId}/board`);

    // Wait for board columns to load
    await userAPage
      .locator('[data-testid^="column-"]')
      .first()
      .waitFor({ timeout: 15_000 });

    // Click the button (it's not HTML-disabled, just opacity-50 with a toast handler)
    await userAPage.getByRole("button", { name: /ai generate/i }).click();

    // Toast should tell user to add API key
    await expect(
      userAPage.locator("[data-sonner-toast]").filter({ hasText: /api key/i })
    ).toBeVisible({ timeout: 10_000 });
  });

  test("opens AI Generate dialog with prompt field and mode selector", async ({
    userAPage,
  }) => {
    // Give User A an API key so the button works
    await supabaseAdmin
      .from("users")
      .update({ encrypted_anthropic_key: FAKE_ENCRYPTED_KEY })
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
    // Give User A an API key
    await supabaseAdmin
      .from("users")
      .update({ encrypted_anthropic_key: FAKE_ENCRYPTED_KEY })
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
});
