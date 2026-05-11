export function ManifestoSection() {
  return (
    <section className="bg-linear-to-b from-[#13111d] to-[#11101a] px-6 py-28">
      <div className="mx-auto grid w-full max-w-7xl gap-14 lg:grid-cols-[1fr_1.1fr] lg:items-center">
        <div>
          <p className="font-mono text-[11px] tracking-[0.18em] text-zinc-500 uppercase">
            A small note
          </p>
          <p className="mt-5 max-w-[14ch] font-display text-5xl leading-[1.03] text-zinc-100 md:text-6xl">
            We do not think leave software should feel like
            <em className="text-violet-300"> HR software</em>.
          </p>
        </div>

        <div className="max-w-2xl space-y-5 text-base leading-relaxed text-zinc-400">
          <p>
            Most products in this category were built for HR departments and
            inherited their language. TeamFore is built for the engineering
            manager planning Friday&apos;s sprint.
          </p>
          <p>
            The vocabulary is yours: standups, capacity, who is around. The
            interface is calm enough to open every morning and quiet enough to
            disappear when you do not need it.
          </p>
          <p className="pt-2 text-sm text-zinc-500">
            - Vivek and the TeamFore team
          </p>
        </div>
      </div>
    </section>
  );
}
