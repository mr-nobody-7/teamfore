import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatSession(session: string): string {
  const labels: Record<string, string> = {
    FULL_DAY: "Full Day",
    FIRST_HALF: "First Half",
    SECOND_HALF: "Second Half",
  };
  return labels[session] ?? session;
}

export function formatLeaveType(type: string): string {
  const labels: Record<string, string> = {
    VACATION: "Earned Leave",
    SICK: "Sick Leave",
    PERSONAL: "Comp Off",
    CASUAL: "Casual Leave",
  };
  return labels[type] ?? type;
}
