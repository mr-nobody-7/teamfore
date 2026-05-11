const heatCells = [
  "",
  "l1",
  "l2",
  "l1",
  "",
  "l3",
  "l4",
  "l2",
  "l1",
  "",
  "l2",
  "l3",
  "l1",
  "",
  "l1",
  "l4",
  "l3",
  "l1",
  "",
  "l2",
  "l1",
  "",
  "l2",
  "l3",
  "l4",
  "l2",
  "l1",
  "",
  "l3",
  "l1",
].map((tone, idx) => ({ id: `h${idx + 1}`, tone }));

function Card({
  className,
  tag,
  title,
  body,
  children,
}: {
  className?: string;
  tag: string;
  title: string;
  body: string;
  children?: React.ReactNode;
}) {
  return (
    <article
      className={`group relative flex h-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#1f1b2b] p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/20 sm:p-7 ${className ?? ""}`}
    >
      <p className="font-mono text-[10px] tracking-[0.16em] text-violet-300 uppercase">
        {tag}
      </p>
      <h3 className="mt-3 font-display text-3xl leading-[1.05] tracking-tight text-zinc-100 sm:text-4xl">
        {title}
      </h3>
      <p className="mt-3 text-sm leading-relaxed text-zinc-400">{body}</p>
      {children ? <div className="mt-auto pt-6">{children}</div> : null}
    </article>
  );
}

