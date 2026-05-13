"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Lock } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useMemo, useState } from "react";
import { toast } from "sonner";

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
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/use-auth";
import { useRole } from "@/hooks/use-role";
import api from "@/lib/axios";
import type { ApiResponse, LeaveTypeSetting } from "@/types/api";

type CountryOption = {
  code: string;
  name: string;
};

type AccrualFrequency = "MONTHLY" | "QUARTERLY" | "ANNUAL";

type LeavePolicy = {
  leaveTypeId: string;
  accrualFrequency: AccrualFrequency;
  daysPerYear: number;
  maxCarryForward: number;
  carryForwardExpiryMonths: number;
  isActive: boolean;
  leaveType: {
    id: string;
    label: string;
    type: string;
    isActive: boolean;
  };
};

type AccrualRow = {
  leaveTypeId: string;
  leaveTypeLabel: string;
  accrualFrequency: AccrualFrequency;
  daysPerYear: number;
  maxCarryForward: number;
  carryForwardExpiryMonths: number;
  isActive: boolean;
};

type RowStatus = {
  isSaving: boolean;
  saved: boolean;
  error: string | null;
};

const DEFAULT_ACCRUAL_POLICY: Pick<
  AccrualRow,
  | "daysPerYear"
  | "accrualFrequency"
  | "maxCarryForward"
  | "carryForwardExpiryMonths"
  | "isActive"
> = {
  daysPerYear: 0,
  accrualFrequency: "MONTHLY",
  maxCarryForward: 0,
  carryForwardExpiryMonths: 3,
  isActive: false,
};

function mergeAccrualRows(
  leaveTypes: LeaveTypeSetting[],
  policies: LeavePolicy[],
): AccrualRow[] {
  const policyMap = new Map(
    policies.map((policy) => [policy.leaveTypeId, policy]),
  );

  return leaveTypes
    .filter((leaveType) => leaveType.isActive)
    .map((leaveType) => {
      const policy = policyMap.get(leaveType.id);

      return {
        leaveTypeId: leaveType.id,
        leaveTypeLabel: leaveType.label,
        daysPerYear: policy?.daysPerYear ?? DEFAULT_ACCRUAL_POLICY.daysPerYear,
        accrualFrequency:
          policy?.accrualFrequency ?? DEFAULT_ACCRUAL_POLICY.accrualFrequency,
        maxCarryForward:
          policy?.maxCarryForward ?? DEFAULT_ACCRUAL_POLICY.maxCarryForward,
        carryForwardExpiryMonths:
          policy?.carryForwardExpiryMonths ??
          DEFAULT_ACCRUAL_POLICY.carryForwardExpiryMonths,
        isActive: policy?.isActive ?? DEFAULT_ACCRUAL_POLICY.isActive,
      };
    });
}

