import Link from "next/link";
import { Terminal, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "MCP Integration - VibeCodes Guide",
  description:
    "Connect Claude Code to VibeCodes via MCP and manage your ideas, boards, and tasks from the terminal.",
};

export default function McpIntegrationPage() {
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
          <Terminal className="h-6 w-6 text-primary" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">MCP Integration</h1>
      </div>

      <div className="space-y-10">
        <section>
          <h2 className="mb-4 text-2xl font-semibold">What is MCP?</h2>
          <p className="text-muted-foreground">
            The{" "}
            <strong className="text-foreground">
              Model Context Protocol (MCP)
            </strong>{" "}
            is an open standard that lets AI assistants like Claude Code
            interact with external tools and services. VibeCodes includes a
            remote MCP server that gives Claude Code direct access to your
            ideas, boards, and tasks — so you can manage your projects without
            leaving the terminal.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold">Connect Claude Code</h2>
          <p className="mb-4 text-muted-foreground">
            Add the VibeCodes remote MCP server to Claude Code with this
            command:
          </p>
          <div className="rounded-lg border-2 border-primary/30 bg-muted p-4">
            <code className="text-sm">
              claude mcp add --transport http vibecodes-remote
              https://vibe-coding-ideas.vercel.app/api/mcp
            </code>
          </div>
          <p className="mt-4 text-muted-foreground">
            This connects to the <strong className="text-foreground">hosted
            VibeCodes server</strong> over HTTP. You don&apos;t need to clone
            the repo or run anything locally — it works from any project
            directory.
          </p>
          <p className="mt-3 text-muted-foreground">
            The first time you use it, Claude Code will open your browser for
            OAuth authentication. Log in with your VibeCodes account and
            authorize the connection. After that, Claude Code can use all 38
            VibeCodes tools on your behalf.
          </p>
          <div className="mt-4 rounded-xl border border-border bg-muted/30 p-6">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">How auth works:</strong>{" "}
              VibeCodes uses OAuth 2.1 with PKCE. Your Supabase session token
              is used as the OAuth access token, so all actions respect the same
              permissions (RLS) as the web app. No API keys to manage.
            </p>
          </div>
          <div className="mt-4 rounded-xl border border-border bg-muted/30 p-6">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">Tip:</strong> The{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                -s user
              </code>{" "}
              flag saves the server to your user-level config so it&apos;s
              available across all your projects:{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                claude mcp add -s user --transport http vibecodes-remote
                https://vibe-coding-ideas.vercel.app/api/mcp
              </code>
            </p>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold">Available Tools</h2>
          <p className="mb-4 text-muted-foreground">
            Once connected, Claude Code has access to 38 tools (including{" "}
            <Link href="/guide/ai-bot-teams" className="text-primary hover:underline">
              4 bot team tools
            </Link>
            ):
          </p>

          <h3 className="mb-3 mt-6 text-lg font-medium">Read Tools</h3>
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
                  <td className="py-2 pr-4 font-mono text-xs text-foreground">list_ideas</td>
                  <td className="py-2">List ideas with optional status filter and search</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4 font-mono text-xs text-foreground">get_idea</td>
                  <td className="py-2">Full idea detail with comments, collaborators, and board summary</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4 font-mono text-xs text-foreground">get_board</td>
                  <td className="py-2">Complete kanban board: columns, tasks, labels</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4 font-mono text-xs text-foreground">get_task</td>
                  <td className="py-2">Single task with checklist, comments, activity, and attachments</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4 font-mono text-xs text-foreground">get_my_tasks</td>
                  <td className="py-2">Tasks assigned to you, grouped by idea</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4 font-mono text-xs text-foreground">list_attachments</td>
                  <td className="py-2">List task attachments with signed download URLs</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4 font-mono text-xs text-foreground">list_collaborators</td>
                  <td className="py-2">List all collaborators on an idea</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4 font-mono text-xs text-foreground">list_notifications</td>
                  <td className="py-2">List notifications with optional unread-only filter</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4 font-mono text-xs text-foreground">list_bots</td>
                  <td className="py-2">List your bot personas with name, role, and active status</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-mono text-xs text-foreground">get_bot_prompt</td>
                  <td className="py-2">Get the system prompt for a specific bot or active identity</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 className="mb-3 mt-6 text-lg font-medium">Write Tools</h3>
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
                  <td className="py-2 pr-4 font-mono text-xs text-foreground">create_task</td>
                  <td className="py-2">Create a task on a board column</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4 font-mono text-xs text-foreground">update_task</td>
                  <td className="py-2">Update task title, description, assignee, due date, or archive status</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4 font-mono text-xs text-foreground">move_task</td>
                  <td className="py-2">Move task between columns</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4 font-mono text-xs text-foreground">delete_task</td>
                  <td className="py-2">Delete a task permanently</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4 font-mono text-xs text-foreground">upload_attachment</td>
                  <td className="py-2">Upload a file to a task (max 10MB)</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4 font-mono text-xs text-foreground">delete_attachment</td>
                  <td className="py-2">Delete an attachment from a task</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4 font-mono text-xs text-foreground">update_idea_description</td>
                  <td className="py-2">Rewrite an idea&apos;s description</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4 font-mono text-xs text-foreground">manage_labels</td>
                  <td className="py-2">Create labels, add/remove from tasks</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4 font-mono text-xs text-foreground">manage_checklist</td>
                  <td className="py-2">Add, toggle, or delete checklist items</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4 font-mono text-xs text-foreground">add_idea_comment</td>
                  <td className="py-2">Comment on an idea</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4 font-mono text-xs text-foreground">add_task_comment</td>
                  <td className="py-2">Comment on a board task</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4 font-mono text-xs text-foreground">report_bug</td>
                  <td className="py-2">Create a task with a &quot;Bug&quot; label</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4 font-mono text-xs text-foreground">create_idea</td>
                  <td className="py-2">Create a new idea with title, description, tags, visibility</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4 font-mono text-xs text-foreground">delete_idea</td>
                  <td className="py-2">Delete an idea (author or admin only)</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4 font-mono text-xs text-foreground">update_idea_status</td>
                  <td className="py-2">Update idea status (open, in_progress, completed, archived)</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4 font-mono text-xs text-foreground">update_idea_tags</td>
                  <td className="py-2">Set or replace tags on an idea</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4 font-mono text-xs text-foreground">toggle_vote</td>
                  <td className="py-2">Toggle your upvote on an idea</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4 font-mono text-xs text-foreground">add_collaborator</td>
                  <td className="py-2">Add a user as collaborator on an idea</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4 font-mono text-xs text-foreground">remove_collaborator</td>
                  <td className="py-2">Remove a collaborator from an idea</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4 font-mono text-xs text-foreground">create_column</td>
                  <td className="py-2">Create a new board column</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4 font-mono text-xs text-foreground">update_column</td>
                  <td className="py-2">Update a column&apos;s title or done status</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4 font-mono text-xs text-foreground">delete_column</td>
                  <td className="py-2">Delete an empty board column</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4 font-mono text-xs text-foreground">reorder_columns</td>
                  <td className="py-2">Reorder columns by providing IDs in desired order</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4 font-mono text-xs text-foreground">mark_notification_read</td>
                  <td className="py-2">Mark a single notification as read</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4 font-mono text-xs text-foreground">mark_all_notifications_read</td>
                  <td className="py-2">Mark all unread notifications as read</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4 font-mono text-xs text-foreground">update_profile</td>
                  <td className="py-2">Update your profile (name, bio, GitHub, avatar, contact)</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4 font-mono text-xs text-foreground">set_bot_identity</td>
                  <td className="py-2">Switch session to act as a specific bot persona</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-mono text-xs text-foreground">create_bot</td>
                  <td className="py-2">Create a new bot with name, role, and system prompt</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold">Example Workflows</h2>
          <p className="mb-4 text-muted-foreground">
            Here are some things you can ask Claude Code to do once connected:
          </p>
          <div className="space-y-3">
            <div className="rounded-lg bg-muted p-4">
              <code className="text-sm">
                &quot;List all my in-progress ideas&quot;
              </code>
            </div>
            <div className="rounded-lg bg-muted p-4">
              <code className="text-sm">
                &quot;Show me the board for my authentication idea&quot;
              </code>
            </div>
            <div className="rounded-lg bg-muted p-4">
              <code className="text-sm">
                &quot;Create a task for implementing the login form in the To Do
                column&quot;
              </code>
            </div>
            <div className="rounded-lg bg-muted p-4">
              <code className="text-sm">
                &quot;Move the API design task to In Progress and assign it to
                me&quot;
              </code>
            </div>
            <div className="rounded-lg bg-muted p-4">
              <code className="text-sm">
                &quot;Report a bug: the signup form doesn&apos;t validate email
                format&quot;
              </code>
            </div>
            <div className="rounded-lg bg-muted p-4">
              <code className="text-sm">
                &quot;What tasks are assigned to me across all my projects?&quot;
              </code>
            </div>
            <div className="rounded-lg bg-muted p-4">
              <code className="text-sm">
                &quot;Create a new idea called &apos;Mobile App&apos; with tags
                mobile and react-native&quot;
              </code>
            </div>
            <div className="rounded-lg bg-muted p-4">
              <code className="text-sm">
                &quot;Add a &apos;Review&apos; column to the board and reorder
                columns so it comes before Done&quot;
              </code>
            </div>
            <div className="rounded-lg bg-muted p-4">
              <code className="text-sm">
                &quot;Show me my unread notifications and mark them all as
                read&quot;
              </code>
            </div>
            <div className="rounded-lg bg-muted p-4">
              <code className="text-sm">
                &quot;Upvote the &apos;Dark mode&apos; idea and add me as a
                collaborator&quot;
              </code>
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold">
            Local Server (Contributors Only)
          </h2>
          <p className="mb-4 text-muted-foreground">
            This section is only for developers who have cloned the VibeCodes
            repo and are contributing to the codebase. Most users should use
            the <strong className="text-foreground">remote server</strong>{" "}
            above.
          </p>
          <p className="mb-4 text-muted-foreground">
            The local MCP server runs over stdio and is already configured in
            the project&apos;s{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
              .mcp.json
            </code>
            . It uses a service-role Supabase client and a dedicated bot user,
            bypassing RLS for full access. It requires{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
              SUPABASE_URL
            </code>{" "}
            and{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
              SUPABASE_SERVICE_ROLE_KEY
            </code>{" "}
            environment variables in{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
              mcp-server/.env
            </code>
            .
          </p>
        </section>
      </div>

      <div className="mt-12 flex justify-between border-t border-border pt-6">
        <Link href="/guide/kanban-boards">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Kanban Boards
          </Button>
        </Link>
        <Link href="/guide/ai-bot-teams">
          <Button variant="outline" className="gap-2">
            AI Bot Teams
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
