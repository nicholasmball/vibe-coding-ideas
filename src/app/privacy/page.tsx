import Link from "next/link";

export const metadata = {
  title: "Privacy Policy - VibeCodes",
  description:
    "How VibeCodes collects, uses, and protects your personal data — compliant with UK GDPR and the Data Protection Act 2018.",
};

const EFFECTIVE_DATE = "23 February 2026";
const CONTACT_EMAIL = "hello@vibecodes.co.uk";

export default function PrivacyPolicyPage() {
  return (
    <div className="prose prose-neutral dark:prose-invert max-w-none">
      <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Effective date: {EFFECTIVE_DATE}
      </p>

      <div className="mt-6 rounded-xl border border-border bg-muted/30 p-5 text-sm text-muted-foreground">
        <strong className="text-foreground">Summary:</strong> VibeCodes
        collects only the data needed to run the platform. We don&apos;t sell
        your data, we don&apos;t use it for advertising, and we minimise
        third-party sharing. You can delete your account and data at any time.
        UK GDPR, the Data Protection Act 2018, and the Privacy and Electronic
        Communications Regulations 2003 (PECR) apply.
      </div>

      {/* 1 */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold">
          1. Data Controller &amp; Contact Details
        </h2>
        <p className="mt-3 text-muted-foreground">
          VibeCodes is operated by{" "}
          <strong className="text-foreground">Nick Ball</strong>, a sole trader
          based in England. For the purposes of the UK General Data Protection
          Regulation (UK GDPR) and the Data Protection Act 2018, Nick Ball is
          the data controller responsible for your personal data.
        </p>
        <div className="mt-3 rounded-xl border border-border bg-muted/30 p-5 text-sm">
          <p className="font-medium text-foreground">Data Controller</p>
          <p className="mt-1 text-muted-foreground">Nick Ball (sole trader)</p>
          <p className="mt-1 text-muted-foreground">
            Email:{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="underline hover:text-foreground"
            >
              {CONTACT_EMAIL}
            </a>
          </p>
          <p className="mt-1 text-muted-foreground">
            Website:{" "}
            <a
              href="https://vibecodes.co.uk"
              className="underline hover:text-foreground"
            >
              vibecodes.co.uk
            </a>
          </p>
        </div>
        <p className="mt-3 text-muted-foreground">
          If you have questions about this policy or wish to exercise your data
          rights, please contact us at{" "}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="underline hover:text-foreground"
          >
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </section>

      {/* 2 */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold">2. What Data We Collect</h2>
        <p className="mt-3 text-muted-foreground">
          We collect the following categories of personal data:
        </p>

        <h3 className="mt-5 text-base font-semibold">
          2.1 Data you provide directly
        </h3>
        <ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
          <li>
            <strong className="text-foreground">Account information:</strong>{" "}
            email address, display name, password (hashed), and avatar (via
            upload or OAuth provider)
          </li>
          <li>
            <strong className="text-foreground">Profile data:</strong> bio,
            GitHub username, and contact information you choose to add
          </li>
          <li>
            <strong className="text-foreground">Content:</strong> ideas,
            comments, task descriptions, checklist items, and other material you
            submit
          </li>
          <li>
            <strong className="text-foreground">File attachments:</strong>{" "}
            files you upload to tasks (stored in private storage) and avatar
            images (stored in public storage)
          </li>
          <li>
            <strong className="text-foreground">Bot profiles:</strong> if you
            create AI agent personas, we store the bot name, role, system
            prompt, and avatar URL
          </li>
          <li>
            <strong className="text-foreground">API keys:</strong> if you
            provide your own Anthropic API key (BYOK), it is stored in
            encrypted form in our database. See Section 6 for details.
          </li>
        </ul>

        <h3 className="mt-5 text-base font-semibold">
          2.2 Data collected automatically
        </h3>
        <ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
          <li>
            <strong className="text-foreground">Authentication tokens:</strong>{" "}
            session cookies and JWTs managed by Supabase Auth
          </li>
          <li>
            <strong className="text-foreground">Usage data:</strong> pages
            visited, features used, and timestamps of activity (via server logs)
          </li>
          <li>
            <strong className="text-foreground">Board activity logs:</strong>{" "}
            task changes, column moves, label updates, and other board actions
            are logged with actor identity, action type, and details
          </li>
          <li>
            <strong className="text-foreground">AI usage data:</strong> when you
            use AI features, we log the action type, input/output token counts,
            model used, key type (platform or BYOK), and associated idea — but
            not the full prompt or response content
          </li>
          <li>
            <strong className="text-foreground">Realtime connections:</strong>{" "}
            we use Supabase Realtime (WebSocket) to deliver live updates; your
            connection metadata is processed but not stored
          </li>
        </ul>

        <h3 className="mt-5 text-base font-semibold">
          2.3 Data from third parties
        </h3>
        <ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
          <li>
            <strong className="text-foreground">OAuth providers:</strong> if you
            sign in with GitHub or Google, we receive your email address, name,
            and avatar URL from those providers
          </li>
        </ul>
      </section>

      {/* 3 */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold">
          3. How and Why We Use Your Data
        </h2>
        <p className="mt-3 text-muted-foreground">
          We process your personal data for the following purposes:
        </p>
        <ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
          <li>
            <strong className="text-foreground">Providing the Service:</strong>{" "}
            creating and managing your account, displaying your content, and
            enabling collaboration features
          </li>
          <li>
            <strong className="text-foreground">Notifications:</strong> sending
            in-app notifications about votes, comments, mentions, and
            collaboration activity (configurable in your notification
            preferences), and transactional emails such as password reset
            messages
          </li>
          <li>
            <strong className="text-foreground">AI features:</strong> processing
            your content through Anthropic&apos;s Claude models when you
            explicitly use AI enhancement or board generation features
          </li>
          <li>
            <strong className="text-foreground">
              MCP (Model Context Protocol) access:
            </strong>{" "}
            if you connect via the remote MCP endpoint, your content and actions
            are processed through the API on your behalf, authenticated with
            your credentials via OAuth 2.1
          </li>
          <li>
            <strong className="text-foreground">Security:</strong> detecting and
            preventing abuse, unauthorised access, and spam
          </li>
          <li>
            <strong className="text-foreground">Improvement:</strong> analysing
            usage patterns to improve the Service (aggregated and anonymised
            where possible)
          </li>
        </ul>
      </section>

      {/* 4 */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold">4. Legal Basis for Processing</h2>
        <p className="mt-3 text-muted-foreground">
          Under the UK GDPR, we rely on the following legal bases:
        </p>
        <ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
          <li>
            <strong className="text-foreground">
              Contract (Article 6(1)(b)):
            </strong>{" "}
            processing necessary to provide you with the Service under our{" "}
            <Link href="/terms" className="underline hover:text-foreground">
              Terms of Service
            </Link>
            . This includes account creation, content hosting, collaboration
            features, and notifications.
          </li>
          <li>
            <strong className="text-foreground">
              Legitimate interests (Article 6(1)(f)):
            </strong>{" "}
            security monitoring, fraud prevention, and service improvement. We
            have assessed that these interests do not override your rights and
            freedoms because: (a) security processing is limited to what is
            necessary to protect all users; (b) service improvement uses
            aggregated and anonymised data where possible; and (c) you can
            object to this processing at any time (see Section 8).
          </li>
          <li>
            <strong className="text-foreground">
              Consent (Article 6(1)(a)):
            </strong>{" "}
            where you explicitly opt in to optional features such as AI
            processing of your content. You may withdraw consent at any time
            without affecting the lawfulness of processing carried out before
            withdrawal.
          </li>
        </ul>
        <p className="mt-3 text-muted-foreground">
          <strong className="text-foreground">
            Statutory and contractual obligations:
          </strong>{" "}
          providing your email address is a contractual requirement to create an
          account. If you do not provide it, we cannot register you for the
          Service. There is no statutory obligation to provide personal data.
        </p>
      </section>

      {/* 5 */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold">
          5. Public and Private Content
        </h2>
        <p className="mt-3 text-muted-foreground">
          VibeCodes allows you to set ideas as{" "}
          <strong className="text-foreground">public</strong> or{" "}
          <strong className="text-foreground">private</strong>:
        </p>
        <ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
          <li>
            <strong className="text-foreground">Public ideas:</strong> visible
            to all authenticated users. Your display name, avatar, and the
            content of the idea (title, description, comments, board tasks) are
            visible to others.
          </li>
          <li>
            <strong className="text-foreground">Private ideas:</strong> visible
            only to you, your collaborators, and platform administrators.
          </li>
          <li>
            <strong className="text-foreground">Avatar images:</strong> stored
            in a public storage bucket and accessible via URL.
          </li>
          <li>
            <strong className="text-foreground">Task attachments:</strong>{" "}
            stored in a private storage bucket; accessible only to idea team
            members via time-limited signed URLs.
          </li>
        </ul>
        <p className="mt-3 text-muted-foreground">
          Platform administrators have access to all content (public and
          private) for the purposes of moderation, security, and support.
        </p>
      </section>

      {/* 6 */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold">
          6. Data Sharing &amp; Third Parties
        </h2>
        <p className="mt-3 text-muted-foreground">
          We do not sell your personal data. We share data only with the
          following categories of third parties, solely to operate the Service:
        </p>
        <ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
          <li>
            <strong className="text-foreground">Supabase, Inc.</strong>{" "}
            (database, authentication, file storage, Realtime) — processes data
            on our behalf as a data processor under a Data Processing Agreement
            (Article 28 UK GDPR). Data is processed in the{" "}
            <strong className="text-foreground">EU (AWS eu-west-1)</strong> or{" "}
            <strong className="text-foreground">US (AWS us-east-1)</strong>{" "}
            depending on project region. Transfers to the US are covered by the
            UK Extension to the EU-US Data Privacy Framework.
          </li>
          <li>
            <strong className="text-foreground">Vercel, Inc.</strong> (hosting
            and deployment) — serves the application and processes server logs.
            Data is processed in{" "}
            <strong className="text-foreground">
              edge locations globally
            </strong>{" "}
            and the US. Transfers are covered by Standard Contractual Clauses
            (SCCs) and Vercel&apos;s DPA.
          </li>
          <li>
            <strong className="text-foreground">Anthropic, PBC</strong> (AI
            processing) — when you use AI features, relevant content is sent to
            Anthropic&apos;s API. Data is processed in the{" "}
            <strong className="text-foreground">US</strong>. If you provide your
            own Anthropic API key (BYOK), your content is sent directly to
            Anthropic under your own agreement with them — your encrypted API
            key is stored in our database but only decrypted server-side at the
            point of use. See{" "}
            <a
              href="https://www.anthropic.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground"
            >
              Anthropic&apos;s Privacy Policy
            </a>
            .
          </li>
          <li>
            <strong className="text-foreground">
              GitHub, Inc. &amp; Google LLC
            </strong>{" "}
            (OAuth authentication) — only if you choose to sign in via these
            providers. Data is processed in the{" "}
            <strong className="text-foreground">US</strong>. Transfers are
            covered by adequacy decisions and/or SCCs.
          </li>
        </ul>
        <p className="mt-3 text-muted-foreground">
          Where personal data is transferred outside the UK, we ensure
          appropriate safeguards are in place as required by Chapter V of the UK
          GDPR, including Standard Contractual Clauses (SCCs), adequacy
          decisions, or the UK Extension to the EU-US Data Privacy Framework, as
          specified per provider above.
        </p>
        <p className="mt-3 text-muted-foreground">
          We have Data Processing Agreements (DPAs) in place with our
          sub-processors in accordance with Article 28 of the UK GDPR. You may
          request a copy of the relevant safeguards by contacting us.
        </p>
      </section>

      {/* 7 */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold">7. Data Retention</h2>
        <p className="mt-3 text-muted-foreground">
          We retain your personal data for as long as your account is active or
          as needed to provide the Service. Specifically:
        </p>
        <ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
          <li>
            <strong className="text-foreground">Account data:</strong> retained
            until you delete your account
          </li>
          <li>
            <strong className="text-foreground">User content:</strong> retained
            until you delete it or delete your account (at which point all your
            content is permanently removed)
          </li>
          <li>
            <strong className="text-foreground">File attachments:</strong>{" "}
            deleted when you remove them, or when your account is deleted
          </li>
          <li>
            <strong className="text-foreground">AI usage logs:</strong> retained
            for up to 12 months for rate limiting and analytics, then
            anonymised or deleted
          </li>
          <li>
            <strong className="text-foreground">Board activity logs:</strong>{" "}
            retained for as long as the associated idea exists
          </li>
          <li>
            <strong className="text-foreground">Server logs:</strong> retained
            for up to 30 days for security and debugging purposes
          </li>
        </ul>
        <p className="mt-3 text-muted-foreground">
          When you delete your account, we permanently delete your data from our
          systems (including cascading deletion of all content, bot profiles,
          and activity records). Some data may persist in encrypted backups for
          a short period before being overwritten.
        </p>
      </section>

      {/* 8 */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold">8. Your Rights</h2>
        <p className="mt-3 text-muted-foreground">
          Under UK GDPR, you have the following rights regarding your personal
          data:
        </p>
        <ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
          <li>
            <strong className="text-foreground">Access (Article 15):</strong>{" "}
            request a copy of the personal data we hold about you
          </li>
          <li>
            <strong className="text-foreground">
              Rectification (Article 16):
            </strong>{" "}
            request correction of inaccurate or incomplete data (you can also
            edit your profile directly)
          </li>
          <li>
            <strong className="text-foreground">Erasure (Article 17):</strong>{" "}
            request deletion of your data (you can delete your account from your
            profile settings at any time)
          </li>
          <li>
            <strong className="text-foreground">
              Restriction (Article 18):
            </strong>{" "}
            request that we limit how we process your data in certain
            circumstances
          </li>
          <li>
            <strong className="text-foreground">
              Portability (Article 20):
            </strong>{" "}
            request your data in a structured, commonly used, machine-readable
            format
          </li>
          <li>
            <strong className="text-foreground">
              Objection (Article 21):
            </strong>{" "}
            object to processing based on legitimate interests — we will cease
            processing unless we demonstrate compelling legitimate grounds
          </li>
          <li>
            <strong className="text-foreground">Withdraw consent:</strong> where
            processing is based on consent, you may withdraw it at any time
            without affecting the lawfulness of processing carried out before
            withdrawal
          </li>
        </ul>
        <p className="mt-3 text-muted-foreground">
          To exercise any of these rights, email us at{" "}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="underline hover:text-foreground"
          >
            {CONTACT_EMAIL}
          </a>
          . We will respond within one month as required by law. If your request
          is complex or we receive a high volume of requests, we may extend this
          by a further two months, and we will inform you of any extension
          within the first month.
        </p>
        <p className="mt-3 text-muted-foreground">
          If you are unsatisfied with our response, you have the right to lodge
          a complaint with the{" "}
          <a
            href="https://ico.org.uk/make-a-complaint/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
          >
            Information Commissioner&apos;s Office (ICO)
          </a>
          , the UK&apos;s supervisory authority for data protection.
        </p>
      </section>

      {/* 9 */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold">
          9. Automated Decision-Making
        </h2>
        <p className="mt-3 text-muted-foreground">
          VibeCodes does not carry out any automated decision-making or
          profiling that produces legal effects or similarly significantly
          affects you, as defined under Article 22 of the UK GDPR. AI features
          are user-initiated and produce suggestions only — no automated
          decisions are made about your access, account status, or rights based
          solely on automated processing.
        </p>
      </section>

      {/* 10 */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold">
          10. Cookies, Local Storage &amp; PECR
        </h2>
        <p className="mt-3 text-muted-foreground">
          This section covers our use of cookies and similar technologies in
          compliance with the{" "}
          <strong className="text-foreground">
            Privacy and Electronic Communications Regulations 2003 (PECR)
          </strong>{" "}
          and the UK GDPR.
        </p>
        <ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
          <li>
            <strong className="text-foreground">
              Authentication cookies (strictly necessary):
            </strong>{" "}
            session cookies set by Supabase Auth to keep you logged in. These
            are essential for the Service to function and do not require consent
            under PECR Regulation 6(4).
          </li>
          <li>
            <strong className="text-foreground">localStorage:</strong> used for
            UI preferences such as theme selection, dashboard panel order, and
            collapsed section state. This data never leaves your browser and is
            strictly necessary for the features you have requested.
          </li>
          <li>
            <strong className="text-foreground">Service Worker cache:</strong>{" "}
            caches static assets locally for faster loading and offline support.
            No personal data is cached.
          </li>
        </ul>
        <p className="mt-3 text-muted-foreground">
          We do not use tracking cookies, advertising cookies, or third-party
          analytics cookies. If we introduce analytics in the future, we will
          update this policy and obtain your consent before setting any
          non-essential cookies.
        </p>
      </section>

      {/* 11 */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold">11. Children&apos;s Privacy</h2>
        <p className="mt-3 text-muted-foreground">
          VibeCodes is not directed at children under{" "}
          <strong className="text-foreground">13 years old</strong>. We do not
          knowingly collect personal data from children under 13. If you believe
          a child under 13 has provided us with personal data, please contact us
          at{" "}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="underline hover:text-foreground"
          >
            {CONTACT_EMAIL}
          </a>{" "}
          and we will delete it promptly.
        </p>
        <p className="mt-3 text-muted-foreground">
          Users under 16 must have consent from a parent or guardian to use the
          Service, in accordance with Article 8 of the UK GDPR and as outlined
          in our{" "}
          <Link href="/terms" className="underline hover:text-foreground">
            Terms of Service
          </Link>
          .
        </p>
      </section>

      {/* 12 */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold">12. Security</h2>
        <p className="mt-3 text-muted-foreground">
          We take reasonable technical and organisational measures to protect
          your personal data, including:
        </p>
        <ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
          <li>
            Encryption in transit (HTTPS/TLS) for all connections
          </li>
          <li>
            Row Level Security (RLS) policies in our database ensuring users can
            only access authorised data
          </li>
          <li>
            OAuth 2.1 with PKCE for secure authentication flows
          </li>
          <li>
            Server-side validation of all user inputs
          </li>
          <li>
            Encrypted storage of sensitive credentials (e.g. BYOK API keys)
          </li>
          <li>
            Password hashing via Supabase Auth (bcrypt)
          </li>
        </ul>
        <p className="mt-3 text-muted-foreground">
          No system is 100% secure. If you discover a security vulnerability,
          please report it responsibly to{" "}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="underline hover:text-foreground"
          >
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </section>

      {/* 13 */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold">13. Data Breach Notification</h2>
        <p className="mt-3 text-muted-foreground">
          In the event of a personal data breach that is likely to result in a
          risk to your rights and freedoms, we will notify the ICO within 72
          hours of becoming aware of the breach, as required by Article 33 of
          the UK GDPR. Where the breach is likely to result in a{" "}
          <strong className="text-foreground">high risk</strong> to your rights
          and freedoms, we will also notify you directly without undue delay, as
          required by Article 34.
        </p>
      </section>

      {/* 14 */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold">
          14. Changes to This Policy
        </h2>
        <p className="mt-3 text-muted-foreground">
          We may update this Privacy Policy from time to time. When we do, we
          will revise the effective date at the top of this page. For material
          changes, we will make reasonable efforts to notify you (for example,
          via an in-app notice or email) and, where required by law, obtain your
          consent before any new processing begins. We will not reduce your
          rights under this policy without your explicit consent.
        </p>
      </section>

      {/* 15 */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold">15. Contact &amp; Complaints</h2>
        <p className="mt-3 text-muted-foreground">
          If you have any questions about this Privacy Policy, wish to exercise
          your data rights, or want to make a complaint, please contact us at:
        </p>
        <div className="mt-3 rounded-xl border border-border bg-muted/30 p-5 text-sm">
          <p className="font-medium text-foreground">
            Nick Ball (Data Controller)
          </p>
          <p className="mt-1 text-muted-foreground">Trading as VibeCodes</p>
          <p className="mt-1 text-muted-foreground">
            Email:{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="underline hover:text-foreground"
            >
              {CONTACT_EMAIL}
            </a>
          </p>
          <p className="mt-1 text-muted-foreground">
            Website:{" "}
            <a
              href="https://vibecodes.co.uk"
              className="underline hover:text-foreground"
            >
              vibecodes.co.uk
            </a>
          </p>
        </div>
        <p className="mt-3 text-muted-foreground">
          You also have the right to lodge a complaint with the UK supervisory
          authority:
        </p>
        <div className="mt-3 rounded-xl border border-border bg-muted/30 p-5 text-sm">
          <p className="font-medium text-foreground">
            Information Commissioner&apos;s Office (ICO)
          </p>
          <p className="mt-1 text-muted-foreground">
            Website:{" "}
            <a
              href="https://ico.org.uk"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground"
            >
              ico.org.uk
            </a>
          </p>
          <p className="mt-1 text-muted-foreground">
            Helpline: 0303 123 1113
          </p>
        </div>
      </section>

      <div className="mt-12 border-t border-border pt-6 text-sm text-muted-foreground">
        <p>
          See also:{" "}
          <Link href="/terms" className="underline hover:text-foreground">
            Terms of Service
          </Link>{" "}
          &mdash;{" "}
          <Link href="/guide" className="underline hover:text-foreground">
            Guide
          </Link>
        </p>
      </div>
    </div>
  );
}
