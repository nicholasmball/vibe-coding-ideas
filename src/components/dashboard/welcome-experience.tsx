"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  X,
  Lightbulb,
  Rss,
  BookOpen,
  Bot,
  Sparkles,
  LayoutDashboard,
  Wand2,
  Cable,
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
    href: "/feed",
    icon: Rss,
    iconColor: "text-blue-400",
    iconBg: "bg-blue-400/10",
    title: "Browse the feed",
    description: "Discover and vote on ideas",
  },
  {
    href: "/guide",
    icon: BookOpen,
    iconColor: "text-emerald-400",
    iconBg: "bg-emerald-400/10",
    title: "Read the guide",
    description: "Learn how VibeCodes works",
  },
];

const uniqueFeatures = [
  {
    href: "/guide/ai-agent-teams",
    icon: Bot,
    iconColor: "text-purple-400",
    iconBg: "bg-purple-400/10",
    borderAccent: "hover:border-purple-400/40",
    title: "AI Agent Teams",
    description:
      "Create AI personas that join your board as team members — assign tasks, track activity, and ship together.",
  },
  {
    href: "/guide/kanban-boards",
    icon: LayoutDashboard,
    iconColor: "text-blue-400",
    iconBg: "bg-blue-400/10",
    borderAccent: "hover:border-blue-400/40",
    title: "Kanban Per Idea",
    description:
      "Every idea gets its own project board with drag-and-drop, labels, due dates, checklists, and file attachments.",
  },
  {
    href: "/guide/ideas-and-voting",
    icon: Wand2,
    iconColor: "text-amber-400",
    iconBg: "bg-amber-400/10",
    borderAccent: "hover:border-amber-400/40",
    title: "AI-Powered Enhancement",
    description:
      "Claude refines your rough ideas, asks clarifying questions, and auto-generates a full task board to get you started.",
  },
  {
    href: "/guide/mcp-integration",
    icon: Cable,
    iconColor: "text-emerald-400",
    iconBg: "bg-emerald-400/10",
    borderAccent: "hover:border-emerald-400/40",
    title: "MCP Integration",
    description:
      "Connect Claude Code directly — your AI reads the board, picks up tasks, files bugs, and writes code in real time.",
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
        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {gettingStarted.map((item) => (
            <Link key={item.href} href={item.href} className="group">
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

        {/* Divider with label */}
        <div className="mb-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-border/60" />
          <span className="text-xs font-medium tracking-wide text-muted-foreground/70 uppercase">
            What makes VibeCodes different
          </span>
          <div className="h-px flex-1 bg-border/60" />
        </div>

        {/* Unique feature highlights */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {uniqueFeatures.map((feature) => (
            <Link key={feature.href} href={feature.href} className="group">
              <div
                className={`flex gap-3 rounded-xl border border-border/60 bg-card/60 p-4 transition-all ${feature.borderAccent} hover:bg-card`}
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${feature.iconBg}`}
                >
                  <feature.icon
                    className={`h-4.5 w-4.5 ${feature.iconColor}`}
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{feature.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </Card>
  );
}
