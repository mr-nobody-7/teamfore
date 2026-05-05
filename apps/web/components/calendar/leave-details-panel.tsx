"use client";

import { format } from "date-fns";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { cn, formatLeaveType } from "@/lib/utils";
import type { LeaveRequest, PublicHoliday } from "@/types/api";

interface LeaveDetailsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDay: {
    date: Date;
    leaves: LeaveRequest[];
    holidays: PublicHoliday[];
  } | null;
}

const LEAVE_TYPE_COLOR: Record<string, string> = {
  VACATION: "bg-blue-500",
  SICK: "bg-red-500",
  PERSONAL: "bg-purple-500",
  CASUAL: "bg-amber-500",
};

const SESSION_LABEL: Record<string, string> = {
  FULL_DAY: "Full day",
  FIRST_HALF: "Morning",
  SECOND_HALF: "Afternoon",
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function LeaveCard({ leave, day }: { leave: LeaveRequest; day: Date }) {
  const key = format(day, "yyyy-MM-dd");
  const isStart = leave.startDate === key;
  const isEnd = leave.endDate === key;
  const sessionLabel =
    isStart && isEnd
      ? SESSION_LABEL[leave.startSession] === SESSION_LABEL[leave.endSession]
        ? SESSION_LABEL[leave.startSession]
        : `${SESSION_LABEL[leave.startSession]} – ${SESSION_LABEL[leave.endSession]}`
      : isStart
        ? `From ${SESSION_LABEL[leave.startSession]}`
        : isEnd
          ? `Until ${SESSION_LABEL[leave.endSession]}`
          : "Full day";

  return (
    <div className="flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-muted/50">
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback
          className={cn(
            "text-xs font-semibold text-white",
            LEAVE_TYPE_COLOR[leave.type] ?? "bg-gray-500",
          )}
        >
          {getInitials(leave.user.name)}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-medium">{leave.user.name}</p>
          <Badge variant="outline" className="shrink-0 text-[10px]">
            {formatLeaveType(leave.type)}
          </Badge>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">{sessionLabel}</p>
        {leave.reason && (
          <p className="mt-1 line-clamp-2 text-xs italic text-muted-foreground">
            &ldquo;{leave.reason}&rdquo;
          </p>
        )}
      </div>
    </div>
  );
}

const HOLIDAY_CATEGORY_LABEL: Record<
  "COMPANY" | "NATIONAL" | "REGIONAL",
  string
> = {
  COMPANY: "Company",
  NATIONAL: "National",
  REGIONAL: "Regional",
};

export function LeaveDetailsPanel({
  open,
  onOpenChange,
  selectedDay,
}: LeaveDetailsPanelProps) {
  const leaveCount = selectedDay?.leaves.length ?? 0;
  const holidayCount = selectedDay?.holidays.length ?? 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[80vh] flex-col gap-0 p-0 sm:max-w-md">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle>
            {selectedDay ? format(selectedDay.date, "EEEE, MMMM d") : ""}
          </DialogTitle>
          <DialogDescription>
            {selectedDay
              ? `${leaveCount} ${leaveCount === 1 ? "person" : "people"} on leave · ${holidayCount} holiday event${holidayCount === 1 ? "" : "s"}`
              : ""}
          </DialogDescription>
        </DialogHeader>

        <Separator />

        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {selectedDay && (
            <>
              {selectedDay.holidays.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Holidays
                  </p>
                  <div className="space-y-2">
                    {selectedDay.holidays.map((holiday) => (
                      <div
                        key={holiday.id}
                        className="rounded-lg border border-sky-300/70 bg-sky-50 px-3 py-2 dark:border-sky-900 dark:bg-sky-950/40"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium text-sky-800 dark:text-sky-300">
                            {holiday.name}
                          </p>
                          <Badge variant="outline" className="text-[10px]">
                            {HOLIDAY_CATEGORY_LABEL[holiday.category]}
                          </Badge>
                        </div>
                        {holiday.region && (
                          <p className="mt-1 text-xs text-sky-700/90 dark:text-sky-400">
                            Region: {holiday.region}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedDay.leaves.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Leaves
                  </p>
                  <div className="divide-y rounded-lg border">
                    {selectedDay.leaves.map((leave) => (
                      <LeaveCard
                        key={leave.id}
                        leave={leave}
                        day={selectedDay.date}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
