import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings · TeamFore",
};

export default function SettingsSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
