import type { McpContext } from "./context";

// Use a duck-typed interface to avoid version conflicts between the main app's
// @modelcontextprotocol/sdk (via mcp-handler) and the mcp-server's copy.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyMcpServer = { tool: (...args: any[]) => any };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ServerExtra = { authInfo?: any; [key: string]: any };

import {
  listIdeas,
  listIdeasSchema,
  getIdea,
  getIdeaSchema,
  updateIdeaDescription,
  updateIdeaDescriptionSchema,
} from "./tools/ideas";
import {
  getBoard,
  getBoardSchema,
  getTask,
  getTaskSchema,
  getMyTasks,
  getMyTasksSchema,
} from "./tools/board-read";
import {
  createTask,
  createTaskSchema,
  updateTask,
  updateTaskSchema,
  moveTask,
  moveTaskSchema,
  deleteTask,
  deleteTaskSchema,
} from "./tools/board-write";
import {
  addIdeaComment,
  addIdeaCommentSchema,
  addTaskComment,
  addTaskCommentSchema,
} from "./tools/comments";
import {
  manageLabels,
  manageLabelsSchema,
  manageChecklist,
  manageChecklistSchema,
  reportBug,
  reportBugSchema,
} from "./tools/labels";
import {
  listAttachments,
  listAttachmentsSchema,
  uploadAttachment,
  uploadAttachmentSchema,
  deleteAttachment,
  deleteAttachmentSchema,
} from "./tools/attachments";

function jsonResult(data: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
  };
}

function errorResult(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return {
    content: [{ type: "text" as const, text: `Error: ${message}` }],
    isError: true,
  };
}

