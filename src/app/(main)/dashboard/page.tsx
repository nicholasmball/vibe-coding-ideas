import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Lightbulb, Plus, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getDueDateStatus } from "@/lib/utils";
import { StatsCards } from "@/components/dashboard/stats-cards";
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
    // Tasks assigned to user
    supabase
      .from("board_tasks")
      .select(
        "*, column:board_columns!board_tasks_column_id_fkey(id, title), idea:ideas!board_tasks_idea_id_fkey(id, title), assignee:users!board_tasks_assignee_id_fkey(*)"
      )
      .eq("assignee_id", user.id),
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

  // Process tasks
  const rawTasks = (tasksResult.data ?? []) as unknown as (DashboardTask)[];

  // Phase 2: Dependent queries
  const [collabIdeasResult, taskLabelsResult] = await Promise.all([
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
  ]);

  const collabIdeas = (collabIdeasResult.data ?? []) as unknown as IdeaWithAuthor[];

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
