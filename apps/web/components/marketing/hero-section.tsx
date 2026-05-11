import { ArrowRight, CheckCircle2, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { Fragment } from "react";

function PreviewCard() {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];

  return (
    <div className="relative rounded-3xl border border-white/12 bg-linear-to-b from-[#252033] to-[#1a1725] p-2.5 shadow-[0_28px_70px_-30px_rgba(0,0,0,0.9)] transition-transform duration-300 hover:-translate-y-0.5 sm:p-3">
      <div className="mb-2.5 flex items-center gap-1.5">
        <div className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
        <div className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
        <div className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
        <span className="ml-2 rounded-full border border-white/10 bg-[#171421] px-3 py-1 font-mono text-[10px] tracking-[0.14em] text-zinc-500 uppercase">
          app.teamfore.io
        </span>
      </div>

      <div className="grid gap-4 rounded-2xl border border-white/8 bg-[#14111d] p-3.5 sm:grid-cols-[120px_1fr] sm:p-4">
        <div className="space-y-1.5 text-[11px] text-zinc-400">
          {[
            "Dashboard",
            "My Leave",
            "Team Calendar",
            "Requests",
            "Reports",
          ].map((item) => (
            <div
              key={item}
              className={
                item === "Team Calendar"
                  ? "rounded-md bg-violet-500/20 px-2.5 py-1.5 text-zinc-100"
                  : "rounded-md px-2.5 py-1.5"
              }
            >
              {item}
            </div>
          ))}
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="font-display text-2xl leading-none text-zinc-100">
                Team Calendar
              </p>
              <p className="mt-1 text-[11px] text-zinc-400">
                May 2026 · 4 members · 3 on leave
              </p>
            </div>
            <span className="rounded-full border border-white/12 px-2.5 py-1 font-mono text-[10px] tracking-[0.12em] text-zinc-400 uppercase">
              This week
            </span>
          </div>

          <div className="grid grid-cols-[38px_repeat(5,1fr)] gap-1 text-[9px]">
            <div />
            {days.map((day) => (
              <p
                key={day}
                className="py-1 text-center font-mono tracking-[0.12em] text-zinc-500 uppercase"
              >
                {day}
              </p>
            ))}

            {[
              {
                id: "PS",
                name: "Priya",
                color: "from-violet-400 to-violet-600",
                cells: ["wfh", "", "", "", ""],
              },
              {
                id: "AK",
                name: "Arjun",
                color: "from-pink-400 to-rose-600",
                cells: ["", "wfh", "", "off", "off"],
              },
              {
                id: "MR",
                name: "Meera",
                color: "from-emerald-400 to-emerald-600",
                cells: ["off", "", "", "", "wfh"],
              },
              {
                id: "DP",
                name: "Dev",
                color: "from-amber-400 to-orange-600",
                cells: ["", "", "wfh", "", "off"],
              },
            ].map((member) => (
              <Fragment key={member.id}>
                <div className="flex items-center gap-1 text-zinc-400">
                  <span
                    className={`grid h-4.5 w-4.5 place-items-center rounded-full bg-linear-to-br ${member.color} text-[7px] font-semibold text-white`}
                  >
                    {member.id}
                  </span>
                  <span className="truncate">{member.name}</span>
                </div>
                {member.cells.map((cell, idx) => (
                  <div
                    key={`${member.id}-${idx}`}
                    className={
                      cell === "wfh"
                        ? "grid h-5 place-items-center rounded bg-sky-500/30 text-[8px] font-semibold text-sky-200"
                        : cell === "off"
                          ? "grid h-5 place-items-center rounded bg-violet-500/35 text-[8px] font-semibold text-zinc-100"
                          : "h-5 rounded bg-zinc-800/70"
                    }
                  >
                    {cell === "wfh" ? "WFH" : cell === "off" ? "OFF" : ""}
                  </div>
                ))}
              </Fragment>
            ))}
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-white/8 pt-2 text-[10px] text-zinc-400">
            <div className="flex items-center gap-3">
              <span>
                <i className="mr-1 inline-block h-2 w-2 rounded-sm bg-violet-500/75" />
                Vacation
              </span>
              <span>
                <i className="mr-1 inline-block h-2 w-2 rounded-sm bg-sky-500/75" />
                WFH
              </span>
            </div>
            <span>Live · syncing</span>
          </div>
        </div>
      </div>

      <div className="absolute -left-6 -top-5 hidden items-center gap-2 rounded-xl border border-white/12 bg-[#211d2d] px-3 py-2 text-xs shadow-2xl lg:flex">
        <span className="grid h-6 w-6 place-items-center rounded-md bg-emerald-500/25 text-emerald-300">
          <CheckCircle2 className="h-3.5 w-3.5" />
        </span>
        <p>
          <b className="font-medium text-zinc-100">Approved</b>
          <span className="text-zinc-400">
            {" "}
            · Priya&apos;s vacation, May 18-22
          </span>
        </p>
      </div>

      <div className="absolute -bottom-6 -right-6 hidden items-center gap-2 rounded-xl border border-white/12 bg-[#211d2d] px-3 py-2 text-xs shadow-2xl lg:flex">
        <span className="grid h-6 w-6 place-items-center rounded-md bg-amber-500/25 text-amber-300">
          <TriangleAlert className="h-3.5 w-3.5" />
        </span>
        <p>
          <b className="font-medium text-zinc-100">Capacity warning</b>
          <span className="text-zinc-400"> · 60% out on May 23</span>
        </p>
      </div>
    </div>
  );
}

