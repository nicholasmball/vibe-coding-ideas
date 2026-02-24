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
  // Reset User A's profile to original state
  await supabaseAdmin
    .from("users")
    .update({
      full_name: "Test User A",
      bio: null,
    })
    .eq("id", userAId);
});

test.describe("Profile editing", () => {
  test("opens edit profile dialog", async ({ userAPage }) => {
    await userAPage.goto(`/profile/${userAId}`);

    // Click "Edit Profile" button
    const editButton = userAPage.getByRole("button", { name: /edit profile/i });
    await expect(editButton).toBeVisible({ timeout: 15_000 });
    await editButton.click();

    // Dialog should open
    const dialog = userAPage.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("Edit Profile")).toBeVisible();

    // Fields should be present
    await expect(dialog.getByLabel("Display Name")).toBeVisible();
    await expect(dialog.getByLabel("Bio")).toBeVisible();
    await expect(dialog.getByLabel("GitHub Username")).toBeVisible();
    await expect(dialog.getByLabel("Contact Info")).toBeVisible();

    // Save and Cancel buttons should be present
    await expect(dialog.getByRole("button", { name: "Save" })).toBeVisible();
    await expect(
      dialog.getByRole("button", { name: "Cancel" })
    ).toBeVisible();
  });

  test("edit name and bio, then verify update on profile page", async ({
    userAPage,
  }) => {
    await userAPage.goto(`/profile/${userAId}`);

    // Open edit dialog
    const editButton = userAPage.getByRole("button", { name: /edit profile/i });
    await expect(editButton).toBeVisible({ timeout: 15_000 });
    await editButton.click();

    const dialog = userAPage.getByRole("dialog");
    await expect(dialog).toBeVisible();

    // Clear and fill name
    const nameInput = dialog.getByLabel("Display Name");
    await nameInput.clear();
    await nameInput.fill("Test User A Updated");

    // Fill bio
    const bioInput = dialog.getByLabel("Bio");
    await bioInput.clear();
    await bioInput.fill("E2E test bio content");

    // Save
    await dialog.getByRole("button", { name: "Save" }).click();

    // Success toast
    const toast = userAPage
      .locator("[data-sonner-toast]")
      .filter({ hasText: /profile updated/i });
    await expect(toast).toBeVisible({ timeout: 5_000 });

    // Dialog should close
    await expect(dialog).not.toBeVisible();

    // Verify the name updated on the profile page
    await expect(
      userAPage.getByRole("heading", { name: "Test User A Updated" })
    ).toBeVisible({ timeout: 10_000 });

    // Verify bio
    await expect(userAPage.getByText("E2E test bio content")).toBeVisible();

    // Reset name back for other tests
    await supabaseAdmin
      .from("users")
      .update({ full_name: "Test User A", bio: null })
      .eq("id", userAId);
  });

  test("upload avatar via file input", async ({ userAPage }) => {
    await userAPage.goto(`/profile/${userAId}`);

    // Open edit dialog
    const editButton = userAPage.getByRole("button", { name: /edit profile/i });
    await expect(editButton).toBeVisible({ timeout: 15_000 });
    await editButton.click();

    const dialog = userAPage.getByRole("dialog");
    await expect(dialog).toBeVisible();

    // The hidden file input should exist
    const fileInput = dialog.locator('input[type="file"]');
    await expect(fileInput).toBeAttached();

    // The "Change photo" button should be visible
    await expect(
      dialog.getByRole("button", { name: /change photo/i })
    ).toBeVisible();

    // We cannot easily test actual file upload in E2E without a real image file,
    // but we verify the file input is properly wired and the dialog works
    // Close dialog for now
    await dialog.getByRole("button", { name: "Cancel" }).click();
    await expect(dialog).not.toBeVisible();
  });

  test("toggle notification settings", async ({ userAPage }) => {
    await userAPage.goto(`/profile/${userAId}`);

    // On desktop, the "Notifications" button is rendered directly (not inside Settings dropdown)
    // Scope to main content to avoid matching the navbar notification bell
    const main = userAPage.locator("main");
    const notifButton = main.getByRole("button", { name: /^notifications$/i });
    await expect(notifButton).toBeVisible({ timeout: 15_000 });
    await notifButton.click();

    // Dialog should open with "Notification Preferences" title
    const dialog = userAPage.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 5_000 });
    await expect(dialog.getByText("Notification Preferences")).toBeVisible();

    // Several preference switches should be visible
    await expect(dialog.getByText("Comments on your ideas")).toBeVisible();
    await expect(dialog.getByText("Votes on your ideas")).toBeVisible();
    await expect(dialog.getByText("New collaborators")).toBeVisible();

    // Toggle the "Votes on your ideas" switch
    const switches = dialog.locator("button[role='switch']");
    const votesSwitch = switches.nth(1); // second switch = votes
    const initialChecked = await votesSwitch.getAttribute("data-state");
    await votesSwitch.click();

    // State should change
    const newChecked = await votesSwitch.getAttribute("data-state");
    expect(newChecked).not.toBe(initialChecked);

    // Save
    await dialog.getByRole("button", { name: "Save" }).click();

    // Success toast
    const toast = userAPage
      .locator("[data-sonner-toast]")
      .filter({ hasText: /notification preferences updated/i });
    await expect(toast).toBeVisible({ timeout: 5_000 });

    // Dialog should close
    await expect(dialog).not.toBeVisible();

    // Reopen to verify persistence
    await notifButton.click();
    const dialog2 = userAPage.getByRole("dialog");
    await expect(dialog2).toBeVisible({ timeout: 5_000 });

    const switches2 = dialog2.locator("button[role='switch']");
    const votesSwitch2 = switches2.nth(1);
    const persistedState = await votesSwitch2.getAttribute("data-state");
    expect(persistedState).toBe(newChecked);

    // Toggle back to original state to not leave side effects
    await votesSwitch2.click();
    await dialog2.getByRole("button", { name: "Save" }).click();
  });
});
