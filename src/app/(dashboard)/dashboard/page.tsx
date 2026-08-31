import { Header } from "@/components/layout/header";
import { prisma } from "@/lib/prisma";
import { DashboardCards } from "@/modules/dashboard/dashboard-cards";
import { DashboardCharts } from "@/modules/dashboard/dashboard-charts";
import { DashboardAlerts } from "@/modules/dashboard/dashboard-alerts";
import { serialize } from "@/utils/serialize";
import { startOfDay, startOfWeek, startOfMonth, subMonths, endOfMonth } from "date-fns";

async function getDashboardData() {
  const now = new Date();
  const todayStart = startOfDay(now);
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const monthStart = startOfMonth(now);
  const prevMonthStart = startOfMonth(subMonths(now, 1));
  const prevMonthEnd = endOfMonth(subMonths(now, 1));

  const [
    dailySales,
    weeklySales,
    monthlySales,
    prevMonthSales,
    pendingQuotes,
    completedSales,
    pendingOrders,
    recentQuotes,
    topProducts,
    monthlySalesChart,
    receivableAgg,
    expiredQuotes,
    settings,
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
    prisma.sale.aggregate({
      where: { createdAt: { gte: prevMonthStart, lte: prevMonthEnd } },
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
      select: { total: true, createdAt: true, paymentMethod: true },
    }),
    prisma.quote.aggregate({
      where: { stockReleasedAt: { not: null }, status: { notIn: ["PAID", "CANCELLED"] } },
      _sum: { finalTotal: true },
      _count: true,
    }),
    prisma.quote.findMany({
      where: { status: "SENT", validUntil: { lt: now } },
      orderBy: { validUntil: "asc" },
      take: 10,
      select: { id: true, number: true, validUntil: true, customer: { select: { name: true } } },
    }) as Promise<
      { id: string; number: number; validUntil: Date; customer: { name: string } }[]
    >,
    prisma.settings.findFirst(),
  ]);

  // Fetch low stock with raw query for comparison
  const lowStockRaw = await prisma.$queryRaw<
    { id: string; name: string; stock: number; minimum_stock: number }[]
  >`SELECT id, name, stock, minimum_stock FROM products WHERE active = true AND stock <= minimum_stock ORDER BY stock ASC LIMIT 10`;

  const monthlyTotal = Number(monthlySales._sum.total ?? 0);
  const prevMonthTotal = Number(prevMonthSales._sum.total ?? 0);
  const monthlyGrowthPercent =
    prevMonthTotal > 0
      ? Math.round(((monthlyTotal - prevMonthTotal) / prevMonthTotal) * 100)
      : null;
  const averageTicket = completedSales > 0 ? monthlyTotal / completedSales : 0;
  const monthlyGoal = settings?.monthlyGoal ? Number(settings.monthlyGoal.toString()) : null;

  return {
    daily: Number(dailySales._sum.total ?? 0),
    weekly: Number(weeklySales._sum.total ?? 0),
    monthly: monthlyTotal,
    monthlyGrowthPercent,
    averageTicket,
    monthlyGoal,
    pendingQuotes,
    completedSales,
    lowStockCount: lowStockRaw.length,
    lowStockProducts: lowStockRaw,
    pendingOrders,
    recentQuotes,
    topProducts,
    monthlySalesChart,
    receivableTotal: Number(receivableAgg._sum.finalTotal ?? 0),
    receivableCount: receivableAgg._count,
    expiredQuotes,
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
      <div className="p-3 md:p-6 space-y-6">
        <DashboardCards data={data} />
        <DashboardCharts monthlySalesData={data.monthlySalesChart} />
        <DashboardAlerts
          lowStockProducts={data.lowStockProducts}
          recentQuotes={data.recentQuotes}
          expiredQuotes={data.expiredQuotes}
        />
      </div>
    </div>
  );
}
