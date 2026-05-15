import { Header } from "@/components/layout/header";
import { prisma } from "@/lib/prisma";
import { PendingOrdersTable } from "@/modules/pending-orders/pending-orders-table";
import { serialize } from "@/utils/serialize";

async function getPendingOrders() {
  return prisma.pendingOrder.findMany({
    where: { status: { in: ["WAITING", "PARTIAL"] } },
    include: { customer: true, product: true },
    orderBy: { createdAt: "asc" },
  });
}

export default async function PedidosPendentesPage() {
  const orders = serialize(await getPendingOrders());

  return (
    <div>
      <Header
        title="Pedidos Pendentes"
        description="Produtos aguardando reposição de estoque"
      />
      <div className="p-3 md:p-6">
        <PendingOrdersTable orders={orders} />
      </div>
    </div>
  );
}
