import { createClient } from "@/lib/supabase/server";
import { IdeaFeed } from "@/components/ideas/idea-feed";
import { CompleteProfileBanner } from "@/components/profile/complete-profile-banner";
import type { SortOption, IdeaStatus, IdeaWithAuthor } from "@/types";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Feed - VibeCodes",
  description: "Discover and vote on vibe coding project ideas",
};

const PAGE_SIZE = 10;

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; q?: string; tag?: string; status?: string; page?: string }>;
}) {
  const params = await searchParams;
  const sort = (params.sort as SortOption) || "newest";
  const search = params.q || "";
  const tag = params.tag || "";
  const status = (params.status as IdeaStatus) || "";
  const page = Math.max(1, parseInt(params.page || "1", 10));
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let query = supabase
    .from("ideas")
    .select("*, author:users!ideas_author_id_fkey(*)", { count: "exact" });

  // Search filter
  if (search) {
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
  }

  // Tag filter
  if (tag) {
    query = query.contains("tags", [tag]);
  }

  // Status filter
  if (status) {
    query = query.eq("status", status);
  }

  // Sorting
  switch (sort) {
    case "popular":
      query = query.order("upvotes", { ascending: false });
      break;
    case "discussed":
      query = query.order("comment_count", { ascending: false });
      break;
    case "newest":
    default:
      query = query.order("created_at", { ascending: false });
      break;
  }

  // Pagination
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  query = query.range(from, to);

  const { data: ideas, count } = await query;
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);

  // Get user votes and profile completeness
  let userVotes: string[] = [];
  let showProfileBanner = false;
  if (user) {
    const { data: votes } = await supabase
      .from("votes")
      .select("idea_id")
      .eq("user_id", user.id);
    userVotes = votes?.map((v) => v.idea_id) ?? [];

    const { data: profile } = await supabase
      .from("users")
      .select("full_name, bio, contact_info")
      .eq("id", user.id)
      .single();
    showProfileBanner = !profile?.full_name || !profile?.bio || !profile?.contact_info;
  }

  // Get all unique tags for the filter and task counts
  const ideaIds = (ideas ?? []).map((i) => i.id);
  const [allIdeasResult, taskCountsResult] = await Promise.all([
    supabase.from("ideas").select("tags"),
    ideaIds.length > 0
      ? supabase
          .from("board_tasks")
          .select("idea_id")
          .in("idea_id", ideaIds)
      : Promise.resolve({ data: [] }),
  ]);
  const allTags = [...new Set((allIdeasResult.data ?? []).flatMap((i) => i.tags))].sort();
  const taskCounts: Record<string, number> = {};
  for (const row of taskCountsResult.data ?? []) {
    taskCounts[row.idea_id] = (taskCounts[row.idea_id] ?? 0) + 1;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {showProfileBanner && user && (
        <CompleteProfileBanner userId={user.id} />
      )}
      <IdeaFeed
        ideas={(ideas as unknown as IdeaWithAuthor[]) ?? []}
        userVotes={userVotes}
        taskCounts={taskCounts}
        currentSort={sort}
        currentSearch={search}
        currentTag={tag}
        currentStatus={status}
        currentPage={page}
        totalPages={totalPages}
        allTags={allTags}
      />
    </div>
  );
}
