"use client";

import { Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export function MarketingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-white/10 bg-[#14111d]/80 shadow-xl shadow-black/20 backdrop-blur-xl"
          : ""
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/brand/mark-64.svg"
            alt="TeamFore mark"
            width={32}
            height={32}
            className="h-8 w-8"
            priority
          />
          <span className="font-display text-xl tracking-tight">TeamFore</span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden items-center gap-7 md:flex">
          <a
            href="#features"
            className="text-sm text-zinc-400 transition-colors hover:text-zinc-100"
          >
            Features
          </a>
          <a
            href="#how"
            className="text-sm text-zinc-400 transition-colors hover:text-zinc-100"
          >
            How it works
          </a>
          <a
            href="#pricing"
            className="text-sm text-zinc-400 transition-colors hover:text-zinc-100"
          >
            Pricing
          </a>
          <Link
            href="/changelog"
            className="text-sm text-zinc-400 transition-colors hover:text-zinc-100"
          >
            Changelog
          </Link>
        </div>

        {/* Desktop CTAs */}
        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/login"
            className="text-sm text-zinc-400 transition-colors hover:text-zinc-100"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center rounded-lg bg-linear-to-b from-violet-400 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-[0_14px_30px_-14px_rgba(124,58,237,0.75)] transition-transform hover:-translate-y-px"
          >
            Get started free
          </Link>
        </div>

        {/* Mobile menu toggle */}
        <button
          type="button"
          className="rounded-md p-1.5 text-zinc-400 transition-colors hover:text-zinc-100 md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="border-t border-white/10 bg-[#14111d]/95 px-6 py-5 backdrop-blur-xl md:hidden">
          <div className="flex flex-col gap-5">
            <a href="#features" className="text-sm text-zinc-400">
              Features
            </a>
            <a href="#how" className="text-sm text-zinc-400">
              How it works
            </a>
            <a href="#pricing" className="text-sm text-zinc-400">
              Pricing
            </a>
            <Link href="/changelog" className="text-sm text-zinc-400">
              Changelog
            </Link>
            <div className="flex flex-col gap-3 border-t border-white/10 pt-4">
              <Link href="/login" className="text-sm text-zinc-400">
                Sign in
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-lg bg-linear-to-b from-violet-400 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white"
              >
                Get started free
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
