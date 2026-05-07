"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useId } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  connectSlack,
  disconnectSlack,
  getSlackStatus,
  updateSlackSettings,
} from "@/services/slack.service";

export function SlackConnectCard() {
  const queryClient = useQueryClient();
  const notifyLeaveId = useId();
  const digestEnabledId = useId();
  const digestTimeId = useId();
  const digestChannelId = useId();

  const { data, isLoading } = useQuery({
    queryKey: ["slack-status"],
    queryFn: getSlackStatus,
  });

  const disconnectMutation = useMutation({
    mutationFn: disconnectSlack,
    onSuccess: async () => {
      toast.success("Slack disconnected");
      await queryClient.invalidateQueries({ queryKey: ["slack-status"] });
    },
    onError: () => toast.error("Could not disconnect Slack"),
  });

  const settingsMutation = useMutation({
    mutationFn: updateSlackSettings,
    onSuccess: async () => {
      toast.success("Slack settings saved");
      await queryClient.invalidateQueries({ queryKey: ["slack-status"] });
    },
    onError: () => toast.error("Could not save Slack settings"),
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Slack Integration</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Loading Slack status...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Slack Integration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!data?.connected ? (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Connect your workspace to Slack to enable notifications and slash
              commands.
            </p>
            <Button onClick={() => connectSlack()}>Connect Slack</Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm">
              Connected to <strong>{data.teamName ?? "Slack workspace"}</strong>
            </p>

            <div className="flex items-center justify-between rounded-md border p-3">
              <Label htmlFor={notifyLeaveId}>Leave notifications</Label>
              <Switch
                id={notifyLeaveId}
                checked={Boolean(data.notifyLeave)}
                onCheckedChange={(checked) =>
                  settingsMutation.mutate({
                    slackNotifyLeave: checked,
                    slackDigestEnabled: Boolean(data.digestEnabled),
                    slackDigestTime: data.digestTime,
                    slackDigestChannel: data.digestChannel,
                  })
                }
              />
            </div>

            <div className="space-y-2 rounded-md border p-3">
              <div className="flex items-center justify-between">
                <Label htmlFor={digestEnabledId}>Daily digest</Label>
                <Switch
                  id={digestEnabledId}
                  checked={Boolean(data.digestEnabled)}
                  onCheckedChange={(checked) =>
                    settingsMutation.mutate({
                      slackNotifyLeave: Boolean(data.notifyLeave),
                      slackDigestEnabled: checked,
                      slackDigestTime: data.digestTime,
                      slackDigestChannel: data.digestChannel,
                    })
                  }
                />
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor={digestTimeId}>Digest time (UTC)</Label>
                  <Input
                    id={digestTimeId}
                    placeholder="09:00"
                    defaultValue={data.digestTime ?? ""}
                    onBlur={(event) =>
                      settingsMutation.mutate({
                        slackNotifyLeave: Boolean(data.notifyLeave),
                        slackDigestEnabled: Boolean(data.digestEnabled),
                        slackDigestTime: event.target.value,
                        slackDigestChannel: data.digestChannel,
                      })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor={digestChannelId}>Digest channel ID</Label>
                  <Input
                    id={digestChannelId}
                    placeholder="C0123456789"
                    defaultValue={data.digestChannel ?? ""}
                    onBlur={(event) =>
                      settingsMutation.mutate({
                        slackNotifyLeave: Boolean(data.notifyLeave),
                        slackDigestEnabled: Boolean(data.digestEnabled),
                        slackDigestTime: data.digestTime,
                        slackDigestChannel: event.target.value,
                      })
                    }
                  />
                </div>
              </div>
            </div>

            <Button
              variant="destructive"
              onClick={() => disconnectMutation.mutate()}
              disabled={disconnectMutation.isPending}
            >
              Disconnect Slack
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
