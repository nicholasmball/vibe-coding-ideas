"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  X,
  Lightbulb,
  Bot,
  Cable,
  Sparkles,
  BookOpen,
  ArrowRight,
} from "lucide-react";
import { Card } from "@/components/ui/card";

const gettingStarted = [
  {
    href: "/ideas/new",
    icon: Lightbulb,
    iconColor: "text-amber-400",
    iconBg: "bg-amber-400/10",
    title: "Create your first idea",
    description: "Share a concept and get feedback",
  },
  {
    href: "/agents",
    icon: Bot,
    iconColor: "text-purple-400",
    iconBg: "bg-purple-400/10",
    title: "Set up your AI team",
    description: "Create agent personas to help build your ideas",
  },
  {
    href: "/guide/mcp-integration",
    icon: Cable,
    iconColor: "text-emerald-400",
    iconBg: "bg-emerald-400/10",
    title: "Connect Claude Code",
    description: "Link your AI assistant via MCP to manage tasks",
  },
];

export function WelcomeExperience() {
  const [dismissed, setDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem("welcome-dismissed") === "true") {
        setDismissed(true);
      }
    } catch {
      // localStorage unavailable
    }
    setMounted(true);
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem("welcome-dismissed", "true");
    } catch {
      // localStorage unavailable
    }
  };

  // Avoid flash of content before hydration
  if (!mounted || dismissed) return null;

  return (
    <Card className="relative mb-6 gap-0 overflow-hidden border-primary/20 py-0">
      {/* Gradient background layer */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/[0.06] via-transparent to-purple-500/[0.06]" />
      <div className="pointer-events-none absolute -top-24 -right-24 h-48 w-48 rounded-full bg-primary/[0.04] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-purple-500/[0.04] blur-3xl" />

      <div className="relative p-5 sm:p-6">
        {/* Header */}
        <div className="mb-5 flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Sparkles className="h-4.5 w-4.5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-tight">
                Welcome to VibeCodes!
              </h2>
              <p className="text-sm text-muted-foreground">
                Here are a few things to get you started:
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="rounded-md p-1 text-muted-foreground/60 transition-colors hover:bg-muted hover:text-muted-foreground"
            aria-label="Dismiss welcome panel"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Getting started actions */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {gettingStarted.map((item) => (
            <Link key={item.href} href={item.href} prefetch={false} className="group">
              <div className="flex flex-col items-center gap-2 rounded-xl border border-border/60 bg-card/60 px-4 py-5 text-center transition-all hover:border-primary/30 hover:bg-card">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.iconBg}`}
                >
                  <item.icon className={`h-5 w-5 ${item.iconColor}`} />
                </div>
                <div>
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Guide teaser */}
        <Link
          href="/guide/getting-started"
          prefetch={false}
          className="group mt-4 flex items-center gap-3 rounded-xl border border-border/40 bg-card/30 px-4 py-3 transition-all hover:border-primary/30 hover:bg-card/60"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-400/10">
            <BookOpen className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="flex-1 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">
              New to VibeCodes?
            </span>{" "}
            Discover how AI agents, project boards, and real-time collaboration
            work together.
          </p>
          <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-muted-foreground" />
        </Link>
      </div>
    </Card>
  );
}
