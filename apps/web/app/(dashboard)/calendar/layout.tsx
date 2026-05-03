import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Team Calendar · TeamFore",
};

export default function CalendarSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
