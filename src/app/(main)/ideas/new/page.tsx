import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { IdeaForm } from "@/components/ideas/idea-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Submit Idea",
  description: "Share your vibe coding project idea with the community.",
  robots: { index: false, follow: false },
};

export default async function NewIdeaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  let githubUsername: string | null = null;
  {
    const { data } = await supabase
      .from("users")
      .select("github_username")
      .eq("id", user.id)
      .maybeSingle();
    githubUsername = data?.github_username ?? null;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <IdeaForm githubUsername={githubUsername} userId={user.id} />
    </div>
  );
}
