import { ArrowRight, Zap } from "lucide-react";
import Link from "next/link";

export function CtaSection() {
  return (
    <section className="relative overflow-hidden border-t border-border/60">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-600/8 via-transparent to-indigo-600/8" />
      <div className="absolute top-0 left-1/2 h-px w-3/4 -translate-x-1/2 bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />
      <div className="absolute top-0 left-1/4 h-[400px] w-[400px] -translate-y-1/2 rounded-full bg-violet-600/10 blur-[100px]" />
      <div className="absolute top-0 right-1/4 h-[300px] w-[300px] -translate-y-1/2 rounded-full bg-indigo-600/10 blur-[80px]" />

      <div className="relative mx-auto w-full max-w-4xl px-6 py-24 text-center">
        {/* Icon */}
        <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-xl shadow-violet-500/35">
          <Zap className="h-7 w-7 text-white" />
        </div>

        <h2 className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
          Your team is planning sprints{" "}
          <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
            right now
          </span>
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
          Don&apos;t let leave chaos derail your next delivery. Get TeamFore set
          up in under 2 minutes — completely free.
        </p>

        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/register"
            className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-7 py-3.5 text-sm font-semibold text-white shadow-xl shadow-violet-500/35 transition-all hover:-translate-y-0.5 hover:from-violet-500 hover:to-indigo-500 hover:shadow-violet-500/50"
          >
            Start free today
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <a
            href="https://github.com/mr-nobody-7/teamfore"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-border px-7 py-3.5 text-sm font-semibold transition-all hover:bg-muted"
          >
            View on GitHub
          </a>
        </div>

        <p className="mt-6 text-xs text-muted-foreground">
          No credit card required · Free up to 10 users · Self-serve setup
        </p>
      </div>
    </section>
  );
}
