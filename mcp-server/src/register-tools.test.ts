import { describe, it, expect, vi } from "vitest";
import { registerTools } from "./register-tools";
import type { McpContext } from "./context";

const EXPECTED_TOOL_NAMES = [
  "list_ideas",
  "get_idea",
  "get_board",
  "get_task",
  "get_my_tasks",
  "create_task",
  "update_task",
  "move_task",
  "delete_task",
  "update_idea_description",
  "create_idea",
  "delete_idea",
  "update_idea_status",
  "update_idea_tags",
  "toggle_vote",
  "add_collaborator",
  "remove_collaborator",
  "list_collaborators",
  "create_column",
  "update_column",
  "delete_column",
  "reorder_columns",
  "manage_labels",
  "manage_checklist",
  "add_idea_comment",
  "add_task_comment",
  "report_bug",
  "list_attachments",
  "upload_attachment",
  "delete_attachment",
  "list_notifications",
  "mark_notification_read",
  "mark_all_notifications_read",
  "update_profile",
];

function createMockServer() {
  return { tool: vi.fn() };
}

describe("registerTools", () => {
  it("registers exactly 30 tools", () => {
    const server = createMockServer();
    const getContext = vi.fn();

    registerTools(server, getContext);

    expect(server.tool).toHaveBeenCalledTimes(34);
  });

  it("registers all expected tool names", () => {
    const server = createMockServer();
    const getContext = vi.fn();

    registerTools(server, getContext);

    const registeredNames = server.tool.mock.calls.map(
      (call: unknown[]) => call[0]
    );
    expect(registeredNames).toEqual(EXPECTED_TOOL_NAMES);
  });

  it("registers each tool with name, description, schema, and callback", () => {
    const server = createMockServer();
    const getContext = vi.fn();

    registerTools(server, getContext);

    for (const call of server.tool.mock.calls) {
      const [name, description, schema, callback] = call;
      expect(typeof name).toBe("string");
      expect(typeof description).toBe("string");
      expect(description.length).toBeGreaterThan(0);
      expect(typeof schema).toBe("object");
      expect(typeof callback).toBe("function");
    }
  });

  it("returns error result when getContext throws", async () => {
    const server = createMockServer();
    const getContext = vi.fn(() => {
      throw new Error("Authentication required");
    });

    registerTools(server, getContext);

    // Invoke the first tool callback (list_ideas)
    const callback = server.tool.mock.calls[0][3];
    const result = await callback({}, {});

    expect(result.isError).toBe(true);
    expect(result.content[0].type).toBe("text");
    expect(result.content[0].text).toContain("Authentication required");
  });

  it("returns error result when tool handler throws", async () => {
    const server = createMockServer();
    // Provide a context with a non-functional supabase client
    // The tool handler will fail when trying to use it
    const mockContext: McpContext = {
      supabase: {} as McpContext["supabase"],
      userId: "test-user",
    };
    const getContext = vi.fn(() => mockContext);

    registerTools(server, getContext);

    // Invoke create_task (index 5) with valid-shaped args that will fail at DB
    const callback = server.tool.mock.calls[5][3];
    const result = await callback(
      {
        idea_id: "00000000-0000-0000-0000-000000000001",
        column_id: "00000000-0000-0000-0000-000000000002",
        title: "Test task",
      },
      {}
    );

    expect(result.isError).toBe(true);
    expect(result.content[0].type).toBe("text");
    expect(result.content[0].text).toMatch(/^Error: /);
  });

  it("returns error result on schema validation failure", async () => {
    const server = createMockServer();
    const getContext = vi.fn(() => ({
      supabase: {} as McpContext["supabase"],
      userId: "test-user",
    }));

    registerTools(server, getContext);

    // Invoke get_idea (index 1) with invalid args (missing required idea_id)
    const callback = server.tool.mock.calls[1][3];
    const result = await callback({}, {});

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Error:");
  });

  it("calls getContext with the extra argument", async () => {
    const server = createMockServer();
    const getContext = vi.fn(() => {
      throw new Error("stop here");
    });

    registerTools(server, getContext);

    const extra = { authInfo: { token: "abc", userId: "user-1" } };
    const callback = server.tool.mock.calls[0][3];
    await callback({}, extra);

    expect(getContext).toHaveBeenCalledWith(extra);
  });
});
