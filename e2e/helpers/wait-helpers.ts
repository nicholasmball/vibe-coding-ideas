import type { Page } from "@playwright/test";

/** Wait for the page to be fully loaded (DOM content loaded + short settle) */
export async function waitForPageLoad(page: Page) {
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(1000);
}

/** Wait for a sonner toast to appear and optionally click its action button */
export async function waitForToast(
  page: Page,
  text: string,
  options?: { clickAction?: string; timeout?: number }
) {
  const toast = page.locator('[data-sonner-toast]').filter({ hasText: text });
  await toast.waitFor({ timeout: options?.timeout ?? 5000 });

  if (options?.clickAction) {
    await toast.getByRole("button", { name: options.clickAction }).click();
  }

  return toast;
}

/** Wait for the undo toast and click undo */
export async function clickUndoToast(page: Page, text: string) {
  return waitForToast(page, text, { clickAction: "Undo" });
}

/** Wait for a dialog to appear */
export async function waitForDialog(page: Page, title?: string) {
  const dialog = page.getByRole("dialog");
  await dialog.waitFor();
  if (title) {
    await dialog.getByText(title).waitFor();
  }
  return dialog;
}

/** Wait for Supabase Realtime to propagate changes (generous timeout) */
export async function waitForRealtime(page: Page, timeout = 10_000) {
  await page.waitForTimeout(Math.min(timeout, 5000));
}

/** Dismiss any visible toasts by clicking elsewhere */
export async function dismissToasts(page: Page) {
  // Click somewhere neutral to dismiss toasts
  await page.mouse.click(0, 0);
  await page.waitForTimeout(500);
}
