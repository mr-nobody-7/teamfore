const logos = ["Northwind", "paperboat", "RAVEL", "Loomwise", "Slate&Co"];

export function TrustStrip() {
  return (
    <section className="border-y border-white/10 bg-[#12101a] px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto grid w-full max-w-7xl gap-8 lg:grid-cols-[auto_1fr] lg:items-center">
        <p className="max-w-xs font-mono text-[11px] tracking-[0.16em] text-zinc-500 uppercase">
          Trusted by lean engineering teams shipping on tight cadences
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5 lg:gap-7">
          {logos.map((logo, idx) => (
            <p
              key={logo}
              className={
                idx % 3 === 1
                  ? "text-center text-2xl font-semibold tracking-tight text-zinc-500"
                  : idx % 3 === 2
                    ? "text-center font-mono text-sm tracking-[0.08em] text-zinc-500 uppercase"
                    : "text-center font-display text-3xl text-zinc-500"
              }
            >
              {logo}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}
