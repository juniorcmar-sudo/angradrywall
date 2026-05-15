import { Header } from "@/components/layout/header";
import { prisma } from "@/lib/prisma";
import { SalesTable } from "@/modules/sales/sales-table";
import { serialize } from "@/utils/serialize";

async function getSales() {
  return prisma.sale.findMany({
    include: {
      customer: true,
      quote: true,
      items: { include: { product: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export default async function VendasPage() {
  const sales = serialize(await getSales());

  return (
    <div>
      <Header title="Vendas" description="Histórico de todas as vendas concluídas" />
      <div className="p-3 md:p-6">
        <SalesTable sales={sales} />
      </div>
    </div>
  );
}
