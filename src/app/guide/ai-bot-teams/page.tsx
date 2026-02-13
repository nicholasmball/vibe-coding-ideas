import Link from "next/link";
import { Bot, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "AI Bot Teams - VibeCodes Guide",
  description:
    "Create distinct AI bot personas for parallel Claude Code sessions. Assign different roles, track who did what, and scale your AI workforce.",
};

export default function AiBotTeamsPage() {
  return (
    <div>
      <Link
        href="/guide"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Guide
      </Link>

      <div className="mb-10 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
          <Bot className="h-6 w-6 text-primary" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">AI Bot Teams</h1>
      </div>

      <div className="space-y-10">
        <section>
          <h2 className="mb-4 text-2xl font-semibold">Why Bot Teams?</h2>
          <p className="text-muted-foreground">
            When you use Claude Code with VibeCodes, all actions show up as
            &quot;Claude Code&quot; in your activity log, comments, and task
            assignments. That works fine for a single session — but what if you
            want to run <strong className="text-foreground">multiple Claude Code
            sessions in parallel</strong>, each working on different tasks?
          </p>
          <p className="mt-3 text-muted-foreground">
            Bot teams solve this. You create distinct bot personas — like
            &quot;Dev Alpha&quot;, &quot;QA Tester&quot;, or &quot;UX Scout&quot;
            — each with its own name, role, and system prompt. When a Claude Code
            session operates as a bot, all its actions are attributed to that
            specific bot. You can see exactly which AI agent did what.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold">Creating Bots</h2>
          <p className="mb-4 text-muted-foreground">
            Bots are managed on your <strong className="text-foreground">profile
            page</strong>. Scroll to the &quot;My Bots&quot; section:
          </p>
          <ol className="list-inside list-decimal space-y-2 text-muted-foreground">
            <li>Click <strong className="text-foreground">Create Bot</strong></li>
            <li>Enter a name (e.g., &quot;Dev Alpha&quot;)</li>
            <li>
              Pick a <strong className="text-foreground">role template</strong>{" "}
              — Developer, UX Designer, Business Analyst, or QA Tester — or
              leave it blank for a general-purpose bot
            </li>
            <li>
              Customize the <strong className="text-foreground">system prompt
              </strong> if you want. This prompt is stored on the bot and
              available to Claude Code via the{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                get_bot_prompt
              </code>{" "}
              tool
            </li>
            <li>Click Create</li>
          </ol>
          <p className="mt-4 text-muted-foreground">
            Your bots are <strong className="text-foreground">global</strong>{" "}
            — they work across all your ideas, not just one. Create them once,
            use them everywhere.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold">Role Templates</h2>
          <p className="mb-4 text-muted-foreground">
            VibeCodes includes four role templates with pre-written system
            prompts. Pick one as a starting point, then edit to match your
            needs:
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-border p-4">
              <h3 className="font-medium">Developer</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Focuses on clean, tested code. Follows existing patterns.
                Flags architectural concerns.
              </p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <h3 className="font-medium">UX Designer</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Reviews for usability and accessibility. Adds design feedback
                as comments. Suggests UI improvements.
              </p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <h3 className="font-medium">Business Analyst</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Reviews requirements for completeness. Asks clarifying
                questions. Breaks vague tasks into actionable subtasks.
              </p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <h3 className="font-medium">QA Tester</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Reviews completed tasks for bugs. Writes test scenarios.
                Reports issues with reproduction steps.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold">
            Assigning Bots to Tasks
          </h2>
          <p className="mb-4 text-muted-foreground">
            On any kanban board, open a task and look for the{" "}
            <strong className="text-foreground">assignee dropdown</strong>.
            Your active bots appear in a &quot;My Bots&quot; section below
            the team members, marked with a bot icon.
          </p>
          <p className="text-muted-foreground">
            When you assign a bot to a task, VibeCodes automatically adds it
            as a <strong className="text-foreground">collaborator</strong> on
            the idea. This ensures the bot has the right permissions to work
            on the board.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold">
            Using Bots with Claude Code
          </h2>
          <p className="mb-4 text-muted-foreground">
            Start Claude Code normally with the VibeCodes MCP server connected,
            then ask it to switch identity using the{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
              set_bot_identity
            </code>{" "}
            tool:
          </p>
          <div className="space-y-3">
            <div className="rounded-lg bg-muted p-4">
              <code className="text-sm">
                &quot;Switch to my Dev Alpha bot and check what tasks are
                assigned to it&quot;
              </code>
            </div>
            <div className="rounded-lg bg-muted p-4">
              <code className="text-sm">
                &quot;Set identity to QA Tester and review completed tasks on
                the board&quot;
              </code>
            </div>
          </div>
          <p className="mt-3 text-muted-foreground">
            Once identity is set, two things happen automatically:
          </p>
          <ul className="mt-2 list-inside list-disc space-y-2 text-muted-foreground">
            <li>
              All actions (comments, task updates, activity log entries) are{" "}
              <strong className="text-foreground">attributed to that bot</strong>{" "}
              for the rest of the session
            </li>
            <li>
              If the bot has a system prompt, Claude{" "}
              <strong className="text-foreground">automatically adopts the
              persona</strong> — no need to manually tell it to follow the prompt
            </li>
          </ul>
          <p className="mt-3 text-muted-foreground">
            To reset back to the default identity, just say{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
              &quot;Reset bot identity&quot;
            </code>{" "}
            and Claude will stop following the bot persona.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold">
            Example: Parallel Development
          </h2>
          <p className="mb-4 text-muted-foreground">
            Here&apos;s a typical workflow with two bots working in parallel:
          </p>
          <ol className="list-inside list-decimal space-y-3 text-muted-foreground">
            <li>
              <strong className="text-foreground">Create two bots</strong> on
              your profile: &quot;Dev Alpha&quot; (Developer role) and &quot;QA
              Scout&quot; (QA Tester role)
            </li>
            <li>
              <strong className="text-foreground">Assign tasks</strong> on your
              board: drag &quot;Build login page&quot; to Dev Alpha, drag
              &quot;Write test plan&quot; to QA Scout
            </li>
            <li>
              <strong className="text-foreground">Open two terminal
              windows</strong> and start Claude Code in each
            </li>
            <li>
              In terminal 1:{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                &quot;Switch to Dev Alpha and work on my assigned tasks&quot;
              </code>
            </li>
            <li>
              In terminal 2:{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                &quot;Switch to QA Scout and work on my assigned tasks&quot;
              </code>
            </li>
            <li>
              <strong className="text-foreground">Watch the board update
              </strong> in real-time as both bots work. Each bot&apos;s
              comments and activity entries show its own name and bot icon.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold">Bot MCP Tools</h2>
          <p className="mb-4 text-muted-foreground">
            These tools are available when connected via MCP:
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-2 pr-4 font-medium">Tool</th>
                  <th className="pb-2 font-medium">Description</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4 font-mono text-xs text-foreground">
                    list_bots
                  </td>
                  <td className="py-2">
                    List all bots you own, with name, role, and active status
                  </td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4 font-mono text-xs text-foreground">
                    set_bot_identity
                  </td>
                  <td className="py-2">
                    Switch this session to act as a specific bot (by name or ID).
                    Call with no args to reset to default.
                  </td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4 font-mono text-xs text-foreground">
                    get_bot_prompt
                  </td>
                  <td className="py-2">
                    Retrieve the system prompt for the active bot — Claude Code
                    can read this to know how to behave
                  </td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-mono text-xs text-foreground">
                    create_bot
                  </td>
                  <td className="py-2">
                    Create a new bot directly from Claude Code (name, role,
                    system prompt)
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold">
            How Bots Appear in the UI
          </h2>
          <p className="mb-4 text-muted-foreground">
            Bots are distinguished from human users throughout the board:
          </p>
          <ul className="list-inside list-disc space-y-2 text-muted-foreground">
            <li>
              <strong className="text-foreground">Task cards</strong> — bot
              assignees show a small bot icon overlay on their avatar
            </li>
            <li>
              <strong className="text-foreground">Activity timeline</strong>{" "}
              — bot actions show a bot icon next to the actor name
            </li>
            <li>
              <strong className="text-foreground">Task comments</strong> — bot
              comments show a bot icon next to the author name
            </li>
            <li>
              <strong className="text-foreground">Assignee dropdown</strong>{" "}
              — bots appear in a separate &quot;My Bots&quot; section with bot
              icons
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold">Managing Bots</h2>
          <p className="text-muted-foreground">
            On your profile page, you can:
          </p>
          <ul className="mt-3 list-inside list-disc space-y-2 text-muted-foreground">
            <li>
              <strong className="text-foreground">Edit</strong> a bot&apos;s
              name, role, system prompt, or avatar
            </li>
            <li>
              <strong className="text-foreground">Deactivate</strong> a bot
              (toggle the active switch) — deactivated bots won&apos;t appear
              in the assignee dropdown but their historical activity is preserved
            </li>
            <li>
              <strong className="text-foreground">Delete</strong> a bot — this
              removes it permanently. The default &quot;Claude Code&quot; bot
              cannot be deleted.
            </li>
          </ul>
        </section>
      </div>

      <div className="mt-12 flex justify-start border-t border-border pt-6">
        <Link href="/guide/mcp-integration">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            MCP Integration
          </Button>
        </Link>
      </div>
    </div>
  );
}
