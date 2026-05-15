const problems = [
  {
    id: "01",
    quote: '"Wait - is Priya off this week?"',
    why: "Lost in chats.",
    detail:
      "Leave requests vanish into chat groups the moment sprint planning starts. Context disappears with them.",
  },
  {
    id: "02",
    quote: '"Did anyone approve this?"',
    why: "Dropped in email.",
    detail:
      "Approvals live across a dozen threads. Managers miss requests, employees chase status, and HR has no clean record.",
  },
  {
    id: "03",
    quote: '"We can\'t ship - half the team is out."',
    why: "Found out too late.",
    detail:
      "Capacity decisions are made days after people have already booked time off. Sprints quietly slip.",
  },
];

export function ProblemSection() {
  return (
    <section id="problem" className="px-6 py-24">
      <div className="mx-auto w-full max-w-7xl">
        <div className="mb-14 grid gap-8 lg:grid-cols-[1fr_1.2fr] lg:items-end lg:gap-16">
          <div>
            <p className="font-mono text-[11px] tracking-[0.18em] text-zinc-500 uppercase">
              The problem
            </p>
            <h2 className="mt-4 font-display text-5xl leading-[0.95] tracking-tight text-zinc-100 md:text-6xl">
              Leave should not
              <br />
              need a <em className="text-violet-300">spreadsheet</em>.
            </h2>
          </div>
          <p className="max-w-3xl text-lg leading-relaxed text-zinc-400">
            Most dev teams manage availability with tools that were never built
            for it: chats, scattered email threads, and manager memory. By
            Monday standup, no one is fully sure who is around.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {problems.map((problem) => (
            <article
              key={problem.id}
              className="relative overflow-hidden rounded-2xl border border-white/10 bg-linear-to-b from-[#1f1b2b] to-[#161320] p-7"
            >
              <span className="absolute right-6 top-5 font-mono text-[11px] tracking-[0.14em] text-zinc-600 uppercase">
                {problem.id}
              </span>

              <p className="max-w-[18ch] font-display text-3xl leading-[1.15] text-zinc-100">
                {problem.quote}
              </p>

              <p className="mt-5 border-t border-white/10 pt-4 text-sm leading-relaxed text-zinc-400">
                <b className="font-medium text-zinc-100">{problem.why}</b>{" "}
                {problem.detail}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
