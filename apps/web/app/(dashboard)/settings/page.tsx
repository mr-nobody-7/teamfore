"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PencilLine, Plus, Trash2 } from "lucide-react";
import { useId, useState } from "react";
import { toast } from "sonner";

import { RoleGuard } from "@/components/auth/role-guard";
import { PageContainer } from "@/components/layout/page-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import api from "@/lib/axios";
import type {
  ApiResponse,
  LeaveTypeSetting,
  LeaveTypeSettingsResponse,
} from "@/types/api";

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const createInputId = useId();
  const editInputId = useId();

  // ── Fetch leave types ────────────────────────────────────────────────────
  const { data, isLoading } = useQuery({
    queryKey: ["leave-type-settings"],
    queryFn: async () => {
      const response = await api.get<ApiResponse<LeaveTypeSettingsResponse>>(
        "/settings/leave-types",
      );
      return response.data.data;
    },
  });

  const leaveTypes = data?.leaveTypes ?? [];

  // ── Toggle active ────────────────────────────────────────────────────────
  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      await api.patch(`/settings/leave-types/${id}`, { isActive });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["leave-type-settings"],
      });
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(
        err?.response?.data?.message ?? "Could not update leave type",
      );
    },
  });

  // ── Create custom leave type ─────────────────────────────────────────────
  const [createOpen, setCreateOpen] = useState(false);
  const [newLabel, setNewLabel] = useState("");

  const createMutation = useMutation({
    mutationFn: async (label: string) => {
      await api.post("/settings/leave-types", { label });
    },
    onSuccess: async () => {
      toast.success("Leave type created");
      setNewLabel("");
      setCreateOpen(false);
      await queryClient.invalidateQueries({
        queryKey: ["leave-type-settings"],
      });
    },
    onError: () => {
      toast.error("Could not create leave type");
    },
  });

  // ── Rename custom leave type ─────────────────────────────────────────────
  const [editTarget, setEditTarget] = useState<LeaveTypeSetting | null>(null);
  const [editLabel, setEditLabel] = useState("");

  const renameMutation = useMutation({
    mutationFn: async ({ id, label }: { id: string; label: string }) => {
      await api.patch(`/settings/leave-types/${id}`, { label });
    },
    onSuccess: async () => {
      toast.success("Leave type renamed");
      setEditTarget(null);
      await queryClient.invalidateQueries({
        queryKey: ["leave-type-settings"],
      });
    },
    onError: () => {
      toast.error("Could not rename leave type");
    },
  });

  // ── Delete custom leave type ─────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState<LeaveTypeSetting | null>(
    null,
  );

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/settings/leave-types/${id}`);
    },
    onSuccess: async () => {
      toast.success("Leave type deleted");
      setDeleteTarget(null);
      await queryClient.invalidateQueries({
        queryKey: ["leave-type-settings"],
      });
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(
        err?.response?.data?.message ?? "Could not delete leave type",
      );
    },
  });

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
        {/* Editorial Header */}
        <div>
          <div className="mb-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Settings · workspace · acme
          </div>
          <h1 className="font-serif text-3xl font-normal italic leading-tight tracking-tight">
            Tune the rules.{" "}
            <span className="not-italic text-blue-600">Once.</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Leave types, accruals, integrations, and policies — workspace-wide.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column: Leave Types & Threshold */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base">Leave types</CardTitle>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setNewLabel("");
                    setCreateOpen(true);
                  }}
                >
                  <Plus className="mr-1.5 h-4 w-4" />
                  Add type
                </Button>
              </CardHeader>
              <CardContent className="space-y-2">
                {isLoading && (
                  <p className="text-sm text-muted-foreground">Loading…</p>
                )}

                {!isLoading && leaveTypes.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No leave types configured.
                  </p>
                )}

                {leaveTypes.map((lt) => (
                  <div
                    key={lt.id}
                    className="flex items-center justify-between rounded-lg border px-3 py-2 transition-colors hover:bg-muted/30"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="text-sm font-medium">{lt.label}</div>
                        <div className="text-xs text-muted-foreground">
                          {lt.isCustom ? "Custom type" : "Built-in"}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {lt.isCustom && (
                        <>
                          <button
                            type="button"
                            className="text-muted-foreground hover:text-foreground"
                            title="Rename"
                            onClick={() => {
                              setEditLabel(lt.label);
                              setEditTarget(lt);
                            }}
                          >
                            <PencilLine className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            className="text-muted-foreground hover:text-destructive"
                            title="Delete"
                            onClick={() => setDeleteTarget(lt)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                      <Switch
                        checked={lt.isActive}
                        disabled={toggleMutation.isPending}
                        onCheckedChange={(checked) =>
                          toggleMutation.mutate({
                            id: lt.id,
                            isActive: checked,
                          })
                        }
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Conflict threshold</CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">
                  Warn when team capacity falls below
                </p>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="relative flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="absolute h-full bg-gradient-to-r from-blue-500 to-blue-600"
                      style={{ width: "50%" }}
                    />
                  </div>
                  <div className="font-mono text-xl font-medium w-12 text-right">
                    50%
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Integrations */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Integrations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between rounded-lg border px-3 py-2">
                  <div>
                    <div className="text-sm font-medium">Slack</div>
                    <div className="text-xs text-muted-foreground">
                      Connected · #standup
                    </div>
                  </div>
                  <Badge
                    variant="default"
                    className="bg-emerald-600 text-white text-xs"
                  >
                    CONNECTED
                  </Badge>
                </div>
                <div className="flex items-center justify-between rounded-lg border px-3 py-2">
                  <div>
                    <div className="text-sm font-medium">Google Calendar</div>
                    <div className="text-xs text-muted-foreground">
                      2-way sync
                    </div>
                  </div>
                  <Badge
                    variant="default"
                    className="bg-emerald-600 text-white text-xs"
                  >
                    CONNECTED
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Plan & billing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <div className="text-sm font-medium">Free Plan</div>
                  <div className="text-xs text-muted-foreground">
                    14 of 20 seats used
                  </div>
                </div>
                <Button size="sm" variant="outline" className="w-full">
                  Manage billing
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </PageContainer>

      {/* ── Create Dialog ────────────────────────────────────────────────── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Add custom leave type</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor={createInputId}>Display name</Label>
            <Input
              id={createInputId}
              placeholder="e.g. Paternity Leave"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newLabel.trim()) {
                  createMutation.mutate(newLabel.trim());
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createMutation.mutate(newLabel.trim())}
              disabled={!newLabel.trim() || createMutation.isPending}
            >
              {createMutation.isPending ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Rename Dialog ────────────────────────────────────────────────── */}
      <Dialog
        open={editTarget !== null}
        onOpenChange={(open) => !open && setEditTarget(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Rename leave type</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor={editInputId}>Display name</Label>
            <Input
              id={editInputId}
              value={editLabel}
              onChange={(e) => setEditLabel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && editTarget && editLabel.trim()) {
                  renameMutation.mutate({
                    id: editTarget.id,
                    label: editLabel.trim(),
                  });
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                editTarget &&
                renameMutation.mutate({
                  id: editTarget.id,
                  label: editLabel.trim(),
                })
              }
              disabled={!editLabel.trim() || renameMutation.isPending}
            >
              {renameMutation.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirm Dialog ────────────────────────────────────────── */}
      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete "{deleteTarget?.label}"?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This leave type will be removed. Existing leave requests that used
            it will still be visible but the type will show its internal key.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                deleteTarget && deleteMutation.mutate(deleteTarget.id)
              }
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </RoleGuard>
  );
}
