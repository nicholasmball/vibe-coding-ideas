import { test, expect } from "../fixtures/auth";
import { cleanupTestData } from "../fixtures/test-data";

test.describe("Create Idea", () => {
  test.afterAll(async () => {
    await cleanupTestData();
  });

  test.describe("Form display", () => {
    test("should display the idea creation form at /ideas/new", async ({
      userAPage,
    }) => {
      await userAPage.goto("/ideas/new");

      // Form header
      await expect(userAPage.getByText("Share Your Idea")).toBeVisible();

      // Required fields
      await expect(userAPage.getByLabel("Title")).toBeVisible();
      await expect(userAPage.getByLabel("Description")).toBeVisible();

      // Tags section
      await expect(userAPage.getByText("Tags")).toBeVisible();

      // GitHub URL field
      await expect(userAPage.getByLabel(/GitHub URL/i)).toBeVisible();

      // Visibility toggle
      await expect(userAPage.getByText("Private idea")).toBeVisible();

      // Submit and Cancel buttons
      await expect(
        userAPage.getByRole("button", { name: /submit idea/i })
      ).toBeVisible();
      await expect(
        userAPage.getByRole("button", { name: /cancel/i })
      ).toBeVisible();
    });
  });

  test.describe("Creating ideas", () => {
    test("should create a public idea with title, description, and tags, then redirect to detail page", async ({
      userAPage,
    }) => {
      await userAPage.goto("/ideas/new");

      const title = `[E2E] Public Idea ${Date.now()}`;
      const description =
        "[E2E] This is a test description for the public idea.";

      // Fill title and description
      await userAPage.getByLabel("Title").fill(title);
      await userAPage.getByLabel("Description").fill(description);

      // Add tags via keyboard — need sufficient delays for React state updates
      // After first tag is added, placeholder changes to "" so re-locate via container input
      const tagInput = userAPage.getByPlaceholder("Add tags...");
      await tagInput.click();
      await tagInput.fill("react");
      await userAPage.waitForTimeout(500);
      await tagInput.press("Enter");
      await userAPage.waitForTimeout(500);

      // After first tag, placeholder is empty — use input inside the tag container
      const tagInputAfter = userAPage.locator(".flex.flex-wrap.gap-2 input").first();
      await tagInputAfter.fill("typescript");
      await userAPage.waitForTimeout(500);
      await tagInputAfter.press("Enter");
      await userAPage.waitForTimeout(500);

      // Verify tags appear as badges
      await expect(userAPage.getByText("react")).toBeVisible();

      // Submit the form
      const submitButton = userAPage.getByRole("button", { name: /submit idea/i });
      await expect(submitButton).toBeEnabled({ timeout: 5_000 });
      await submitButton.click();

      // Should redirect to the idea detail page (UUID-specific pattern to avoid matching /ideas/new)
      await userAPage.waitForURL(/\/ideas\/[a-f0-9-]{36}$/, { timeout: 30_000 });

      // Wait for the detail page content to fully load
      // Title is in an inline-edit textbox for authors — use locator with input value
      const titleInput = userAPage.locator(`input[value="${title}"]`);
      await expect(titleInput).toBeVisible({ timeout: 30_000 });
      await expect(userAPage.getByText(description)).toBeVisible({ timeout: 15_000 });
    });

    test("should support adding multiple tags via Enter key and comma", async ({
      userAPage,
    }) => {
      await userAPage.goto("/ideas/new");

      // When no tags, placeholder is shown
      const tagInput = userAPage.getByPlaceholder("Add tags...");
      await expect(tagInput).toBeVisible();

      // Add first tag via Enter
      await tagInput.click();
      await tagInput.fill("nextjs");
      await userAPage.waitForTimeout(500);
      await tagInput.press("Enter");
      await userAPage.waitForTimeout(500);

      // After first tag, placeholder is empty — use input inside the tag container
      const tagInputAfter = userAPage.locator(".flex.flex-wrap.gap-2 input").first();

      // Add second tag via comma
      await tagInputAfter.fill("supabase");
      await userAPage.waitForTimeout(500);
      await tagInputAfter.press(",");
      await userAPage.waitForTimeout(500);

      // Add third tag via Enter
      await tagInputAfter.fill("tailwind");
      await userAPage.waitForTimeout(500);
      await tagInputAfter.press("Enter");
      await userAPage.waitForTimeout(500);

      // All three should be visible as badges
      const tagContainer = userAPage.locator(".flex.flex-wrap.gap-2").first();
      await expect(tagContainer.getByText("nextjs")).toBeVisible();
      await expect(tagContainer.getByText("supabase")).toBeVisible();
      await expect(tagContainer.getByText("tailwind")).toBeVisible();

      // Remove a tag by clicking the X button (Badge renders as <span>)
      const supabaseBadge = tagContainer
        .locator('[data-slot="badge"]')
        .filter({ hasText: "supabase" })
        .first();
      await supabaseBadge.locator("button").click();

      // Supabase tag should be removed
      await expect(tagContainer.getByText("supabase")).not.toBeVisible();
      // Others should remain
      await expect(tagContainer.getByText("nextjs")).toBeVisible();
      await expect(tagContainer.getByText("tailwind")).toBeVisible();
    });

    test("should show validation error when submitting without a title", async ({
      userAPage,
    }) => {
      await userAPage.goto("/ideas/new");

      // Fill only description, leave title empty
      await userAPage.getByLabel("Description").fill("[E2E] Some description");

      // Try to submit
      await userAPage.getByRole("button", { name: /submit idea/i }).click();

      // Browser-level HTML5 required validation prevents submission.
      // The page should NOT navigate away from /ideas/new.
      await userAPage.waitForTimeout(1000);
      expect(userAPage.url()).toContain("/ideas/new");

      // The title input should have the :invalid pseudo-class via HTML5 required attribute
      const titleInput = userAPage.getByLabel("Title");
      const isRequired = await titleInput.getAttribute("required");
      expect(isRequired).not.toBeNull();
    });

    test("should create an idea with a GitHub URL", async ({ userAPage }) => {
      await userAPage.goto("/ideas/new");

      const title = `[E2E] Idea With GitHub ${Date.now()}`;
      const githubUrl = "https://github.com/test-user/test-repo";

      await userAPage.getByLabel("Title").fill(title);
      await userAPage
        .getByLabel("Description")
        .fill("[E2E] Idea with a linked repository.");
      await userAPage.getByLabel(/GitHub URL/i).fill(githubUrl);

      await userAPage.getByRole("button", { name: /submit idea/i }).click();

      // Should redirect to idea detail (UUID-specific pattern to avoid matching /ideas/new)
      await userAPage.waitForURL(/\/ideas\/[a-f0-9-]{36}$/, { timeout: 30_000 });

      // The detail page should show the GitHub repository link
      await expect(
        userAPage.getByRole("link", { name: /view repository/i })
      ).toBeVisible();
    });

    test("should toggle visibility between public and private", async ({
      userAPage,
    }) => {
      await userAPage.goto("/ideas/new");

      // By default, the private toggle should be off (public)
      const privateSwitch = userAPage.locator("#private-toggle");
      await expect(privateSwitch).toBeVisible();

      // Check that hidden input has "public" value
      const hiddenVisibility = userAPage.locator(
        'input[name="visibility"][type="hidden"]'
      );
      await expect(hiddenVisibility).toHaveValue("public");

      // Toggle to private
      await privateSwitch.click();
      await expect(hiddenVisibility).toHaveValue("private");

      // Toggle back to public
      await privateSwitch.click();
      await expect(hiddenVisibility).toHaveValue("public");
    });

    test("should create a private idea and show the private badge", async ({
      userAPage,
    }) => {
      await userAPage.goto("/ideas/new");

      const title = `[E2E] Private Idea ${Date.now()}`;

      await userAPage.getByLabel("Title").fill(title);
      await userAPage
        .getByLabel("Description")
        .fill("[E2E] This is a private idea for testing.");

      // Toggle to private
      await userAPage.locator("#private-toggle").click();

      const submitBtn = userAPage.getByRole("button", { name: /submit idea/i });
      await expect(submitBtn).toBeEnabled({ timeout: 5_000 });
      await submitBtn.click();

      // Should redirect to idea detail (UUID-specific pattern to avoid matching /ideas/new)
      await userAPage.waitForURL(/\/ideas\/[a-f0-9-]{36}$/, { timeout: 30_000 });

      // Should show the Private badge on the detail page
      // Use a more specific selector to avoid matching other elements
      await expect(userAPage.locator("main").getByText("Private").first()).toBeVisible({ timeout: 15_000 });
    });
  });
});
