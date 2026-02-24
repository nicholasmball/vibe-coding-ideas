import type { Page, Locator } from "@playwright/test";

/**
 * Simulate @dnd-kit drag-and-drop with mouse events.
 * @dnd-kit uses MouseSensor with distance: 8, so we need to:
 * 1. Mouse down on drag handle
 * 2. Move past 8px activation distance
 * 3. Move to target position
 * 4. Mouse up to drop
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

  // Mouse down on source
  await page.mouse.move(startX, startY);
  await page.mouse.down();

  // Move past 8px activation distance
  await page.mouse.move(startX + 10, startY, { steps: 3 });

  // Small pause for DnD to activate
  await page.waitForTimeout(100);

  // Move to target
  await page.mouse.move(endX, endY, { steps: 10 });

  // Small pause for position to register
  await page.waitForTimeout(100);

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
