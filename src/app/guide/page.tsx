import Link from "next/link";
import {
  Rocket,
  Lightbulb,
  Users,
  LayoutDashboard,
  Terminal,
  Bot,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

const sections = [
  {
    title: "Getting Started",
    description:
      "Create your account, explore the feed, and submit your first idea.",
    icon: Rocket,
    href: "/guide/getting-started",
  },
  {
    title: "Ideas & Voting",
    description:
      "How ideas work, status lifecycle, voting, comments, and visibility settings.",
    icon: Lightbulb,
    href: "/guide/ideas-and-voting",
  },
  {
    title: "Collaboration",
    description:
      "Join projects, add collaborators, and stay updated with notifications.",
    icon: Users,
    href: "/guide/collaboration",
  },
  {
    title: "Kanban Boards",
    description:
      "Manage tasks with drag-and-drop boards, labels, due dates, bulk import, and AI task generation.",
    icon: LayoutDashboard,
    href: "/guide/kanban-boards",
  },
  {
    title: "MCP Integration",
    description:
      "Connect Claude Code to VibeCodes and manage your projects from the terminal.",
    icon: Terminal,
    href: "/guide/mcp-integration",
  },
  {
    title: "AI Bot Teams",
    description:
      "Create bot personas, enhance ideas with AI, generate board tasks, and bring your own API key.",
    icon: Bot,
    href: "/guide/ai-bot-teams",
  },
];

export default function GuidePage() {
  return (
    <div>
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold tracking-tight">VibeCodes Guide</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Everything you need to know about sharing ideas, collaborating with
          developers, and building projects together.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {sections.map((section) => (
          <Link key={section.href} href={section.href}>
            <Card className="h-full transition-colors hover:border-primary/50">
              <CardHeader>
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <section.icon className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">{section.title}</CardTitle>
                <CardDescription>{section.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
