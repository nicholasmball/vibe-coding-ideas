import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Lightbulb, Plus, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getDueDateStatus } from "@/lib/utils";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { ActiveBoards } from "@/components/dashboard/active-boards";
import type { ActiveBoard } from "@/components/dashboard/active-boards";
import { MyTasksList } from "@/components/dashboard/my-tasks-list";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { IdeaCard } from "@/components/ideas/idea-card";
import { Button } from "@/components/ui/button";
import type {
  IdeaWithAuthor,
  NotificationWithDetails,
  DashboardTask,
  BoardLabel,
} from "@/types";

export const metadata = {
  title: "Dashboard - VibeCodes",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Phase 1: Independent queries
  const [
    myIdeasResult,
    ideasCountResult,
    myIdeaIdsResult,
    collabResult,
    upvotesResult,
    votesResult,
    notificationsResult,
    tasksResult,
  ] = await Promise.all([
    // My ideas (limit 5)
    supabase
      .from("ideas")
      .select("*, author:users!ideas_author_id_fkey(*)")
      .eq("author_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5),
    // Total ideas count
    supabase
      .from("ideas")
      .select("*", { head: true, count: "exact" })
      .eq("author_id", user.id),
    // All my idea IDs (for board queries)
    supabase
      .from("ideas")
      .select("id")
      .eq("author_id", user.id),
    // Collaborations with count
    supabase
      .from("collaborators")
      .select("idea_id", { count: "exact" })
      .eq("user_id", user.id),
    // Upvotes on user's ideas
    supabase
      .from("ideas")
      .select("upvotes")
      .eq("author_id", user.id),
    // User's votes (for IdeaCard hasVoted)
    supabase
      .from("votes")
      .select("idea_id")
      .eq("user_id", user.id),
    // Recent notifications
    supabase
      .from("notifications")
      .select(
        "*, actor:users!notifications_actor_id_fkey(id, full_name, avatar_url, email, bio, github_username, created_at, updated_at), idea:ideas!notifications_idea_id_fkey(id, title)"
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(15),
    // Tasks assigned to user (exclude archived and tasks in done columns)
    supabase
      .from("board_tasks")
      .select(
        "*, column:board_columns!board_tasks_column_id_fkey(id, title, is_done_column), idea:ideas!board_tasks_idea_id_fkey(id, title), assignee:users!board_tasks_assignee_id_fkey(*)"
      )
      .eq("assignee_id", user.id)
      .eq("archived", false),
  ]);

  const myIdeas = (myIdeasResult.data ?? []) as unknown as IdeaWithAuthor[];
  const ideasCount = ideasCountResult.count ?? 0;
  const collabIdeaIds = (collabResult.data ?? []).map((c) => c.idea_id);
  const collaborationsCount = collabResult.count ?? 0;
  const totalUpvotes = (upvotesResult.data ?? []).reduce(
    (sum, idea) => sum + idea.upvotes,
    0
  );
  const votedIdeaIds = new Set((votesResult.data ?? []).map((v) => v.idea_id));
  const notifications = (notificationsResult.data ?? []) as unknown as NotificationWithDetails[];

  // Process tasks — exclude tasks in done columns
  const rawTasks = (
    (tasksResult.data ?? []) as unknown as DashboardTask[]
  ).filter((t) => !t.column.is_done_column);

  // All idea IDs the user owns or collaborates on (for board queries)
  const myIdeaIds = (myIdeaIdsResult.data ?? []).map((i) => i.id);
  const allUserIdeaIds = [...new Set([...myIdeaIds, ...collabIdeaIds])];

  // Phase 2: Dependent queries
  const [collabIdeasResult, taskLabelsResult, boardColumnsResult, boardTasksResult] = await Promise.all([
    // Collaboration idea details
    collabIdeaIds.length > 0
      ? supabase
          .from("ideas")
          .select("*, author:users!ideas_author_id_fkey(*)")
          .in("id", collabIdeaIds)
          .order("created_at", { ascending: false })
          .limit(5)
      : Promise.resolve({ data: [] }),
    // Task labels
    rawTasks.length > 0
      ? supabase
          .from("board_task_labels")
          .select("task_id, label:board_labels!board_task_labels_label_id_fkey(*)")
          .in(
            "task_id",
            rawTasks.map((t) => t.id)
          )
      : Promise.resolve({ data: [] }),
    // Board columns for user's ideas (with idea title for active boards)
    allUserIdeaIds.length > 0
      ? supabase
          .from("board_columns")
          .select("id, idea_id, title, is_done_column, position, idea:ideas!board_columns_idea_id_fkey(id, title)")
          .in("idea_id", allUserIdeaIds)
          .order("position")
      : Promise.resolve({ data: [] }),
    // Board tasks for user's ideas (non-archived only)
    allUserIdeaIds.length > 0
      ? supabase
          .from("board_tasks")
          .select("idea_id, column_id, updated_at")
          .in("idea_id", allUserIdeaIds)
          .eq("archived", false)
      : Promise.resolve({ data: [] }),
  ]);

  const collabIdeas = (collabIdeasResult.data ?? []) as unknown as IdeaWithAuthor[];

  // Process active boards data
  type BoardColumnRow = { id: string; idea_id: string; title: string; is_done_column: boolean; position: number; idea: { id: string; title: string } };
  const boardColumns = (boardColumnsResult.data ?? []) as unknown as BoardColumnRow[];
  const boardTasks = (boardTasksResult.data ?? []) as { idea_id: string; column_id: string; updated_at: string }[];

  // Build idea title map from column joins (covers all ideas with boards)
  const ideaTitleMap = new Map<string, string>();
  for (const col of boardColumns) {
    if (col.idea && !ideaTitleMap.has(col.idea_id)) {
      ideaTitleMap.set(col.idea_id, col.idea.title);
    }
  }

  // Group columns by idea
  const columnsByIdea = new Map<string, BoardColumnRow[]>();
  for (const col of boardColumns) {
    const arr = columnsByIdea.get(col.idea_id) ?? [];
    arr.push(col);
    columnsByIdea.set(col.idea_id, arr);
  }

  // Count tasks per column and track most recent activity per idea
  const taskCountByColumn = new Map<string, number>();
  const lastActivityByIdea = new Map<string, string>();
  for (const task of boardTasks) {
    taskCountByColumn.set(task.column_id, (taskCountByColumn.get(task.column_id) ?? 0) + 1);
    const existing = lastActivityByIdea.get(task.idea_id);
    if (!existing || task.updated_at > existing) {
      lastActivityByIdea.set(task.idea_id, task.updated_at);
    }
  }

  // Build active boards — only ideas with at least one task
  const activeBoards: ActiveBoard[] = [];
  for (const [ideaId, columns] of columnsByIdea) {
    const totalTasks = columns.reduce((sum, col) => sum + (taskCountByColumn.get(col.id) ?? 0), 0);
    if (totalTasks === 0) continue;

    const title = ideaTitleMap.get(ideaId);
    if (!title) continue;

    const columnSummary = columns
      .map((col) => ({
        title: col.title,
        count: taskCountByColumn.get(col.id) ?? 0,
        isDone: col.is_done_column,
      }))
      .filter((c) => c.count > 0);

    activeBoards.push({
      ideaId,
      ideaTitle: title,
      totalTasks,
      columnSummary,
      lastActivity: lastActivityByIdea.get(ideaId) ?? new Date().toISOString(),
    });
  }

  // Sort by most recent activity and limit to 5
  activeBoards.sort((a, b) => b.lastActivity.localeCompare(a.lastActivity));
  const topActiveBoards = activeBoards.slice(0, 5);

  // Fetch task counts for all displayed ideas
  const allDisplayedIdeaIds = [
    ...myIdeas.map((i) => i.id),
    ...collabIdeas.map((i) => i.id),
  ];
  const taskCounts: Record<string, number> = {};
  if (allDisplayedIdeaIds.length > 0) {
    const { data: taskRows } = await supabase
      .from("board_tasks")
      .select("idea_id")
      .in("idea_id", allDisplayedIdeaIds);
    for (const row of taskRows ?? []) {
      taskCounts[row.idea_id] = (taskCounts[row.idea_id] ?? 0) + 1;
    }
  }

  // Build labels map
  const labelsMap = new Map<string, BoardLabel[]>();
  for (const row of taskLabelsResult.data ?? []) {
    const r = row as unknown as { task_id: string; label: BoardLabel };
    const existing = labelsMap.get(r.task_id) ?? [];
    existing.push(r.label);
    labelsMap.set(r.task_id, existing);
  }

  // Attach labels & sort tasks by urgency
  const duePriority = { overdue: 0, due_soon: 1, on_track: 2 };
  const tasks: DashboardTask[] = rawTasks
    .map((t) => ({ ...t, labels: labelsMap.get(t.id) ?? [] }))
    .sort((a, b) => {
      const aPri = a.due_date
        ? duePriority[getDueDateStatus(a.due_date)]
        : 3;
      const bPri = b.due_date
        ? duePriority[getDueDateStatus(b.due_date)]
        : 3;
      return aPri - bPri;
    });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-3xl font-bold">Dashboard</h1>

      {/* Stats */}
      <StatsCards
        ideasCount={ideasCount}
        collaborationsCount={collaborationsCount}
        upvotesReceived={totalUpvotes}
        tasksAssigned={tasks.length}
      />

      {/* Active Boards */}
      <div className="mt-8">
        <ActiveBoards boards={topActiveBoards} />
      </div>

      {/* My Tasks */}
      <div className="mt-8">
        <MyTasksList tasks={tasks} />
      </div>

      {/* My Ideas */}
      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Lightbulb className="h-5 w-5" />
            My Ideas
          </h2>
          {myIdeas.length > 0 && (
            <Link
              href={`/profile/${user.id}`}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              View all
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
        {myIdeas.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-8 text-center">
            <p className="text-sm text-muted-foreground">
              You haven&apos;t created any ideas yet.
            </p>
            <Link href="/ideas/new">
              <Button variant="outline" size="sm" className="mt-3 gap-2">
                <Plus className="h-4 w-4" />
                Create your first idea
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {myIdeas.map((idea) => (
              <IdeaCard
                key={idea.id}
                idea={idea}
                hasVoted={votedIdeaIds.has(idea.id)}
                taskCount={taskCounts[idea.id]}
              />
            ))}
          </div>
        )}
      </div>

      {/* Collaborations */}
      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Users className="h-5 w-5" />
            Collaborations
          </h2>
          {collabIdeas.length > 0 && (
            <Link
              href={`/profile/${user.id}`}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              View all
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
        {collabIdeas.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-8 text-center">
            <p className="text-sm text-muted-foreground">
              Not collaborating on any ideas yet.
            </p>
            <Link href="/feed">
              <Button variant="outline" size="sm" className="mt-3">
                Browse the feed
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {collabIdeas.map((idea) => (
              <IdeaCard
                key={idea.id}
                idea={idea}
                hasVoted={votedIdeaIds.has(idea.id)}
                taskCount={taskCounts[idea.id]}
              />
            ))}
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="mt-8">
        <ActivityFeed notifications={notifications} />
      </div>
    </div>
  );
}