export function FeaturesSection() {
  return (
    // biome-ignore lint/correctness/useUniqueElementIds: static anchor id for in-page nav
    <section id="features" className="px-4 pb-18 pt-3 sm:px-6 sm:pb-24 sm:pt-4">
      <div className="mx-auto w-full max-w-7xl">
        <div className="mb-10 grid gap-6 sm:mb-14 sm:gap-8 lg:grid-cols-[1fr_1.2fr] lg:items-end lg:gap-16">
          <div>
            <p className="font-mono text-[11px] tracking-[0.18em] text-zinc-500 uppercase">
              What&apos;s inside
            </p>
            <h2 className="mt-4 font-display text-4xl leading-[0.95] tracking-tight text-zinc-100 sm:text-5xl md:text-6xl">
              Everything your team
              <br />
              needs. <em className="text-violet-300">Nothing</em> it does not.
            </h2>
          </div>
          <p className="max-w-3xl text-lg leading-relaxed text-zinc-400">
            Built for dev teams that want to coordinate availability without
            ceremony. Eight features, each earning its place.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-6">
          <Card
            className="lg:col-span-4"
            tag="01 - Team planning calendar"
            title="See everyone&apos;s week in one heatmap."
            body="Vacations, holidays, half-days, WFH, and custom statuses laid out across the team."
          >
            <div>
              <div className="grid grid-cols-10 gap-1">
                {heatCells.map((cell) => (
                  <i
                    key={cell.id}
                    className={
                      cell.tone === "l4"
                        ? "h-4 rounded-sm bg-violet-400"
                        : cell.tone === "l3"
                          ? "h-4 rounded-sm bg-violet-500/85"
                          : cell.tone === "l2"
                            ? "h-4 rounded-sm bg-violet-500/65"
                            : cell.tone === "l1"
                              ? "h-4 rounded-sm bg-violet-500/40"
                              : "h-4 rounded-sm bg-zinc-800"
                    }
                  />
                ))}
              </div>
              <div className="mt-2 flex justify-between font-mono text-[10px] tracking-[0.1em] text-zinc-500 uppercase">
                <span>Week 19</span>
                <span>Week 20</span>
                <span>Week 21</span>
              </div>
            </div>
          </Card>

          <Card
            className="lg:col-span-2"
            tag="02 - Approvals"
            title="One-click approve. Full audit trail."
            body="Managers approve from Slack, email, or in-app, with complete event history."
          >
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="rounded-full border border-emerald-500/40 bg-emerald-500/15 px-3 py-1 text-emerald-300">
                Submitted
              </span>
              <span className="text-zinc-500">-&gt;</span>
              <span className="rounded-full border border-violet-500/45 bg-violet-500/20 px-3 py-1 text-zinc-100">
                In review
              </span>
              <span className="text-zinc-500">-&gt;</span>
              <span className="rounded-full border border-white/12 px-3 py-1 text-zinc-400">
                Approved
              </span>
            </div>
          </Card>

          <Card
            className="lg:col-span-3"
            tag="03 - Standup board"
            title="Daily availability, no questions asked."
            body="See who is available, remote, or off without posting another morning Slack question."
          >
            <div className="space-y-2 text-sm text-zinc-300">
              {[
                {
                  n: "PS",
                  name: "Priya",
                  status: "Available",
                  c: "text-emerald-300",
                },
                { n: "AK", name: "Arjun", status: "Remote", c: "text-sky-300" },
                { n: "MR", name: "Meera", status: "Sick", c: "text-rose-300" },
              ].map((row) => (
                <div
                  key={row.n}
                  className="flex items-center justify-between border-t border-white/10 pt-2 first:border-none first:pt-0"
                >
                  <div className="flex items-center gap-2">
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-zinc-700 text-[10px] font-semibold text-white">
                      {row.n}
                    </span>
                    {row.name}
                  </div>
                  <span
                    className={`font-mono text-[10px] tracking-[0.1em] uppercase ${row.c}`}
                  >
                    {row.status}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <Card
            className="lg:col-span-3"
            tag="04 - Role-based access"
            title="Four roles. Real isolation."
            body="Multi-tenant from day one. Each role sees exactly what it needs."
          >
            <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
              {[
                ["Owner", "Full", "Billing & tenant"],
                ["Admin", "Org", "Settings & teams"],
                ["Manager", "Team", "Approvals"],
                ["Employee", "Self", "Apply & view"],
              ].map(([role, level, desc]) => (
                <div
                  key={role}
                  className="rounded-xl border border-white/10 bg-[#161320] p-2.5"
                >
                  <p className="font-mono text-[10px] tracking-[0.14em] text-violet-300 uppercase">
                    {role}
                  </p>
                  <p className="mt-1 font-display text-2xl text-zinc-100">
                    {level}
                  </p>
                  <p className="text-[11px] text-zinc-500">{desc}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card
            className="lg:col-span-2"
            tag="05 - Custom leave types"
            title="Sick. Casual. WFH."
            body="Configure leave categories with their own rules and approval behavior."
          >
            <div className="flex flex-wrap gap-2 text-xs text-zinc-400">
              {["Casual", "Sick", "Earned", "Comp Off", "WFH", "+ Custom"].map(
                (chip) => (
                  <span
                    key={chip}
                    className="rounded-full border border-white/10 bg-[#161320] px-3 py-1"
                  >
                    {chip}
                  </span>
                ),
              )}
            </div>
          </Card>

          <Card
            className="lg:col-span-2"
            tag="06 - Slack and Email"
            title="Approve from where your team already is."
            body="Approve, reject, or check team status without context switching."
          >
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded-full border border-violet-500/40 bg-violet-500/15 px-3 py-1 text-violet-300">
                /leave apply
              </span>
              <span className="rounded-full border border-emerald-500/40 bg-emerald-500/15 px-3 py-1 text-emerald-300">
                /team today
              </span>
            </div>
          </Card>

          <Card
            className="lg:col-span-2"
            tag="07 - Reports and export"
            title="Patterns, trends, and clean CSV."
            body="Track leave behavior and export what HR or payroll needs."
          >
            <div className="grid grid-cols-2 gap-2.5">
              <div className="rounded-xl border border-white/10 bg-[#161320] p-3">
                <p className="font-mono text-[10px] tracking-[0.14em] text-zinc-500 uppercase">
                  Avg days / qtr
                </p>
                <p className="mt-1 font-display text-4xl text-zinc-100">4.2</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-[#161320] p-3">
                <p className="font-mono text-[10px] tracking-[0.14em] text-zinc-500 uppercase">
                  Approval SLA
                </p>
                <p className="mt-1 font-display text-4xl text-zinc-100">3.6h</p>
              </div>
            </div>
          </Card>

          <Card
            className="lg:col-span-2"
            tag="08 - Audit logs"
            title="Every action, recorded honestly."
            body="Authentication, user changes, leave events, and policy edits in one immutable trail."
          >
            <div className="space-y-1 font-mono text-[10px] tracking-[0.08em] text-zinc-500">
              <p>10 May 11:20 - login - 43.204.x</p>
              <p>09 May 18:02 - approved - MR-219</p>
              <p>08 May 09:47 - settings - ...</p>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
