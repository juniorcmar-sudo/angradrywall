import { Header } from "@/components/layout/header";
import { DashboardSkeleton } from "@/components/layout/page-skeleton";

export default function Loading() {
  return (
    <div>
      <Header title="Dashboard" description="Visão geral da operação comercial" />
      <DashboardSkeleton />
    </div>
  );
}
