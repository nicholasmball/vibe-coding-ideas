import { Navbar } from "@/components/layout/navbar";
import { Sparkles } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Guide - VibeCodes",
  description:
    "Learn how to use VibeCodes — share ideas, collaborate with developers, manage projects with kanban boards, and integrate with Claude Code via MCP.",
};

export default function GuideLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {children}
      </main>
      <footer className="border-t border-border py-8">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4" />
            <span>
              VibeCodes &mdash; Built with vibes &mdash;{" "}
              <Link href="/guide" className="underline hover:text-foreground">
                Guide
              </Link>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
