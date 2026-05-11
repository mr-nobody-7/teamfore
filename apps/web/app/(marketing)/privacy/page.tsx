import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { MarketingNav } from "@/components/marketing/marketing-nav";

export const metadata: Metadata = {
  title: "Privacy Policy — TeamFore",
  description: "How TeamFore collects, uses, and protects your data.",
};

export default function PrivacyPage() {
  return (
    <div className="bg-linear-to-b from-[#14111d] via-[#0f0c17] to-[#0a0813] text-white min-h-screen">
      <MarketingNav />
      <main className="mx-auto w-full max-w-3xl px-6 pb-24 pt-28">
        {/* Back button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          Privacy Policy
        </h1>
        <p className="mt-3 text-sm text-zinc-400">
          Last updated: April 27, 2026
        </p>

        <div className="mt-10 space-y-10 text-sm leading-relaxed text-zinc-300">
          <section>
            <h2 className="mb-3 text-base font-semibold text-white">
              1. Who we are
            </h2>
            <p>
              TeamFore (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) is a
              workspace-based leave and availability management platform built
              for teams. This Privacy Policy explains how we collect, use, and
              protect your information when you use our service at{" "}
              <span className="font-medium text-white">
                teamfore.vercel.app
              </span>
              .
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-white">
              2. Information we collect
            </h2>
            <p className="mb-3">
              We collect only the information necessary to provide the service:
            </p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <span className="font-medium text-white">
                  Account information:
                </span>{" "}
                your name and email address, provided directly or via Google
                OAuth sign-in.
              </li>
              <li>
                <span className="font-medium text-white">
                  Google OAuth data:
                </span>{" "}
                when you sign in with Google, we receive your name, email
                address, and Google account ID. We do not receive your Google
                password or access to your Google account beyond authentication.
              </li>
              <li>
                <span className="font-medium text-white">Usage data:</span>{" "}
                leave requests, availability status, workload status, and other
                actions you take within the app.
              </li>
              <li>
                <span className="font-medium text-white">Workspace data:</span>{" "}
                team names, user roles, leave type configurations, and related
                settings created by your workspace admin.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-white">
              3. How we use your information
            </h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>To authenticate you and manage your session securely.</li>
              <li>
                To provide leave management, team calendar, and availability
                features.
              </li>
              <li>
                To send email notifications related to your leave requests and
                approvals (via Brevo).
              </li>
              <li>
                To generate analytics and reports scoped to your workspace.
              </li>
              <li>
                To maintain audit logs of key actions for governance and
                compliance within your workspace.
              </li>
            </ul>
            <p className="mt-3">
              We do not sell your personal data. We do not use your data for
              advertising.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-white">
              4. Data sharing
            </h2>
            <p className="mb-3">
              We share your data only with the following third-party services
              required to operate the platform:
            </p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <span className="font-medium text-white">
                  Neon (PostgreSQL):
                </span>{" "}
                our database provider. Your data is stored in their managed
                PostgreSQL service.
              </li>
              <li>
                <span className="font-medium text-white">
                  Brevo (Sendinblue):
                </span>{" "}
                used to send transactional emails (leave notifications). We
                share only your email address and name for this purpose.
              </li>
              <li>
                <span className="font-medium text-white">Google OAuth:</span>{" "}
                used for authentication. We receive basic profile data (name,
                email) from Google only when you choose to sign in with Google.
              </li>
              <li>
                <span className="font-medium text-white">PostHog:</span> used
                for product analytics. We may share anonymized usage events. No
                personally identifiable information is sent to PostHog.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-white">
              5. Cookies and sessions
            </h2>
            <p>
              We use a single{" "}
              <span className="font-medium text-white">
                httpOnly, secure cookie
              </span>{" "}
              to maintain your authenticated session. This cookie is strictly
              necessary for the service to function. We do not use tracking
              cookies or advertising cookies.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-white">
              6. Data retention
            </h2>
            <p>
              Your data is retained for as long as your account and workspace
              exist. When a workspace is deleted, associated user records and
              leave data are removed. Audit logs are retained for compliance
              purposes. You may request deletion of your account by contacting
              us at the email below.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-white">
              7. Your rights
            </h2>
            <p className="mb-3">You have the right to:</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>Access the personal data we hold about you.</li>
              <li>
                Request correction of inaccurate data (you can update your
                profile directly in the app).
              </li>
              <li>Request deletion of your account and associated data.</li>
              <li>
                Withdraw consent for Google OAuth by revoking access via your
                Google account settings at{" "}
                <a
                  href="https://myaccount.google.com/permissions"
                  target="_blank"
                  rel="noreferrer"
                  className="text-white underline underline-offset-2 hover:text-zinc-300"
                >
                  myaccount.google.com/permissions
                </a>
                .
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-white">
              8. Security
            </h2>
            <p>
              We use industry-standard security practices: encrypted connections
              (HTTPS/TLS), httpOnly session cookies, Helmet security headers,
              rate limiting, and workspace-level data isolation. No system is
              completely secure; if you believe your account has been
              compromised, contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-white">
              9. Changes to this policy
            </h2>
            <p>
              We may update this Privacy Policy from time to time. Material
              changes will be noted by updating the date at the top of this
              page. Continued use of TeamFore after changes constitutes
              acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-white">
              10. Contact
            </h2>
            <p>
              For any privacy-related questions or data requests, contact us at:{" "}
              <a
                href="mailto:vivekanandagodi@gmail.com"
                className="text-white underline underline-offset-2 hover:text-zinc-300"
              >
                vivekanandagodi@gmail.com
              </a>
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
