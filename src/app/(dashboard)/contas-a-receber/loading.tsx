import { Header } from "@/components/layout/header";
import { TableSkeleton } from "@/components/layout/page-skeleton";

export default function Loading() {
  return (
    <div>
      <Header
        title="Contas a Receber"
        description="Orçamentos com estoque já baixado e pagamento pendente"
      />
      <TableSkeleton />
    </div>
  );
}
