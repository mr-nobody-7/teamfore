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
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Workspace-level leave configuration.
          </p>
        </div>

        {/* ── Leave Types Card ─────────────────────────────────────────── */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Leave Types</CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setNewLabel("");
                setCreateOpen(true);
              }}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Add custom type
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
                className="flex items-center justify-between rounded-md border p-3"
              >
                {/* Label + badges */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{lt.label}</span>
                  {lt.isCustom && (
                    <Badge variant="secondary" className="text-xs">
                      Custom
                    </Badge>
                  )}
                </div>

                {/* Controls */}
                <div className="flex items-center gap-3">
                  <Badge variant={lt.isActive ? "default" : "outline"}>
                    {lt.isActive ? "Enabled" : "Disabled"}
                  </Badge>

                  {/* Toggle */}
                  <Switch
                    checked={lt.isActive}
                    disabled={
                      toggleMutation.isPending ||
                      (lt.isActive &&
                        leaveTypes.filter((x) => x.isActive).length <= 1)
                    }
                    onCheckedChange={(checked) =>
                      toggleMutation.mutate({ id: lt.id, isActive: checked })
                    }
                  />

                  {/* Rename (custom only) */}
                  {lt.isCustom && (
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
                  )}

                  {/* Delete (custom only) */}
                  {lt.isCustom && (
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-destructive"
                      title="Delete"
                      onClick={() => setDeleteTarget(lt)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}

            <p className="pt-1 text-xs text-muted-foreground">
              Disabled types are hidden when submitting new leave requests.
              Built-in types cannot be deleted.
            </p>
          </CardContent>
        </Card>

        {/* ── Conflict Threshold Card ──────────────────────────────────── */}
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
