import { redirect } from "next/navigation";
import Link from "next/link";
import { Users, MessageSquare, Lightbulb, ArrowRight, Zap, Handshake, Bot, LayoutDashboard, Bug, Code, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { createClient } from "@/lib/supabase/server";

const features = [
  {
    icon: Lightbulb,
    title: "Share Ideas",
    description:
      "Drop a rough concept and watch it evolve through community feedback and AI refinement.",
  },
  {
    icon: Users,
    title: "Find Collaborators",
    description:
      "Attract developers who share your vision — or let AI be your first team member.",
  },
  {
    icon: MessageSquare,
    title: "Discuss & Refine",
    description:
      "Threaded comments, suggestions, and questions keep every decision traceable.",
  },
  {
    icon: Zap,
    title: "Real-time Updates",
    description:
      "Board changes, votes, and comments stream live — no refresh needed.",
  },
];

export default async function LandingPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  const { data: stats } = await supabase.rpc("get_public_stats");
  const ideaCount = (stats as { idea_count?: number })?.idea_count ?? 0;
  const userCount = (stats as { user_count?: number })?.user_count ?? 0;
  const collabCount = (stats as { collab_count?: number })?.collab_count ?? 0;

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5" />
          <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-purple-500/5 blur-3xl" />
        </div>

        <div className="mx-auto max-w-7xl px-4 pt-24 pb-16 sm:px-6 sm:pt-32 sm:pb-20 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-8 flex justify-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                <Sparkles className="h-4 w-4" />
                Idea to shipped code, powered by AI
              </div>
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
              Where Vibe Coding Ideas{" "}
              <span className="bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                Come to Life
              </span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              The AI-powered idea board where you go from concept to shipped
              code. Share ideas, build your team, and let AI handle the rest.
            </p>
            <div className="mt-10">
              <Link href="/signup">
                <Button size="lg" className="gap-2">
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* AI Spotlight Section */}
      <section className="relative overflow-hidden border-t border-border pt-14 pb-24">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-primary/10" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-purple-500/5 blur-3xl" />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
              <Bot className="h-4 w-4" />
              AI-Powered
            </div>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Your AI assistant,{" "}
              <span className="bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                built right in
              </span>
            </h2>
            <p className="mt-6 text-lg text-muted-foreground">
              VibeCodes connects directly to AI coding assistants like Claude Code via the{" "}
              <span className="font-medium text-foreground">Model Context Protocol (MCP)</span>.
              Your AI can read your ideas, manage your task board, file bugs, and write code &mdash; all while keeping everything updated in real time.
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-8 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-card/50 p-6 backdrop-blur-sm">
              <LayoutDashboard className="mb-4 h-8 w-8 text-blue-400" />
              <h3 className="mb-2 text-lg font-semibold">AI Manages Your Board</h3>
              <p className="text-sm text-muted-foreground">
                Create tasks, move cards between columns, add labels, set due dates, and manage checklists &mdash; all through natural conversation.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card/50 p-6 backdrop-blur-sm">
              <Bug className="mb-4 h-8 w-8 text-red-400" />
              <h3 className="mb-2 text-lg font-semibold">File Bugs, Get Fixes</h3>
              <p className="text-sm text-muted-foreground">
                Describe an issue and watch your AI file it as a bug, pick it up, and deliver a fix &mdash; with full activity tracking on the board.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card/50 p-6 backdrop-blur-sm">
              <Code className="mb-4 h-8 w-8 text-emerald-400" />
              <h3 className="mb-2 text-lg font-semibold">From Idea to Software</h3>
              <p className="text-sm text-muted-foreground">
                Go from a rough idea to a shipped product. AI refines your concept, creates tasks, writes code, and updates progress in real time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section — hidden until numbers are meaningful */}
      {(ideaCount ?? 0) >= 10 && (
        <section className="border-t border-border py-12">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-3 gap-8 text-center">
              <div>
                <div className="flex items-center justify-center gap-1.5 text-primary">
                  <Lightbulb className="h-5 w-5" />
                  <span className="text-3xl font-bold">{ideaCount ?? 0}</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">Ideas Shared</p>
              </div>
              <div>
                <div className="flex items-center justify-center gap-1.5 text-primary">
                  <Users className="h-5 w-5" />
                  <span className="text-3xl font-bold">{userCount ?? 0}</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">Developers</p>
              </div>
              <div>
                <div className="flex items-center justify-center gap-1.5 text-primary">
                  <Handshake className="h-5 w-5" />
                  <span className="text-3xl font-bold">{collabCount ?? 0}</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">Collaborations</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="border-t border-border bg-muted/30 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              From spark to shipped
            </h2>
            <p className="mt-4 text-muted-foreground">
              Idea, feedback, team, board, code, ship &mdash; VibeCodes covers
              the full journey.
            </p>
          </div>
          <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary/50"
              >
                <feature.icon className="mb-4 h-8 w-8 text-primary" />
                <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-border py-24">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Start with an idea. Ship with AI.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Turn your next idea into working software. VibeCodes gives you
            the board, the team, and the AI to make it happen.
          </p>
          <div className="mt-8">
            <Link href="/signup">
              <Button size="lg" className="gap-2">
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
