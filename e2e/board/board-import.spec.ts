import { test, expect } from "../fixtures/auth";
import {
  createTestIdea,
  createTestBoardColumns,
  cleanupTestData,
} from "../fixtures/test-data";
import { supabaseAdmin } from "../fixtures/supabase-admin";

let userAId: string;

// Each test uses its own idea to avoid state leakage between tests
let bulkTextIdeaId: string;
let csvIdeaId: string;
let jsonIdeaId: string;
let limitIdeaId: string;

test.beforeAll(async () => {
  const { data: users } = await supabaseAdmin
    .from("users")
    .select("id, full_name")
    .eq("full_name", "Test User A");

  const userA = users?.[0];
  if (!userA) throw new Error("Test User A not found -- run global setup first");
  userAId = userA.id;

  // Create separate ideas for each import test (each needs its own board)
  const [bulkIdea, csvIdea, jsonIdea, limitIdea] = await Promise.all([
    createTestIdea(userAId, {
      title: "[E2E] Import Bulk Text Idea",
      description: "[E2E] Idea for testing bulk text import.",
    }),
    createTestIdea(userAId, {
      title: "[E2E] Import CSV Idea",
      description: "[E2E] Idea for testing CSV import.",
    }),
    createTestIdea(userAId, {
      title: "[E2E] Import JSON Idea",
      description: "[E2E] Idea for testing JSON import.",
    }),
    createTestIdea(userAId, {
      title: "[E2E] Import Limit Idea",
      description: "[E2E] Idea for testing the 500-task import limit.",
    }),
  ]);

  bulkTextIdeaId = bulkIdea.id;
  csvIdeaId = csvIdea.id;
  jsonIdeaId = jsonIdea.id;
  limitIdeaId = limitIdea.id;

  // Pre-create board columns for each idea so they don't need lazy initialization
  await Promise.all([
    createTestBoardColumns(bulkTextIdeaId),
    createTestBoardColumns(csvIdeaId),
    createTestBoardColumns(jsonIdeaId),
    createTestBoardColumns(limitIdeaId),
  ]);
});

test.afterAll(async () => {
  await cleanupTestData();
});

