import { createClient } from "@/lib/supabase/server";
import { IdeaFeed } from "@/components/ideas/idea-feed";
import type { SortOption, IdeaWithAuthor } from "@/types";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Feed - VibeCodes",
  description: "Discover and vote on vibe coding project ideas",
};

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  const params = await searchParams;
  const sort = (params.sort as SortOption) || "newest";
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let query = supabase
    .from("ideas")
    .select("*, author:users!ideas_author_id_fkey(*)");

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

  const { data: ideas } = await query;

  // Get user votes
  let userVotes: string[] = [];
  if (user) {
    const { data: votes } = await supabase
      .from("votes")
      .select("idea_id")
      .eq("user_id", user.id);
    userVotes = votes?.map((v) => v.idea_id) ?? [];
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <IdeaFeed
        ideas={(ideas as unknown as IdeaWithAuthor[]) ?? []}
        userVotes={userVotes}
        currentSort={sort}
      />
    </div>
  );
}
