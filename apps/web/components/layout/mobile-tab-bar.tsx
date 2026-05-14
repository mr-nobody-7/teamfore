"use client";

import {
  CalendarDays,
  CalendarRange,
  CheckSquare,
  LayoutDashboard,
  PlusCircle,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { UserRole } from "@/hooks/use-role";
import { cn } from "@/lib/utils";

interface TabItem {
  href: string;
  label: string;
  icon: React.ElementType;
  isAction?: boolean;
  /** Match only the exact path (not sub-routes) */
  exact?: boolean;
}

function getTabsForRole(role?: UserRole): TabItem[] {
  const applyTab: TabItem = {
    href: "/leaves/apply",
    label: "Apply",
    icon: PlusCircle,
    isAction: true,
    exact: true,
  };

  if (role === "MANAGER" || role === "ADMIN") {
    return [
      { href: "/dashboard", label: "Home", icon: LayoutDashboard, exact: true },
      { href: "/leaves", label: "Leaves", icon: CalendarDays, exact: true },
      applyTab,
      {
        href: "/leaves/approvals",
        label: "Approvals",
        icon: CheckSquare,
        exact: false,
      },
      { href: "/settings", label: "Settings", icon: Settings, exact: false },
    ];
  }

  return [
    { href: "/dashboard", label: "Home", icon: LayoutDashboard, exact: true },
    { href: "/calendar", label: "Calendar", icon: CalendarRange, exact: false },
    applyTab,
    { href: "/leaves", label: "Leaves", icon: CalendarDays, exact: true },
    { href: "/settings", label: "Settings", icon: Settings, exact: false },
  ];
}

interface MobileTabBarProps {
  userRole?: UserRole;
}

export function MobileTabBar({ userRole }: MobileTabBarProps) {
  const pathname = usePathname();
  const tabs = getTabsForRole(userRole);

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border/70 bg-background/95 backdrop-blur-xl md:hidden"
      aria-label="Mobile navigation"
    >
      <div className="flex h-16 items-stretch">
        {tabs.map((tab) => {
          const isActive = tab.exact
            ? pathname === tab.href
            : pathname === tab.href || pathname.startsWith(`${tab.href}/`);

          if (tab.isAction) {
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-label={tab.label}
                className="relative flex flex-1 flex-col items-center justify-center min-h-[44px]"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary shadow-lg shadow-primary/30">
                  <tab.icon className="h-5 w-5 text-primary-foreground" />
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-label={tab.label}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-0.5 min-h-[44px] text-[10px] font-medium transition-colors",
                isActive ? "text-primary" : "text-muted-foreground",
              )}
            >
              <tab.icon
                className={cn(
                  "h-5 w-5",
                  isActive ? "text-primary" : "text-muted-foreground",
                )}
              />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
