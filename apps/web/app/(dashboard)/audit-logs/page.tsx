"use client";

import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import {
  Activity,
  ChevronDown,
  ChevronUp,
  Clock,
  Filter,
  Globe,
  Shield,
  User,
} from "lucide-react";
import { useState } from "react";

import { RoleGuard } from "@/components/auth/role-guard";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import api from "@/lib/axios";
import type { ApiResponse, AuditLog, ListAuditLogsResponse } from "@/types/api";

// ── Action config ──────────────────────────────────────────────────────────────

type ActionCategory = "auth" | "team" | "leave" | "user" | "settings";

const ACTION_CATEGORY: Record<string, ActionCategory> = {
  USER_LOGIN: "auth",
  USER_LOGIN_FAILED: "auth",
  USER_REGISTERED: "auth",
  USER_CREATED: "user",
  USER_UPDATED: "user",
  USER_DEACTIVATED: "user",
  TEAM_CREATED: "team",
  TEAM_UPDATED: "team",
  TEAM_DELETED: "team",
  LEAVE_APPLIED: "leave",
  LEAVE_APPROVED: "leave",
  LEAVE_REJECTED: "leave",
  LEAVE_CANCELLED: "leave",
  LEAVE_TYPES_UPDATED: "settings",
  USER_AVAILABILITY_UPDATED: "user",
};

const CATEGORY_STYLES: Record<ActionCategory, string> = {
  auth: "bg-blue-500/15 text-blue-400 border-blue-500/25",
  team: "bg-purple-500/15 text-purple-400 border-purple-500/25",
  leave: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  user: "bg-amber-500/15 text-amber-400 border-amber-500/25",
  settings: "bg-cyan-500/15 text-cyan-400 border-cyan-500/25",
};

const FAILED_ACTIONS = new Set(["USER_LOGIN_FAILED"]);

const ACTION_LABEL: Record<string, string> = {
  USER_REGISTERED: "Registered",
  USER_LOGIN: "Logged in",
  USER_LOGIN_FAILED: "Login failed",
  USER_CREATED: "User created",
  USER_UPDATED: "User updated",
  USER_DEACTIVATED: "User deactivated",
  TEAM_CREATED: "Team created",
  TEAM_UPDATED: "Team updated",
  TEAM_DELETED: "Team deleted",
  LEAVE_APPLIED: "Leave applied",
  LEAVE_APPROVED: "Leave approved",
  LEAVE_REJECTED: "Leave rejected",
  LEAVE_CANCELLED: "Leave cancelled",
  LEAVE_TYPES_UPDATED: "Leave types updated",
  USER_AVAILABILITY_UPDATED: "Availability updated",
};

const ACTIONS = [
  "ALL",
  "USER_REGISTERED",
  "USER_LOGIN",
  "USER_LOGIN_FAILED",
  "USER_CREATED",
  "USER_UPDATED",
  "USER_DEACTIVATED",
  "TEAM_CREATED",
  "TEAM_UPDATED",
  "TEAM_DELETED",
  "LEAVE_TYPES_UPDATED",
  "USER_AVAILABILITY_UPDATED",
  "LEAVE_APPLIED",
  "LEAVE_APPROVED",
  "LEAVE_REJECTED",
  "LEAVE_CANCELLED",
] as const;

const DOT_COLOR: Record<ActionCategory, string> = {
  auth: "bg-blue-400",
  team: "bg-purple-400",
  leave: "bg-emerald-400",
  user: "bg-amber-400",
  settings: "bg-cyan-400",
};

const PAGE_SIZE = 25;

// ── Sub-components ─────────────────────────────────────────────────────────────