function flagEmoji(countryCode: string): string {
  return countryCode
    .toUpperCase()
    .split("")
    .map((char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join("");
}

export default function TeamSettingsPage() {
  const { user, refetch } = useAuth();
  const { isAdmin } = useRole();
  const countryInputId = useId();
  const timezoneInputId = useId();
  const [country, setCountry] = useState<string>("");
  const [timezone, setTimezone] = useState<string>("Asia/Kolkata");
  const [accrualRows, setAccrualRows] = useState<AccrualRow[]>([]);
  const [rowStatuses, setRowStatuses] = useState<Record<string, RowStatus>>({});

  const { data: countriesData, isLoading: isCountriesLoading } = useQuery({
    queryKey: ["settings-countries"],
    queryFn: async () => {
      const response = await api.get<
        ApiResponse<{ countries: CountryOption[] }>
      >("/settings/countries");
      return response.data.data.countries;
    },
  });

  useEffect(() => {
    if (!user?.workspace) {
      return;
    }

    setCountry(user.workspace.country ?? "");
    setTimezone(user.workspace.timezone || "Asia/Kolkata");
  }, [user?.workspace]);

  const isDirty = useMemo(() => {
    if (!user?.workspace) {
      return false;
    }

    const initialCountry = user.workspace.country ?? "";
    const initialTimezone = user.workspace.timezone || "Asia/Kolkata";

    return country !== initialCountry || timezone !== initialTimezone;
  }, [country, timezone, user?.workspace]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      await api.post("/settings/workspace", {
        country,
        timezone,
      });
    },
    onSuccess: async () => {
      toast.success("Settings saved. Public holidays synced.");
      refetch();
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(
        error.response?.data?.message ?? "Could not save regional settings",
      );
    },
  });

  const {
    data: accrualData,
    isLoading: isAccrualLoading,
    error: accrualError,
  } = useQuery({
    queryKey: ["settings-accruals"],
    enabled: isAdmin,
    queryFn: async () => {
      const leaveTypesRequest = api.get<
        ApiResponse<{ leaveTypes: LeaveTypeSetting[] }>
      >("/settings/leave-types");
      const leavePoliciesRequest = api
        .get<ApiResponse<{ policies: LeavePolicy[] }>>(
          "/settings/leave-policies",
        )
        .then((response) => ({
          locked: false,
          policies: response.data.data.policies,
        }))
        .catch(
          (error: {
            response?: {
              data?: { upgradeRequired?: boolean; message?: string };
            };
          }) => {
            if (error.response?.data?.upgradeRequired) {
              return {
                locked: true,
                policies: [] as LeavePolicy[],
              };
            }

            throw error;
          },
        );

      const [leaveTypesResponse, leavePoliciesResponse] = await Promise.all([
        leaveTypesRequest,
        leavePoliciesRequest,
      ]);

      return {
        leaveTypes: leaveTypesResponse.data.data.leaveTypes,
        policies: leavePoliciesResponse.policies,
        locked: leavePoliciesResponse.locked,
      };
    },
  });

  useEffect(() => {
    if (!accrualData?.leaveTypes) {
      return;
    }

    setAccrualRows(
      mergeAccrualRows(accrualData.leaveTypes, accrualData.policies),
    );
  }, [accrualData]);

  const updateAccrualRow = <K extends keyof AccrualRow>(
    leaveTypeId: string,
    field: K,
    value: AccrualRow[K],
  ) => {
    setAccrualRows((currentRows) =>
      currentRows.map((row) =>
        row.leaveTypeId === leaveTypeId ? { ...row, [field]: value } : row,
      ),
    );
  };

  const saveAccrualRow = useMutation({
    mutationFn: async (row: AccrualRow) => {
      await api.post("/settings/leave-policies", {
        leaveTypeId: row.leaveTypeId,
        accrualFrequency: row.accrualFrequency,
        daysPerYear: row.daysPerYear,
        maxCarryForward: row.maxCarryForward,
        carryForwardExpiryMonths: row.carryForwardExpiryMonths,
        isActive: row.isActive,
      });

      return row.leaveTypeId;
    },
    onMutate: async (row) => {
      setRowStatuses((current) => ({
        ...current,
        [row.leaveTypeId]: {
          isSaving: true,
          saved: false,
          error: null,
        },
      }));
    },
    onSuccess: (leaveTypeId) => {
      setRowStatuses((current) => ({
        ...current,
        [leaveTypeId]: {
          isSaving: false,
          saved: true,
          error: null,
        },
      }));

      window.setTimeout(() => {
        setRowStatuses((current) => ({
          ...current,
          [leaveTypeId]: {
            isSaving: false,
            saved: false,
            error: null,
          },
        }));
      }, 2000);
    },
    onError: (error: { response?: { data?: { message?: string } } }, row) => {
      setRowStatuses((current) => ({
        ...current,
        [row.leaveTypeId]: {
          isSaving: false,
          saved: false,
          error:
            error.response?.data?.message ?? "Could not save accrual policy",
        },
      }));
    },
  });

  const showAccrualSection = isAdmin;
  const accrualLocked = accrualData?.locked ?? false;

  return (
    <PageContainer className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Team Setup</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Add members and organize teams to unlock planning views.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invite your team</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild size="sm">
            <Link href="/users">Invite members</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/teams">Manage teams</Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Regional Settings</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label
              htmlFor={countryInputId}
              className="text-sm font-medium text-foreground"
            >
              Country
            </label>
            <Select
              value={country || "none"}
              onValueChange={(value) =>
                setCountry(value === "none" ? "" : value)
              }
              disabled={isCountriesLoading}
            >
              <SelectTrigger id={countryInputId}>
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Not set</SelectItem>
                {(countriesData ?? []).map((item) => (
                  <SelectItem key={item.code} value={item.code}>
                    {flagEmoji(item.code)} {item.name} ({item.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label
              htmlFor={timezoneInputId}
              className="text-sm font-medium text-foreground"
            >
              Timezone
            </label>
            <Input
              id={timezoneInputId}
              value={timezone}
              onChange={(event) => setTimezone(event.target.value)}
              placeholder="Asia/Kolkata"
            />
          </div>

          <div className="md:col-span-2">
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || !timezone.trim() || !isDirty}
            >
              {saveMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {showAccrualSection && (
        <Card>
          <CardHeader>
            <CardTitle>Leave Accruals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isAccrualLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Spinner size="sm" />
                Loading accrual settings...
              </div>
            ) : accrualLocked ? (
              <div className="rounded-lg border border-dashed p-4">
                <div className="flex items-start gap-3">
                  <Lock className="mt-0.5 h-5 w-5 text-muted-foreground" />
                  <div className="space-y-3">
                    <div>
                      <p className="font-medium">
                        Leave accruals are available on the Starter plan.
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Upgrade to configure accrual frequency, carry-forward,
                        and yearly allowances.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => toast.info("Billing coming soon")}
                    >
                      Upgrade to Starter
                    </Button>
                  </div>
                </div>
              </div>
            ) : accrualError ? (
              <p className="text-sm text-destructive">
                Could not load leave accrual settings.
              </p>
            ) : accrualRows.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No active leave types available for accrual configuration.
              </p>
            ) : (
              accrualRows.map((row) => {
                const rowStatus = rowStatuses[row.leaveTypeId] ?? {
                  isSaving: false,
                  saved: false,
                  error: null,
                };
                const carryForwardVisible =
                  row.isActive && row.maxCarryForward > 0;

                return (
                  <div key={row.leaveTypeId} className="rounded-lg border p-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="font-medium">{row.leaveTypeLabel}</p>
                        <p className="text-sm text-muted-foreground">
                          Configure how this leave type accrues over time.
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground">
                          Enable accruals
                        </span>
                        <Switch
                          checked={row.isActive}
                          onCheckedChange={(checked) =>
                            updateAccrualRow(
                              row.leaveTypeId,
                              "isActive",
                              checked,
                            )
                          }
                        />
                      </div>
                    </div>

                    {row.isActive && (
                      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <div className="space-y-2">
                          <label
                            htmlFor={`${row.leaveTypeId}-days-per-year`}
                            className="text-sm font-medium"
                          >
                            Days per year
                          </label>
                          <Input
                            id={`${row.leaveTypeId}-days-per-year`}
                            type="number"
                            min="0"
                            step="0.01"
                            value={row.daysPerYear}
                            onChange={(event) =>
                              updateAccrualRow(
                                row.leaveTypeId,
                                "daysPerYear",
                                Number(event.target.value || 0),
                              )
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <label
                            htmlFor={`${row.leaveTypeId}-accrual-frequency`}
                            className="text-sm font-medium"
                          >
                            Accrual frequency
                          </label>
                          <Select
                            value={row.accrualFrequency}
                            onValueChange={(value) =>
                              updateAccrualRow(
                                row.leaveTypeId,
                                "accrualFrequency",
                                value as AccrualFrequency,
                              )
                            }
                          >
                            <SelectTrigger
                              id={`${row.leaveTypeId}-accrual-frequency`}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="MONTHLY">Monthly</SelectItem>
                              <SelectItem value="QUARTERLY">
                                Quarterly
                              </SelectItem>
                              <SelectItem value="ANNUAL">Annual</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <label
                            htmlFor={`${row.leaveTypeId}-carry-forward`}
                            className="text-sm font-medium"
                          >
                            Max carry-forward days
                          </label>
                          <Input
                            id={`${row.leaveTypeId}-carry-forward`}
                            type="number"
                            min="0"
                            step="0.01"
                            value={row.maxCarryForward}
                            onChange={(event) =>
                              updateAccrualRow(
                                row.leaveTypeId,
                                "maxCarryForward",
                                Number(event.target.value || 0),
                              )
                            }
                          />
                        </div>

                        {carryForwardVisible && (
                          <div className="space-y-2">
                            <label
                              htmlFor={`${row.leaveTypeId}-carry-forward-expiry`}
                              className="text-sm font-medium"
                            >
                              Carry-forward expires after
                            </label>
                            <div className="flex items-center gap-2">
                              <Input
                                id={`${row.leaveTypeId}-carry-forward-expiry`}
                                type="number"
                                min="0"
                                step="1"
                                value={row.carryForwardExpiryMonths}
                                onChange={(event) =>
                                  updateAccrualRow(
                                    row.leaveTypeId,
                                    "carryForwardExpiryMonths",
                                    Number(event.target.value || 0),
                                  )
                                }
                              />
                              <span className="text-sm text-muted-foreground">
                                months
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <Button
                        size="sm"
                        onClick={() => saveAccrualRow.mutate(row)}
                        disabled={rowStatus.isSaving}
                      >
                        Save
                      </Button>
                      {rowStatus.isSaving && (
                        <span className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Spinner size="sm" />
                          Saving...
                        </span>
                      )}
                      {rowStatus.saved && (
                        <span className="text-sm text-emerald-600">
                          Saved ✓
                        </span>
                      )}
                      {rowStatus.error && (
                        <span className="text-sm text-destructive">
                          {rowStatus.error}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      )}
    </PageContainer>
  );
}
