import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard · TeamFore",
};

export default function DashboardSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
