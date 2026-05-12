"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatCurrency } from "@/utils/currency";

interface MonthlySale {
  total: { toString(): string };
  createdAt: Date;
}

interface DashboardChartsProps {
  monthlySalesData: MonthlySale[];
}

function groupByMonth(sales: MonthlySale[]) {
  const grouped: Record<string, number> = {};

  for (const sale of sales) {
    const key = format(new Date(sale.createdAt), "MMM/yy", { locale: ptBR });
    grouped[key] = (grouped[key] ?? 0) + Number(sale.total.toString());
  }

  return Object.entries(grouped).map(([month, total]) => ({ month, total }));
}

export function DashboardCharts({ monthlySalesData }: DashboardChartsProps) {
  const chartData = groupByMonth(monthlySalesData);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Faturamento Mensal</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis
                dataKey="month"
                tick={{ fill: "#71717a", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
                tick={{ fill: "#71717a", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(value) => [formatCurrency(Number(value)), "Total"]}
                contentStyle={{
                  backgroundColor: "#18181b",
                  border: "1px solid #27272a",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#a1a1aa" }}
                itemStyle={{ color: "#3b82f6" }}
              />
              <Area
                type="monotone"
                dataKey="total"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#colorTotal)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Resumo Operacional</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-sm text-muted-foreground">Total últimos 6 meses</span>
              <span className="font-semibold">
                {formatCurrency(
                  monthlySalesData.reduce(
                    (acc, s) => acc + Number(s.total.toString()),
                    0
                  )
                )}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-sm text-muted-foreground">Média mensal</span>
              <span className="font-semibold">
                {formatCurrency(
                  monthlySalesData.reduce(
                    (acc, s) => acc + Number(s.total.toString()),
                    0
                  ) / Math.max(chartData.length, 1)
                )}
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-muted-foreground">Total de transações</span>
              <span className="font-semibold">{monthlySalesData.length}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
