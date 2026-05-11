import { Check } from "lucide-react";
import Link from "next/link";

const freeFeatures = [
  "Up to 10 users",
  "Full leave management and approvals",
  "Team planning calendar",
  "Public holiday calendar",
  "Role-based access (4 roles)",
  "Email notifications",
  "Reports and CSV export",
  "Audit logs",
];

const proFeatures = [
  "Everything in Free",
  "Unlimited users",
  "Sprint capacity view",
  "Slack integration and sync",
  "Public REST API",
  "SSO (Google + SAML)",
  "Priority support",
  "Custom approval chains",
];

export function PricingSection() {
  return (
    // biome-ignore lint/correctness/useUniqueElementIds: static anchor id for in-page nav
    <section id="pricing" className="px-4 py-18 sm:px-6 sm:py-24">
      <div className="mx-auto w-full max-w-7xl">
        <div className="mb-10 grid gap-6 sm:mb-14 sm:gap-8 lg:grid-cols-[1fr_1.2fr] lg:items-end lg:gap-16">
          <div>
            <p className="font-mono text-[11px] tracking-[0.18em] text-zinc-500 uppercase">
              Pricing
            </p>
            <h2 className="mt-4 font-display text-4xl leading-[0.95] tracking-tight text-zinc-100 sm:text-5xl md:text-6xl">
              Simple. <em className="text-violet-300">Honest.</em>
              <br />
              Free to start.
            </h2>
          </div>
          <p className="max-w-3xl text-lg leading-relaxed text-zinc-400">
            Start free for your whole team. Upgrade when you outgrow it. No
            contact-sales gate, no hidden seat math.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-3xl border border-white/10 bg-[#1f1b2b] p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/20 sm:p-8">
            <p className="font-mono text-[11px] tracking-[0.16em] text-zinc-500 uppercase">
              Free forever
            </p>
            <div className="mt-4 flex items-end gap-2">
              <span className="font-display text-7xl leading-none text-zinc-100">
                $0
              </span>
              <span className="pb-2 text-sm text-zinc-400">/ month</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">
              Everything a small team needs to coordinate availability without
              chaos.
            </p>

            <ul className="mt-6 space-y-2.5">
              {freeFeatures.map((feature) => (
                <li
                  key={feature}
                  className="flex items-start gap-2.5 text-sm text-zinc-200"
                >
                  <Check className="mt-0.5 h-4 w-4 text-violet-300" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/register"
              className="mt-8 inline-flex w-full items-center justify-center rounded-xl border border-white/15 px-4 py-3 text-sm font-semibold text-zinc-100 transition-colors hover:bg-white/6"
            >
              Get started free
            </Link>
          </article>

          <article className="relative overflow-hidden rounded-3xl border border-violet-400/35 bg-[#1f1b2b] p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-300/55 sm:p-8">
            <span className="absolute right-6 top-6 rounded-full border border-violet-400/50 px-3 py-1 font-mono text-[10px] tracking-[0.14em] text-violet-300 uppercase">
              Coming soon
            </span>
            <p className="font-mono text-[11px] tracking-[0.16em] text-zinc-500 uppercase">
              Pro
            </p>
            <div className="mt-4 flex items-end gap-2">
              <span className="font-display text-7xl leading-none text-zinc-100">
                INR99
              </span>
              <span className="pb-2 text-sm text-zinc-400">/ user / month</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">
              For teams needing deeper integrations, richer controls, and
              priority support.
            </p>

            <ul className="mt-6 space-y-2.5">
              {proFeatures.map((feature, index) => (
                <li
                  key={feature}
                  className={`flex items-start gap-2.5 text-sm ${index === 0 ? "text-zinc-200" : "text-zinc-500"}`}
                >
                  <Check
                    className={`mt-0.5 h-4 w-4 ${index === 0 ? "text-violet-300" : "text-zinc-600"}`}
                  />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <button
              type="button"
              className="mt-8 inline-flex w-full items-center justify-center rounded-xl bg-linear-to-b from-violet-400 to-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_-14px_rgba(124,58,237,0.75)]"
            >
              Notify me when available
            </button>
          </article>
        </div>
      </div>
    </section>
  );
}
