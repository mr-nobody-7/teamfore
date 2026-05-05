import { format, isSameMonth, isToday } from "date-fns";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn, formatLeaveType } from "@/lib/utils";
import type { LeaveRequest, PublicHoliday } from "@/types/api";
import type { CapacityHeatmapCell } from "./capacity-heatmap";

const LEAVE_TYPE_COLOR: Record<string, string> = {
  VACATION: "bg-blue-500",
  SICK: "bg-red-500",
  PERSONAL: "bg-purple-500",
  CASUAL: "bg-amber-500",
};

interface CalendarDayProps {
  date: Date;
  currentMonth: Date;
  leaves: LeaveRequest[];
  holidays: PublicHoliday[];
  capacity?: CapacityHeatmapCell | undefined;
  showHeatmap?: boolean;
  isSelected: boolean;
  onClick: (
    date: Date,
    leaves: LeaveRequest[],
    holidays: PublicHoliday[],
  ) => void;
}

export function CalendarDay({
  date,
  currentMonth,
  leaves,
  holidays,
  capacity,
  showHeatmap = false,
  isSelected,
  onClick,
}: CalendarDayProps) {
  const today = isToday(date);
  const inMonth = isSameMonth(date, currentMonth);
  const hasLeaves = leaves.length > 0;
  const hasHolidays = holidays.length > 0;

  // Density fallback for non-heatmap views
  const densityClass =
    leaves.length >= 5
      ? "bg-red-50 dark:bg-red-950/20"
      : leaves.length >= 3
        ? "bg-amber-50 dark:bg-amber-950/20"
        : leaves.length >= 1
          ? "bg-green-50/60 dark:bg-green-950/20"
          : "";

  const heatmapClass =
    showHeatmap && inMonth && capacity
      ? capacity.level === "LOW"
        ? "bg-red-100 dark:bg-red-950/30"
        : capacity.level === "MEDIUM"
          ? "bg-amber-100 dark:bg-amber-950/30"
          : "bg-emerald-100 dark:bg-emerald-950/30"
      : "";

  const countBadgeClass =
    showHeatmap && capacity
      ? capacity.level === "LOW"
        ? "bg-red-600 text-white"
        : capacity.level === "MEDIUM"
          ? "bg-amber-500 text-white"
          : "bg-emerald-600 text-white"
      : leaves.length >= 5
        ? "bg-red-600 text-white"
        : leaves.length >= 3
          ? "bg-amber-500 text-white"
          : "bg-green-600 text-white";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={() => onClick(date, leaves, holidays)}
          className={cn(
            "relative flex min-h-22 w-full flex-col rounded-lg border p-2 text-left transition-all",
            inMonth ? "bg-card" : "bg-muted/20",
            !inMonth && "opacity-50",
            heatmapClass || densityClass,
            "cursor-pointer hover:border-primary/60 hover:shadow-sm",
            today && "border-primary/70 ring-1 ring-primary/25",
            isSelected && "border-primary ring-2 ring-primary/40",
          )}
          aria-label={`${format(date, "MMMM d")}${hasLeaves ? `, ${leaves.length} on leave` : ""}${showHeatmap && capacity ? `, capacity ${capacity.capacityPercent}%` : ""}${hasHolidays ? `, ${holidays.length} holiday event${holidays.length === 1 ? "" : "s"}` : ""}`}
        >
          {/* Day number */}
          <span
            className={cn(
              "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm font-medium",
              today
                ? "bg-primary text-primary-foreground"
                : inMonth
                  ? "text-foreground"
                  : "text-muted-foreground",
            )}
          >
            {date.getDate()}
          </span>

          {/* Leave count badge (density indicator) */}
          {hasLeaves && (
            <span
              className={cn(
                "absolute right-1.5 top-1.5 inline-flex min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold",
                countBadgeClass,
              )}
            >
              {leaves.length}
            </span>
          )}

          {showHeatmap && capacity && (
            <span className="mt-1 text-[10px] font-medium text-muted-foreground">
              Capacity {capacity.capacityPercent}%
            </span>
          )}

          {/* Leave badges */}
          {hasLeaves && (
            <div className="mt-1.5 flex flex-col gap-0.5">
              {leaves.slice(0, 3).map((leave) => (
                <div
                  key={leave.id}
                  className={cn(
                    "truncate rounded px-1.5 py-0.5 text-[10px] font-semibold leading-tight text-white",
                    LEAVE_TYPE_COLOR[leave.type] ?? "bg-gray-500",
                  )}
                >
                  {leave.user.name.split(" ")[0]}
                </div>
              ))}
              {leaves.length > 3 && (
                <span className="text-[10px] font-medium text-muted-foreground">
                  +{leaves.length - 3} more
                </span>
              )}
            </div>
          )}

          {hasHolidays && (
            <div className={cn(hasLeaves ? "mt-1" : "mt-1.5", "space-y-0.5")}>
              {holidays.slice(0, 2).map((holiday) => (
                <div
                  key={holiday.id}
                  className="truncate rounded border border-sky-300 bg-sky-100 px-1.5 py-0.5 text-[10px] font-medium text-sky-700 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-300"
                >
                  🎉 {holiday.name}
                </div>
              ))}
              {holidays.length > 2 && (
                <span className="text-[10px] font-medium text-muted-foreground">
                  +{holidays.length - 2} more holiday events
                </span>
              )}
            </div>
          )}
        </button>
      </TooltipTrigger>

      {(hasLeaves || hasHolidays) && (
        <TooltipContent side="top" className="max-w-56 space-y-1">
          <p className="font-semibold">{format(date, "MMM d")}</p>
          {hasLeaves && (
            <>
              <p>{leaves.length} on leave</p>
              {showHeatmap && capacity && (
                <p>
                  Capacity {capacity.capacityPercent}% ·{" "}
                  {capacity.availableCount}/{capacity.totalCount} available
                </p>
              )}
              <ul className="space-y-0.5">
                {leaves.slice(0, 5).map((leave) => (
                  <li key={leave.id}>
                    {leave.user.name} · {formatLeaveType(leave.type)}
                  </li>
                ))}
                {leaves.length > 5 && <li>+{leaves.length - 5} more</li>}
              </ul>
            </>
          )}
          {hasHolidays && (
            <>
              <p>
                {holidays.length} holiday event
                {holidays.length === 1 ? "" : "s"}
              </p>
              <ul className="space-y-0.5">
                {holidays.slice(0, 4).map((holiday) => (
                  <li key={holiday.id}>
                    {holiday.name} · {holiday.category}
                  </li>
                ))}
                {holidays.length > 4 && <li>+{holidays.length - 4} more</li>}
              </ul>
            </>
          )}
        </TooltipContent>
      )}
    </Tooltip>
  );
}