function ActionBadge({ action }: { action: string }) {
  const category = ACTION_CATEGORY[action] ?? "user";
  const style = FAILED_ACTIONS.has(action)
    ? "bg-red-500/15 text-red-400 border-red-500/25"
    : CATEGORY_STYLES[category];
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold ${style}`}
    >
      {ACTION_LABEL[action] ?? action}
    </span>
  );
}

function MetadataViewer({ metadata }: { metadata: Record<string, unknown> }) {
  const entries = Object.entries(metadata).filter(
    ([, v]) => v !== null && v !== undefined,
  );
  if (entries.length === 0) return null;
  return (
    <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 rounded-md bg-muted/50 px-3 py-2 text-xs sm:grid-cols-3">
      {entries.map(([k, v]) => (
        <div key={k}>
          <dt className="text-muted-foreground">{k}</dt>
          <dd className="mt-0.5 truncate font-mono text-foreground/80">
            {String(v)}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function LogRow({ log }: { log: AuditLog }) {
  const [expanded, setExpanded] = useState(false);
  const category = ACTION_CATEGORY[log.action] ?? "user";
  const dotColor = FAILED_ACTIONS.has(log.action)
    ? "bg-red-400"
    : DOT_COLOR[category];
  const hasMetadata = log.metadata && Object.keys(log.metadata).length > 0;
  const hasExtra =
    hasMetadata || log.targetType || log.targetId || log.ipAddress;

  return (
    <div className="rounded-lg border border-border bg-card transition-colors hover:bg-muted/30">
      <button
        type="button"
        className="flex w-full cursor-pointer flex-col gap-3 p-4 text-left sm:flex-row sm:items-start"
        onClick={() => hasExtra && setExpanded((v) => !v)}
        disabled={!hasExtra}
        aria-expanded={hasExtra ? expanded : undefined}
      >
        {/* Timeline dot */}
        <div className="mt-2 hidden shrink-0 sm:block">
          <div className={`h-2 w-2 rounded-full ${dotColor}`} />
        </div>

        {/* Main content */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <ActionBadge action={log.action} />
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {format(parseISO(log.createdAt), "d MMM yyyy, HH:mm:ss")}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
            {log.userId && (
              <span className="flex items-center gap-1">
                <User className="h-3 w-3 shrink-0" />
                <span className="max-w-45 truncate font-mono">
                  {log.userId}
                </span>
              </span>
            )}
            {log.ipAddress && (
              <span className="flex items-center gap-1">
                <Globe className="h-3 w-3 shrink-0" />
                {log.ipAddress}
              </span>
            )}
            {log.targetType && (
              <span className="flex items-center gap-1">
                <Shield className="h-3 w-3 shrink-0" />
                {log.targetType}
              </span>
            )}
          </div>
        </div>

        {/* Expand toggle */}
        {hasExtra && (
          <div className="shrink-0 self-start text-muted-foreground/60">
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </div>
        )}
      </button>

      {/* Expanded details */}
      {expanded && hasExtra && (
        <div className="border-t border-border px-4 pb-4 pt-3 text-xs">
          {log.targetId && (
            <p className="mb-2 text-muted-foreground">
              Target ID:{" "}
              <span className="font-mono text-foreground/80">
                {log.targetId}
              </span>
            </p>
          )}
          {hasMetadata && (
            <MetadataViewer
              metadata={log.metadata as Record<string, unknown>}
            />
          )}
        </div>
      )}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function AuditLogsPage() {
  const [action, setAction] = useState<(typeof ACTIONS)[number]>("ALL");
  const [userId, setUserId] = useState("");
  const [page, setPage] = useState(1);

  const queryParams = {
    page,
    limit: PAGE_SIZE,
    ...(action !== "ALL" ? { action } : {}),
    ...(userId.trim() ? { user_id: userId.trim() } : {}),
  };

  const { data, isLoading } = useQuery({
    queryKey: ["audit-logs", queryParams],
    queryFn: async () => {
      const response = await api.get<ApiResponse<ListAuditLogsResponse>>(
        "/audit-logs",
        { params: queryParams },
      );
      return response.data.data;
    },
  });

  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / PAGE_SIZE));

  function handleActionChange(value: string) {
    setAction(value as (typeof ACTIONS)[number]);
    setPage(1);
  }

  function handleUserIdChange(e: React.ChangeEvent<HTMLInputElement>) {
    setUserId(e.target.value);
    setPage(1);
  }

  return (
    <RoleGuard
      allowedRoles={["ADMIN"]}
      fallback={
        <PageContainer>
          <p className="text-sm text-muted-foreground">Access denied.</p>
        </PageContainer>
      }
    >
      <PageContainer className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Audit Logs</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Full history of authentication, user management, team, and leave
              events.
            </p>
          </div>
          {data && (
            <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Total events:</span>
              <span className="font-semibold">
                {data.total.toLocaleString()}
              </span>
            </div>
          )}
        </div>

        {/* Category legend */}
        <div className="flex flex-wrap gap-2 text-xs">
          {(
            [
              ["auth", "Authentication"],
              ["leave", "Leave"],
              ["user", "User"],
              ["team", "Team"],
              ["settings", "Settings"],
            ] as const
          ).map(([cat, label]) => (
            <span
              key={cat}
              className={`inline-flex items-center rounded-md border px-2 py-0.5 font-medium ${CATEGORY_STYLES[cat]}`}
            >
              {label}
            </span>
          ))}
          <span className="inline-flex items-center rounded-md border border-red-500/25 bg-red-500/15 px-2 py-0.5 font-medium text-red-400">
            Failed
          </span>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={action} onValueChange={handleActionChange}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Filter action" />
            </SelectTrigger>
            <SelectContent>
              {ACTIONS.map((item) => (
                <SelectItem key={item} value={item}>
                  {item === "ALL"
                    ? "All actions"
                    : (ACTION_LABEL[item] ?? item)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            className="max-w-xs"
            placeholder="Filter by actor user ID"
            value={userId}
            onChange={handleUserIdChange}
          />
        </div>

        {/* Log list */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">
              {data
                ? `${data.logs.length} of ${data.total.toLocaleString()} events`
                : "Events"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    // biome-ignore lint/suspicious/noArrayIndexKey: skeleton loaders
                    key={i}
                    className="h-16 animate-pulse rounded-lg bg-muted"
                  />
                ))}
              </div>
            ) : !(data?.logs.length ?? 0) ? (
              <div className="flex flex-col items-center gap-2 py-12 text-center">
                <Activity className="h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm font-medium text-muted-foreground">
                  No events found
                </p>
                <p className="text-xs text-muted-foreground/60">
                  Try adjusting your filters.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {data?.logs.map((log) => (
                  <LogRow key={log.id} log={log} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {(data?.total ?? 0) > PAGE_SIZE && (
          <div className="flex items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </PageContainer>
    </RoleGuard>
  );
}
