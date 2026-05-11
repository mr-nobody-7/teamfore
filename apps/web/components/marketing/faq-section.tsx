const faqs = [
  {
    question: "How is TeamFore different from a generic HR tool?",
    answer:
      "TeamFore is built for engineering teams coordinating leave, approvals, availability, and weekly planning. The defaults, language, and workflows are designed for manager visibility, not bulky HR operations.",
  },
  {
    question: "Is the Free plan really free forever?",
    answer:
      "Yes. Up to 10 users with full core features and no credit card. You only pay when Pro ships and you choose to upgrade.",
  },
  {
    question: "How is data isolated between workspaces?",
    answer:
      "Each workspace is tenant-isolated at the data layer. Role checks are enforced for every action, and audit logs keep history complete.",
  },
  {
    question: "Will my data be locked in?",
    answer:
      "No. Your team can review records in-app today through reports and analytics, and CSV export is marked as coming soon rather than hidden behind the UI.",
  },
  {
    question: "Do you support half-days and custom leave types?",
    answer:
      "Yes. Half-day requests and custom leave types are fully supported, including policy-specific behavior.",
  },
  {
    question: "Where are you based and who is behind this?",
    answer:
      "TeamFore is maintained by Vivekananda Godi from Bengaluru, with feedback loops from early engineering teams.",
  },
];

export function FaqSection() {
  return (
    // biome-ignore lint/correctness/useUniqueElementIds: static anchor id for in-page nav
    <section id="faq" className="px-4 pb-18 pt-4 sm:px-6 sm:pb-24 sm:pt-6">
      <div className="mx-auto w-full max-w-7xl">
        <div className="mb-10 grid gap-6 sm:mb-14 sm:gap-8 lg:grid-cols-[1fr_1.2fr] lg:items-end lg:gap-16">
          <div>
            <p className="font-mono text-[11px] tracking-[0.18em] text-zinc-500 uppercase">
              Questions, answered
            </p>
            <h2 className="mt-4 font-display text-4xl leading-[0.95] tracking-tight text-zinc-100 sm:text-5xl md:text-6xl">
              What you might
              <br />
              be wondering.
            </h2>
          </div>
          <p className="max-w-3xl text-lg leading-relaxed text-zinc-400">
            Short answers, no marketing-speak. If something is missing, a real
            human will reply.
          </p>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          {faqs.map((faq, index) => (
            <details
              key={faq.question}
              open={index === 0}
              className="rounded-2xl border border-white/10 bg-[#1f1b2b] px-5 py-4.5 transition-colors duration-300 open:bg-[#252135] sm:px-6 sm:py-5"
            >
              <summary className="cursor-pointer list-none text-base font-medium text-zinc-100 [&::-webkit-details-marker]:hidden">
                {faq.question}
              </summary>
              <p className="mt-4 border-t border-white/10 pt-4 text-sm leading-relaxed text-zinc-400">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
