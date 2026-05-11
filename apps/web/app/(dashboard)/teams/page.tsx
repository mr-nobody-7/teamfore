"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { RoleGuard } from "@/components/auth/role-guard";
import { PageContainer } from "@/components/layout/page-container";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTeams } from "@/hooks/use-teams";
import api from "@/lib/axios";

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
  const [name, setName] = useState("");
  const [_editing, _setEditing] = useState<Record<string, string>>({});

  const _createMutation = useMutation({
    mutationFn: async () => {
      await api.post("/teams", { name });
    },
    onSuccess: async () => {
      setName("");
      toast.success("Team created");
      await queryClient.invalidateQueries({ queryKey: ["teams"] });
    },
    onError: () => toast.error("Could not create team"),
  });

  const _updateMutation = useMutation({
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
      toast.success("Team updated");
      await queryClient.invalidateQueries({ queryKey: ["teams"] });
    },
    onError: () => toast.error("Could not update team"),
  });

  const _deleteMutation = useMutation({
    mutationFn: async (teamId: string) => {
      await api.delete(`/teams/${teamId}`);
    },
    onSuccess: async () => {
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

                  {/* Edit button */}
                  <Button
                    size="sm"
                    variant="outline"
                    className="product-press w-full text-xs"
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
                    setName("");
                    // In a real app, this would open a dialog
                  }}
                >
                  <Plus className="mr-1.5 h-3 w-3" />
                  New team
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </PageContainer>
    </RoleGuard>
  );
}
