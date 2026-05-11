"use client";

import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import {
  Activity,
  ChevronDown,
  ChevronUp,
  Clock,
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
  auth: "border-sky-500/50 bg-sky-500/10 text-sky-700 dark:border-sky-900/50 dark:bg-sky-950/20 dark:text-sky-200",
  team: "border-iris-500/50 bg-iris-500/10 text-iris-700 dark:border-iris-900/50 dark:bg-iris-950/20 dark:text-iris-200",
  leave:
    "border-mint-500/50 bg-mint-500/10 text-mint-700 dark:border-mint-900/50 dark:bg-mint-950/20 dark:text-mint-200",
  user: "border-amber-500/50 bg-amber-500/10 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200",
  settings:
    "border-rose-500/50 bg-rose-500/10 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-rose-200",
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
  auth: "bg-sky-400",
  team: "bg-iris-400",
  leave: "bg-mint-400",
  user: "bg-amber-400",
  settings: "bg-rose-400",
};

const PAGE_SIZE = 25;

// ── Sub-components ─────────────────────────────────────────────────────────────

function ActionBadge({ action }: { action: string }) {
  const category = ACTION_CATEGORY[action] ?? "user";
  const style = FAILED_ACTIONS.has(action)
    ? "border-coral-500/50 bg-coral-500/10 text-coral-700 dark:border-coral-900/50 dark:bg-coral-950/20 dark:text-coral-200"
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
    ? "bg-coral-400"
    : DOT_COLOR[category];
  const hasMetadata = log.metadata && Object.keys(log.metadata).length > 0;
  const hasExtra =
    hasMetadata || log.targetType || log.targetId || log.ipAddress;

  return (
    <div className="product-card-hover rounded-lg border border-border bg-card hover:bg-muted/30">
      <button
        type="button"
        className="flex w-full cursor-pointer flex-col gap-3 p-4 text-left sm:flex-row sm:items-start"
        onClick={() => hasExtra && setExpanded((v) => !v)}
        disabled={!hasExtra}
        aria-expanded={hasExtra ? expanded : undefined}
        aria-label={
          hasExtra
            ? `${expanded ? "Collapse" : "Expand"} details for ${ACTION_LABEL[log.action] ?? log.action} event from ${format(parseISO(log.createdAt), "d MMM yyyy, HH:mm:ss")}`
            : `${ACTION_LABEL[log.action] ?? log.action} event from ${format(parseISO(log.createdAt), "d MMM yyyy, HH:mm:ss")}`
        }
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
      <PageContainer className="flex flex-col gap-6 product-reveal">
        {/* Editorial Header */}
        <div>
          <div className="mb-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Audit logs · {data?.total ?? 0} events · last 30 days
          </div>
          <h1 className="font-serif text-3xl font-normal italic leading-tight tracking-tight">
            Every action, kept{" "}
            <span className="not-italic text-blue-600">honest.</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Authentication, leave, user, team, and settings events — searchable
            for compliance.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <Select value={action} onValueChange={handleActionChange}>
            <SelectTrigger
              aria-label="Filter audit logs by action"
              className="w-full sm:w-56"
            >
              <SelectValue placeholder="All actions" />
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
            aria-label="Filter audit logs by actor user ID"
            className="w-full sm:max-w-xs"
            placeholder="Filter by actor user ID"
            value={userId}
            onChange={handleUserIdChange}
          />
        </div>

        {/* Log list */}
        <Card className="product-card-hover">
          <CardHeader className="pb-4 border-b">
            <CardTitle className="text-base">
              {data
                ? `${data.logs.length} of ${data.total.toLocaleString()} events`
                : "Events"}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
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
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="product-press flex-1 sm:flex-none"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="product-press flex-1 sm:flex-none"
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
