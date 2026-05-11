import { ArrowLeft, CalendarClock } from "lucide-react";
import Link from "next/link";

const launchChanges = [
  "Leave requests, approvals, and half-day support",
  "Team planning calendar with public holidays",
  "Daily availability and workload status",
  "Role-based access: employee, manager, admin",
  "Multi-workspace support with tenant isolation",
  "Audit logs for all key actions",
  "Analytics and CSV export",
  "Google OAuth sign-in",
  "Email notifications via Brevo",
  "Mobile-responsive dashboard",
  "Feedback button (in-app)",
];

export default function ChangelogPage() {
  return (
    <main className="bg-linear-to-b from-[#14111d] via-[#0f0c17] to-[#0a0813] text-white min-h-screen">
      <section className="mx-auto w-full max-w-4xl px-6 py-16 md:py-20">
        {/* Back button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          Changelog
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          Latest updates and features added to TeamFore
        </p>

        <div className="mt-8 space-y-6">
          <article className="rounded-2xl border border-white/8 bg-linear-to-b from-[#252033] to-[#1a1725] p-6 shadow-[0_28px_70px_-30px_rgba(0,0,0,0.9)]">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-zinc-300">
                April 2026
              </span>
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <CalendarClock className="h-4 w-4 text-violet-400" />
                <span>v1.0 Launch</span>
              </div>
            </div>

            <ul className="list-disc space-y-2 pl-5 text-sm text-zinc-300">
              {launchChanges.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </div>
      </section>
    </main>
  );
}
