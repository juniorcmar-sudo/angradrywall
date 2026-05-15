import { Header } from "@/components/layout/header";
import { prisma } from "@/lib/prisma";
import { ReportsView } from "@/modules/reports/reports-view";
import { serialize } from "@/utils/serialize";
import { startOfMonth, startOfYear } from "date-fns";

async function getReportsData() {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const yearStart = startOfYear(now);

  const [
    monthlySales,
    yearlySales,
    topProducts,
    topCustomers,
    quoteConversion,
  ] = await Promise.all([
    prisma.sale.aggregate({
      where: { createdAt: { gte: monthStart } },
      _sum: { total: true },
      _count: true,
    }),
    prisma.sale.aggregate({
      where: { createdAt: { gte: yearStart } },
      _sum: { total: true },
      _count: true,
    }),
    prisma.saleItem.groupBy({
      by: ["productId"],
      _sum: { quantity: true, total: true },
      orderBy: { _sum: { total: "desc" } },
      take: 10,
    }),
    prisma.sale.groupBy({
      by: ["customerId"],
      _sum: { total: true },
      _count: true,
      orderBy: { _sum: { total: "desc" } },
      take: 10,
    }),
    Promise.all([
      prisma.quote.count(),
      prisma.quote.count({ where: { status: "PAID" } }),
    ]),
  ]);

  const productIds = topProducts.map((p: { productId: string }) => p.productId);
  const customerIds = topCustomers.map((c: { customerId: string }) => c.customerId);

  const [products, customers] = await Promise.all([
    prisma.product.findMany({ where: { id: { in: productIds } } }),
    prisma.customer.findMany({ where: { id: { in: customerIds } } }),
  ]);

  return {
    monthlySales: {
      total: Number(monthlySales._sum.total ?? 0),
      count: monthlySales._count,
    },
    yearlySales: {
      total: Number(yearlySales._sum.total ?? 0),
      count: yearlySales._count,
    },
    topProducts: topProducts.map((p: { productId: string; _sum: { total?: unknown; quantity?: unknown } }) => ({
      ...p,
      product: products.find((pr) => pr.id === p.productId),
      totalRevenue: Number(p._sum.total ?? 0),
      totalQty: Number(p._sum.quantity ?? 0),
    })),
    topCustomers: topCustomers.map((c: { customerId: string; _sum: { total?: unknown }; _count: number }) => ({
      ...c,
      customer: customers.find((cu) => cu.id === c.customerId),
      totalSpent: Number(c._sum.total ?? 0),
    })),
    quoteConversion: {
      total: quoteConversion[0],
      paid: quoteConversion[1],
      rate:
        quoteConversion[0] > 0
          ? Math.round((quoteConversion[1] / quoteConversion[0]) * 100)
          : 0,
    },
  };
}

export default async function RelatoriosPage() {
  const data = serialize(await getReportsData());

  return (
    <div>
      <Header title="Relatórios" description="Análises e métricas de desempenho" />
      <div className="p-3 md:p-6">
        <ReportsView data={data} />
      </div>
    </div>
  );
}
