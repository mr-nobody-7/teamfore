"use client";

import {
  BarChart3,
  CalendarDays,
  CalendarRange,
  CheckSquare,
  LayoutDashboard,
  Logs,
  PlusCircle,
  Settings,
  ShieldCheck,
  UserCog,
  Users,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { UserRole } from "@/hooks/use-role";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  roles: UserRole[];
}

const navItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    roles: ["USER", "MANAGER", "ADMIN"],
  },
  {
    href: "/calendar",
    label: "Calendar",
    icon: CalendarRange,
    roles: ["USER", "MANAGER", "ADMIN"],
  },
  {
    href: "/leaves",
    label: "My Leaves",
    icon: CalendarDays,
    roles: ["USER"],
  },
  {
    href: "/leaves",
    label: "Team Leaves",
    icon: Users,
    roles: ["MANAGER"],
  },
  {
    href: "/leaves",
    label: "All Leaves",
    icon: CalendarDays,
    roles: ["ADMIN"],
  },
  {
    href: "/leaves/apply",
    label: "Apply Leave",
    icon: PlusCircle,
    roles: ["USER", "MANAGER", "ADMIN"],
  },
  {
    href: "/leaves/approvals",
    label: "Approvals",
    icon: CheckSquare,
    roles: ["MANAGER", "ADMIN"],
  },
  {
    href: "/reports",
    label: "Reports",
    icon: BarChart3,
    roles: ["MANAGER", "ADMIN"],
  },
  {
    href: "/teams",
    label: "Teams",
    icon: ShieldCheck,
    roles: ["ADMIN"],
  },
  {
    href: "/users",
    label: "Users",
    icon: UserCog,
    roles: ["ADMIN"],
  },
  {
    href: "/settings",
    label: "Settings",
    icon: Settings,
    roles: ["ADMIN"],
  },
  {
    href: "/audit-logs",
    label: "Audit Logs",
    icon: Logs,
    roles: ["ADMIN"],
  },
];

interface SidebarProps {
  userRole?: UserRole;
  userName?: string;
  userEmail?: string;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({
  userRole,
  userName,
  userEmail,
  isMobileOpen = false,
  onMobileClose,
}: SidebarProps) {
  const pathname = usePathname();

  const filtered = navItems.filter(
    (item) => !userRole || item.roles.includes(userRole),
  );

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-sidebar-border/70 bg-sidebar/95 backdrop-blur-xl transition-transform duration-200 ease-out md:z-40",
        isMobileOpen ? "translate-x-0" : "-translate-x-full",
        "md:translate-x-0",
      )}
    >
      {/* Logo */}
      <div className="flex h-18 items-center gap-3 border-b border-sidebar-border/70 px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-primary/15 to-cyan-400/20 p-2 shadow-lg shadow-primary/20 ring-1 ring-primary/25">
          <Image
            src="/brand/mark-64.svg"
            alt="TeamFore mark"
            width={24}
            height={24}
            className="h-6 w-6"
            priority
          />
        </div>
        <div>
          <span className="font-display text-xl tracking-tight">TeamFore</span>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            Operations OS
          </p>
        </div>
        {onMobileClose && (
          <button
            type="button"
            aria-label="Close navigation"
            onClick={onMobileClose}
            className="ml-auto flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-4 py-5">
        <p className="mb-3 px-3 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground/90">
          Workspace
        </p>
        <ul className="space-y-1.5">
          {filtered.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" &&
                pathname.startsWith(`${item.href}/`));
            return (
              <li key={`${item.href}-${item.label}`}>
                <Link
                  href={item.href}
                  onClick={onMobileClose}
                  className={cn(
                    "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                    isActive
                      ? "bg-linear-to-r from-primary/30 to-primary/10 text-foreground shadow-lg shadow-black/15 ring-1 ring-primary/20"
                      : "text-sidebar-foreground/85 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  )}
                >
                  <item.icon
                    className={cn(
                      "h-4 w-4 shrink-0 transition-transform group-hover:scale-105",
                      isActive ? "text-primary" : "text-muted-foreground",
                    )}
                  />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User info at bottom */}
      {userName && (
        <div className="border-t border-sidebar-border/70 p-4">
          <p className="truncate text-sm font-semibold">{userName}</p>
          {userEmail && (
            <p className="truncate text-xs text-muted-foreground/90">
              {userEmail}
            </p>
          )}
        </div>
      )}
    </aside>
  );
}
