import { Header } from "@/components/layout/header";
import { TableSkeleton } from "@/components/layout/page-skeleton";

export default function Loading() {
  return (
    <div>
      <Header title="Estoque" description="Controle de entrada e saída de produtos" />
      <TableSkeleton />
    </div>
  );
}
