import { ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";

function DashboardMockup() {
  const members = [
    { name: "Priya S.", avatar: "PS", leaves: [2, 3], wfh: [0] },
    { name: "Arjun K.", avatar: "AK", leaves: [], wfh: [1, 4] },
    { name: "Meera R.", avatar: "MR", leaves: [0, 1, 2, 3, 4], wfh: [] },
    { name: "Dev P.", avatar: "DP", leaves: [4], wfh: [2] },
  ];
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];

  return (
    <div className="relative mx-auto max-w-4xl">
      {/* Glow behind the card */}
      <div className="absolute -inset-2 rounded-3xl bg-gradient-to-r from-violet-600/20 via-purple-600/10 to-indigo-600/20 blur-2xl" />

      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/40 shadow-2xl backdrop-blur-sm">
        {/* Window chrome */}
        <div className="flex items-center gap-3 border-b border-white/8 bg-white/3 px-4 py-3">
          <div className="flex gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
            <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/60" />
            <div className="h-2.5 w-2.5 rounded-full bg-green-500/60" />
          </div>
          <div className="mx-auto flex h-5 w-52 items-center justify-center rounded-md bg-white/8 text-[10px] text-white/25">
            app.teamfore.in
          </div>
          <div className="h-5 w-5 rounded-full bg-gradient-to-br from-violet-500/60 to-indigo-600/60" />
        </div>

        {/* Sidebar + main content */}
        <div className="flex">
          {/* Mini sidebar */}
          <div className="hidden w-44 flex-col gap-1 border-r border-white/5 bg-white/2 px-3 py-5 sm:flex">
            <div className="mb-3 px-2 text-[9px] font-semibold uppercase tracking-widest text-white/20">
              Navigation
            </div>
            {[
              { label: "Dashboard", active: false },
              { label: "My Leave", active: false },
              { label: "Team Calendar", active: true },
              { label: "Requests", active: false },
              { label: "Analytics", active: false },
            ].map((item) => (
              <div
                key={item.label}
                className={`rounded-md px-2.5 py-1.5 text-[10px] font-medium ${
                  item.active
                    ? "bg-violet-500/20 text-violet-300"
                    : "text-white/30"
                }`}
              >
                {item.label}
              </div>
            ))}
          </div>

          {/* Main content */}
          <div className="flex-1 p-4 md:p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white/90">
                  Team Calendar
                </h3>
                <p className="mt-0.5 text-[10px] text-white/35">
                  May 2026 · 4 members · 3 on leave
                </p>
              </div>
              <div className="flex gap-1.5">
                <div className="flex h-6 items-center rounded-md border border-violet-500/30 bg-violet-500/15 px-2.5 text-[10px] font-semibold text-violet-300">
                  This week
                </div>
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-white/8 text-white/30 text-[10px]">
                  +
                </div>
              </div>
            </div>

            {/* Calendar grid */}
            <div>
              {/* Day headers */}
              <div className="mb-1.5 grid grid-cols-[80px_repeat(5,1fr)] gap-1">
                <div />
                {days.map((day) => (
                  <div
                    key={day}
                    className="text-center text-[10px] font-semibold text-white/30"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Member rows */}
              <div className="space-y-1">
                {members.map((member) => (
                  <div
                    key={member.name}
                    className="grid grid-cols-[80px_repeat(5,1fr)] gap-1"
                  >
                    <div className="flex items-center gap-1.5">
                      <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/70 to-indigo-600/70 text-[8px] font-bold text-white">
                        {member.avatar}
                      </div>
                      <span className="truncate text-[10px] text-white/60">
                        {member.name}
                      </span>
                    </div>
                    {[0, 1, 2, 3, 4].map((day) => (
                      <div
                        key={day}
                        className={`flex h-6 items-center justify-center rounded text-[9px] font-semibold ${
                          member.leaves.includes(day)
                            ? "border border-violet-500/30 bg-violet-500/20 text-violet-300"
                            : member.wfh.includes(day)
                              ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                              : "bg-white/3 text-white/10"
                        }`}
                      >
                        {member.leaves.includes(day)
                          ? "Off"
                          : member.wfh.includes(day)
                            ? "WFH"
                            : ""}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div className="mt-4 flex items-center gap-4 border-t border-white/5 pt-3">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-sm border border-violet-500/40 bg-violet-500/40" />
                <span className="text-[9px] text-white/30">On leave</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-sm border border-emerald-500/30 bg-emerald-500/20" />
                <span className="text-[9px] text-white/30">WFH</span>
              </div>
              <div className="ml-auto flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                <span className="text-[9px] text-white/30">Live sync</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pb-20 pt-32 md:pb-28 md:pt-40">
      {/* Background orbs */}
      <div className="absolute top-0 left-1/4 h-[600px] w-[600px] -translate-y-1/2 rounded-full bg-violet-600/12 blur-[130px]" />
      <div className="absolute top-1/3 right-1/5 h-[400px] w-[400px] rounded-full bg-indigo-600/10 blur-[100px]" />
      <div className="absolute bottom-0 left-1/2 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-purple-600/8 blur-[80px]" />

      {/* Dot grid */}
      <div
        className="absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.18) 1px, transparent 1px)",
          backgroundSize: "30px 30px",
        }}
      />

      {/* Gradient fade at bottom of grid */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-background to-transparent" />

      <div className="relative mx-auto max-w-6xl px-6">
        {/* Announcement badge */}
        <div className="mb-7 flex justify-center md:justify-start">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 shadow-lg shadow-violet-500/10">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-violet-500" />
            </span>
            <span className="text-xs font-semibold text-violet-300">
              v1.0 is live — try it free today
            </span>
          </div>
        </div>

        <div className="max-w-4xl text-center md:text-left">
          <h1 className="text-5xl font-bold leading-[1.1] tracking-tight md:text-6xl lg:text-7xl">
            <span className="text-foreground">Know who&apos;s available</span>
            <br />
            <span className="bg-gradient-to-r from-violet-400 via-purple-300 to-indigo-400 bg-clip-text text-transparent">
              before you plan the week
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground md:mx-0 md:text-lg">
            TeamFore gives dev teams a single place for leave requests,
            approvals, and team availability — so no one gets surprised
            mid-sprint.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row md:justify-start">
            <Link
              href="/register"
              className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-xl shadow-violet-500/30 transition-all hover:-translate-y-0.5 hover:from-violet-500 hover:to-indigo-500 hover:shadow-violet-500/40"
            >
              Start free — no credit card
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <a
              href="#features"
              className="inline-flex items-center gap-2 rounded-xl border border-border px-6 py-3 text-sm font-semibold text-foreground transition-all hover:border-muted-foreground/30 hover:bg-muted"
            >
              See how it works
            </a>
          </div>

          {/* Social proof avatars */}
          <div className="mt-10 flex items-center justify-center gap-3 md:justify-start">
            <div className="flex -space-x-2">
              {["#8b5cf6", "#6366f1", "#a78bfa", "#818cf8", "#c4b5fd"].map(
                (color) => (
                  <div
                    key={color}
                    className="h-7 w-7 rounded-full border-2 border-background shadow-md"
                    style={{ backgroundColor: color }}
                  />
                ),
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">50+</span> teams
              already planning smarter
            </p>
          </div>
        </div>

        {/* Dashboard mockup */}
        <div className="mt-16">
          <DashboardMockup />
        </div>
      </div>
    </section>
  );
}
