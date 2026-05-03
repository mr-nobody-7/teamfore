import { Zap } from "lucide-react";
import Link from "next/link";

export function MarketingFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto w-full max-w-6xl px-6 py-12">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          {/* Brand */}
          <div className="max-w-xs">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/25">
                <Zap className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold tracking-tight">TeamFore</span>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Leave management and team availability for dev teams who care
              about sprint planning.
            </p>
          </div>

          {/* Links */}
          <nav className="flex flex-wrap gap-10 text-sm">
            <div className="flex flex-col gap-3">
              <span className="text-xs font-semibold uppercase tracking-widest text-foreground">
                Product
              </span>
              <a
                href="#features"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Features
              </a>
              <a
                href="#pricing"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Pricing
              </a>
              <Link
                href="/changelog"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Changelog
              </Link>
            </div>
            <div className="flex flex-col gap-3">
              <span className="text-xs font-semibold uppercase tracking-widest text-foreground">
                Account
              </span>
              <Link
                href="/login"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Sign up
              </Link>
            </div>
            <div className="flex flex-col gap-3">
              <span className="text-xs font-semibold uppercase tracking-widest text-foreground">
                Open source
              </span>
              <a
                href="https://github.com/mr-nobody-7/teamfore"
                target="_blank"
                rel="noreferrer"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                GitHub
              </a>
            </div>
            <div className="flex flex-col gap-3">
              <span className="text-xs font-semibold uppercase tracking-widest text-foreground">
                Legal
              </span>
              <Link
                href="/privacy"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Terms of Service
              </Link>
            </div>
          </nav>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-border pt-8 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
          <p>© 2026 TeamFore · Built by Vivekananda</p>
          <p>Made with ♥ for dev teams everywhere</p>
        </div>
      </div>
    </footer>
  );
}
