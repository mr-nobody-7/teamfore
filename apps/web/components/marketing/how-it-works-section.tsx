const steps = [
  {
    id: "01",
    title: "Sign up your workspace.",
    body: "Start with email or Google OAuth, then create a tenant-isolated workspace for your team.",
    time: "~ 30 sec",
  },
  {
    id: "02",
    title: "Invite the team.",
    body: "Add teammates, assign them to teams, and set user, manager, or admin access.",
    time: "~ 1 min",
  },
  {
    id: "03",
    title: "Apply and approve.",
    body: "Employees apply for leave while managers review in-app and everyone gets updates in Slack and email.",
    time: "always-on",
  },
  {
    id: "04",
    title: "Plan with confidence.",
    body: "Open the team calendar before weekly planning to spot holidays, leave conflicts, and capacity warnings.",
    time: "every Monday",
  },
];

export function HowItWorksSection() {
  return (
    // biome-ignore lint/correctness/useUniqueElementIds: static anchor id for in-page nav
    <section id="how" className="px-4 pb-18 pt-4 sm:px-6 sm:pb-24 sm:pt-6">
      <div className="mx-auto w-full max-w-7xl">
        <div className="mb-10 grid gap-6 sm:mb-14 sm:gap-8 lg:grid-cols-[1fr_1.2fr] lg:items-end lg:gap-16">
          <div>
            <p className="font-mono text-[11px] tracking-[0.18em] text-zinc-500 uppercase">
              How it works
            </p>
            <h2 className="mt-4 font-display text-4xl leading-[0.95] tracking-tight text-zinc-100 sm:text-5xl md:text-6xl">
              Up and running
              <br />
              in <em className="text-violet-300">minutes</em>, not months.
            </h2>
          </div>
          <p className="max-w-3xl text-lg leading-relaxed text-zinc-400">
            No onboarding calls. No heavy setup. Sign up, invite your team, and
            plan your week before your coffee gets cold.
          </p>
        </div>

        <div className="grid overflow-hidden rounded-3xl border border-white/10 bg-[#1f1b2b] md:grid-cols-2 xl:grid-cols-4">
          {steps.map((step, index) => (
            <article
              key={step.id}
              className={`border-white/10 p-6 transition-colors duration-300 hover:bg-white/3 sm:p-8 ${
                index < steps.length - 1
                  ? "border-b xl:border-b-0 xl:border-r"
                  : ""
              } ${index === 1 ? "md:border-r" : ""}`}
            >
              <p className="font-mono text-[11px] tracking-[0.18em] text-violet-300 uppercase">
                {step.id}
              </p>
              <h3 className="mt-3 font-display text-4xl leading-[1.05] text-zinc-100">
                {step.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                {step.body}
              </p>
              <p className="mt-5 font-mono text-[11px] tracking-[0.1em] text-zinc-500 uppercase">
                {step.time}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
