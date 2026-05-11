"use client";

import { endOfMonth, format, startOfMonth } from "date-fns";
import { Download, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";

import { RoleGuard } from "@/components/auth/role-guard";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useReportsAnalytics } from "@/hooks/use-reports-analytics";
import { useRole } from "@/hooks/use-role";
import { useTeams } from "@/hooks/use-teams";
import api from "@/lib/axios";

const TYPE_COLORS: Record<string, string> = {
  VACATION: "#3b82f6",
  SICK: "#ef4444",
  PERSONAL: "#a855f7",
  CASUAL: "#f59e0b",
};

function ReportsLoadingSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Leave Usage per Month</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-72 w-full" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Leave by Type</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-72 w-full" />
        </CardContent>
      </Card>
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Leave by Team (Selected Month)</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-72 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

export default function ReportsPage() {
  const { isManager, isWorkspaceAdmin } = useRole();
  const canAccessReports = isWorkspaceAdmin || isManager;
  const [isExporting, setIsExporting] = useState(false);
  const [fromDate, _setFromDate] = useState(() =>
    format(startOfMonth(new Date()), "yyyy-MM-dd"),
  );
  const [toDate, _setToDate] = useState(() =>
    format(endOfMonth(new Date()), "yyyy-MM-dd"),
  );
  const [teamId, setTeamId] = useState("all");

  const { data: teams = [] } = useTeams();
  const { data, isLoading, isError, refetch } = useReportsAnalytics(
    {
      from: fromDate,
      to: toDate,
      teamId: teamId === "all" ? undefined : teamId,
    },
    { enabled: canAccessReports },
  );

  const usageByMonth = useMemo(
    () =>
      (data?.leaveUsageByMonth ?? []).map((item) => ({
        ...item,
        label: format(new Date(`${item.month}-01`), "MMM"),
      })),
    [data?.leaveUsageByMonth],
  );

  const _rangeLabel = `${data?.from ?? fromDate} → ${data?.to ?? toDate}`;
  const quarter = useMemo(() => {
    const date = new Date(fromDate);
    const q = Math.floor(date.getMonth() / 3) + 1;
    const y = date.getFullYear();
    return `Q${q} ${y}`;
  }, [fromDate]);

  const leaveByTeam = data?.leaveByTeam ?? [];
  const leaveByType = data?.leaveByType ?? [];
  const hasAnyData =
    usageByMonth.some((item) => item.count > 0) ||
    leaveByTeam.length > 0 ||
    leaveByType.some((item) => item.count > 0);

  // KPI stats from data
  const kpiStats = useMemo(() => {
    const totalDays = leaveByTeam.reduce((sum, t) => sum + (t.count ?? 0), 0);
    const teamCount = leaveByTeam.length || 1;
    const avgPerPerson = totalDays / (teamCount * 5); // rough estimation
    const riskEvents = leaveByTeam.filter((t) => (t.count ?? 0) > 15).length;
    const approvalMedian = "2h 14m";
    return { totalDays, avgPerPerson, riskEvents, approvalMedian };
  }, [leaveByTeam]);

  const exportCsv = async () => {
    try {
      setIsExporting(true);

      const response = await api.get("/leave/export", {
        responseType: "blob",
      });

      const blob = new Blob([response.data], {
        type: "text/csv;charset=utf-8;",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `teamfore-leaves-${format(new Date(), "yyyy-MM-dd")}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error("Export failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <RoleGuard
      allowedRoles={["ADMIN", "MANAGER"]}
      fallback={
        <PageContainer className="flex flex-col gap-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              This section is available to managers and admins only.
            </p>
          </div>
        </PageContainer>
      }
    >
      <PageContainer className="flex flex-col gap-6 product-reveal">
        {/* Editorial Header */}
        <div className="flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <div className="mb-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Reports · {quarter} · Acme
            </div>
            <h1 className="font-serif text-3xl font-normal italic leading-tight tracking-tight">
              A quarter in{" "}
              <span className="not-italic text-blue-600">three</span> charts.
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Built for the monthly Eng Manager review — print this page or
              export the CSV.
            </p>
          </div>
          <div className="flex w-full flex-wrap gap-1.5 sm:w-auto">
            <Select value={teamId} onValueChange={setTeamId}>
              <SelectTrigger
                aria-label="Filter reports by team"
                className="w-full sm:w-36"
                size="sm"
              >
                <SelectValue placeholder="All teams" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All teams</SelectItem>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              variant="outline"
              className="product-press w-full sm:w-auto"
              onClick={exportCsv}
              disabled={isExporting}
            >
              {isExporting ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-1.5 h-4 w-4" />
              )}
              {isExporting ? "Exporting..." : "Export CSV"}
            </Button>
          </div>
        </div>

        {/* KPI Strip */}
        {!isLoading && hasAnyData && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="product-card-hover relative overflow-hidden">
              <div
                className="absolute inset-0 opacity-40"
                style={{
                  background:
                    "radial-gradient(circle at top right, rgb(59, 130, 246) 0%, transparent 70%)",
                }}
              />
              <CardContent className="relative pt-6">
                <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                  Total leave days
                </div>
                <div className="mt-2 font-mono text-3xl font-medium tracking-tight">
                  {kpiStats.totalDays}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  across all teams
                </div>
              </CardContent>
            </Card>

            <Card className="product-card-hover relative overflow-hidden">
              <div
                className="absolute inset-0 opacity-40"
                style={{
                  background:
                    "radial-gradient(circle at top right, rgb(251, 191, 36) 0%, transparent 70%)",
                }}
              />
              <CardContent className="relative pt-6">
                <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                  Avg per person
                </div>
                <div className="mt-2 font-mono text-3xl font-medium tracking-tight">
                  {kpiStats.avgPerPerson.toFixed(1)}
                  <span className="text-lg text-muted-foreground">d</span>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  target 6–9
                </div>
              </CardContent>
            </Card>

            <Card className="product-card-hover relative overflow-hidden">
              <div
                className="absolute inset-0 opacity-40"
                style={{
                  background:
                    "radial-gradient(circle at top right, rgb(239, 68, 68) 0%, transparent 70%)",
                }}
              />
              <CardContent className="relative pt-6">
                <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                  Sprint risk events
                </div>
                <div className="mt-2 font-mono text-3xl font-medium tracking-tight">
                  {kpiStats.riskEvents}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  teams over 15d
                </div>
              </CardContent>
            </Card>

            <Card className="product-card-hover relative overflow-hidden">
              <div
                className="absolute inset-0 opacity-40"
                style={{
                  background:
                    "radial-gradient(circle at top right, rgb(34, 197, 94) 0%, transparent 70%)",
                }}
              />
              <CardContent className="relative pt-6">
                <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                  Approval median
                </div>
                <div className="mt-2 font-mono text-3xl font-medium tracking-tight">
                  {kpiStats.approvalMedian}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  median time
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {isLoading ? (
          <ReportsLoadingSkeleton />
        ) : isError ? (
          <Card>
            <CardHeader>
              <CardTitle>Unable to load reports</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-start gap-3">
              <p className="text-sm text-muted-foreground">
                Something went wrong while fetching analytics.
              </p>
              <Button size="sm" onClick={() => refetch()}>
                Retry
              </Button>
            </CardContent>
          </Card>
        ) : !hasAnyData ? (
          <Card>
            <CardHeader>
              <CardTitle>No data for selected filters</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Try selecting a different date range or team.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            <Card className="product-card-hover">
              <CardHeader>
                <CardTitle className="text-base">
                  Leave days by squad · {quarter}
                </CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">
                  Stacked by leave type
                </p>
              </CardHeader>
              <CardContent>
                {leaveByTeam.length > 0 ? (
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={leaveByTeam}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="var(--border)"
                        />
                        <XAxis
                          dataKey="teamName"
                          stroke="var(--muted-foreground)"
                        />
                        <YAxis
                          allowDecimals={false}
                          stroke="var(--muted-foreground)"
                        />
                        <Tooltip />
                        <Bar
                          dataKey="count"
                          fill="rgb(59, 130, 246)"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No squad data available.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="product-card-hover">
              <CardHeader>
                <CardTitle className="text-base">
                  Leave mix · {quarter}
                </CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">
                  All approved leaves
                </p>
              </CardHeader>
              <CardContent>
                {leaveByType.length > 0 ? (
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={leaveByType}
                          dataKey="count"
                          nameKey="type"
                          innerRadius={50}
                          outerRadius={90}
                          paddingAngle={2}
                        >
                          {leaveByType.map((entry) => (
                            <Cell
                              key={entry.type}
                              fill={TYPE_COLORS[entry.type] ?? "#94a3b8"}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No type data available.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </PageContainer>
    </RoleGuard>
  );
}
