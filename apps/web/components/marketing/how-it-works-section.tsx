const steps = [
  {
    number: "01",
    title: "Your team signs up",
    body: "Create your workspace in under 2 minutes with Google OAuth. Invite team members — employees and managers get the right roles automatically.",
  },
  {
    number: "02",
    title: "Submit & approve leave",
    body: "Employees submit leave requests (full day, half day, or custom). Managers get notified and approve or reject with one click.",
  },
  {
    number: "03",
    title: "Plan your sprint with confidence",
    body: "Open the team calendar and instantly see who's available. No more mid-sprint surprises or last-minute capacity scrambles.",
  },
  {
    number: "04",
    title: "Get notified everywhere",
    body: "Approvals, rejections, and reminders flow straight into Slack and email — so your team is always in sync without checking another app.",
  },
];

export function HowItWorksSection() {
  return (
    // biome-ignore lint/correctness/useUniqueElementIds: static anchor id for in-page nav
    <section
      id="how-it-works"
      className="border-y border-border/60 bg-muted/20"
    >
      <div className="mx-auto w-full max-w-6xl px-6 py-20">
        <div className="mb-14 max-w-2xl">
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            How it works
          </span>
          <h2 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">
            Up and running in minutes
          </h2>
          <p className="mt-3 text-sm text-muted-foreground md:text-base">
            No complex setup. No training needed.
          </p>
        </div>

        <div className="grid gap-10 md:grid-cols-4">
          {steps.map((step, i) => (
            <div key={step.number} className="relative flex flex-col gap-5">
              {/* Connector line */}
              {i < steps.length - 1 && (
                <div className="absolute top-5 left-10 hidden h-px w-[calc(100%+2.5rem)] bg-gradient-to-r from-violet-500/30 via-border/60 to-transparent md:block" />
              )}

              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-violet-500/40 bg-violet-500/10 text-sm font-bold text-violet-400">
                {step.number}
              </div>
              <div>
                <h3 className="text-base font-semibold leading-snug">
                  {step.title}
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
                  {step.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