export function registerTools(
  server: AnyMcpServer,
  getContext: (extra: ServerExtra) => McpContext
): void {
  // --- Read Tools ---

  server.tool(
    "list_ideas",
    "List ideas with optional status filter and search. Returns title, status, tags, vote/comment/collaborator counts.",
    listIdeasSchema.shape,
    async (args: Record<string, unknown>, extra: ServerExtra) => {
      try {
        const ctx = getContext(extra);
        return jsonResult(await listIdeas(ctx, listIdeasSchema.parse(args)));
      } catch (e) {
        return errorResult(e);
      }
    }
  );

  server.tool(
    "get_idea",
    "Get full idea detail including description, recent comments, collaborators, and board summary.",
    getIdeaSchema.shape,
    async (args: Record<string, unknown>, extra: ServerExtra) => {
      try {
        const ctx = getContext(extra);
        return jsonResult(await getIdea(ctx, getIdeaSchema.parse(args)));
      } catch (e) {
        return errorResult(e);
      }
    }
  );

  server.tool(
    "get_board",
    "Get complete kanban board: columns with tasks, labels, checklist progress. Initializes default columns if none exist.",
    getBoardSchema.shape,
    async (args: Record<string, unknown>, extra: ServerExtra) => {
      try {
        const ctx = getContext(extra);
        return jsonResult(await getBoard(ctx, getBoardSchema.parse(args)));
      } catch (e) {
        return errorResult(e);
      }
    }
  );

  server.tool(
    "get_task",
    "Get single task detail including checklist items, comments, and recent activity.",
    getTaskSchema.shape,
    async (args: Record<string, unknown>, extra: ServerExtra) => {
      try {
        const ctx = getContext(extra);
        return jsonResult(await getTask(ctx, getTaskSchema.parse(args)));
      } catch (e) {
        return errorResult(e);
      }
    }
  );

  server.tool(
    "get_my_tasks",
    "Get tasks assigned to the bot (Claude Code), grouped by idea. Excludes done/archived by default.",
    getMyTasksSchema.shape,
    async (args: Record<string, unknown>, extra: ServerExtra) => {
      try {
        const ctx = getContext(extra);
        return jsonResult(await getMyTasks(ctx, getMyTasksSchema.parse(args)));
      } catch (e) {
        return errorResult(e);
      }
    }
  );

  // --- Write Tools ---

  server.tool(
    "create_task",
    "Create a new task on a board. Requires idea_id and column_id. Position auto-calculated.",
    createTaskSchema.shape,
    async (args: Record<string, unknown>, extra: ServerExtra) => {
      try {
        const ctx = getContext(extra);
        return jsonResult(await createTask(ctx, createTaskSchema.parse(args)));
      } catch (e) {
        return errorResult(e);
      }
    }
  );

  server.tool(
    "update_task",
    "Update task fields: title, description, assignee, due date, archived status. Only changed fields need to be provided.",
    updateTaskSchema.shape,
    async (args: Record<string, unknown>, extra: ServerExtra) => {
      try {
        const ctx = getContext(extra);
        return jsonResult(await updateTask(ctx, updateTaskSchema.parse(args)));
      } catch (e) {
        return errorResult(e);
      }
    }
  );

  server.tool(
    "move_task",
    "Move a task to a different column. Position auto-calculated if not provided.",
    moveTaskSchema.shape,
    async (args: Record<string, unknown>, extra: ServerExtra) => {
      try {
        const ctx = getContext(extra);
        return jsonResult(await moveTask(ctx, moveTaskSchema.parse(args)));
      } catch (e) {
        return errorResult(e);
      }
    }
  );

  server.tool(
    "delete_task",
    "Permanently delete a task from a board.",
    deleteTaskSchema.shape,
    async (args: Record<string, unknown>, extra: ServerExtra) => {
      try {
        const ctx = getContext(extra);
        return jsonResult(await deleteTask(ctx, deleteTaskSchema.parse(args)));
      } catch (e) {
        return errorResult(e);
      }
    }
  );

  server.tool(
    "update_idea_description",
    "Update/rewrite an idea's description. Supports markdown.",
    updateIdeaDescriptionSchema.shape,
    async (args: Record<string, unknown>, extra: ServerExtra) => {
      try {
        const ctx = getContext(extra);
        return jsonResult(
          await updateIdeaDescription(ctx, updateIdeaDescriptionSchema.parse(args))
        );
      } catch (e) {
        return errorResult(e);
      }
    }
  );

  // --- Supporting Tools ---

  server.tool(
    "manage_labels",
    "Create labels, add labels to tasks, or remove labels from tasks. Actions: create, add_to_task, remove_from_task.",
    manageLabelsSchema.shape,
    async (args: Record<string, unknown>, extra: ServerExtra) => {
      try {
        const ctx = getContext(extra);
        return jsonResult(await manageLabels(ctx, manageLabelsSchema.parse(args)));
      } catch (e) {
        return errorResult(e);
      }
    }
  );

  server.tool(
    "manage_checklist",
    "Add, toggle, or delete checklist items on a task. Actions: add, toggle, delete.",
    manageChecklistSchema.shape,
    async (args: Record<string, unknown>, extra: ServerExtra) => {
      try {
        const ctx = getContext(extra);
        return jsonResult(
          await manageChecklist(ctx, manageChecklistSchema.parse(args))
        );
      } catch (e) {
        return errorResult(e);
      }
    }
  );

  server.tool(
    "add_idea_comment",
    "Add a comment to an idea. Types: comment, suggestion, question. Posted as Claude Code bot.",
    addIdeaCommentSchema.shape,
    async (args: Record<string, unknown>, extra: ServerExtra) => {
      try {
        const ctx = getContext(extra);
        return jsonResult(
          await addIdeaComment(ctx, addIdeaCommentSchema.parse(args))
        );
      } catch (e) {
        return errorResult(e);
      }
    }
  );

  server.tool(
    "add_task_comment",
    "Add a comment to a board task. Posted as Claude Code bot.",
    addTaskCommentSchema.shape,
    async (args: Record<string, unknown>, extra: ServerExtra) => {
      try {
        const ctx = getContext(extra);
        return jsonResult(
          await addTaskComment(ctx, addTaskCommentSchema.parse(args))
        );
      } catch (e) {
        return errorResult(e);
      }
    }
  );

  server.tool(
    "report_bug",
    "Convenience tool: creates a task with a red 'Bug' label, assigned to Claude Code. Uses first column (To Do) by default.",
    reportBugSchema.shape,
    async (args: Record<string, unknown>, extra: ServerExtra) => {
      try {
        const ctx = getContext(extra);
        return jsonResult(await reportBug(ctx, reportBugSchema.parse(args)));
      } catch (e) {
        return errorResult(e);
      }
    }
  );

  // --- Attachment Tools ---

  server.tool(
    "list_attachments",
    "List all attachments for a task with 1-hour signed download URLs.",
    listAttachmentsSchema.shape,
    async (args: Record<string, unknown>, extra: ServerExtra) => {
      try {
        const ctx = getContext(extra);
        return jsonResult(await listAttachments(ctx, listAttachmentsSchema.parse(args)));
      } catch (e) {
        return errorResult(e);
      }
    }
  );

  server.tool(
    "upload_attachment",
    "Upload a file attachment to a task. Accepts base64-encoded file content. Max 10MB. Auto-sets cover image for first image upload.",
    uploadAttachmentSchema.shape,
    async (args: Record<string, unknown>, extra: ServerExtra) => {
      try {
        const ctx = getContext(extra);
        return jsonResult(await uploadAttachment(ctx, uploadAttachmentSchema.parse(args)));
      } catch (e) {
        return errorResult(e);
      }
    }
  );

  server.tool(
    "delete_attachment",
    "Delete a file attachment from a task. Also clears cover image if the deleted attachment was the cover.",
    deleteAttachmentSchema.shape,
    async (args: Record<string, unknown>, extra: ServerExtra) => {
      try {
        const ctx = getContext(extra);
        return jsonResult(await deleteAttachment(ctx, deleteAttachmentSchema.parse(args)));
      } catch (e) {
        return errorResult(e);
      }
    }
  );
}
