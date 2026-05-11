"use client";

import { usePathname } from "next/navigation";
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
import * as React from "react";

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      {...props}
    >
      <ThemeHotkey />
      {children}
    </NextThemesProvider>
  );
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)
  );
}

function ThemeHotkey() {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();

  const isProductRoute = React.useMemo(
    () =>
      [
        "/dashboard",
        "/calendar",
        "/leaves",
        "/reports",
        "/teams",
        "/users",
        "/settings",
        "/audit-logs",
      ].some((route) => pathname === route || pathname.startsWith(`${route}/`)),
    [pathname],
  );

  React.useEffect(() => {
    if (!isProductRoute) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.repeat) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key.toLowerCase() !== "d") return;
      if (isTypingTarget(event.target)) return;
      setTheme(resolvedTheme === "dark" ? "light" : "dark");
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isProductRoute, resolvedTheme, setTheme]);
  return null;
}
