import { test, expect } from "../fixtures/auth";
import { createTestIdea, cleanupTestData } from "../fixtures/test-data";
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

  // Create a test idea owned by User A
  const idea = await createTestIdea(userAId, {
    title: "[E2E] AI Enhance Test Idea",
    description: "[E2E] This is the original description that should be enhanced by AI.",
  });
  testIdeaId = idea.id;
});

test.afterAll(async () => {
  // Reset ai_enabled and ai_daily_limit to defaults
  await supabaseAdmin
    .from("users")
    .update({ ai_enabled: false, ai_daily_limit: 10 })
    .eq("id", userAId);

  // Clean up AI usage log entries from tests
  await supabaseAdmin
    .from("ai_usage_log")
    .delete()
    .eq("user_id", userAId);

  await cleanupTestData();
});

test.describe("AI Enhance - Idea Detail", () => {
  test('shows "Enhance with AI" button for author when ai_enabled is true', async ({
    userAPage,
  }) => {
    // Enable AI for User A
    await supabaseAdmin
      .from("users")
      .update({ ai_enabled: true, ai_daily_limit: 10 })
      .eq("id", userAId);

    await userAPage.goto(`/ideas/${testIdeaId}`);

    // The button should be visible on desktop (hidden sm:inline-flex wrapper)
    const enhanceButton = userAPage.getByRole("button", { name: /enhance with ai/i });
    await expect(enhanceButton.first()).toBeVisible({ timeout: 10_000 });
  });

  test.fixme("hides enhance button when ai_enabled is false", async ({
    userAPage,
  }) => {
    // Disable AI for User A
    await supabaseAdmin
      .from("users")
      .update({ ai_enabled: false })
      .eq("id", userAId);

    await userAPage.goto(`/ideas/${testIdeaId}`);

    // Wait for page to fully render — check both the title and an interactive element
    await expect(userAPage.getByText("[E2E] AI Enhance Test Idea")).toBeVisible({
      timeout: 15_000,
    });
    // Wait for vote button to confirm the page is fully hydrated
    await expect(userAPage.locator('[data-testid="vote-button"]').first()).toBeVisible({ timeout: 10_000 });

    // Wait a bit for client components to fully mount
    await userAPage.waitForTimeout(2000);

    // The enhance button should not be present at all
    const enhanceButtons = userAPage.getByRole("button", { name: /enhance with ai/i });
    await expect(enhanceButtons).toHaveCount(0);
  });

  test("opens enhance dialog with prompt textarea and current description", async ({
    userAPage,
  }) => {
    // Enable AI for User A
    await supabaseAdmin
      .from("users")
      .update({ ai_enabled: true, ai_daily_limit: 10 })
      .eq("id", userAId);

    await userAPage.goto(`/ideas/${testIdeaId}`);

    // Click the enhance button
    const enhanceButton = userAPage.getByRole("button", { name: /enhance with ai/i });
    await enhanceButton.first().click();

    // Dialog should open
    const dialog = userAPage.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 10_000 });

    // Dialog title should contain "Enhance with AI"
    await expect(dialog.getByText("Enhance with AI")).toBeVisible();

    // Prompt textarea should be present with default prompt text
    const promptTextarea = dialog.locator("textarea");
    await expect(promptTextarea).toBeVisible();
    await expect(promptTextarea).not.toBeEmpty();

    // Current description preview should be visible
    await expect(dialog.getByText("Current Description")).toBeVisible();
  });

  test("displays credit badge (X/Y) on enhance button", async ({
    userAPage,
  }) => {
    // Enable AI with a known daily limit
    await supabaseAdmin
      .from("users")
      .update({ ai_enabled: true, ai_daily_limit: 10 })
      .eq("id", userAId);

    // Clear any existing usage log entries for today
    await supabaseAdmin
      .from("ai_usage_log")
      .delete()
      .eq("user_id", userAId);

    await userAPage.goto(`/ideas/${testIdeaId}`);

    // The enhance button should show remaining/limit credits
    // Look for the credit text pattern like "10/10" or "X/10"
    const enhanceButton = userAPage.getByRole("button", { name: /enhance with ai/i }).first();
    await expect(enhanceButton).toBeVisible({ timeout: 10_000 });

    // Check for the credit badge text within the button — look for X/Y pattern
    const creditText = enhanceButton.locator("*").filter({ hasText: /\d+\/\d+/ }).first();
    await expect(creditText).toBeVisible({ timeout: 10_000 });
  });

  test("shows disabled state when credits are exhausted", async ({
    userAPage,
  }) => {
    // Set daily limit to 1 and add a usage log entry to exhaust credits
    await supabaseAdmin
      .from("users")
      .update({ ai_enabled: true, ai_daily_limit: 1 })
      .eq("id", userAId);

    // Insert a usage log entry for today to exhaust the limit
    await supabaseAdmin.from("ai_usage_log").insert({
      user_id: userAId,
      action_type: "enhance_description",
      input_tokens: 100,
      output_tokens: 200,
      model: "claude-sonnet-4-5-20250929",
      key_type: "platform",
      idea_id: testIdeaId,
    });

    await userAPage.goto(`/ideas/${testIdeaId}`);

    // The enhance button should be disabled
    const enhanceButton = userAPage.getByRole("button", { name: /enhance with ai/i }).first();
    await expect(enhanceButton).toBeVisible({ timeout: 10_000 });
    await expect(enhanceButton).toBeDisabled();

    // Clean up the usage log entry
    await supabaseAdmin
      .from("ai_usage_log")
      .delete()
      .eq("user_id", userAId);

    // Reset daily limit
    await supabaseAdmin
      .from("users")
      .update({ ai_daily_limit: 10 })
      .eq("id", userAId);
  });

  test("dialog shows credit info bar in configure phase", async ({
    userAPage,
  }) => {
    // Enable AI with a known limit
    await supabaseAdmin
      .from("users")
      .update({ ai_enabled: true, ai_daily_limit: 10 })
      .eq("id", userAId);

    await userAPage.goto(`/ideas/${testIdeaId}`);

    // Open the enhance dialog
    const enhanceButton = userAPage.getByRole("button", { name: /enhance with ai/i });
    await enhanceButton.first().click();

    const dialog = userAPage.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 10_000 });

    // Should show "X/10 credits remaining today" text
    await expect(dialog.getByText(/credits remaining today/)).toBeVisible();
  });

  test("dialog has Ask clarifying questions checkbox and Next button", async ({
    userAPage,
  }) => {
    // Enable AI
    await supabaseAdmin
      .from("users")
      .update({ ai_enabled: true, ai_daily_limit: 10 })
      .eq("id", userAId);

    await userAPage.goto(`/ideas/${testIdeaId}`);

    // Open the enhance dialog
    const enhanceButton = userAPage.getByRole("button", { name: /enhance with ai/i });
    await enhanceButton.first().click();

    const dialog = userAPage.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 10_000 });

    // "Ask clarifying questions first" checkbox should be present and checked by default
    const askQuestionsCheckbox = dialog.getByLabel(/ask clarifying questions/i);
    await expect(askQuestionsCheckbox).toBeVisible();
    await expect(askQuestionsCheckbox).toBeChecked();

    // "Next" button should be visible (since ask questions is checked)
    const nextButton = dialog.getByRole("button", { name: /next/i });
    await expect(nextButton).toBeVisible();
  });
});
