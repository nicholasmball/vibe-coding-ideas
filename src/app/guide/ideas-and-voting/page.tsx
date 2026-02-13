import Link from "next/link";
import { Lightbulb, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "Ideas & Voting - VibeCodes Guide",
  description:
    "How ideas work on VibeCodes — statuses, voting, threaded comments, and visibility settings.",
};

export default function IdeasAndVotingPage() {
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
          <Lightbulb className="h-6 w-6 text-primary" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Ideas & Voting</h1>
      </div>

      <div className="space-y-10">
        <section>
          <h2 className="mb-4 text-2xl font-semibold">Idea Lifecycle</h2>
          <p className="mb-4 text-muted-foreground">
            Every idea goes through a status lifecycle. Only the author can
            change the status.
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">Open</Badge>
            <span className="text-muted-foreground">&rarr;</span>
            <Badge variant="secondary">In Progress</Badge>
            <span className="text-muted-foreground">&rarr;</span>
            <Badge variant="secondary">Completed</Badge>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Ideas can also be <strong className="text-foreground">Archived</strong> at
            any stage. Archived ideas are still visible but clearly marked.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold">Voting</h2>
          <p className="mb-4 text-muted-foreground">
            Show support for ideas you like by upvoting them. Votes use{" "}
            <strong className="text-foreground">optimistic updates</strong> — the
            UI updates instantly while the server catches up in the background.
          </p>
          <ul className="list-inside list-disc space-y-2 text-muted-foreground">
            <li>Click the upvote button to vote; click again to remove your vote</li>
            <li>Vote counts are visible on idea cards and detail pages</li>
            <li>The idea author gets a notification when someone votes</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold">Comments</h2>
          <p className="mb-4 text-muted-foreground">
            Every idea has a threaded comment section. Comments support markdown
            and come in three types:
          </p>
          <ul className="mb-4 list-inside list-disc space-y-2 text-muted-foreground">
            <li>
              <strong className="text-foreground">Comment</strong> — general
              discussion
            </li>
            <li>
              <strong className="text-foreground">Suggestion</strong> — propose
              a change or improvement
            </li>
            <li>
              <strong className="text-foreground">Question</strong> — ask the
              author for clarification
            </li>
          </ul>
          <p className="text-muted-foreground">
            The idea author can mark suggestions as{" "}
            <strong className="text-foreground">incorporated</strong> to show
            the feedback was acted on.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold">Visibility</h2>
          <p className="mb-4 text-muted-foreground">
            Ideas can be <strong className="text-foreground">public</strong> or{" "}
            <strong className="text-foreground">private</strong>:
          </p>
          <ul className="list-inside list-disc space-y-2 text-muted-foreground">
            <li>
              <strong className="text-foreground">Public</strong> — visible to
              everyone in the feed and on your profile
            </li>
            <li>
              <strong className="text-foreground">Private</strong> — only
              visible to you, your collaborators, and admins
            </li>
          </ul>
          <div className="mt-4 rounded-xl border border-border bg-muted/30 p-6">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">Tip:</strong> Private ideas are
              great for work-in-progress concepts you want to develop with a
              select group before sharing publicly.
            </p>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold">Editing & Deleting</h2>
          <p className="text-muted-foreground">
            As the author, you can edit your idea at any time — update the
            title, description, tags, GitHub link, or visibility. You can also
            delete your idea, which removes it and all associated data
            (comments, votes, board, etc.) permanently.
          </p>
        </section>
      </div>

      <div className="mt-12 flex justify-between border-t border-border pt-6">
        <Link href="/guide/getting-started">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Getting Started
          </Button>
        </Link>
        <Link href="/guide/collaboration">
          <Button variant="outline" className="gap-2">
            Collaboration
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
