import type { Page, Locator } from "@playwright/test";

/** Common page selectors for reuse across tests */
export const selectors = {
  // Navigation
  navbar: (page: Page) => page.locator("nav"),
  navLink: (page: Page, name: string) => page.getByRole("link", { name }),

  // Auth forms
  emailInput: (page: Page) => page.getByLabel("Email"),
  passwordInput: (page: Page) => page.getByLabel("Password"),
  submitButton: (page: Page, name: string) => page.getByRole("button", { name }),

  // Ideas
  ideaCard: (page: Page, id: string) => page.locator(`[data-testid="idea-card-${id}"]`),
  voteButton: (page: Page) => page.locator('[data-testid="vote-button"]'),

  // Board
  boardColumn: (page: Page, id: string) => page.locator(`[data-testid="column-${id}"]`),
  taskCard: (page: Page, id: string) => page.locator(`[data-testid="task-card-${id}"]`),
  taskDragHandle: (page: Page) => page.locator('[data-testid="task-drag-handle"]'),
  columnDragHandle: (page: Page) => page.locator('[data-testid="column-drag-handle"]'),

  // Dashboard
  statsCard: (page: Page, type: string) => page.locator(`[data-testid="stats-${type}"]`),
  section: (page: Page, id: string) => page.locator(`[data-testid="section-${id}"]`),

  // Notifications
  notificationBell: (page: Page) => page.locator('[data-testid="notification-bell"]'),

  // Toasts (sonner)
  toast: (page: Page) => page.locator('[data-sonner-toast]'),
  toastWithText: (page: Page, text: string) =>
    page.locator('[data-sonner-toast]').filter({ hasText: text }),
} as const;

/** Wait for a sonner toast to appear with specific text */
export async function waitForToast(page: Page, text: string, timeout = 5000) {
  await page.locator('[data-sonner-toast]').filter({ hasText: text }).waitFor({ timeout });
}

/** Wait for navigation to complete at a specific path */
export async function waitForNavigation(page: Page, path: string, timeout = 10000) {
  await page.waitForURL(`**${path}`, { timeout });
}

/** Get all visible idea cards on the page */
export function getIdeaCards(page: Page): Locator {
  return page.locator('[data-testid^="idea-card-"]');
}

/** Get all visible board columns */
export function getBoardColumns(page: Page): Locator {
  return page.locator('[data-testid^="column-"]');
}

/** Get all visible task cards */
export function getTaskCards(page: Page): Locator {
  return page.locator('[data-testid^="task-card-"]');
}
