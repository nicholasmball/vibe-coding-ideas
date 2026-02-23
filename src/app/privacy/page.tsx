import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Sparkles, Shield, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Privacy Policy - VibeCodes",
  description:
    "How VibeCodes collects, uses, stores, and protects your data. Plain-English privacy policy covering accounts, ideas, AI features, and third-party services.",
};

const LAST_UPDATED = "23 February 2026";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        <div className="mb-10 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Privacy Policy
            </h1>
            <p className="text-sm text-muted-foreground">
              Last updated: {LAST_UPDATED}
            </p>
          </div>
        </div>

        <div className="space-y-10">
          {/* Introduction */}
          <section>
            <p className="text-muted-foreground">
              VibeCodes (<strong className="text-foreground">vibecodes.co.uk</strong>) is
              an AI-powered idea board for developers. This policy explains what
              data we collect, why we collect it, how we store it, and what
              rights you have over it. We&apos;ve written this in plain English
              &mdash; no legal jargon.
            </p>
          </section>

          {/* Data We Collect */}
          <section>
            <h2 className="mb-4 text-2xl font-semibold">Data We Collect</h2>
            <p className="mb-4 text-muted-foreground">
              We only collect data that is necessary for VibeCodes to function.
              Here&apos;s everything we store:
            </p>

            <div className="space-y-6">
              <div>
                <h3 className="mb-2 text-lg font-medium">Account Information</h3>
                <p className="text-muted-foreground">
                  When you sign up, we store your{" "}
                  <strong className="text-foreground">email address</strong>,{" "}
                  <strong className="text-foreground">display name</strong>, and{" "}
                  <strong className="text-foreground">avatar</strong> (either
                  from your OAuth provider or uploaded manually). If you sign up
                  via GitHub or Google, we receive your public profile
                  information from those services.
                </p>
              </div>

              <div>
                <h3 className="mb-2 text-lg font-medium">
                  Ideas &amp; Content
                </h3>
                <p className="text-muted-foreground">
                  Everything you create on VibeCodes &mdash; ideas (titles,
                  descriptions, tags), comments, votes, and collaborator
                  relationships. Ideas can be set to{" "}
                  <strong className="text-foreground">public</strong> (visible to
                  everyone) or{" "}
                  <strong className="text-foreground">private</strong> (visible
                  only to you, your collaborators, and admins).
                </p>
              </div>

              <div>
                <h3 className="mb-2 text-lg font-medium">
                  Board &amp; Task Data
                </h3>
                <p className="text-muted-foreground">
                  Kanban board columns, tasks, labels, checklists, due dates,
                  task comments, activity logs, and file attachments (up to 10MB
                  per file, stored securely).
                </p>
              </div>

              <div>
                <h3 className="mb-2 text-lg font-medium">AI Interaction Data</h3>
                <p className="text-muted-foreground">
                  When you use AI features (idea enhancement, task generation),
                  we send your prompts and relevant idea/task content to
                  Anthropic&apos;s Claude API. We log the{" "}
                  <strong className="text-foreground">token counts</strong>,{" "}
                  <strong className="text-foreground">model used</strong>, and{" "}
                  <strong className="text-foreground">action type</strong> for
                  rate limiting and analytics. We do not store the full AI
                  responses separately. If you provide your own Anthropic API key
                  (BYOK), it is encrypted at rest.
                </p>
              </div>

              <div>
                <h3 className="mb-2 text-lg font-medium">Agent Profiles</h3>
                <p className="text-muted-foreground">
                  If you create AI agent personas, we store the agent name, role,
                  system prompt, and avatar URL. These are linked to your
                  account.
                </p>
              </div>

              <div>
                <h3 className="mb-2 text-lg font-medium">
                  Notification Preferences
                </h3>
                <p className="text-muted-foreground">
                  Your per-type notification settings (votes, comments,
                  collaborator joins, status changes, task mentions) are stored
                  so we only send you notifications you want.
                </p>
              </div>

              <div>
                <h3 className="mb-2 text-lg font-medium">
                  Client-Side Storage
                </h3>
                <p className="text-muted-foreground">
                  We use{" "}
                  <strong className="text-foreground">localStorage</strong> in
                  your browser for dashboard layout preferences, collapsed
                  section states, and theme preference (light/dark). We do not
                  use third-party tracking cookies.
                </p>
              </div>
            </div>
          </section>

          {/* Third-Party Services */}
          <section>
            <h2 className="mb-4 text-2xl font-semibold">
              Third-Party Services
            </h2>
            <p className="mb-4 text-muted-foreground">
              VibeCodes relies on the following third-party services:
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="pb-3 pr-4 text-left font-semibold">
                      Service
                    </th>
                    <th className="pb-3 pr-4 text-left font-semibold">
                      Purpose
                    </th>
                    <th className="pb-3 text-left font-semibold">
                      Data Shared
                    </th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  <tr className="border-b border-border/50">
                    <td className="py-3 pr-4 font-medium text-foreground">
                      Supabase
                    </td>
                    <td className="py-3 pr-4">
                      Authentication, database, file storage, realtime updates
                    </td>
                    <td className="py-3">All user data</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-3 pr-4 font-medium text-foreground">
                      Vercel
                    </td>
                    <td className="py-3 pr-4">Hosting and edge functions</td>
                    <td className="py-3">Request logs, IP addresses</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-3 pr-4 font-medium text-foreground">
                      GitHub OAuth
                    </td>
                    <td className="py-3 pr-4">Authentication</td>
                    <td className="py-3">
                      Profile info (email, name, avatar)
                    </td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-3 pr-4 font-medium text-foreground">
                      Google OAuth
                    </td>
                    <td className="py-3 pr-4">Authentication</td>
                    <td className="py-3">
                      Profile info (email, name, avatar)
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 font-medium text-foreground">
                      Anthropic (Claude)
                    </td>
                    <td className="py-3 pr-4">AI features</td>
                    <td className="py-3">
                      Idea descriptions, prompts (only when you use AI features)
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="mt-4 text-sm text-muted-foreground">
              We do not sell your data to any third party. Data shared with
              these services is limited to what&apos;s necessary for their
              function.
            </p>
          </section>

          {/* How We Use Your Data */}
          <section>
            <h2 className="mb-4 text-2xl font-semibold">
              How We Use Your Data
            </h2>
            <ul className="list-inside list-disc space-y-2 text-muted-foreground">
              <li>To provide and maintain VibeCodes functionality</li>
              <li>To authenticate you and protect your account</li>
              <li>To send you in-app notifications based on your preferences</li>
              <li>
                To process AI requests (idea enhancement, task generation) when
                you initiate them
              </li>
              <li>
                To enforce rate limits and prevent abuse of AI features
              </li>
              <li>To display your public profile to other users</li>
              <li>
                To generate anonymous, aggregate usage statistics (e.g. total
                ideas shared, displayed on the landing page)
              </li>
            </ul>
          </section>

          {/* Data Retention & Deletion */}
          <section>
            <h2 className="mb-4 text-2xl font-semibold">
              Data Retention &amp; Deletion
            </h2>
            <p className="mb-4 text-muted-foreground">
              Your data is retained for as long as your account is active.
            </p>
            <p className="mb-4 text-muted-foreground">
              When your account is deleted, a{" "}
              <strong className="text-foreground">cascade delete</strong>{" "}
              removes all associated data: your profile, ideas, comments, votes,
              collaborator relationships, board tasks, file attachments, AI usage
              logs, agent profiles, and notifications. This is permanent and
              cannot be undone.
            </p>
            <p className="text-muted-foreground">
              Server access logs (IP addresses, request timestamps) retained by
              Vercel follow{" "}
              <a
                href="https://vercel.com/docs/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Vercel&apos;s retention policy
              </a>
              .
            </p>
          </section>

          {/* Your Rights */}
          <section>
            <h2 className="mb-4 text-2xl font-semibold">Your Rights</h2>
            <p className="mb-4 text-muted-foreground">
              Under UK GDPR, you have the right to:
            </p>
            <ul className="list-inside list-disc space-y-2 text-muted-foreground">
              <li>
                <strong className="text-foreground">Access</strong> &mdash;
                request a copy of the data we hold about you
              </li>
              <li>
                <strong className="text-foreground">Correction</strong> &mdash;
                update your profile, ideas, and comments at any time through the
                app
              </li>
              <li>
                <strong className="text-foreground">Deletion</strong> &mdash;
                request account deletion by contacting us (admin users can also
                delete accounts directly). All data is cascade-deleted.
              </li>
              <li>
                <strong className="text-foreground">Data portability</strong>{" "}
                &mdash; request an export of your data in a machine-readable
                format
              </li>
              <li>
                <strong className="text-foreground">Withdraw consent</strong>{" "}
                &mdash; you can stop using AI features at any time; revoke OAuth
                access from your GitHub/Google account settings
              </li>
            </ul>
            <p className="mt-4 text-muted-foreground">
              To exercise any of these rights, contact us using the details
              below. We aim to respond within 30 days.
            </p>
          </section>

          {/* Security */}
          <section>
            <h2 className="mb-4 text-2xl font-semibold">Security</h2>
            <p className="text-muted-foreground">
              All data is transmitted over HTTPS. Database access is controlled
              by Row-Level Security (RLS) policies &mdash; users can only access
              their own data and public content. File uploads are stored in
              private buckets with signed download URLs. BYOK API keys are
              encrypted at rest. Authentication uses industry-standard OAuth 2.0
              and session management via Supabase Auth.
            </p>
          </section>

          {/* Children */}
          <section>
            <h2 className="mb-4 text-2xl font-semibold">Children</h2>
            <p className="text-muted-foreground">
              VibeCodes is not intended for users under 13 years of age. We do
              not knowingly collect data from children. If you believe a child
              has created an account, please contact us and we will delete it.
            </p>
          </section>

          {/* Changes to This Policy */}
          <section>
            <h2 className="mb-4 text-2xl font-semibold">
              Changes to This Policy
            </h2>
            <p className="text-muted-foreground">
              We may update this policy from time to time. Changes will be
              posted on this page with an updated &ldquo;Last updated&rdquo;
              date. For significant changes, we&apos;ll notify users via in-app
              notification.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="mb-4 text-2xl font-semibold">Contact</h2>
            <p className="text-muted-foreground">
              For privacy-related questions or to exercise your data rights,
              contact us at:{" "}
              <a
                href="mailto:privacy@vibecodes.co.uk"
                className="text-primary hover:underline"
              >
                privacy@vibecodes.co.uk
              </a>
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
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
