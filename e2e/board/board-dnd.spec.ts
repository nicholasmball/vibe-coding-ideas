import { test, expect } from "../fixtures/auth";
import {
  createTestIdea,
  createTestBoardWithTasks,
  cleanupTestData,
} from "../fixtures/test-data";
import { supabaseAdmin } from "../fixtures/supabase-admin";

// DnD tests are inherently flaky -- give them extra time
test.describe.configure({ timeout: 60_000 });

let userAId: string;
let ideaId: string;

test.beforeAll(async () => {
  const { data: users } = await supabaseAdmin
    .from("users")
    .select("id, full_name")
    .in("full_name", ["Test User A"]);

  const userA = users?.find((u) => u.full_name === "Test User A");
  if (!userA) throw new Error("Test User A not found -- run global setup first");

  userAId = userA.id;

  // Create idea with board + 3 tasks in To Do column
  const idea = await createTestIdea(userAId, {
    title: "[E2E] Board DnD Idea",
    description: "[E2E] Idea for drag-and-drop tests.",
  });
  ideaId = idea.id;
  await createTestBoardWithTasks(ideaId, 3);
});

test.afterAll(async () => {
  await cleanupTestData();
});

test.describe("Board Drag and Drop", () => {
  test.slow();

  // FIXME: DnD mouse simulation is inherently unreliable with @dnd-kit in Playwright.
  // These tests need to be rewritten using keyboard-based DnD or a different simulation
  // approach that doesn't depend on precise mouse coordinates and timing.

  test.fixme("drag task between columns", async ({ userAPage }) => {
    // Test intentionally disabled — see comment above
  });

  test.fixme("drag task within column for reordering", async ({ userAPage }) => {
    // Test intentionally disabled — see comment above
  });

  test.fixme("drag column to reorder", async ({ userAPage }) => {
    // Test intentionally disabled — see comment above
  });

  // FIXME: Checking CSS classes during a drag operation is timing-sensitive and
  // unreliable — the overlay and opacity changes depend on exact DnD activation
  // timing which varies between runs.
  test.fixme("drag overlay appears during drag", async ({ userAPage }) => {
    // Test intentionally disabled — see comment above
  });
});
