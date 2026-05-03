import type { Metadata } from "next";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { MarketingNav } from "@/components/marketing/marketing-nav";

export const metadata: Metadata = {
  title: "Terms of Service — TeamFore",
  description: "The terms and conditions for using TeamFore.",
};

export default function TermsPage() {
  return (
    <div className="bg-background text-foreground">
      <MarketingNav />
      <main className="mx-auto w-full max-w-3xl px-6 pb-24 pt-36">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          Terms of Service
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Last updated: April 27, 2026
        </p>

        <div className="mt-10 space-y-10 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">
              1. Acceptance of terms
            </h2>
            <p>
              By accessing or using TeamFore (&quot;the Service&quot;), you
              agree to be bound by these Terms of Service. If you do not agree,
              do not use the Service. These terms apply to all users, including
              workspace admins, managers, and employees.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">
              2. Description of service
            </h2>
            <p>
              TeamFore is a workspace-based leave and availability management
              platform that allows teams to submit leave requests, manage
              approvals, track team availability, and plan capacity. The Service
              is provided free of charge for workspaces with up to 10 users.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">
              3. Your account
            </h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                You are responsible for maintaining the security of your account
                credentials.
              </li>
              <li>
                You must provide accurate information when registering. Do not
                impersonate another person.
              </li>
              <li>
                You are responsible for all activity that occurs under your
                account.
              </li>
              <li>
                Notify us immediately if you suspect unauthorized access to your
                account.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">
              4. Acceptable use
            </h2>
            <p className="mb-3">You agree not to:</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                Use the Service for any unlawful purpose or in violation of any
                regulations.
              </li>
              <li>
                Attempt to gain unauthorized access to any part of the Service
                or its infrastructure.
              </li>
              <li>
                Interfere with or disrupt the integrity or performance of the
                Service.
              </li>
              <li>
                Submit false or misleading information, including fraudulent
                leave requests.
              </li>
              <li>
                Reverse engineer, decompile, or attempt to extract the source
                code of the Service.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">
              5. Workspace responsibilities
            </h2>
            <p>
              Workspace admins are responsible for managing their workspace,
              including adding and removing users, configuring leave types, and
              ensuring appropriate use of the Service within their organization.
              Admins are responsible for their team members&apos; compliance
              with these terms.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">
              6. Data and privacy
            </h2>
            <p>
              Your use of the Service is also governed by our{" "}
              <a
                href="/privacy"
                className="text-foreground underline underline-offset-2 hover:text-muted-foreground"
              >
                Privacy Policy
              </a>
              , which is incorporated into these terms by reference. We collect
              and process only the data necessary to operate the Service.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">
              7. Third-party services
            </h2>
            <p>
              The Service integrates with third-party services including Google
              OAuth (authentication), Brevo (email), Neon (database), and
              PostHog (analytics). Your use of these services is subject to
              their respective terms and privacy policies. We are not
              responsible for the practices of these third parties.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">
              8. Availability and modifications
            </h2>
            <p>
              We reserve the right to modify, suspend, or discontinue the
              Service at any time with or without notice. We may update these
              Terms from time to time. Continued use of the Service after
              changes constitutes acceptance of the updated terms. We will
              endeavor to provide notice of material changes where possible.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">
              9. Disclaimer of warranties
            </h2>
            <p>
              The Service is provided &quot;as is&quot; and &quot;as
              available&quot; without warranties of any kind, express or
              implied. We do not warrant that the Service will be uninterrupted,
              error-free, or completely secure. Use of the Service is at your
              own risk.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">
              10. Limitation of liability
            </h2>
            <p>
              To the maximum extent permitted by law, TeamFore and its creator
              shall not be liable for any indirect, incidental, special,
              consequential, or punitive damages arising from your use of or
              inability to use the Service, even if advised of the possibility
              of such damages.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">
              11. Termination
            </h2>
            <p>
              We reserve the right to suspend or terminate your account at our
              discretion if you violate these terms. You may stop using the
              Service at any time and request deletion of your account by
              contacting us.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">
              12. Governing law
            </h2>
            <p>
              These Terms are governed by the laws of India. Any disputes
              arising from your use of the Service shall be subject to the
              jurisdiction of the courts of India.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">
              13. Contact
            </h2>
            <p>
              For any questions about these Terms, contact us at:{" "}
              <a
                href="mailto:vivekanandagodi@gmail.com"
                className="text-foreground underline underline-offset-2 hover:text-muted-foreground"
              >
                vivekanandagodi@gmail.com
              </a>
            </p>
          </section>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
