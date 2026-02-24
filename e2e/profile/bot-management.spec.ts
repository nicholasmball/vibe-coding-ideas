import { test, expect } from "../fixtures/auth";
import { supabaseAdmin } from "../fixtures/supabase-admin";

let userAId: string;

test.beforeAll(async () => {
  const { data: users } = await supabaseAdmin
    .from("users")
    .select("id, full_name")
    .eq("full_name", "Test User A");

  const userA = users?.[0];
  if (!userA) throw new Error("Test User A not found — run global setup first");
  userAId = userA.id;
});

test.afterAll(async () => {
  // Clean up any E2E bots created during tests
  const { data: bots } = await supabaseAdmin
    .from("bot_profiles")
    .select("id, name")
    .eq("owner_id", userAId)
    .like("name", "%E2E%");

  if (bots && bots.length > 0) {
    for (const bot of bots) {
      // Delete via the RPC to cascade properly (auth.users -> public.users -> bot_profiles)
      await supabaseAdmin.rpc("delete_bot_user", {
        p_bot_id: bot.id,
        p_owner_id: userAId,
      });
    }
  }
});

test.describe("Agent management", () => {
  test("create a new agent", async ({ userAPage }) => {
    await userAPage.goto("/agents");

    // The "My Agents" h1 heading should be visible (h2 sidebar also matches, so use locator("h1"))
    await expect(userAPage.locator("h1").filter({ hasText: "My Agents" })).toBeVisible({ timeout: 15_000 });

    // Click "Create Agent"
    const createButton = userAPage.getByRole("button", { name: /create agent/i });
    await expect(createButton).toBeVisible();
    await createButton.click();

    // Dialog should open
    const dialog = userAPage.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("Create Agent")).toBeVisible();

    // Fill agent name
    await dialog.getByLabel("Name").fill("E2E Test Bot Alpha");

    // Fill role
    await dialog.getByLabel("Role").fill("Developer");

    // Submit
    await dialog.getByRole("button", { name: "Create" }).click();

    // Success toast
    const toast = userAPage
      .locator("[data-sonner-toast]")
      .filter({ hasText: /agent created/i });
    await expect(toast).toBeVisible({ timeout: 5_000 });

    // Dialog should close
    await expect(dialog).not.toBeVisible();

    // The new agent should appear in the list
    await expect(
      userAPage.getByText("E2E Test Bot Alpha")
    ).toBeVisible({ timeout: 10_000 });
  });

  test("edit agent details", async ({ userAPage }) => {
    // Ensure a bot exists to edit
    const { data: existingBots } = await supabaseAdmin
      .from("bot_profiles")
      .select("id, name")
      .eq("owner_id", userAId)
      .like("name", "%E2E%");

    if (!existingBots || existingBots.length === 0) {
      // Create one via the admin client
      await supabaseAdmin.rpc("create_bot_user", {
        p_name: "E2E Edit Bot",
        p_owner_id: userAId,
        p_role: "Tester",
        p_system_prompt: null,
        p_avatar_url: null,
      });
    }

    await userAPage.goto("/agents");

    // Find the "Edit" button next to an agent
    const editButton = userAPage
      .getByRole("button", { name: /^edit$/i })
      .first();
    await expect(editButton).toBeVisible({ timeout: 15_000 });
    await editButton.click();

    // Edit dialog should open
    const dialog = userAPage.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("Edit Agent")).toBeVisible();

    // Change the name
    const nameInput = dialog.getByLabel("Name");
    await nameInput.clear();
    await nameInput.fill("E2E Renamed Bot");

    // Save
    await dialog.getByRole("button", { name: "Save" }).click();

    // Success toast
    const toast = userAPage
      .locator("[data-sonner-toast]")
      .filter({ hasText: /agent updated/i });
    await expect(toast).toBeVisible({ timeout: 5_000 });

    // Dialog should close
    await expect(dialog).not.toBeVisible();

    // The renamed agent should appear in the list
    await expect(
      userAPage.getByText("E2E Renamed Bot")
    ).toBeVisible({ timeout: 10_000 });
  });

  test("toggle agent active/inactive", async ({ userAPage }) => {
    // Ensure a bot exists
    const { data: existingBots } = await supabaseAdmin
      .from("bot_profiles")
      .select("id, name, is_active")
      .eq("owner_id", userAId)
      .like("name", "%E2E%");

    if (!existingBots || existingBots.length === 0) {
      await supabaseAdmin.rpc("create_bot_user", {
        p_name: "E2E Toggle Bot",
        p_owner_id: userAId,
        p_role: "Developer",
        p_system_prompt: null,
        p_avatar_url: null,
      });
    }

    await userAPage.goto("/agents");

    // Find a toggle switch next to an agent card
    // The agent management section has switches with "Active"/"Inactive" text
    const botSection = userAPage.locator(".grid.gap-3").first();
    await expect(botSection).toBeVisible({ timeout: 15_000 });

    const toggle = botSection.locator("button[role='switch']").first();
    await expect(toggle).toBeVisible();

    // Get initial state
    const initialState = await toggle.getAttribute("data-state");

    // Click to toggle
    await toggle.click();

    // Wait for the server action to complete and the toggle state to change
    await expect(toggle).not.toHaveAttribute("data-state", initialState!, { timeout: 10_000 });

    const newState = await toggle.getAttribute("data-state");
    expect(newState).not.toBe(initialState);

    // The label text should change between "Active" and "Inactive"
    if (initialState === "checked") {
      await expect(botSection.getByText("Inactive").first()).toBeVisible();
    } else {
      await expect(botSection.getByText("Active").first()).toBeVisible();
    }
  });

  test("delete an agent", async ({ userAPage }) => {
    // Create a specific bot for deletion
    await supabaseAdmin.rpc("create_bot_user", {
      p_name: "E2E Delete Me Bot",
      p_owner_id: userAId,
      p_role: "QA",
      p_system_prompt: null,
      p_avatar_url: null,
    });

    await userAPage.goto("/agents");

    // The agent should be visible
    await expect(
      userAPage.getByText("E2E Delete Me Bot")
    ).toBeVisible({ timeout: 15_000 });

    // Find the agent card container, then click its Edit button
    const botCards = userAPage.locator(".grid.gap-3 > div");
    const targetCard = botCards.filter({ hasText: "E2E Delete Me Bot" });
    await targetCard.getByRole("button", { name: /edit/i }).click();

    // Edit dialog should open
    const dialog = userAPage.getByRole("dialog");
    await expect(dialog).toBeVisible();

    // Click "Delete" button (first click shows confirmation)
    const deleteButton = dialog.getByRole("button", { name: /delete/i });
    await expect(deleteButton).toBeVisible();
    await deleteButton.click();

    // Confirmation state: text changes to "Are you sure?"
    await expect(
      dialog.getByRole("button", { name: /are you sure/i })
    ).toBeVisible({ timeout: 3_000 });

    // Click again to confirm
    await dialog.getByRole("button", { name: /are you sure/i }).click();

    // Success toast
    const toast = userAPage
      .locator("[data-sonner-toast]")
      .filter({ hasText: /agent deleted/i });
    await expect(toast).toBeVisible({ timeout: 5_000 });

    // Dialog should close
    await expect(dialog).not.toBeVisible();

    // The agent should no longer appear in the list
    await expect(
      userAPage.getByText("E2E Delete Me Bot")
    ).not.toBeVisible({ timeout: 5_000 });
  });
});
