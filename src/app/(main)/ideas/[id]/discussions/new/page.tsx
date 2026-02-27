import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { NewDiscussionForm } from "@/components/discussions/new-discussion-form";
import type { User } from "@/types";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: "New Discussion",
};

export default async function NewDiscussionPage({ params }: PageProps) {
  const { id: ideaId } = await params;
  const { user } = await requireAuth();

  const supabase = await createClient();

  // Verify idea exists and user is a team member
  const { data: idea } = await supabase
    .from("ideas")
    .select("id, title, author_id")
    .eq("id", ideaId)
    .maybeSingle();

  if (!idea) notFound();

  const isAuthor = idea.author_id === user.id;
  const { data: collab } = await supabase
    .from("collaborators")
    .select("id")
    .eq("idea_id", ideaId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!isAuthor && !collab) {
    notFound();
  }

  // Fetch author + collaborators for mention support
  const [{ data: ideaAuthor }, { data: collabs }] = await Promise.all([
    supabase.from("users").select("*").eq("id", idea.author_id).single(),
    supabase
      .from("collaborators")
      .select("*, user:users!collaborators_user_id_fkey(*)")
      .eq("idea_id", ideaId),
  ]);

  const teamMembersMap = new Map<string, User>();
  if (ideaAuthor) teamMembersMap.set(ideaAuthor.id, ideaAuthor as User);
  for (const c of collabs ?? []) {
    const u = c.user as unknown as User;
    if (u && !teamMembersMap.has(u.id)) teamMembersMap.set(u.id, u);
  }

  // Fetch active bots owned by the current user and add their user records
  {
    const { data: botProfiles } = await supabase
      .from("bot_profiles")
      .select("id")
      .eq("owner_id", user.id)
      .eq("is_active", true);

    if (botProfiles && botProfiles.length > 0) {
      const botUserIds = botProfiles.map((b) => b.id);
      const { data: botUsers } = await supabase
        .from("users")
        .select("*")
        .in("id", botUserIds);

      for (const bu of botUsers ?? []) {
        if (!teamMembersMap.has(bu.id)) teamMembersMap.set(bu.id, bu as User);
      }
    }
  }

  const teamMembers = Array.from(teamMembersMap.values());

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <Link
        href={`/ideas/${ideaId}/discussions`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Discussions
      </Link>

      <h1 className="mb-6 text-xl font-bold sm:text-2xl">New Discussion</h1>

      <NewDiscussionForm
        ideaId={ideaId}
        teamMembers={teamMembers}
        currentUserId={user.id}
      />
    </div>
  );
}
