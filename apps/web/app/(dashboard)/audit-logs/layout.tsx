import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Audit Logs · TeamFore",
};

export default function AuditLogsSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
