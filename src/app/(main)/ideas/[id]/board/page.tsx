import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { initializeBoardColumns } from "@/actions/board";
import { KanbanBoard } from "@/components/board/kanban-board";
import { BoardRealtime } from "@/components/board/board-realtime";
import { Button } from "@/components/ui/button";
import type {
  BoardColumnWithTasks,
  BoardTaskWithAssignee,
  BoardLabel,
  BoardChecklistItem,
  User,
} from "@/types";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data: idea } = await supabase
    .from("ideas")
    .select("title")
    .eq("id", id)
    .single();

  if (!idea) return { title: "Board - Not Found" };

  return {
    title: `Board - ${idea.title} - VibeCodes`,
  };
}

export default async function BoardPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch idea
  const { data: idea } = await supabase
    .from("ideas")
    .select("id, title, author_id")
    .eq("id", id)
    .single();

  if (!idea) notFound();

  // Check if user is author or collaborator
  const isAuthor = user.id === idea.author_id;
  let isCollaborator = false;
  if (!isAuthor) {
    const { data: collab } = await supabase
      .from("collaborators")
      .select("id")
      .eq("idea_id", id)
      .eq("user_id", user.id)
      .maybeSingle();
    isCollaborator = !!collab;
  }

  if (!isAuthor && !isCollaborator) {
    redirect(`/ideas/${id}`);
  }

  // Lazy-create default columns on first visit
  await initializeBoardColumns(id);

  // Fetch columns ordered by position
  const { data: rawColumns } = await supabase
    .from("board_columns")
    .select("*")
    .eq("idea_id", id)
    .order("position", { ascending: true });

  // Fetch tasks with assignee
  const { data: rawTasks } = await supabase
    .from("board_tasks")
    .select("*, assignee:users!board_tasks_assignee_id_fkey(*)")
    .eq("idea_id", id)
    .order("position", { ascending: true });

  // Fetch board labels
  const { data: boardLabels } = await supabase
    .from("board_labels")
    .select("*")
    .eq("idea_id", id)
    .order("created_at", { ascending: true });

  // Fetch task-label assignments with label data
  const { data: taskLabelRows } = await supabase
    .from("board_task_labels")
    .select("task_id, label:board_labels!board_task_labels_label_id_fkey(*)")
    .in(
      "task_id",
      (rawTasks ?? []).map((t) => t.id)
    );

  // Build taskLabelsMap: Record<taskId, BoardLabel[]>
  const taskLabelsMap: Record<string, BoardLabel[]> = {};
  if (taskLabelRows) {
    for (const row of taskLabelRows) {
      if (!row.label) continue;
      const label = row.label as unknown as BoardLabel;
      if (!taskLabelsMap[row.task_id]) {
        taskLabelsMap[row.task_id] = [];
      }
      taskLabelsMap[row.task_id].push(label);
    }
  }

  // Fetch checklist items
  const { data: rawChecklistItems } = await supabase
    .from("board_checklist_items")
    .select("*")
    .eq("idea_id", id)
    .order("position", { ascending: true });

  // Build checklistItemsByTaskId
  const checklistItemsByTaskId: Record<string, BoardChecklistItem[]> = {};
  if (rawChecklistItems) {
    for (const item of rawChecklistItems) {
      if (!checklistItemsByTaskId[item.task_id]) {
        checklistItemsByTaskId[item.task_id] = [];
      }
      checklistItemsByTaskId[item.task_id].push(item as BoardChecklistItem);
    }
  }

  // Fetch team members (author + collaborators)
  const { data: collabs } = await supabase
    .from("collaborators")
    .select("user:users!collaborators_user_id_fkey(*)")
    .eq("idea_id", id);

  const { data: author } = await supabase
    .from("users")
    .select("*")
    .eq("id", idea.author_id)
    .single();

  const teamMembers: User[] = [];
  if (author) teamMembers.push(author as User);
  if (collabs) {
    collabs.forEach((c) => {
      const u = c.user as unknown as User;
      if (u && !teamMembers.find((m) => m.id === u.id)) {
        teamMembers.push(u);
      }
    });
  }

  // Assemble columns with tasks (including labels)
  const columns: BoardColumnWithTasks[] = (rawColumns ?? []).map((col) => ({
    ...col,
    tasks: (rawTasks ?? [])
      .filter((t) => t.column_id === col.id)
      .map((t) => ({
        ...t,
        assignee: (t.assignee as unknown as User) ?? null,
        labels: taskLabelsMap[t.id] ?? [],
      })) as BoardTaskWithAssignee[],
  }));

  return (
    <div className="flex h-full flex-col overflow-hidden px-4">
      <BoardRealtime ideaId={id} />

      {/* Header */}
      <div className="flex shrink-0 items-center gap-4 py-4">
        <Link href={`/ideas/${id}`}>
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to idea
          </Button>
        </Link>
        <h1 className="text-xl font-bold">{idea.title} — Board</h1>
      </div>

      {/* Kanban Board */}
      <KanbanBoard
        columns={columns}
        ideaId={id}
        teamMembers={teamMembers}
        boardLabels={(boardLabels ?? []) as BoardLabel[]}
        checklistItemsByTaskId={checklistItemsByTaskId}
        currentUserId={user.id}
      />
    </div>
  );
}
