import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfileTabs } from "@/components/profile/profile-tabs";
import type { IdeaWithAuthor } from "@/types";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("users")
    .select("full_name")
    .eq("id", id)
    .single();

  if (!profile) return { title: "User Not Found" };

  return {
    title: `${profile.full_name ?? "User"} - VibeCodes`,
  };
}

export default async function ProfilePage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  // Fetch profile user
  const { data: profileUser } = await supabase
    .from("users")
    .select("*")
    .eq("id", id)
    .single();

  if (!profileUser) notFound();

  // Fetch user's ideas
  const { data: ideas } = await supabase
    .from("ideas")
    .select("*, author:users!ideas_author_id_fkey(*)")
    .eq("author_id", id)
    .order("created_at", { ascending: false });

  // Fetch collaborations
  const { data: collaborations } = await supabase
    .from("collaborators")
    .select("idea_id")
    .eq("user_id", id);

  let collabIdeas: IdeaWithAuthor[] = [];
  if (collaborations && collaborations.length > 0) {
    const ideaIds = collaborations.map((c) => c.idea_id);
    const { data } = await supabase
      .from("ideas")
      .select("*, author:users!ideas_author_id_fkey(*)")
      .in("id", ideaIds)
      .order("created_at", { ascending: false });
    collabIdeas = (data as unknown as IdeaWithAuthor[]) ?? [];
  }

  // Fetch user's comments with idea titles
  const { data: rawComments } = await supabase
    .from("comments")
    .select("*, author:users!comments_author_id_fkey(*)")
    .eq("author_id", id)
    .order("created_at", { ascending: false })
    .limit(50);

  // Get idea titles for comments
  const commentIdeaIds = [...new Set(rawComments?.map((c) => c.idea_id) ?? [])];
  let ideaTitleMap: Record<string, string> = {};
  if (commentIdeaIds.length > 0) {
    const { data: ideaTitles } = await supabase
      .from("ideas")
      .select("id, title")
      .in("id", commentIdeaIds);
    ideaTitleMap = Object.fromEntries(
      (ideaTitles ?? []).map((i) => [i.id, i.title])
    );
  }

  const comments = (rawComments ?? []).map((c) => ({
    ...c,
    idea_title: ideaTitleMap[c.idea_id],
  }));

  // Get current user's votes
  let userVotes: string[] = [];
  if (currentUser) {
    const { data: votes } = await supabase
      .from("votes")
      .select("idea_id")
      .eq("user_id", currentUser.id);
    userVotes = votes?.map((v) => v.idea_id) ?? [];
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <ProfileHeader
        user={profileUser}
        ideaCount={ideas?.length ?? 0}
        collaborationCount={collaborations?.length ?? 0}
        commentCount={rawComments?.length ?? 0}
      />
      <ProfileTabs
        ideas={(ideas as unknown as IdeaWithAuthor[]) ?? []}
        collaborations={collabIdeas}
        comments={comments as any}
        userVotes={userVotes}
      />
    </div>
  );
}
