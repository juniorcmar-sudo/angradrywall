import { Header } from "@/components/layout/header";
import { DashboardSkeleton } from "@/components/layout/page-skeleton";

export default function Loading() {
  return (
    <div>
      <Header title="Relatórios" description="Análises e métricas de desempenho" />
      <DashboardSkeleton />
    </div>
  );
}
