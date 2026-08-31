import { Header } from "@/components/layout/header";
import { TableSkeleton } from "@/components/layout/page-skeleton";

export default function Loading() {
  return (
    <div>
      <Header title="Clientes" description="Gerencie seus clientes" />
      <TableSkeleton />
    </div>
  );
}
