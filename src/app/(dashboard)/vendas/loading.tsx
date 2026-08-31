import { Header } from "@/components/layout/header";
import { TableSkeleton } from "@/components/layout/page-skeleton";

export default function Loading() {
  return (
    <div>
      <Header title="Vendas" description="Histórico de todas as vendas concluídas" />
      <TableSkeleton />
    </div>
  );
}
