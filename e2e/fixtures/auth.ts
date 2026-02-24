import { test as base, type Page } from "@playwright/test";
import path from "path";

const AUTH_DIR = path.join(__dirname, "..", ".auth");

export const test = base.extend<{
  userAPage: Page;
  userBPage: Page;
  adminPage: Page;
  freshPage: Page;
  anonPage: Page;
}>({
  userAPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: path.join(AUTH_DIR, "user-a.json"),
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },

  userBPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: path.join(AUTH_DIR, "user-b.json"),
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },

  adminPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: path.join(AUTH_DIR, "admin.json"),
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },

  freshPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: path.join(AUTH_DIR, "fresh.json"),
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },

  anonPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await use(page);
    await context.close();
  },
});

export { expect } from "@playwright/test";
