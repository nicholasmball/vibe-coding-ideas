import { test, expect } from "../fixtures/auth";
import {
  createTestIdea,
  createTestBoardWithTasks,
  cleanupTestData,
} from "../fixtures/test-data";
import { supabaseAdmin } from "../fixtures/supabase-admin";

// Minimal 1x1 PNG (valid image for upload)
const PNG_BYTES = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64"
);

// Minimal text file for non-image upload
const TEXT_BYTES = Buffer.from("E2E test attachment content", "utf-8");

let userAId: string;
let ideaId: string;
let taskId: string;

test.beforeAll(async () => {
  const { data: users } = await supabaseAdmin
    .from("users")
    .select("id, full_name")
    .eq("full_name", "Test User A");

  const userA = users?.[0];
  if (!userA) throw new Error("Test User A not found -- run global setup first");
  userAId = userA.id;

  // Create idea with a board and tasks
  const idea = await createTestIdea(userAId, {
    title: "[E2E] Board Attachments Idea",
    description: "[E2E] Idea for testing file attachments on board tasks.",
  });
  ideaId = idea.id;

  const { tasks } = await createTestBoardWithTasks(ideaId, 1);
  taskId = tasks[0].id;
});

test.afterAll(async () => {
  await cleanupTestData();
});

test.describe("Board Attachments", () => {
  // All attachment tests are skipped because file uploads require Supabase Storage
  // which uses signed URLs and RLS policies that don't work reliably in E2E.
  // The "Choose file" label triggers a hidden <input type="file"> via htmlFor,
  // but the upload to Supabase Storage fails silently in the test environment
  // (no storage bucket configured for the E2E test runner).
  test.fixme("upload a file via the Files tab", async ({ userAPage }) => {
    await userAPage.goto(`/ideas/${ideaId}/board`);

    // Wait for the board to load
    await userAPage
      .locator('[data-testid^="column-"]')
      .first()
      .waitFor({ timeout: 15_000 });

    // Click the task card to open detail dialog
    const taskCard = userAPage.locator(`[data-testid="task-card-${taskId}"]`);
    await taskCard.click();

    // Wait for dialog to appear
    const dialog = userAPage.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 10_000 });

    // Switch to Files tab
    await dialog.getByRole("tab", { name: /files/i }).click();

    // Wait for the Files tab content to load (attachments section)
    await expect(dialog.getByText("Attachments")).toBeVisible({ timeout: 10_000 });

    // Use file chooser interception to upload a text file via the hidden input
    const fileChooserPromise = userAPage.waitForEvent("filechooser");
    // Click the "Choose file" label/button to trigger the file input
    await dialog.getByText("Choose file").click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: "e2e-test-file.txt",
      mimeType: "text/plain",
      buffer: TEXT_BYTES,
    });

    // Wait for the file to appear in the attachments list
    await expect(dialog.getByText("e2e-test-file.txt")).toBeVisible({
      timeout: 15_000,
    });
  });

  test.fixme("download an attachment without error", async ({ userAPage }) => {
    await userAPage.goto(`/ideas/${ideaId}/board`);

    // Wait for the board to load
    await userAPage
      .locator('[data-testid^="column-"]')
      .first()
      .waitFor({ timeout: 15_000 });

    // Open task detail dialog
    const taskCard = userAPage.locator(`[data-testid="task-card-${taskId}"]`);
    await taskCard.click();

    const dialog = userAPage.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 10_000 });

    // Switch to Files tab
    await dialog.getByRole("tab", { name: /files/i }).click();

    // Wait for attachments to load
    await expect(dialog.getByText("e2e-test-file.txt")).toBeVisible({
      timeout: 10_000,
    });

    // Click the download button (Download tooltip button on the attachment row)
    // Intercept the popup/new tab to verify it opens without error
    const popupPromise = userAPage.waitForEvent("popup", { timeout: 10_000 });
    // The download button has a Download tooltip; click it
    const downloadButton = dialog
      .locator("button")
      .filter({ has: userAPage.locator('svg.lucide-download') });
    await downloadButton.first().click();

    // Verify the popup opens (signed URL download) -- just check no crash
    const popup = await popupPromise;
    // Close the popup
    await popup.close();
  });

  test.fixme("delete an attachment", async ({ userAPage }) => {
    await userAPage.goto(`/ideas/${ideaId}/board`);

    // Wait for the board
    await userAPage
      .locator('[data-testid^="column-"]')
      .first()
      .waitFor({ timeout: 15_000 });

    // Open task detail
    const taskCard = userAPage.locator(`[data-testid="task-card-${taskId}"]`);
    await taskCard.click();

    const dialog = userAPage.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 10_000 });

    // Switch to Files tab
    await dialog.getByRole("tab", { name: /files/i }).click();

    // Wait for the file to appear
    await expect(dialog.getByText("e2e-test-file.txt")).toBeVisible({
      timeout: 10_000,
    });

    // Click the delete button (Trash2 icon)
    const deleteButton = dialog
      .locator("button")
      .filter({ has: userAPage.locator('svg.lucide-trash-2') });
    await deleteButton.first().click();

    // Verify the file is removed from the list
    await expect(dialog.getByText("e2e-test-file.txt")).not.toBeVisible({
      timeout: 10_000,
    });
  });

  test.fixme("upload an image sets cover on the task card", async ({ userAPage }) => {
    await userAPage.goto(`/ideas/${ideaId}/board`);

    // Wait for the board
    await userAPage
      .locator('[data-testid^="column-"]')
      .first()
      .waitFor({ timeout: 15_000 });

    // Open task detail
    const taskCard = userAPage.locator(`[data-testid="task-card-${taskId}"]`);
    await taskCard.click();

    const dialog = userAPage.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 10_000 });

    // Switch to Files tab
    await dialog.getByRole("tab", { name: /files/i }).click();
    await expect(dialog.getByText("Attachments")).toBeVisible({ timeout: 10_000 });

    // Upload a PNG image file
    const fileChooserPromise = userAPage.waitForEvent("filechooser");
    await dialog.getByText("Choose file").click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: "e2e-cover-image.png",
      mimeType: "image/png",
      buffer: PNG_BYTES,
    });

    // Wait for the image to appear in attachments
    await expect(dialog.getByText("e2e-cover-image.png")).toBeVisible({
      timeout: 15_000,
    });

    // Close the dialog
    await userAPage.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible({ timeout: 5_000 });

    // The task card should now show a cover image (an img element inside the card)
    // Auto-set cover happens when uploading an image with no existing cover
    const taskCardAfter = userAPage.locator(
      `[data-testid="task-card-${taskId}"]`
    );
    // Cover image is rendered as an <img> inside the card container
    const coverImg = taskCardAfter.locator("img");
    await expect(coverImg).toBeVisible({ timeout: 15_000 });
  });
});
