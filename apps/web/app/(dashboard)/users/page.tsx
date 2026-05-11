"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { RoleGuard } from "@/components/auth/role-guard";
import { PageContainer } from "@/components/layout/page-container";
import { Badge } from "@/components/ui/badge";
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
import { useTeams } from "@/hooks/use-teams";
import api from "@/lib/axios";
import type { ApiResponse, ListUsersResponse } from "@/types/api";

const ROLES = ["USER", "MANAGER", "ADMIN"] as const;

interface NewUserForm {
  name: string;
  email: string;
  password: string;
  role: (typeof ROLES)[number];
  team_id?: string;
}

export default function UsersPage() {
  const queryClient = useQueryClient();
  const { data: teams = [] } = useTeams();

  const [form, setForm] = useState<NewUserForm>({
    name: "",
    email: "",
    password: "",
    role: "USER",
    team_id: undefined,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["workspace-users"],
    queryFn: async () => {
      const response = await api.get<ApiResponse<ListUsersResponse>>("/users", {
        params: { page: 1, limit: 50 },
      });
      return response.data.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      await api.post("/users", {
        ...form,
        ...(form.team_id ? { team_id: form.team_id } : {}),
      });
    },
    onSuccess: async () => {
      toast.success("User created");
      setForm({
        name: "",
        email: "",
        password: "",
        role: "USER",
        team_id: undefined,
      });
      await queryClient.invalidateQueries({ queryKey: ["workspace-users"] });
    },
    onError: () => toast.error("Could not create user"),
  });

  const _updateMutation = useMutation({
    mutationFn: async ({
      userId,
      role,
      teamId,
      isActive,
    }: {
      userId: string;
      role: string;
      teamId: string | null;
      isActive: boolean;
    }) => {
      await api.patch(`/users/${userId}`, {
        role,
        team_id: teamId,
        is_active: isActive,
      });
    },
    onSuccess: async () => {
      toast.success("User updated");
      await queryClient.invalidateQueries({ queryKey: ["workspace-users"] });
    },
    onError: () => toast.error("Could not update user"),
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
            Users · {data?.users.length || 0} active · 2 invited · 1 deactivated
          </div>
          <h1 className="font-serif text-3xl font-normal italic leading-tight tracking-tight">
            Who's on the team.{" "}
            <span className="not-italic text-blue-600">Who</span> can do what.
          </h1>
        </div>

        {/* Invite Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b pb-4">
            <div>
              <CardTitle>Invite a teammate</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                Invitees join with USER role by default
              </p>
            </div>
            <Badge variant="default" className="bg-blue-600">
              FREE PLAN · 14 SEATS LEFT
            </Badge>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5 lg:items-end">
              <div className="lg:col-span-1">
                <div className="text-xs font-medium text-muted-foreground">
                  Email
                </div>
                <Input
                  placeholder="user@company.dev"
                  value={form.email}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                  className="mt-1"
                />
              </div>
              <div className="lg:col-span-1">
                <div className="text-xs font-medium text-muted-foreground">
                  Name
                </div>
                <Input
                  placeholder="Optional"
                  value={form.name}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="mt-1"
                />
              </div>
              <div className="lg:col-span-1">
                <div className="text-xs font-medium text-muted-foreground">
                  Role
                </div>
                <Select
                  value={form.role}
                  onValueChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      role: value as NewUserForm["role"],
                    }))
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="lg:col-span-1">
                <div className="text-xs font-medium text-muted-foreground">
                  Team
                </div>
                <Select
                  value={form.team_id ?? "none"}
                  onValueChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      team_id: value === "none" ? undefined : value,
                    }))
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select team" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No team</SelectItem>
                    {teams.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={() => createMutation.mutate()}
                disabled={createMutation.isPending || !form.email}
              >
                Send invites
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="text-base">Users</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground py-8">
                Loading users...
              </p>
            ) : !(data?.users.length ?? 0) ? (
              <p className="text-sm text-muted-foreground py-8">
                No users yet.
              </p>
            ) : (
              <div className="space-y-0">
                <div className="grid grid-cols-5 gap-4 border-b px-4 py-3 font-mono text-xs uppercase tracking-widest text-muted-foreground">
                  <div className="col-span-1.5">Name</div>
                  <div>Team</div>
                  <div>Role</div>
                  <div>Status</div>
                  <div></div>
                </div>
                {data?.users.map((user) => (
                  <div
                    key={user.id}
                    className="grid grid-cols-5 gap-4 border-b px-4 py-3 items-center transition-colors hover:bg-muted/30"
                  >
                    <div className="col-span-1.5">
                      <div className="text-sm font-medium">{user.name}</div>
                      <div className="text-xs text-muted-foreground font-mono">
                        {user.email}
                      </div>
                    </div>
                    <div className="text-sm">{user.teamId || "—"}</div>
                    <div>
                      <Badge variant="outline" className="text-xs">
                        {user.role}
                      </Badge>
                    </div>
                    <div>
                      <Badge
                        variant={
                          user.isActive
                            ? "default"
                            : user.role === "USER"
                              ? "secondary"
                              : "outline"
                        }
                        className="text-xs"
                      >
                        {user.isActive ? "ACTIVE" : "INVITED"}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <Button size="sm" variant="ghost" className="text-xs">
                        …
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </PageContainer>
    </RoleGuard>
  );
}
