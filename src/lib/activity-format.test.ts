import { describe, it, expect } from "vitest";
import { formatActivityDetails, groupIntoSessions, SESSION_GAP_MS } from "./activity-format";

describe("formatActivityDetails", () => {
  it("returns null when details is null", () => {
    expect(formatActivityDetails("moved", null)).toBeNull();
  });

  it("returns null for unknown action types", () => {
    expect(formatActivityDetails("unknown_action", { foo: "bar" })).toBeNull();
  });

  it("formats title_changed with from and to", () => {
    expect(
      formatActivityDetails("title_changed", { from: "Old Title", to: "New Title" })
    ).toBe('from "Old Title" to "New Title"');
  });

  it("formats title_changed with only to", () => {
    expect(
      formatActivityDetails("title_changed", { to: "New Title" })
    ).toBe('to "New Title"');
  });

  it("returns null for title_changed with empty details", () => {
    expect(formatActivityDetails("title_changed", {})).toBeNull();
  });

  it("formats moved with to_column", () => {
    expect(formatActivityDetails("moved", { to_column: "In Progress" })).toBe(
      "to In Progress"
    );
  });

  it("formats assigned with assignee_name", () => {
    expect(formatActivityDetails("assigned", { assignee_name: "Alice" })).toBe(
      "to Alice"
    );
  });

  it("returns null for assigned without assignee_name (MCP style)", () => {
    expect(
      formatActivityDetails("assigned", { assignee_id: "some-uuid" })
    ).toBeNull();
  });

  it("formats due_date_set with date", () => {
    const result = formatActivityDetails("due_date_set", {
      due_date: "2026-03-15T00:00:00.000Z",
    });
    expect(result).toMatch(/Mar 15/);
  });

  it("formats label_added with label_name", () => {
    expect(formatActivityDetails("label_added", { label_name: "Bug" })).toBe(
      '"Bug"'
    );
  });

  it("formats label_removed with label_name", () => {
    expect(
      formatActivityDetails("label_removed", { label_name: "Enhancement" })
    ).toBe('"Enhancement"');
  });

  it("formats checklist_item_added with title (UI style)", () => {
    expect(
      formatActivityDetails("checklist_item_added", { title: "Write tests" })
    ).toBe('"Write tests"');
  });

  it("formats checklist_item_added with item_title (MCP style)", () => {
    expect(
      formatActivityDetails("checklist_item_added", { item_title: "Deploy" })
    ).toBe('"Deploy"');
  });

  it("formats checklist_item_completed with title", () => {
    expect(
      formatActivityDetails("checklist_item_completed", { title: "Write tests" })
    ).toBe('"Write tests"');
  });

  it("formats attachment_added with file_name", () => {
    expect(
      formatActivityDetails("attachment_added", { file_name: "screenshot.png" })
    ).toBe('"screenshot.png"');
  });

  it("formats attachment_removed with file_name", () => {
    expect(
      formatActivityDetails("attachment_removed", { file_name: "old.pdf" })
    ).toBe('"old.pdf"');
  });

  it("returns null for actions without details (created, archived, etc.)", () => {
    expect(formatActivityDetails("created", {})).toBeNull();
    expect(formatActivityDetails("archived", {})).toBeNull();
    expect(formatActivityDetails("unarchived", {})).toBeNull();
    expect(formatActivityDetails("comment_added", {})).toBeNull();
    expect(formatActivityDetails("description_changed", {})).toBeNull();
  });
});

describe("groupIntoSessions", () => {
  it("returns empty array for empty input", () => {
    expect(groupIntoSessions([])).toEqual([]);
  });

  it("returns single session for single entry", () => {
    const entries = [{ created_at: "2026-01-01T10:00:00Z" }];
    const result = groupIntoSessions(entries);
    expect(result).toHaveLength(1);
    expect(result[0]).toHaveLength(1);
  });

  it("groups entries within 30 minutes into one session", () => {
    const entries = [
      { created_at: "2026-01-01T10:25:00Z" },
      { created_at: "2026-01-01T10:15:00Z" },
      { created_at: "2026-01-01T10:05:00Z" },
      { created_at: "2026-01-01T10:00:00Z" },
    ];
    const result = groupIntoSessions(entries);
    expect(result).toHaveLength(1);
    expect(result[0]).toHaveLength(4);
  });

  it("splits into sessions at 30-minute gaps", () => {
    const entries = [
      { created_at: "2026-01-01T12:00:00Z" }, // session 2
      { created_at: "2026-01-01T10:20:00Z" }, // session 1
      { created_at: "2026-01-01T10:00:00Z" }, // session 1
    ];
    const result = groupIntoSessions(entries);
    expect(result).toHaveLength(2);
    expect(result[0]).toHaveLength(1); // 12:00
    expect(result[1]).toHaveLength(2); // 10:20, 10:00
  });

  it("creates three sessions from three clusters", () => {
    const base = new Date("2026-01-01T10:00:00Z").getTime();
    // Clusters at base, base+2h, base+4h — each with 2 entries 5s apart
    const hour = 60 * 60 * 1000;

    const entries = [
      { created_at: new Date(base + hour * 4 + 5000).toISOString() },
      { created_at: new Date(base + hour * 4).toISOString() },
      { created_at: new Date(base + hour * 2 + 5000).toISOString() },
      { created_at: new Date(base + hour * 2).toISOString() },
      { created_at: new Date(base + 5000).toISOString() },
      { created_at: new Date(base).toISOString() },
    ];

    const result = groupIntoSessions(entries);
    expect(result).toHaveLength(3);
    expect(result[0]).toHaveLength(2);
    expect(result[1]).toHaveLength(2);
    expect(result[2]).toHaveLength(2);
  });

  it("handles entries exactly at boundary (30 min apart = same session)", () => {
    const base = new Date("2026-01-01T10:00:00Z").getTime();
    const entries = [
      { created_at: new Date(base + SESSION_GAP_MS).toISOString() },
      { created_at: new Date(base).toISOString() },
    ];
    const result = groupIntoSessions(entries);
    expect(result).toHaveLength(1);
    expect(result[0]).toHaveLength(2);
  });
});
