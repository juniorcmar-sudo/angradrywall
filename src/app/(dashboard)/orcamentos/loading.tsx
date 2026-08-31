import { Header } from "@/components/layout/header";
import { TableSkeleton } from "@/components/layout/page-skeleton";

export default function Loading() {
  return (
    <div>
      <Header title="Orçamentos" description="Gerencie todos os orçamentos" />
      <TableSkeleton />
    </div>
  );
}
