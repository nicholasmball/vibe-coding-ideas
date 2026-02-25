import Link from "next/link";

export const metadata = {
  title: "Terms of Service",
  description:
    "The Terms of Service governing your use of VibeCodes — a collaborative idea board for developers.",
};

const EFFECTIVE_DATE = "23 February 2026";
const CONTACT_EMAIL = "hello@vibecodes.co.uk";

export default function TermsOfServicePage() {
  return (
    <div className="prose prose-neutral dark:prose-invert max-w-none">
      <h1 className="text-3xl font-bold tracking-tight">Terms of Service</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Effective date: {EFFECTIVE_DATE}
      </p>

      <div className="mt-6 rounded-xl border border-border bg-muted/30 p-5 text-sm text-muted-foreground">
        <strong className="text-foreground">Summary:</strong> VibeCodes is a
        free platform for sharing and collaborating on software ideas. By using
        it you agree to these terms. Be respectful, own your content, and
        don&apos;t misuse the service. We&apos;re based in the UK and English
        law applies.
      </div>

      {/* 1 */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold">1. Acceptance of Terms</h2>
        <p className="mt-3 text-muted-foreground">
          By accessing or using VibeCodes at{" "}
          <strong className="text-foreground">vibecodes.co.uk</strong> (the
          &ldquo;Service&rdquo;), you agree to be bound by these Terms of
          Service (&ldquo;Terms&rdquo;) and our{" "}
          <Link href="/privacy" className="underline hover:text-foreground">
            Privacy Policy
          </Link>
          . If you do not agree, you must not use the Service.
        </p>
        <p className="mt-3 text-muted-foreground">
          These Terms constitute a legally binding agreement between you and
          VibeCodes (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or
          &ldquo;our&rdquo;). We reserve the right to update these Terms at any
          time. Continued use of the Service after changes are posted
          constitutes acceptance of the revised Terms.
        </p>
      </section>

      {/* 2 */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold">2. About VibeCodes</h2>
        <p className="mt-3 text-muted-foreground">
          VibeCodes is a collaborative platform that allows users to submit
          software project ideas, vote on and discuss ideas, collaborate with
          other developers, manage tasks using kanban boards, and use AI-powered
          tools to enhance and develop their projects. The Service is currently
          provided free of charge as a community platform.
        </p>
      </section>

      {/* 3 */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold">
          3. Eligibility &amp; Account Registration
        </h2>
        <p className="mt-3 text-muted-foreground">
          You must be at least{" "}
          <strong className="text-foreground">13 years old</strong> to use the
          Service. If you are under 16 years old, you confirm that you have
          obtained consent from a parent or guardian before registering.
        </p>
        <p className="mt-3 text-muted-foreground">
          You may register using GitHub OAuth, Google OAuth, or an email and
          password. You are responsible for:
        </p>
        <ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
          <li>
            Maintaining the confidentiality of your account credentials.
          </li>
          <li>
            All activity that occurs under your account.
          </li>
          <li>
            Notifying us immediately at{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="underline hover:text-foreground"
            >
              {CONTACT_EMAIL}
            </a>{" "}
            if you suspect unauthorised access.
          </li>
        </ul>
        <p className="mt-3 text-muted-foreground">
          You must provide accurate information during registration and keep
          your profile details up to date. We reserve the right to suspend or
          terminate accounts that contain false information.
        </p>
      </section>

      {/* 4 */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold">4. User Content</h2>
        <p className="mt-3 text-muted-foreground">
          &ldquo;User Content&rdquo; means any ideas, descriptions, comments,
          task names, attachments, or other material you submit to the Service.
        </p>

        <h3 className="mt-5 text-base font-semibold">4.1 Ownership</h3>
        <p className="mt-2 text-muted-foreground">
          You retain ownership of all intellectual property rights in your User
          Content. By submitting content to the Service, you grant VibeCodes a
          worldwide, royalty-free, non-exclusive licence to host, store,
          display, and reproduce that content solely for the purpose of
          operating and improving the Service.
        </p>

        <h3 className="mt-5 text-base font-semibold">4.2 Your Responsibilities</h3>
        <p className="mt-2 text-muted-foreground">
          You are solely responsible for your User Content. You represent and
          warrant that:
        </p>
        <ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
          <li>
            You own or have the necessary rights to submit the content.
          </li>
          <li>
            The content does not infringe any third-party intellectual property,
            privacy, or other rights.
          </li>
          <li>
            The content complies with applicable law and these Terms.
          </li>
        </ul>

        <h3 className="mt-5 text-base font-semibold">4.3 Removal</h3>
        <p className="mt-2 text-muted-foreground">
          We reserve the right to remove any User Content that violates these
          Terms or that we deem harmful to the Service or its users, without
          prior notice.
        </p>
      </section>

      {/* 5 */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold">5. Acceptable Use</h2>
        <p className="mt-3 text-muted-foreground">
          You agree not to use the Service to:
        </p>
        <ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
          <li>
            Post content that is unlawful, defamatory, obscene, hateful,
            threatening, or harassing.
          </li>
          <li>
            Infringe any third-party intellectual property, privacy, or
            publicity rights.
          </li>
          <li>
            Distribute malware, spam, or unsolicited promotional material.
          </li>
          <li>
            Attempt to gain unauthorised access to the Service, its
            infrastructure, or other users&apos; accounts.
          </li>
          <li>
            Scrape, crawl, or extract data from the Service by automated means
            without our express written consent.
          </li>
          <li>
            Impersonate any person or entity, or misrepresent your affiliation.
          </li>
          <li>
            Use the Service for any illegal purpose or in violation of any
            applicable law or regulation, including UK data protection law.
          </li>
          <li>
            Interfere with or disrupt the integrity or performance of the
            Service.
          </li>
        </ul>
        <p className="mt-3 text-muted-foreground">
          Violation of these rules may result in immediate suspension or
          termination of your account and, where appropriate, referral to law
          enforcement authorities.
        </p>
      </section>

      {/* 6 */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold">6. AI Features</h2>
        <p className="mt-3 text-muted-foreground">
          VibeCodes offers AI-powered features including idea enhancement, board
          generation, and AI agent personas, powered by Anthropic&apos;s Claude
          models via the Vercel AI SDK.
        </p>
        <ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
          <li>
            <strong className="text-foreground">No reliance:</strong> AI-generated
            output is provided for convenience only. You should independently
            verify any AI output before relying on it for decisions.
          </li>
          <li>
            <strong className="text-foreground">Content submission:</strong> When
            you use AI features, relevant portions of your content may be sent
            to Anthropic&apos;s API for processing. Please do not include
            sensitive personal data in prompts.
          </li>
          <li>
            <strong className="text-foreground">Usage limits:</strong> AI features
            are subject to per-user daily usage limits. We reserve the right to
            adjust or withdraw AI features at any time.
          </li>
          <li>
            <strong className="text-foreground">BYOK:</strong> If you provide your
            own Anthropic API key, you are subject to Anthropic&apos;s own Terms
            of Service and usage policies.
          </li>
        </ul>
      </section>

      {/* 7 */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold">7. Intellectual Property</h2>
        <p className="mt-3 text-muted-foreground">
          All rights in the VibeCodes platform, including its software, design,
          logos, and documentation, are owned by or licensed to VibeCodes and
          are protected under the{" "}
          <strong className="text-foreground">
            Copyright, Designs and Patents Act 1988
          </strong>{" "}
          and other applicable intellectual property laws.
        </p>
        <p className="mt-3 text-muted-foreground">
          Nothing in these Terms grants you any right to use our trade names,
          trademarks, service marks, or logos without our prior written consent.
          The open-source components of the Service are subject to their
          respective licences, as indicated in the{" "}
          <a
            href="https://github.com/nicholasmball/vibe-coding-ideas"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
          >
            GitHub repository
          </a>
          .
        </p>
      </section>

      {/* 8 */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold">8. Third-Party Services</h2>
        <p className="mt-3 text-muted-foreground">
          The Service integrates with third-party providers including:
        </p>
        <ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
          <li>
            <strong className="text-foreground">Supabase</strong> — database,
            authentication, and storage
          </li>
          <li>
            <strong className="text-foreground">GitHub &amp; Google</strong> —
            OAuth authentication
          </li>
          <li>
            <strong className="text-foreground">Anthropic</strong> — AI model
            processing
          </li>
          <li>
            <strong className="text-foreground">Vercel</strong> — hosting and
            deployment
          </li>
        </ul>
        <p className="mt-3 text-muted-foreground">
          Your use of these third-party services is subject to their own terms
          and privacy policies. We are not responsible for the practices of
          third-party providers.
        </p>
      </section>

      {/* 9 */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold">9. Privacy &amp; Data Protection</h2>
        <p className="mt-3 text-muted-foreground">
          We process your personal data in accordance with our{" "}
          <Link href="/privacy" className="underline hover:text-foreground">
            Privacy Policy
          </Link>{" "}
          and applicable UK data protection legislation, including the{" "}
          <strong className="text-foreground">
            UK General Data Protection Regulation (UK GDPR)
          </strong>{" "}
          and the{" "}
          <strong className="text-foreground">
            Data Protection Act 2018
          </strong>
          . Please review the Privacy Policy to understand how we collect, use,
          and store your information.
        </p>
      </section>

      {/* 10 */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold">
          10. Disclaimer of Warranties
        </h2>
        <p className="mt-3 text-muted-foreground">
          The Service is provided on an{" "}
          <strong className="text-foreground">&ldquo;as is&rdquo;</strong> and{" "}
          <strong className="text-foreground">
            &ldquo;as available&rdquo;
          </strong>{" "}
          basis without warranties of any kind, whether express or implied,
          including but not limited to implied warranties of merchantability,
          fitness for a particular purpose, or non-infringement.
        </p>
        <p className="mt-3 text-muted-foreground">
          We do not warrant that the Service will be uninterrupted, error-free,
          or free of viruses or other harmful components. Nothing in these Terms
          affects your statutory rights as a consumer under English law.
        </p>
      </section>

      {/* 11 */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold">11. Limitation of Liability</h2>
        <p className="mt-3 text-muted-foreground">
          To the fullest extent permitted by applicable law, VibeCodes and its
          operators shall not be liable for any indirect, incidental, special,
          consequential, or punitive damages arising out of or in connection
          with your use of the Service, including but not limited to loss of
          data, loss of profits, or loss of goodwill.
        </p>
        <p className="mt-3 text-muted-foreground">
          Our total aggregate liability to you for any claim arising under these
          Terms shall not exceed{" "}
          <strong className="text-foreground">&pound;100</strong>. Nothing in
          these Terms limits our liability for death or personal injury caused
          by our negligence, fraud, or any other liability that cannot be
          excluded under English law.
        </p>
      </section>

      {/* 12 */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold">12. Indemnification</h2>
        <p className="mt-3 text-muted-foreground">
          You agree to indemnify and hold harmless VibeCodes and its operators
          from and against any claims, damages, losses, liabilities, costs, and
          expenses (including reasonable legal fees) arising from your use of
          the Service, your User Content, or your violation of these Terms or
          applicable law.
        </p>
      </section>

      {/* 13 */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold">13. Termination</h2>
        <p className="mt-3 text-muted-foreground">
          You may delete your account at any time from your profile settings.
          We reserve the right to suspend or terminate your account and access
          to the Service at our sole discretion, with or without notice, if we
          reasonably believe you have violated these Terms.
        </p>
        <p className="mt-3 text-muted-foreground">
          Upon termination, your right to use the Service ceases immediately.
          Provisions that by their nature should survive termination (including
          sections on intellectual property, limitation of liability, and
          governing law) will do so.
        </p>
      </section>

      {/* 14 */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold">14. Changes to These Terms</h2>
        <p className="mt-3 text-muted-foreground">
          We may update these Terms from time to time. When we do, we will
          revise the effective date at the top of this page. For material
          changes, we will make reasonable efforts to notify users (for example,
          via a notice in the application or by email). Your continued use of
          the Service after changes take effect constitutes your acceptance of
          the updated Terms.
        </p>
      </section>

      {/* 15 */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold">
          15. Governing Law &amp; Disputes
        </h2>
        <p className="mt-3 text-muted-foreground">
          These Terms and any disputes arising in connection with them shall be
          governed by and construed in accordance with the laws of{" "}
          <strong className="text-foreground">England and Wales</strong>. You
          agree to submit to the exclusive jurisdiction of the courts of England
          and Wales, without prejudice to any mandatory consumer protection
          rights you may have under the law of your country of residence.
        </p>
        <p className="mt-3 text-muted-foreground">
          If a dispute arises, we encourage you to contact us first to seek an
          informal resolution before initiating formal proceedings.
        </p>
      </section>

      {/* 16 */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold">16. Contact</h2>
        <p className="mt-3 text-muted-foreground">
          If you have any questions about these Terms, please contact us at:
        </p>
        <div className="mt-3 rounded-xl border border-border bg-muted/30 p-5 text-sm">
          <p className="font-medium text-foreground">VibeCodes</p>
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
      </section>

      <div className="mt-12 border-t border-border pt-6 text-sm text-muted-foreground">
        <p>
          See also:{" "}
          <Link href="/privacy" className="underline hover:text-foreground">
            Privacy Policy
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
