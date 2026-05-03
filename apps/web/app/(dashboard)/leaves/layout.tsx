import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Leaves · TeamFore",
};

export default function LeavesSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
