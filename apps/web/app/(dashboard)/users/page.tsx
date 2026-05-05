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

  const updateMutation = useMutation({
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
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Users</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Invite, assign role/team, and manage user activation.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Add User</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
            <Input
              placeholder="Name"
              value={form.name}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, name: e.target.value }))
              }
            />
            <Input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, email: e.target.value }))
              }
            />
            <Input
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, password: e.target.value }))
              }
            />
            <Select
              value={form.role}
              onValueChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  role: value as NewUserForm["role"],
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={form.team_id ?? "none"}
              onValueChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  team_id: value === "none" ? undefined : value,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Team" />
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

            <div className="md:col-span-2 lg:col-span-5">
              <Button
                onClick={() => createMutation.mutate()}
                disabled={
                  createMutation.isPending ||
                  !form.name ||
                  !form.email ||
                  !form.password
                }
              >
                Create User
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User List</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading users...</p>
            ) : !(data?.users.length ?? 0) ? (
              <p className="text-sm text-muted-foreground">No users yet.</p>
            ) : (
              <div className="space-y-2">
                {data?.users.map((user) => (
                  <div
                    key={user.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
                  >
                    <div>
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {user.email}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={user.isActive ? "default" : "outline"}>
                        {user.isActive ? "ACTIVE" : "INACTIVE"}
                      </Badge>

                      <Select
                        value={user.role}
                        onValueChange={(value) =>
                          updateMutation.mutate({
                            userId: user.id,
                            role: value,
                            teamId: user.teamId,
                            isActive: user.isActive,
                          })
                        }
                      >
                        <SelectTrigger className="w-28">
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

                      <Select
                        value={user.teamId ?? "none"}
                        onValueChange={(value) =>
                          updateMutation.mutate({
                            userId: user.id,
                            role: user.role,
                            teamId: value === "none" ? null : value,
                            isActive: user.isActive,
                          })
                        }
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Team" />
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

                      <Button
                        size="sm"
                        variant={user.isActive ? "destructive" : "outline"}
                        onClick={() =>
                          updateMutation.mutate({
                            userId: user.id,
                            role: user.role,
                            teamId: user.teamId,
                            isActive: !user.isActive,
                          })
                        }
                      >
                        {user.isActive ? "Deactivate" : "Activate"}
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
