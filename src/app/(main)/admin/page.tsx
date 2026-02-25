import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AiUsageDashboard } from "@/components/admin/ai-usage-dashboard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin: AI Usage",
  robots: { index: false, follow: false },
};

interface PageProps {
  searchParams: Promise<{
    from?: string;
    to?: string;
    action?: string;
  }>;
}

export default async function AdminPage({ searchParams }: PageProps) {
  const { from, to, action } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Check admin
  const { data: currentUser } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!currentUser?.is_admin) redirect("/dashboard");

  // Fetch usage logs with filters
  let usageQuery = supabase
    .from("ai_usage_log")
    .select("*, user:users!ai_usage_log_user_id_fkey(id, full_name, email, avatar_url)")
    .order("created_at", { ascending: false })
    .limit(1000);

  if (from) usageQuery = usageQuery.gte("created_at", `${from}T00:00:00Z`);
  if (to) usageQuery = usageQuery.lte("created_at", `${to}T23:59:59Z`);
  if (action && action !== "all") {
    usageQuery = usageQuery.eq(
      "action_type",
      action as "enhance_description" | "generate_questions" | "enhance_with_context" | "generate_board_tasks"
    );
  }

  const { data: usageLogs } = await usageQuery;

  // Fetch all non-bot users with AI fields
  const { data: allUsers } = await supabase
    .from("users")
    .select("id, full_name, email, avatar_url, ai_enabled, ai_daily_limit, encrypted_anthropic_key, is_bot")
    .eq("is_bot", false)
    .order("full_name", { ascending: true });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Admin: AI Usage</h1>
      <AiUsageDashboard
        usageLogs={(usageLogs ?? []) as UsageLogWithUser[]}
        users={(allUsers ?? []) as AdminUser[]}
        filters={{ from: from ?? "", to: to ?? "", action: action ?? "all" }}
      />
    </div>
  );
}

// Types for the serialized data passed to the client component
export type UsageLogWithUser = {
  id: string;
  user_id: string;
  action_type: string;
  input_tokens: number;
  output_tokens: number;
  model: string;
  key_type: string;
  idea_id: string | null;
  created_at: string;
  user: {
    id: string;
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  };
};

export type AdminUser = {
  id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
  ai_enabled: boolean;
  ai_daily_limit: number;
  encrypted_anthropic_key: string | null;
  is_bot: boolean;
};
