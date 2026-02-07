import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { IdeaEditForm } from "@/components/ideas/idea-edit-form";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: "Edit Idea - VibeCodes",
};

export default async function EditIdeaPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: idea } = await supabase
    .from("ideas")
    .select("*")
    .eq("id", id)
    .single();

  if (!idea) notFound();

  // Only the author can edit
  if (idea.author_id !== user.id) redirect(`/ideas/${id}`);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <IdeaEditForm idea={idea} />
    </div>
  );
}
