import Image from "next/image";
import Link from "next/link";

export function MarketingFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#12101a] px-4 pb-10 pt-12 sm:px-6 sm:pt-14">
      <div className="mx-auto w-full max-w-7xl">
        <div className="grid gap-8 md:grid-cols-2 md:gap-10 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Link href="/" className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl border border-white/12 bg-white/5 p-2">
                <Image
                  src="/brand/mark-64.svg"
                  alt="TeamFore"
                  width={24}
                  height={24}
                  className="h-6 w-6"
                />
              </span>
              <span className="font-display text-3xl leading-none tracking-tight text-zinc-100">
                TeamFore
              </span>
            </Link>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-zinc-400">
              Team availability intelligence for engineering managers who care
              about shipping on time without burning teams out.
            </p>
          </div>

          <div>
            <h5 className="font-mono text-[11px] tracking-[0.16em] text-zinc-500 uppercase">
              Product
            </h5>
            <ul className="mt-4 space-y-2.5 text-sm text-zinc-400">
              <li>
                <a
                  href="#features"
                  className="transition-colors duration-200 hover:text-zinc-100"
                >
                  Features
                </a>
              </li>
              <li>
                <a
                  href="#pricing"
                  className="transition-colors duration-200 hover:text-zinc-100"
                >
                  Pricing
                </a>
              </li>
              <li>
                <a
                  href="#how"
                  className="transition-colors duration-200 hover:text-zinc-100"
                >
                  Product tour
                </a>
              </li>
              <li>
                <Link
                  href="/changelog"
                  className="transition-colors duration-200 hover:text-zinc-100"
                >
                  Changelog
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="font-mono text-[11px] tracking-[0.16em] text-zinc-500 uppercase">
              Company
            </h5>
            <ul className="mt-4 space-y-2.5 text-sm text-zinc-400">
              <li>
                <Link
                  href="/login"
                  className="transition-colors duration-200 hover:text-zinc-100"
                >
                  Sign in
                </Link>
              </li>
              <li>
                <Link
                  href="/register"
                  className="transition-colors duration-200 hover:text-zinc-100"
                >
                  Sign up
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com/mr-nobody-7/teamfore"
                  target="_blank"
                  rel="noreferrer"
                  className="transition-colors duration-200 hover:text-zinc-100"
                >
                  GitHub
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="font-mono text-[11px] tracking-[0.16em] text-zinc-500 uppercase">
              Legal
            </h5>
            <ul className="mt-4 space-y-2.5 text-sm text-zinc-400">
              <li>
                <Link
                  href="/privacy"
                  className="transition-colors duration-200 hover:text-zinc-100"
                >
                  Privacy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="transition-colors hover:text-zinc-100"
                >
                  Terms
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-white/10 pt-8 text-xs text-zinc-500 md:flex-row md:items-center md:justify-between">
          <p>© 2026 TeamFore · Built by Vivekananda</p>
          <p className="font-mono tracking-[0.12em] uppercase">
            Made for dev teams · From Bengaluru
          </p>
        </div>
      </div>
    </footer>
  );
}
