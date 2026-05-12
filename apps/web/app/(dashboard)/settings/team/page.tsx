"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useId, useMemo, useState } from "react";
import { toast } from "sonner";

import { PageContainer } from "@/components/layout/page-container";
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
import { useAuth } from "@/hooks/use-auth";
import api from "@/lib/axios";
import type { ApiResponse } from "@/types/api";

type CountryOption = {
  code: string;
  name: string;
};

function flagEmoji(countryCode: string): string {
  return countryCode
    .toUpperCase()
    .split("")
    .map((char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join("");
}

export default function TeamSettingsPage() {
  const { user, refetch } = useAuth();
  const countryInputId = useId();
  const timezoneInputId = useId();
  const [country, setCountry] = useState<string>("");
  const [timezone, setTimezone] = useState<string>("Asia/Kolkata");

  const { data: countriesData, isLoading: isCountriesLoading } = useQuery({
    queryKey: ["settings-countries"],
    queryFn: async () => {
      const response = await api.get<
        ApiResponse<{ countries: CountryOption[] }>
      >("/settings/countries");
      return response.data.data.countries;
    },
  });

  useEffect(() => {
    if (!user?.workspace) {
      return;
    }

    setCountry(user.workspace.country ?? "");
    setTimezone(user.workspace.timezone || "Asia/Kolkata");
  }, [user?.workspace]);

  const isDirty = useMemo(() => {
    if (!user?.workspace) {
      return false;
    }

    const initialCountry = user.workspace.country ?? "";
    const initialTimezone = user.workspace.timezone || "Asia/Kolkata";

    return country !== initialCountry || timezone !== initialTimezone;
  }, [country, timezone, user?.workspace]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      await api.post("/settings/workspace", {
        country,
        timezone,
      });
    },
    onSuccess: async () => {
      toast.success("Settings saved. Public holidays synced.");
      refetch();
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(
        error.response?.data?.message ?? "Could not save regional settings",
      );
    },
  });

  return (
    <PageContainer className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Team Setup</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Add members and organize teams to unlock planning views.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invite your team</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild size="sm">
            <Link href="/users">Invite members</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/teams">Manage teams</Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Regional Settings</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label
              htmlFor={countryInputId}
              className="text-sm font-medium text-foreground"
            >
              Country
            </label>
            <Select
              value={country || "none"}
              onValueChange={(value) =>
                setCountry(value === "none" ? "" : value)
              }
              disabled={isCountriesLoading}
            >
              <SelectTrigger id={countryInputId}>
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Not set</SelectItem>
                {(countriesData ?? []).map((item) => (
                  <SelectItem key={item.code} value={item.code}>
                    {flagEmoji(item.code)} {item.name} ({item.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label
              htmlFor={timezoneInputId}
              className="text-sm font-medium text-foreground"
            >
              Timezone
            </label>
            <Input
              id={timezoneInputId}
              value={timezone}
              onChange={(event) => setTimezone(event.target.value)}
              placeholder="Asia/Kolkata"
            />
          </div>

          <div className="md:col-span-2">
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || !timezone.trim() || !isDirty}
            >
              {saveMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
