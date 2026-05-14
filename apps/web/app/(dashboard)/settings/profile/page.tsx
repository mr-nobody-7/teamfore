"use client";

import { useMutation } from "@tanstack/react-query";
import { useEffect, useId, useState } from "react";
import { toast } from "sonner";

import { PageContainer } from "@/components/layout/page-container";
import { NotificationSettings } from "@/components/pwa/notification-settings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/auth-context";
import api from "@/lib/axios";

export default function ProfileSettingsPage() {
  const displayNameId = useId();
  const emailId = useId();
  const currentPasswordId = useId();
  const newPasswordId = useId();
  const confirmPasswordId = useId();

  const { user, refetch } = useAuth();
  const [name, setName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    setName(user?.name ?? "");
  }, [user?.name]);

  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      await api.put("/users/me", { name: name.trim() });
    },
    onSuccess: async () => {
      toast.success("Profile updated");
      refetch();
    },
    onError: () => {
      toast.error("Could not update profile");
    },
  });

  const updatePasswordMutation = useMutation({
    mutationFn: async () => {
      await api.put("/users/me/password", {
        currentPassword,
        newPassword,
      });
    },
    onSuccess: () => {
      toast.success("Password updated");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: () => {
      toast.error("Could not update password");
    },
  });

  const saveProfile = () => {
    if (!name.trim()) {
      toast.error("Display name is required");
      return;
    }

    updateProfileMutation.mutate();
  };

  const changePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("All password fields are required");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters long");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New password and confirm password must match");
      return;
    }

    updatePasswordMutation.mutate();
  };

  return (
    <PageContainer className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Update your display name and password.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Personal Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor={displayNameId} className="text-sm font-medium">
              Display name
            </label>
            <Input
              id={displayNameId}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Your display name"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor={emailId} className="text-sm font-medium">
              Email
            </label>
            <Input id={emailId} value={user?.email ?? ""} readOnly />
          </div>

          <Button
            type="button"
            className="w-full sm:w-auto"
            onClick={saveProfile}
            disabled={updateProfileMutation.isPending}
          >
            {updateProfileMutation.isPending ? "Saving..." : "Save"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor={currentPasswordId} className="text-sm font-medium">
              Current password
            </label>
            <Input
              id={currentPasswordId}
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              placeholder="Current password"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor={newPasswordId} className="text-sm font-medium">
              New password
            </label>
            <Input
              id={newPasswordId}
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder="New password"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor={confirmPasswordId} className="text-sm font-medium">
              Confirm new password
            </label>
            <Input
              id={confirmPasswordId}
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Confirm new password"
            />
          </div>

          <Button
            type="button"
            className="w-full sm:w-auto"
            onClick={changePassword}
            disabled={updatePasswordMutation.isPending}
          >
            {updatePasswordMutation.isPending ? "Updating..." : "Save"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <NotificationSettings />
        </CardContent>
      </Card>
    </PageContainer>
  );
}