test.describe("Board Import", () => {
  test("import tasks via Bulk Text", async ({ userAPage }) => {
    await userAPage.goto(`/ideas/${bulkTextIdeaId}/board`);

    // Wait for board columns to render
    await userAPage
      .locator('[data-testid^="column-"]')
      .first()
      .waitFor({ timeout: 15_000 });

    // Click the Import button in the toolbar
    await userAPage.getByRole("button", { name: /import/i }).click();

    // Wait for import dialog
    const dialog = userAPage.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 5_000 });

    // The Bulk Text tab should be active by default
    await expect(dialog.getByRole("tab", { name: /bulk text/i })).toBeVisible();

    // Paste task titles (one per line) into the textarea
    const textarea = dialog.getByRole("textbox");
    await textarea.fill(
      "Bulk Task Alpha\nBulk Task Beta\nBulk Task Gamma"
    );

    // Preview should show 3 tasks
    await expect(dialog.getByText("Preview (3 tasks)")).toBeVisible({
      timeout: 5_000,
    });

    // Click import button
    await dialog.getByRole("button", { name: /import 3 tasks/i }).click();

    // Wait for import to complete and dialog to close
    await expect(dialog).not.toBeVisible({ timeout: 30_000 });

    // Verify tasks appear on the board
    await expect(userAPage.getByText("Bulk Task Alpha")).toBeVisible({
      timeout: 10_000,
    });
    await expect(userAPage.getByText("Bulk Task Beta")).toBeVisible();
    await expect(userAPage.getByText("Bulk Task Gamma")).toBeVisible();
  });

  test("import tasks via CSV", async ({ userAPage }) => {
    await userAPage.goto(`/ideas/${csvIdeaId}/board`);

    // Wait for board
    await userAPage
      .locator('[data-testid^="column-"]')
      .first()
      .waitFor({ timeout: 15_000 });

    // Open import dialog
    await userAPage.getByRole("button", { name: /import/i }).click();

    const dialog = userAPage.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 5_000 });

    // Switch to CSV tab
    await dialog.getByRole("tab", { name: /csv/i }).click();

    // Upload a CSV file via file chooser
    const csvContent =
      "Title,Description\nCSV Task One,Description for task one\nCSV Task Two,Description for task two";
    const csvBuffer = Buffer.from(csvContent, "utf-8");

    const fileChooserPromise = userAPage.waitForEvent("filechooser");
    await dialog.getByText("Choose file").click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: "e2e-import.csv",
      mimeType: "text/csv",
      buffer: csvBuffer,
    });

    // Wait for column mapping step to appear
    await expect(dialog.getByText(/map columns/i)).toBeVisible({
      timeout: 10_000,
    });

    // The auto-detection should map "Title" -> Title. Click Continue to preview.
    await dialog
      .getByRole("button", { name: /continue to preview/i })
      .click();

    // Preview should show 2 tasks
    await expect(dialog.getByText("Preview (2 tasks)")).toBeVisible({
      timeout: 5_000,
    });

    // Click import
    await dialog.getByRole("button", { name: /import 2 tasks/i }).click();

    // Wait for dialog to close
    await expect(dialog).not.toBeVisible({ timeout: 30_000 });

    // Verify tasks appear on the board
    await expect(userAPage.getByText("CSV Task One")).toBeVisible({
      timeout: 10_000,
    });
    await expect(userAPage.getByText("CSV Task Two")).toBeVisible();
  });

  test("import tasks via JSON", async ({ userAPage }) => {
    await userAPage.goto(`/ideas/${jsonIdeaId}/board`);

    // Wait for board
    await userAPage
      .locator('[data-testid^="column-"]')
      .first()
      .waitFor({ timeout: 15_000 });

    // Open import dialog
    await userAPage.getByRole("button", { name: /import/i }).click();

    const dialog = userAPage.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 5_000 });

    // Switch to JSON tab
    await dialog.getByRole("tab", { name: /json/i }).click();

    // Paste JSON into the textarea (custom format with "tasks" array)
    // Include a "column" field matching "To Do" so the auto-mapper assigns tasks correctly
    const jsonData = JSON.stringify({
      tasks: [
        { title: "JSON Task One", description: "Desc 1", column: "To Do" },
        { title: "JSON Task Two", description: "Desc 2", column: "To Do" },
      ],
    });

    const jsonTextarea = dialog.getByRole("textbox");
    await jsonTextarea.fill(jsonData);

    // Click "Parse JSON" to process
    await dialog.getByRole("button", { name: /parse json/i }).click();

    // Wait for preview to appear
    await expect(dialog.getByText(/json import/i)).toBeVisible({
      timeout: 15_000,
    });

    // The preview table should show 2 tasks
    await expect(dialog.getByText("Preview (2 tasks)")).toBeVisible({
      timeout: 10_000,
    });

    // Click import
    await dialog.getByRole("button", { name: /import 2 tasks/i }).click();

    // Wait for dialog to close (import uses client-side batch inserts)
    await expect(dialog).not.toBeVisible({ timeout: 30_000 });

    // Verify tasks appear on the board (may need a reload since import uses client-side Supabase)
    await userAPage.waitForTimeout(2000);

    const jsonTask1 = userAPage.getByText("JSON Task One");
    if (!(await jsonTask1.isVisible())) {
      // Import may not trigger Realtime fast enough — reload to see tasks
      await userAPage.reload();
      await userAPage
        .locator('[data-testid^="column-"]')
        .first()
        .waitFor({ timeout: 15_000 });
    }

    await expect(userAPage.getByText("JSON Task One")).toBeVisible({
      timeout: 10_000,
    });
    await expect(userAPage.getByText("JSON Task Two")).toBeVisible();
  });

  test("shows warning when exceeding 500 task limit", async ({
    userAPage,
  }) => {
    await userAPage.goto(`/ideas/${limitIdeaId}/board`);

    // Wait for board
    await userAPage
      .locator('[data-testid^="column-"]')
      .first()
      .waitFor({ timeout: 15_000 });

    // Open import dialog
    await userAPage.getByRole("button", { name: /import/i }).click();

    const dialog = userAPage.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 5_000 });

    // Bulk Text tab is active by default
    // Generate 501 lines of task titles
    const lines = Array.from({ length: 501 }, (_, i) => `Limit Task ${i + 1}`);
    const textarea = dialog.getByRole("textbox");
    await textarea.fill(lines.join("\n"));

    // Preview should show 501 tasks in count
    await expect(dialog.getByText("Preview (501 tasks)")).toBeVisible({
      timeout: 5_000,
    });

    // The warning message about the 500 limit should be visible
    await expect(
      dialog.getByText(/only the first 500 tasks will be imported/i)
    ).toBeVisible();

    // The import button shows the raw count (501) in the bulk text tab
    await expect(
      dialog.getByRole("button", { name: /import 501 tasks/i })
    ).toBeVisible();
  });
});
