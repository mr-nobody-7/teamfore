"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PencilLine, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { RoleGuard } from "@/components/auth/role-guard";
import { PageContainer } from "@/components/layout/page-container";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { useTeams } from "@/hooks/use-teams";
import api from "@/lib/axios";
import type { Team } from "@/types/api";

const TEAM_COLORS = [
  "bg-gradient-to-br from-blue-500 to-blue-700",
  "bg-gradient-to-br from-purple-500 to-purple-700",
  "bg-gradient-to-br from-cyan-500 to-cyan-700",
  "bg-gradient-to-br from-rose-500 to-rose-700",
  "bg-gradient-to-br from-amber-500 to-amber-700",
  "bg-gradient-to-br from-emerald-500 to-emerald-700",
];

function getTeamColor(index: number) {
  return TEAM_COLORS[index % TEAM_COLORS.length];
}

export default function TeamsPage() {
  const queryClient = useQueryClient();
  const { data: teams = [], isLoading } = useTeams();
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [editTarget, setEditTarget] = useState<Team | null>(null);
  const [editName, setEditName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Team | null>(null);

  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      await api.post("/teams", { name });
    },
    onSuccess: async () => {
      setCreateName("");
      setCreateOpen(false);
      toast.success("Team created");
      await queryClient.invalidateQueries({ queryKey: ["teams"] });
    },
    onError: () => toast.error("Could not create team"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      teamId,
      teamName,
    }: {
      teamId: string;
      teamName: string;
    }) => {
      await api.patch(`/teams/${teamId}`, { name: teamName });
    },
    onSuccess: async () => {
      setEditTarget(null);
      setEditName("");
      toast.success("Team updated");
      await queryClient.invalidateQueries({ queryKey: ["teams"] });
    },
    onError: () => toast.error("Could not update team"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (teamId: string) => {
      await api.delete(`/teams/${teamId}`);
    },
    onSuccess: async () => {
      setDeleteTarget(null);
      toast.success("Team deleted");
      await queryClient.invalidateQueries({ queryKey: ["teams"] });
    },
    onError: () => toast.error("Could not delete team"),
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
      <PageContainer className="flex flex-col gap-6 product-reveal">
        {/* Editorial Header */}
        <div>
          <div className="mb-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Teams · {teams.length} squads · {teams.length * 5} members
          </div>
          <h1 className="font-serif text-3xl font-normal italic leading-tight tracking-tight">
            Six squads. <span className="not-italic text-blue-600">One</span>{" "}
            sprint.
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Each squad has its own approval chain and capacity threshold. Manage
            members and settings per team.
          </p>
        </div>

        {/* Team Cards Grid */}
        {isLoading ? (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="h-56 animate-pulse bg-muted" />
            ))}
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {teams.map((team, idx) => (
              <Card
                key={team.id}
                className="product-card-hover flex flex-col gap-3"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar
                        className={`h-10 w-10 text-white ${getTeamColor(idx)}`}
                      >
                        <AvatarFallback className="bg-transparent font-semibold">
                          {team.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-base">{team.name}</CardTitle>
                        <p className="text-xs text-muted-foreground">
                          approver · @vivek
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        aria-label={`Edit ${team.name}`}
                        onClick={() => {
                          setEditTarget(team);
                          setEditName(team.name);
                        }}
                      >
                        <PencilLine className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        aria-label={`Delete ${team.name}`}
                        onClick={() => setDeleteTarget(team)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-3 pt-0">
                  {/* Member avatars stack */}
                  <div className="flex items-center gap-1">
                    {[0, 1, 2, 3].map((i) => (
                      <Avatar
                        key={i}
                        className={`h-6 w-6 text-xs text-white ${getTeamColor(i)}`}
                      >
                        <AvatarFallback className="bg-transparent">
                          {String.fromCharCode(65 + i)}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    <div className="h-6 w-6 rounded-full bg-muted text-xs text-muted-foreground flex items-center justify-center">
                      +2
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-2 rounded-lg bg-muted/50 p-2">
                    <div>
                      <div className="text-xs font-mono text-muted-foreground">
                        Capacity
                      </div>
                      <div className="mt-1 text-sm font-semibold text-emerald-600">
                        88%
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-mono text-muted-foreground">
                        On leave
                      </div>
                      <div className="mt-1 text-sm font-semibold">1</div>
                    </div>
                    <div>
                      <div className="text-xs font-mono text-muted-foreground">
                        Pending
                      </div>
                      <div className="mt-1 text-sm font-semibold text-amber-600">
                        1
                      </div>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    className="product-press w-full text-xs"
                    onClick={() => {
                      setEditTarget(team);
                      setEditName(team.name);
                    }}
                  >
                    Edit team
                  </Button>
                </CardContent>
              </Card>
            ))}

            {/* Add Squad Card */}
            <Card className="product-card-hover flex flex-col items-center justify-center gap-3 border-dashed bg-muted/30 hover:bg-muted/50">
              <CardContent className="flex flex-col items-center justify-center gap-2 py-12">
                <div className="text-lg font-serif italic">Add a squad</div>
                <p className="text-center text-xs text-muted-foreground">
                  Pick a name, set an approver, assign members.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="product-press mt-2"
                  onClick={() => {
                    setCreateName("");
                    setCreateOpen(true);
                  }}
                >
                  <Plus className="mr-1.5 h-3 w-3" />
                  New team
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Create team</DialogTitle>
            </DialogHeader>
            <div className="py-2">
              <Input
                placeholder="Team name"
                value={createName}
                onChange={(event) => setCreateName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && createName.trim()) {
                    createMutation.mutate(createName.trim());
                  }
                }}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => createMutation.mutate(createName.trim())}
                disabled={!createName.trim() || createMutation.isPending}
              >
                {createMutation.isPending ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={editTarget !== null}
          onOpenChange={(open) => {
            if (!open) {
              setEditTarget(null);
              setEditName("");
            }
          }}
        >
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Edit team</DialogTitle>
            </DialogHeader>
            <div className="py-2">
              <Input
                placeholder="Team name"
                value={editName}
                onChange={(event) => setEditName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && editTarget && editName.trim()) {
                    updateMutation.mutate({
                      teamId: editTarget.id,
                      teamName: editName.trim(),
                    });
                  }
                }}
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setEditTarget(null);
                  setEditName("");
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (!editTarget || !editName.trim()) {
                    return;
                  }
                  updateMutation.mutate({
                    teamId: editTarget.id,
                    teamName: editName.trim(),
                  });
                }}
                disabled={
                  !editTarget || !editName.trim() || updateMutation.isPending
                }
              >
                {updateMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={deleteTarget !== null}
          onOpenChange={(open) => {
            if (!open) {
              setDeleteTarget(null);
            }
          }}
        >
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Delete team</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Delete{" "}
              <span className="font-medium text-foreground">
                {deleteTarget?.name}
              </span>
              ? This action cannot be undone.
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteTarget(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (deleteTarget) {
                    deleteMutation.mutate(deleteTarget.id);
                  }
                }}
                disabled={!deleteTarget || deleteMutation.isPending}
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageContainer>
    </RoleGuard>
  );
}
