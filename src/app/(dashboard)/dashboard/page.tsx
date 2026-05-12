import { Header } from "@/components/layout/header";
import { prisma } from "@/lib/prisma";
import { DashboardCards } from "@/modules/dashboard/dashboard-cards";
import { DashboardCharts } from "@/modules/dashboard/dashboard-charts";
import { DashboardAlerts } from "@/modules/dashboard/dashboard-alerts";
import { serialize } from "@/utils/serialize";
import { startOfDay, startOfWeek, startOfMonth } from "date-fns";

async function getDashboardData() {
  const now = new Date();
  const todayStart = startOfDay(now);
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const monthStart = startOfMonth(now);

  const [
    dailySales,
    weeklySales,
    monthlySales,
    pendingQuotes,
    completedSales,
    pendingOrders,
    recentQuotes,
    topProducts,
    monthlySalesChart,
  ] = await Promise.all([
    prisma.sale.aggregate({
      where: { createdAt: { gte: todayStart } },
      _sum: { total: true },
    }),
    prisma.sale.aggregate({
      where: { createdAt: { gte: weekStart } },
      _sum: { total: true },
    }),
    prisma.sale.aggregate({
      where: { createdAt: { gte: monthStart } },
      _sum: { total: true },
    }),
    prisma.quote.count({
      where: { status: { in: ["DRAFT", "SENT", "AWAITING_PAYMENT"] } },
    }),
    prisma.sale.count({
      where: { createdAt: { gte: monthStart } },
    }),
    prisma.pendingOrder.count({ where: { status: { in: ["WAITING", "PARTIAL"] } } }),
    prisma.quote.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { customer: true },
    }),
    prisma.saleItem.groupBy({
      by: ["productId"],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    }),
    prisma.sale.findMany({
      where: { createdAt: { gte: new Date(now.getFullYear(), now.getMonth() - 5, 1) } },
      select: { total: true, createdAt: true },
    }),
  ]);

  // Fetch low stock with raw query for comparison
  const lowStockRaw = await prisma.$queryRaw<
    { id: string; name: string; stock: number; minimum_stock: number }[]
  >`SELECT id, name, stock, minimum_stock FROM products WHERE active = true AND stock <= minimum_stock ORDER BY stock ASC LIMIT 10`;

  return {
    daily: Number(dailySales._sum.total ?? 0),
    weekly: Number(weeklySales._sum.total ?? 0),
    monthly: Number(monthlySales._sum.total ?? 0),
    pendingQuotes,
    completedSales,
    lowStockCount: lowStockRaw.length,
    lowStockProducts: lowStockRaw,
    pendingOrders,
    recentQuotes,
    topProducts,
    monthlySalesChart,
  };
}

export default async function DashboardPage() {
  const data = serialize(await getDashboardData());

  return (
    <div>
      <Header
        title="Dashboard"
        description="Visão geral da operação comercial"
      />
      <div className="p-6 space-y-6">
        <DashboardCards data={data} />
        <DashboardCharts monthlySalesData={data.monthlySalesChart} />
        <DashboardAlerts
          lowStockProducts={data.lowStockProducts}
          recentQuotes={data.recentQuotes}
        />
      </div>
    </div>
  );
}
