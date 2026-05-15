import { LayoutShell } from "@/components/layout/layout-shell";

export const dynamic = "force-dynamic";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <LayoutShell>{children}</LayoutShell>;
}
