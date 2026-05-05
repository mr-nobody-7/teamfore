"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { RoleGuard } from "@/components/auth/role-guard";
import { PageContainer } from "@/components/layout/page-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import api from "@/lib/axios";
import { formatLeaveType } from "@/lib/utils";
import type {
  ApiResponse,
  LeaveType,
  LeaveTypeSettingsResponse,
} from "@/types/api";

const LEAVE_TYPES = ["VACATION", "SICK", "PERSONAL", "CASUAL"];

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [enabledTypes, setEnabledTypes] = useState<LeaveType[]>([]);

  const { data, isLoading } = useQuery({
    queryKey: ["leave-type-settings"],
    queryFn: async () => {
      const response = await api.get<ApiResponse<LeaveTypeSettingsResponse>>(
        "/settings/leave-types",
      );
      return response.data.data;
    },
  });

  useEffect(() => {
    if (data?.enabledTypes) {
      setEnabledTypes(data.enabledTypes);
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: async (nextEnabledTypes: LeaveType[]) => {
      await api.put("/settings/leave-types", {
        enabled_types: nextEnabledTypes,
      });
    },
    onSuccess: async () => {
      toast.success("Leave type settings updated");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["leave-type-settings"] }),
        queryClient.invalidateQueries({ queryKey: ["audit-logs"] }),
      ]);
    },
    onError: () => {
      toast.error("Could not update leave type settings");
    },
  });

  const toggleType = (type: LeaveType) => {
    setEnabledTypes((current) => {
      if (current.includes(type)) {
        if (current.length === 1) {
          toast.error("At least one leave type must remain enabled");
          return current;
        }
        return current.filter((item) => item !== type);
      }
      return [...current, type];
    });
  };

  const save = () => {
    mutation.mutate(enabledTypes);
  };

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
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Workspace-level leave configuration overview.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Leave Types</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-2 sm:grid-cols-2">
              {LEAVE_TYPES.map((type) => {
                const isActive = enabledTypes.includes(type as LeaveType);

                return (
                  <label
                    key={type}
                    className="flex cursor-pointer items-center justify-between rounded-md border p-3"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isActive}
                        onChange={() => toggleType(type as LeaveType)}
                        disabled={
                          mutation.isPending ||
                          isLoading ||
                          (isActive && enabledTypes.length === 1)
                        }
                      />
                      <span className="text-sm font-medium">{formatLeaveType(type)}</span>
                    </div>

                    <Badge variant={isActive ? "default" : "outline"}>
                      {isActive ? "Enabled" : "Disabled"}
                    </Badge>
                  </label>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              Changes here affect the leave types available when submitting new
              leave requests.
            </p>

            <div>
              <Button
                size="sm"
                onClick={save}
                disabled={mutation.isPending || isLoading}
              >
                {mutation.isPending ? "Saving..." : "Save leave type settings"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Conflict Threshold</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              Current warning threshold: <strong>50%</strong> team overlap.
            </p>
          </CardContent>
        </Card>
      </PageContainer>
    </RoleGuard>
  );
}
