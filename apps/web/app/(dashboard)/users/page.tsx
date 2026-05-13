"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit, Trash2 } from "lucide-react";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/auth-context";
import { useTeams } from "@/hooks/use-teams";
import api from "@/lib/axios";
import type {
  ApiResponse,
  ListUsersResponse,
  WorkspaceUser,
} from "@/types/api";

const ROLES = ["USER", "MANAGER", "ADMIN"] as const;

interface NewUserForm {
  name: string;
  email: string;
  password: string;
  role: (typeof ROLES)[number];
  team_id?: string;
}

export default function UsersPage() {
  const editNameInputId = useId();
  const editRoleSelectId = useId();
  const editTeamSelectId = useId();
  const { user: currentUser } = useAuth();
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

  // Edit user dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<WorkspaceUser | null>(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState<(typeof ROLES)[number]>("USER");
  const [editTeamId, setEditTeamId] = useState<string | null>(null);

  // Deactivate confirmation dialog state
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  const [deactivatingUser, setDeactivatingUser] =
    useState<WorkspaceUser | null>(null);

  const updateMutation = useMutation({
    mutationFn: async (data: {
      userId: string;
      name: string;
      role: string;
      teamId: string | null;
    }) => {
      const res = await api.patch(`/users/${data.userId}`, {
        name: data.name,
        role: data.role,
        ...(data.teamId ? { team_id: data.teamId } : {}),
      });
      return res.data.data;
    },
    onSuccess: () => {
      toast.success("User updated");
      setEditDialogOpen(false);
      setEditingUser(null);
      queryClient.invalidateQueries({ queryKey: ["workspace-users"] });
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : "Failed to update user";
      toast.error(message);
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await api.patch(`/users/${userId}/deactivate`);
      return res.data.data;
    },
    onSuccess: () => {
      toast.success("User deactivated");
      setDeactivateDialogOpen(false);
      setDeactivatingUser(null);
      queryClient.invalidateQueries({ queryKey: ["workspace-users"] });
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : "Failed to deactivate user";
      toast.error(message);
    },
  });

  // Edit handlers
  const handleEditOpen = (user: WorkspaceUser) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditRole(user.role as (typeof ROLES)[number]);
    setEditTeamId(user.teamId || null);
    setEditDialogOpen(true);
  };

  const handleEditSubmit = () => {
    if (!editingUser) return;
    if (!editName.trim()) {
      toast.error("Name is required");
      return;
    }

    updateMutation.mutate({
      userId: editingUser.id,
      name: editName.trim(),
      role: editRole,
      teamId: editTeamId,
    });
  };

  // Deactivate handlers
  const handleDeactivateOpen = (user: WorkspaceUser) => {
    setDeactivatingUser(user);
    setDeactivateDialogOpen(true);
  };

  const handleDeactivateConfirm = () => {
    if (!deactivatingUser) return;
    deactivateMutation.mutate(deactivatingUser.id);
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
      <PageContainer className="flex flex-col gap-6 product-reveal">
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
        <Card className="product-card-hover">
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
              <div className="product-field-stack lg:col-span-1">
                <div className="text-xs font-medium text-muted-foreground">
                  Email
                </div>
                <Input
                  aria-label="Invite user email"
                  placeholder="user@company.dev"
                  value={form.email}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                  className="mt-1"
                />
              </div>
              <div className="product-field-stack lg:col-span-1">
                <div className="text-xs font-medium text-muted-foreground">
                  Name
                </div>
                <Input
                  aria-label="Invite user name"
                  placeholder="Optional"
                  value={form.name}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="mt-1"
                />
              </div>
              <div className="product-field-stack lg:col-span-1">
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
                  <SelectTrigger aria-label="Select role" className="mt-1">
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
              <div className="product-field-stack lg:col-span-1">
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
                  <SelectTrigger aria-label="Select team" className="mt-1">
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
                className="product-press w-full lg:w-auto"
                onClick={() => createMutation.mutate()}
                disabled={createMutation.isPending || !form.email}
              >
                Send invites
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card className="product-card-hover overflow-hidden">
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
                <div className="hidden grid-cols-5 gap-4 border-b px-4 py-3 font-mono text-xs uppercase tracking-widest text-muted-foreground sm:grid">
                  <div className="col-span-2">Name</div>
                  <div>Team</div>
                  <div>Role</div>
                  <div>Status</div>
                </div>
                {data?.users.map((user) => (
                  <div
                    key={user.id}
                    className={`product-interactive grid gap-3 border-b px-4 py-4 hover:bg-muted/30 sm:grid-cols-5 sm:items-center sm:gap-4 sm:py-3 ${!user.isActive ? "opacity-60" : ""}`}
                  >
                    <div className="sm:col-span-2">
                      <div className="product-mobile-label">Name</div>
                      <div className="text-sm font-medium">{user.name}</div>
                      <div className="text-xs text-muted-foreground font-mono">
                        {user.email}
                      </div>
                    </div>
                    <div className="text-sm">
                      <div className="product-mobile-label">Team</div>
                      {user.teamId || "—"}
                    </div>
                    <div>
                      <div className="product-mobile-label">Role</div>
                      <Badge variant="outline" className="text-xs">
                        {user.role}
                      </Badge>
                    </div>
                    <div>
                      <div className="product-mobile-label">Status</div>
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
                        {user.isActive ? "ACTIVE" : "INACTIVE"}
                      </Badge>
                    </div>
                    <div className="pt-1 sm:pt-0 sm:text-right">
                      {currentUser?.id !== user.id &&
                        currentUser?.role === "ADMIN" && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                aria-label={`Open actions for ${user.name}`}
                                size="sm"
                                variant="ghost"
                                className="product-press w-full justify-center text-xs sm:w-auto"
                              >
                                …
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleEditOpen(user)}
                                className="cursor-pointer"
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit user
                              </DropdownMenuItem>
                              {user.isActive && (
                                <DropdownMenuItem
                                  onClick={() => handleDeactivateOpen(user)}
                                  className="cursor-pointer text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Deactivate
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit User Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>
                Update user information and role assignments
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor={editNameInputId}
                  className="text-sm font-medium"
                >
                  Name
                </label>
                <Input
                  id={editNameInputId}
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="User name"
                  className="mt-1"
                  disabled={updateMutation.isPending}
                />
              </div>
              <div>
                <label
                  htmlFor={editRoleSelectId}
                  className="text-sm font-medium"
                >
                  Role
                </label>
                <Select
                  value={editRole}
                  onValueChange={(value) =>
                    setEditRole(value as (typeof ROLES)[number])
                  }
                  disabled={updateMutation.isPending}
                >
                  <SelectTrigger id={editRoleSelectId} className="mt-1">
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
              <div>
                <label
                  htmlFor={editTeamSelectId}
                  className="text-sm font-medium"
                >
                  Team
                </label>
                <Select
                  value={editTeamId ?? "none"}
                  onValueChange={(value) =>
                    setEditTeamId(value === "none" ? null : value)
                  }
                  disabled={updateMutation.isPending}
                >
                  <SelectTrigger id={editTeamSelectId} className="mt-1">
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
              {updateMutation.error && (
                <p className="text-sm text-destructive">
                  {updateMutation.error instanceof Error
                    ? updateMutation.error.message
                    : "An error occurred"}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
                disabled={updateMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleEditSubmit}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Deactivate Confirmation Dialog */}
        <Dialog
          open={deactivateDialogOpen}
          onOpenChange={setDeactivateDialogOpen}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Deactivate {deactivatingUser?.name}?</DialogTitle>
              <DialogDescription>
                They will lose access immediately. This can be reversed by an
                admin.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeactivateDialogOpen(false)}
                disabled={deactivateMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeactivateConfirm}
                disabled={deactivateMutation.isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deactivateMutation.isPending
                  ? "Deactivating..."
                  : "Deactivate"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageContainer>
    </RoleGuard>
  );
}
