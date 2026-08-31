import { Header } from "@/components/layout/header";
import { TableSkeleton } from "@/components/layout/page-skeleton";

export default function Loading() {
  return (
    <div>
      <Header title="Produtos" description="Gerencie seu catálogo de produtos" />
      <TableSkeleton />
    </div>
  );
}
