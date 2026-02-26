import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the Supabase client
const mockUpdate = vi.fn().mockReturnThis();
const mockEq = vi.fn().mockReturnThis();
const mockInsert = vi.fn().mockReturnThis();
const mockSelect = vi.fn().mockReturnThis();
const mockSingle = vi.fn();
const mockFrom = vi.fn().mockReturnValue({
  update: mockUpdate,
  insert: mockInsert,
  select: mockSelect,
  eq: mockEq,
  single: mockSingle,
});
const mockGetUser = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    from: (...args: unknown[]) => mockFrom(...args),
    auth: {
      getUser: () => mockGetUser(),
    },
  }),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw Object.assign(new Error(`REDIRECT: ${url}`), {
      digest: "NEXT_REDIRECT",
    });
  }),
}));

describe("onboarding actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
    });
    // Default: operations succeed
    mockEq.mockResolvedValue({ error: null });
    mockSingle.mockResolvedValue({
      data: { id: "idea-123" },
      error: null,
    });
  });

  describe("completeOnboarding", () => {
    it("updates onboarding_completed_at on the user row", async () => {
      const { completeOnboarding } = await import("./onboarding");

      // Mock chain: from("users").update(...).eq(...)
      mockUpdate.mockReturnValue({ eq: mockEq });
      mockEq.mockResolvedValue({ error: null });

      await completeOnboarding();

      expect(mockFrom).toHaveBeenCalledWith("users");
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          onboarding_completed_at: expect.any(String),
        })
      );
      expect(mockEq).toHaveBeenCalledWith("id", "user-1");
    });

    it("redirects unauthenticated users to login", async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } });
      const { completeOnboarding } = await import("./onboarding");

      await expect(completeOnboarding()).rejects.toThrow("REDIRECT: /login");
    });
  });

  describe("createIdeaFromOnboarding", () => {
    it("creates an idea and returns the ID", async () => {
      const { createIdeaFromOnboarding } = await import("./onboarding");

      // Mock chain: from("ideas").insert(...).select("id").single()
      mockInsert.mockReturnValue({ select: mockSelect });
      mockSelect.mockReturnValue({ single: mockSingle });
      mockSingle.mockResolvedValue({
        data: { id: "new-idea-id" },
        error: null,
      });

      const result = await createIdeaFromOnboarding({
        title: "My cool app",
        description: "A description",
        tags: ["ai", "web"],
      });

      expect(result).toEqual({ ideaId: "new-idea-id" });
      expect(mockFrom).toHaveBeenCalledWith("ideas");
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "My cool app",
          description: "A description",
          tags: ["ai", "web"],
          visibility: "public",
          author_id: "user-1",
        })
      );
    });

    it("rejects empty titles", async () => {
      const { createIdeaFromOnboarding } = await import("./onboarding");

      await expect(
        createIdeaFromOnboarding({ title: "  ", tags: [] })
      ).rejects.toThrow("Title is required");
    });

    it("rejects too many tags", async () => {
      const { createIdeaFromOnboarding } = await import("./onboarding");
      const tooManyTags = Array.from({ length: 11 }, (_, i) => `tag${i}`);

      await expect(
        createIdeaFromOnboarding({ title: "Test", tags: tooManyTags })
      ).rejects.toThrow("Maximum 10 tags allowed");
    });

    it("uses title as description when description is empty", async () => {
      const { createIdeaFromOnboarding } = await import("./onboarding");

      mockInsert.mockReturnValue({ select: mockSelect });
      mockSelect.mockReturnValue({ single: mockSingle });
      mockSingle.mockResolvedValue({
        data: { id: "new-idea-id" },
        error: null,
      });

      await createIdeaFromOnboarding({ title: "My app", tags: [] });

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          description: "My app",
        })
      );
    });
  });

  describe("updateProfileFromOnboarding", () => {
    it("updates profile fields", async () => {
      const { updateProfileFromOnboarding } = await import("./onboarding");

      mockUpdate.mockReturnValue({ eq: mockEq });
      mockEq.mockResolvedValue({ error: null });

      await updateProfileFromOnboarding({
        full_name: "Nick Ball",
        bio: "Developer",
        github_username: "nickball",
      });

      expect(mockFrom).toHaveBeenCalledWith("users");
      expect(mockUpdate).toHaveBeenCalledWith({
        full_name: "Nick Ball",
        bio: "Developer",
        github_username: "nickball",
      });
    });

    it("skips update when no fields provided", async () => {
      const { updateProfileFromOnboarding } = await import("./onboarding");

      await updateProfileFromOnboarding({});

      // Should not call from() for profile update (only auth.getUser)
      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it("trims empty strings to null", async () => {
      const { updateProfileFromOnboarding } = await import("./onboarding");

      mockUpdate.mockReturnValue({ eq: mockEq });
      mockEq.mockResolvedValue({ error: null });

      await updateProfileFromOnboarding({
        full_name: "  ",
        bio: "",
        github_username: "  ",
      });

      expect(mockUpdate).toHaveBeenCalledWith({
        full_name: null,
        bio: null,
        github_username: null,
      });
    });
  });
});
