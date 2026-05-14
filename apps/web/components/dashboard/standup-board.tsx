import { format, parseISO } from "date-fns";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { AvailabilityBoardResponse } from "@/types/api";

interface StandupBoardProps {
  date: string;
  board: AvailabilityBoardResponse | undefined;
  isLoading: boolean;
  scopeLabel?: string;
}

function MemberList({
  names,
  emptyLabel,
}: {
  names: string[];
  emptyLabel: string;
}) {
  if (names.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
  }

  return (
    <ul className="space-y-1.5">
      {names.map((name) => (
        <li key={name} className="text-sm font-medium">
          {name}
        </li>
      ))}
    </ul>
  );
}

export function StandupBoard({
  date,
  board,
  isLoading,
  scopeLabel,
}: StandupBoardProps) {
  const availableMembers =
    board?.members
      .filter((member) => member.status === "AVAILABLE")
      .map((member) => member.name) ?? [];

  const offMembers =
    board?.members
      .filter((member) => member.status === "ON_LEAVE")
      .map((member) => member.name) ?? [];

  const remoteMembers =
    board?.members
      .filter((member) => member.status === "WORKING_REMOTELY")
      .map((member) => member.name) ?? [];

  return (
    <Card className="border-border/70 bg-card/75">
      <CardHeader>
        <CardTitle className="font-display text-3xl leading-none tracking-tight">
          Team Standup Board
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          {scopeLabel ?? "Team"} ·{" "}
          {format(parseISO(`${date}T00:00:00Z`), "EEE, MMM d")}
        </p>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="grid gap-3 md:grid-cols-3">
            {Array.from({ length: 3 }, (_, idx) => (
              <div key={`standup-skeleton-${idx + 1}`} className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-36" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5">
              <h3 className="mb-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                Who&apos;s available today ({availableMembers.length})
              </h3>
              <MemberList
                names={availableMembers}
                emptyLabel="No one marked as available"
              />
            </div>

            <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3.5">
              <h3 className="mb-2 text-sm font-semibold text-rose-700 dark:text-rose-300">
                Who&apos;s off today ({offMembers.length})
              </h3>
              <MemberList names={offMembers} emptyLabel="No one off today" />
            </div>

            <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3.5">
              <h3 className="mb-2 text-sm font-semibold text-blue-700 dark:text-blue-300">
                Who&apos;s remote ({remoteMembers.length})
              </h3>
              <MemberList
                names={remoteMembers}
                emptyLabel="No one marked remote"
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
