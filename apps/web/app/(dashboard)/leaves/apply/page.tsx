"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import api from "@/lib/axios";
import { posthog } from "@/lib/posthog";
import { formatLeaveType, formatSession } from "@/lib/utils";
import type {
  ApiResponse,
  ApplyLeavePayload,
  LeaveTypeSettingsResponse,
  Session,
} from "@/types/api";

const applyLeaveSchema = z.object({
  start_date: z.string().min(1, "Start date is required"),
  start_session: z.enum(["FULL_DAY", "FIRST_HALF", "SECOND_HALF"]),
  end_date: z.string().min(1, "End date is required"),
  end_session: z.enum(["FULL_DAY", "FIRST_HALF", "SECOND_HALF"]),
  type: z.enum(["VACATION", "SICK", "PERSONAL", "CASUAL"]),
  reason: z.string().min(1, "Reason is required").max(500),
});

type ApplyLeaveForm = z.infer<typeof applyLeaveSchema>;

const SESSIONS: Session[] = ["FULL_DAY", "FIRST_HALF", "SECOND_HALF"];

export default function ApplyLeavePage() {
  const queryClient = useQueryClient();

  const { data: leaveTypeSettings, isLoading: isLeaveTypesLoading } = useQuery({
    queryKey: ["leave-type-settings"],
    queryFn: async () => {
      const response = await api.get<ApiResponse<LeaveTypeSettingsResponse>>(
        "/settings/leave-types",
      );
      return response.data.data;
    },
  });

  const enabledTypes = leaveTypeSettings?.enabledTypes ?? [];

  const form = useForm<ApplyLeaveForm>({
    resolver: zodResolver(applyLeaveSchema),
    defaultValues: {
      start_date: "",
      start_session: "FULL_DAY",
      end_date: "",
      end_session: "FULL_DAY",
      type: "VACATION",
      reason: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (payload: ApplyLeavePayload) => {
      const { data } = await api.post("/leave/applyLeave", payload);
      return data;
    },
    onSuccess: async (response: {
      data?: { warning?: boolean; warningMessage?: string | null };
    }) => {
      posthog.capture("leave_requested");
      if (response?.data?.warning) {
        toast.warning(
          response.data.warningMessage ??
            "Leave submitted with conflict warning",
        );
      } else {
        toast.success("Leave request submitted");
      }

      form.reset();
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["leaves"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] }),
        queryClient.invalidateQueries({ queryKey: ["calendar-leaves"] }),
      ]);
    },
    onError: () => {
      toast.error("Could not submit leave request");
    },
  });

  useEffect(() => {
    if (enabledTypes.length === 0) {
      return;
    }

    const current = form.getValues("type");
    if (!enabledTypes.includes(current)) {
      form.setValue("type", enabledTypes[0] ?? "VACATION", {
        shouldValidate: true,
      });
    }
  }, [enabledTypes, form]);

  return (
    <PageContainer className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Apply Leave</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Submit leave request with date range and type.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New Request</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              className="grid gap-4 md:grid-cols-2"
              onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
            >
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="start_session"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start session</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {SESSIONS.map((session) => (
                          <SelectItem key={session} value={session}>
                            {formatSession(session)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="end_session"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End session</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {SESSIONS.map((session) => (
                          <SelectItem key={session} value={session}>
                            {formatSession(session)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Leave type</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger disabled={isLeaveTypesLoading}>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {enabledTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {formatLeaveType(type)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Reason</FormLabel>
                    <FormControl>
                      <Input placeholder="Reason for leave" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="md:col-span-2">
                <Button
                  type="submit"
                  disabled={
                    mutation.isPending ||
                    isLeaveTypesLoading ||
                    enabledTypes.length === 0
                  }
                >
                  {mutation.isPending ? "Submitting..." : "Submit request"}
                </Button>
                {enabledTypes.length === 0 && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    No leave types are currently enabled. Please contact your
                    workspace admin.
                  </p>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
