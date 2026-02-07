import Link from "next/link";
import { Sparkles, Users, MessageSquare, Lightbulb, ArrowRight, Zap, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/navbar";
import { createClient } from "@/lib/supabase/server";

const features = [
  {
    icon: Lightbulb,
    title: "Share Ideas",
    description:
      "Post your vibe coding project ideas and get feedback from the community.",
  },
  {
    icon: Users,
    title: "Find Collaborators",
    description:
      "Connect with developers who share your vision and want to build together.",
  },
  {
    icon: MessageSquare,
    title: "Discuss & Refine",
    description:
      "Get suggestions, answer questions, and incorporate community feedback.",
  },
  {
    icon: Zap,
    title: "Real-time Updates",
    description:
      "See votes, comments, and collaborator updates as they happen.",
  },
];

export default async function LandingPage() {
  const supabase = await createClient();

  const [{ count: ideaCount }, { count: userCount }, { count: collabCount }] =
    await Promise.all([
      supabase.from("ideas").select("*", { count: "exact", head: true }),
      supabase.from("users").select("*", { count: "exact", head: true }),
      supabase.from("collaborators").select("*", { count: "exact", head: true }),
    ]);

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

        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-8 flex items-center justify-center gap-2">
              <Sparkles className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
              Where Vibe Coding Ideas{" "}
              <span className="bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                Come to Life
              </span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              Share your project ideas, find collaborators, and build something
              amazing together. VibeCodes is the collaborative idea board for
              developers who love to create.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link href="/signup">
                <Button size="lg" className="gap-2">
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline">
                  Log In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      {(ideaCount ?? 0) > 0 && (
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
                  <ChevronUp className="h-5 w-5" />
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
              Everything you need to vibe
            </h2>
            <p className="mt-4 text-muted-foreground">
              From idea to implementation, VibeCodes helps you every step of the
              way.
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
            Ready to start vibing?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Join the community and share your next great idea. Whether you are
            looking for feedback or collaborators, VibeCodes has you covered.
          </p>
          <div className="mt-8">
            <Link href="/signup">
              <Button size="lg" className="gap-2">
                Create Your Account
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4" />
            <span>VibeCodes &mdash; Built with vibes</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
