import { Header } from "@/components/layout/header";
import { TableSkeleton } from "@/components/layout/page-skeleton";

export default function Loading() {
  return (
    <div>
      <Header
        title="Pedidos Pendentes"
        description="Produtos aguardando reposição de estoque"
      />
      <TableSkeleton />
    </div>
  );
}
