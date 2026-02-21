import Link from "next/link";
import { Users, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Collaboration - VibeCodes Guide",
  description:
    "Join projects, add collaborators, manage teams, and stay updated with notifications on VibeCodes.",
};

export default function CollaborationPage() {
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
          <Users className="h-6 w-6 text-primary" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Collaboration</h1>
      </div>

      <div className="space-y-10">
        <section>
          <h2 className="mb-4 text-2xl font-semibold">Joining a Project</h2>
          <p className="mb-4 text-muted-foreground">
            On any public idea, click the{" "}
            <strong className="text-foreground">I want to build this</strong>{" "}
            button to join the project. This gives you:
          </p>
          <ul className="list-inside list-disc space-y-2 text-muted-foreground">
            <li>Access to the idea&apos;s kanban board</li>
            <li>Ability to be assigned tasks</li>
            <li>Notifications for updates on the idea</li>
            <li>Visibility if the idea is later set to private</li>
          </ul>
          <p className="mt-4 text-muted-foreground">
            Click the button again to leave the project at any time.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold">
            Adding Collaborators
          </h2>
          <p className="mb-4 text-muted-foreground">
            As the idea author, you can directly add collaborators to your
            project — especially useful for private ideas where self-joining
            isn&apos;t possible.
          </p>
          <ul className="list-inside list-disc space-y-2 text-muted-foreground">
            <li>
              Use the <strong className="text-foreground">Add Collaborator</strong>{" "}
              button on your idea&apos;s detail page
            </li>
            <li>Search for users by name or email</li>
            <li>The added user receives a notification letting them know</li>
            <li>
              You can remove collaborators from the collaborator list at any time
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold">Members Directory</h2>
          <p className="mb-4 text-muted-foreground">
            The <strong className="text-foreground">Members</strong> page is
            the best way to discover people on VibeCodes. Browse all users,
            search by name, sort by activity, and click through to their
            profiles to see what they&apos;re working on.
          </p>
          <p className="text-muted-foreground">
            Use it to find collaborators for your ideas, or explore profiles
            to discover projects you might want to join.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold">Notifications</h2>
          <p className="mb-4 text-muted-foreground">
            VibeCodes sends real-time notifications so you never miss an update.
            The <strong className="text-foreground">bell icon</strong> in the
            navbar shows your unread count. Click it to see your notifications
            and use <strong className="text-foreground">Mark all as read</strong>{" "}
            to clear them.
          </p>
          <p className="mb-4 text-muted-foreground">
            You&apos;ll get notified when:
          </p>
          <ul className="mb-4 list-inside list-disc space-y-2 text-muted-foreground">
            <li>Someone <strong className="text-foreground">votes</strong> on your idea</li>
            <li>Someone <strong className="text-foreground">comments</strong> on your idea</li>
            <li>A new <strong className="text-foreground">collaborator joins</strong> your idea</li>
            <li>An idea you collaborate on <strong className="text-foreground">changes status</strong></li>
            <li>You&apos;re <strong className="text-foreground">@mentioned</strong> in a task comment or description</li>
          </ul>
          <div className="rounded-xl border border-border bg-muted/30 p-6">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">Tip:</strong> Customize which
              notifications you receive in your{" "}
              <strong className="text-foreground">profile settings</strong>.
              Each type — votes, comments, collaborator joins, status changes,
              and task mentions — can be toggled on or off individually.
            </p>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold">Team Profiles</h2>
          <p className="text-muted-foreground">
            Every user has a public profile showing their ideas, collaborations,
            and activity. Visit a collaborator&apos;s profile to see what else
            they&apos;re working on and find more projects to join.
          </p>
        </section>
      </div>

      <div className="mt-12 flex justify-between border-t border-border pt-6">
        <Link href="/guide/ideas-and-voting">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Ideas & Voting
          </Button>
        </Link>
        <Link href="/guide/kanban-boards">
          <Button variant="outline" className="gap-2">
            Kanban Boards
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
