import type { Page, Locator } from "@playwright/test";

/**
 * Simulate @happy-doc/dnd (react-beautiful-dnd fork) drag-and-drop.
 * rbd activates drag on mouse-down + small movement (no distance threshold
 * like @dnd-kit's 8px MouseSensor). The library listens for mousedown on
 * drag handles, then mousemove to start the drag, and mouseup to drop.
 */
export async function dragAndDrop(
  page: Page,
  source: Locator,
  target: Locator,
  options?: { offsetX?: number; offsetY?: number }
) {
  const sourceBox = await source.boundingBox();
  const targetBox = await target.boundingBox();

  if (!sourceBox || !targetBox) {
    throw new Error("Could not get bounding box for source or target element");
  }

  const startX = sourceBox.x + sourceBox.width / 2;
  const startY = sourceBox.y + sourceBox.height / 2;
  const endX = targetBox.x + (options?.offsetX ?? targetBox.width / 2);
  const endY = targetBox.y + (options?.offsetY ?? targetBox.height / 2);

  // Mouse down on source drag handle
  await page.mouse.move(startX, startY);
  await page.mouse.down();

  // Small movement to trigger rbd's drag activation
  await page.mouse.move(startX, startY + 5, { steps: 2 });

  // Wait for rbd to recognise the drag
  await page.waitForTimeout(200);

  // Move to target in smooth steps
  await page.mouse.move(endX, endY, { steps: 15 });

  // Pause for rbd to register the hover position
  await page.waitForTimeout(150);

  // Drop
  await page.mouse.up();

  // Wait for optimistic UI to settle
  await page.waitForTimeout(300);
}

/** Drag a task card to a different column */
export async function dragTaskToColumn(
  page: Page,
  taskCardLocator: Locator,
  targetColumnLocator: Locator
) {
  const dragHandle = taskCardLocator.locator('[data-testid="task-drag-handle"]');
  const targetDropZone = targetColumnLocator.locator(".min-h-\\[60px\\]");

  await dragAndDrop(page, dragHandle, targetDropZone);
}

/** Drag a column to a new position */
export async function dragColumnToPosition(
  page: Page,
  sourceColumnLocator: Locator,
  targetColumnLocator: Locator
) {
  const dragHandle = sourceColumnLocator.locator('[data-testid="column-drag-handle"]');

  await dragAndDrop(page, dragHandle, targetColumnLocator);
}
