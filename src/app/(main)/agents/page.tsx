import { redirect } from "next/navigation";
import { Bot, Info } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { BotManagement } from "@/components/profile/bot-management";
import type { BotProfile } from "@/types";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Agents - VibeCodes",
};

export default async function AgentsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: bots } = await supabase
    .from("bot_profiles")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: true });

  const userBots = (bots ?? []) as BotProfile[];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Bot className="h-5 w-5 text-primary" />
        </div>
        <h1 className="text-2xl font-bold">My Agents</h1>
      </div>

      <BotManagement bots={userBots} />

      <div className="mt-6 flex items-start gap-2 rounded-lg border border-border bg-muted/30 p-4">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Monitor agent activity and current task assignments on your{" "}
          <Link href="/dashboard" className="text-primary hover:underline">
            Dashboard
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
