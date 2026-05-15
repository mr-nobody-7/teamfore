const stats = [
  { value: "50+", label: "Teams using TeamFore" },
  { value: "< 2 min", label: "Setup time" },
  { value: "3 roles", label: "User · Manager · Admin" },
  { value: "100%", label: "Data isolation per workspace" },
];

export function StatsSection() {
  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-12">
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="flex flex-col items-center gap-1 bg-card px-6 py-8 text-center"
          >
            <span className="bg-linear-to-r from-violet-400 to-indigo-400 bg-clip-text text-3xl font-bold tracking-tight text-transparent">
              {s.value}
            </span>
            <span className="text-xs text-muted-foreground">{s.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