export function HeroSection() {
  return (
    <header className="relative overflow-hidden px-4 pb-16 pt-30 sm:px-6 sm:pb-20 sm:pt-36">
      <div className="pointer-events-none absolute -top-28 right-[-10%] h-[560px] w-[760px] rounded-full bg-radial-[at_40%_40%] from-violet-500/30 to-transparent" />
      <div className="pointer-events-none absolute -bottom-52 left-[-20%] h-[420px] w-[620px] rounded-full bg-radial-[at_60%_40%] from-indigo-500/20 to-transparent" />

      <div className="relative mx-auto grid w-full max-w-7xl gap-12 sm:gap-16 lg:grid-cols-[1.1fr_1fr] lg:items-center">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/6 px-3 py-1.5 font-mono text-[10px] tracking-[0.12em] text-zinc-300 uppercase sm:text-[11px]">
            <i className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(16,185,129,0.2)]" />
            v1.0 - live for early teams
          </span>

          <h1 className="mt-6 font-display text-4xl leading-[0.95] tracking-tight text-zinc-100 sm:text-5xl md:text-7xl lg:text-8xl">
            Know who&apos;s <em className="text-violet-300">actually</em>
            <br />
            available before
            <br />
            you plan the week.
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-relaxed text-zinc-400 sm:mt-7 sm:text-lg">
            TeamFore is team availability intelligence for engineering managers.
            Leave requests, capacity, and sprint readiness in one calm surface
            that your team will actually open on Monday.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-2.5 sm:mt-10 sm:gap-3">
            <Link
              href="/register"
              className="group inline-flex items-center gap-2 rounded-xl bg-linear-to-b from-violet-400 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_14px_30px_-14px_rgba(124,58,237,0.75)] transition-transform hover:-translate-y-0.5 sm:px-5 sm:py-3"
            >
              Start free - no credit card
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <a
              href="#how"
              className="inline-flex items-center rounded-xl border border-white/15 px-4 py-2.5 text-sm font-medium text-zinc-200 transition-colors hover:bg-white/6 sm:px-5 sm:py-3"
            >
              See how it works
            </a>
          </div>

          <div className="mt-7 flex items-center gap-3 text-sm text-zinc-400 sm:mt-8">
            <div className="flex -space-x-2">
              {[
                "from-violet-400 to-violet-600",
                "from-rose-400 to-rose-600",
                "from-emerald-400 to-emerald-600",
                "from-amber-400 to-orange-600",
              ].map((tone) => (
                <span
                  key={tone}
                  className={`inline-block h-7 w-7 rounded-full border-2 border-[#13111d] bg-linear-to-br ${tone}`}
                />
              ))}
            </div>
            <p>50+ engineering teams already planning smarter</p>
          </div>
        </div>

        <PreviewCard />
      </div>
    </header>
  );
}
