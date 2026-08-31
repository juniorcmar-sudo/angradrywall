"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatCurrency, PAYMENT_METHOD_LABELS } from "@/utils/currency";

interface MonthlySale {
  total: { toString(): string };
  createdAt: Date;
  paymentMethod: string;
}

interface DashboardChartsProps {
  monthlySalesData: MonthlySale[];
}

const PAYMENT_COLORS: Record<string, string> = {
  PIX: "#10b981",
  CASH: "#22c55e",
  DEBIT: "#3b82f6",
  CREDIT: "#8b5cf6",
  LINK_3X: "#f59e0b",
};

const PAYMENT_KEYS = ["PIX", "CASH", "DEBIT", "CREDIT", "LINK_3X"];

function groupByMonthAndPayment(sales: MonthlySale[]) {
  const grouped: Record<string, Record<string, number>> = {};

  for (const sale of sales) {
    const key = format(new Date(sale.createdAt), "MMM/yy", { locale: ptBR });
    if (!grouped[key]) grouped[key] = {};
    const method = sale.paymentMethod;
    grouped[key][method] = (grouped[key][method] ?? 0) + Number(sale.total.toString());
  }

  return Object.entries(grouped).map(([month, byMethod]) => ({ month, ...byMethod }));
}

export function DashboardCharts({ monthlySalesData }: DashboardChartsProps) {
  const chartData = groupByMonthAndPayment(monthlySalesData);
  const usedMethods = PAYMENT_KEYS.filter((k) =>
    monthlySalesData.some((s) => s.paymentMethod === k)
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Faturamento Mensal por Forma de Pagamento</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
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
                formatter={(value, name) => [
                  formatCurrency(Number(value)),
                  PAYMENT_METHOD_LABELS[name as string] ?? name,
                ]}
                contentStyle={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e4e4e7",
                  borderRadius: "8px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                }}
                labelStyle={{ color: "#52525b" }}
              />
              <Legend
                formatter={(value) => PAYMENT_METHOD_LABELS[value] ?? value}
                wrapperStyle={{ fontSize: 12 }}
              />
              {usedMethods.map((method) => (
                <Bar
                  key={method}
                  dataKey={method}
                  stackId="total"
                  fill={PAYMENT_COLORS[method]}
                  radius={method === usedMethods[usedMethods.length - 1] ? [4, 4, 0, 0] : undefined}
                />
              ))}
            </BarChart>
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
            {usedMethods.length > 0 && (
              <div className="pt-2 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Por forma de pagamento
                </p>
                {usedMethods.map((method) => {
                  const total = monthlySalesData
                    .filter((s) => s.paymentMethod === method)
                    .reduce((acc, s) => acc + Number(s.total.toString()), 0);
                  return (
                    <div key={method} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: PAYMENT_COLORS[method] }}
                        />
                        {PAYMENT_METHOD_LABELS[method] ?? method}
                      </span>
                      <span className="font-medium">{formatCurrency(total)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
