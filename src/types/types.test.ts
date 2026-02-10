import { describe, it, expectTypeOf } from "vitest";
import type {
  BoardTaskWithAssignee,
  BoardTask,
  BoardLabel,
  User,
  DashboardTask,
  NotificationWithDetails,
} from "./index";
import type { Database } from "./database";

describe("BoardTaskWithAssignee type", () => {
  it("includes archived field from BoardTask", () => {
    expectTypeOf<BoardTaskWithAssignee["archived"]>().toEqualTypeOf<boolean>();
  });

  it("includes attachment_count field from BoardTask", () => {
    expectTypeOf<BoardTaskWithAssignee["attachment_count"]>().toEqualTypeOf<number>();
  });

  it("includes cover_image_path field from BoardTask", () => {
    expectTypeOf<BoardTaskWithAssignee["cover_image_path"]>().toEqualTypeOf<string | null>();
  });

  it("includes assignee", () => {
    expectTypeOf<BoardTaskWithAssignee["assignee"]>().toEqualTypeOf<User | null>();
  });

  it("includes labels", () => {
    expectTypeOf<BoardTaskWithAssignee["labels"]>().toEqualTypeOf<BoardLabel[]>();
  });
});

describe("DashboardTask type", () => {
  it("includes archived field", () => {
    expectTypeOf<DashboardTask["archived"]>().toEqualTypeOf<boolean>();
  });

  it("includes column info", () => {
    expectTypeOf<DashboardTask["column"]>().toMatchTypeOf<{
      id: string;
      title: string;
      is_done_column: boolean;
    }>();
  });
});

describe("Notification types", () => {
  it("Row type includes task_mention", () => {
    type RowType = Database["public"]["Tables"]["notifications"]["Row"]["type"];
    expectTypeOf<RowType>().toMatchTypeOf<
      "comment" | "vote" | "collaborator" | "user_deleted" | "status_change" | "task_mention"
    >();
  });

  it("Insert type includes task_mention", () => {
    type InsertType = Database["public"]["Tables"]["notifications"]["Insert"]["type"];
    expectTypeOf<InsertType>().toMatchTypeOf<
      "comment" | "vote" | "collaborator" | "user_deleted" | "status_change" | "task_mention"
    >();
  });

  it("Update type includes task_mention", () => {
    type UpdateType = NonNullable<Database["public"]["Tables"]["notifications"]["Update"]["type"]>;
    // Update type should match Row type exactly (both include task_mention)
    type RowType = Database["public"]["Tables"]["notifications"]["Row"]["type"];
    expectTypeOf<UpdateType>().toEqualTypeOf<RowType>();
  });
});
