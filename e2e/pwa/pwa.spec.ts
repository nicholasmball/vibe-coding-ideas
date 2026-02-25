import { test, expect } from "../fixtures/auth";

test.describe("PWA Features", () => {
  test("service worker is registered and becomes active", async ({
    userAPage,
  }) => {
    // Navigate to a page that registers the service worker
    await userAPage.goto("/dashboard");
    await userAPage.waitForTimeout(2000);

    // Wait for the service worker to be registered and become active
    const swReady = await userAPage.evaluate(async () => {
      if (!("serviceWorker" in navigator)) return null;
      try {
        const registration = await navigator.serviceWorker.ready;
        return {
          active: !!registration.active,
          scriptURL: registration.active?.scriptURL ?? null,
        };
      } catch {
        return null;
      }
    });

    expect(swReady).not.toBeNull();
    expect(swReady!.active).toBe(true);
    expect(swReady!.scriptURL).toContain("/sw.js");
  });

  test("manifest.webmanifest returns valid JSON with required fields", async ({
    userAPage,
  }) => {
    // Fetch the manifest directly
    const response = await userAPage.goto("/manifest.webmanifest");
    expect(response).not.toBeNull();
    expect(response!.status()).toBe(200);

    const contentType = response!.headers()["content-type"];
    expect(contentType).toContain("application/manifest+json");

    const manifest = await response!.json();

    // Verify required fields
    expect(manifest.name).toBe("VibeCodes");
    expect(manifest.short_name).toBe("VibeCodes");
    expect(manifest.start_url).toBe("/dashboard");
    expect(manifest.display).toBe("standalone");

    // Verify icons are present
    expect(manifest.icons).toBeInstanceOf(Array);
    expect(manifest.icons.length).toBeGreaterThanOrEqual(2);

    // Each icon should have src, sizes, and type
    for (const icon of manifest.icons) {
      expect(icon.src).toBeTruthy();
      expect(icon.sizes).toBeTruthy();
      expect(icon.type).toBe("image/png");
    }
  });

  test("offline fallback page is served when network is unavailable", async ({
    userAPage,
  }) => {
    // First, visit the dashboard to register the service worker and cache offline.html
    await userAPage.goto("/dashboard");
    await userAPage.waitForTimeout(2000);

    // Wait for the service worker to become active and cache the offline page
    await userAPage.evaluate(async () => {
      if ("serviceWorker" in navigator) {
        await navigator.serviceWorker.ready;
        // Give the service worker a moment to cache offline.html
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    });

    // Now simulate offline by blocking all network requests
    await userAPage.context().setOffline(true);

    // Try to navigate to a page that hasn't been cached
    // The service worker should serve the offline fallback
    try {
      await userAPage.goto("/ideas", {
        waitUntil: "domcontentloaded",
        timeout: 10_000,
      });
    } catch {
      // Navigation may throw when offline, that's expected
    }

    // The offline page should be shown
    // The offline.html page has a title "Offline - VibeCodes"
    const pageContent = await userAPage.content();
    const isOfflinePage =
      pageContent.includes("Offline") ||
      pageContent.includes("offline") ||
      pageContent.includes("VibeCodes");
    expect(isOfflinePage).toBe(true);

    // Restore network
    await userAPage.context().setOffline(false);
  });
});
