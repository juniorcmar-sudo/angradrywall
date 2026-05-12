"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency } from "@/utils/currency";
import { TrendingUp, Users, Package, FileCheck } from "lucide-react";

interface ReportsViewProps {
  data: {
    monthlySales: { total: number; count: number };
    yearlySales: { total: number; count: number };
    topProducts: {
      productId: string;
      product?: { name: string } | null;
      totalRevenue: number;
      totalQty: number;
    }[];
    topCustomers: {
      customerId: string;
      customer?: { name: string } | null;
      totalSpent: number;
      _count: number;
    }[];
    quoteConversion: { total: number; paid: number; rate: number };
  };
}

export function ReportsView({ data }: ReportsViewProps) {
  const productChartData = data.topProducts.slice(0, 5).map((p) => ({
    name: p.product?.name?.substring(0, 20) ?? "—",
    receita: p.totalRevenue,
    quantidade: p.totalQty,
  }));

  const customerChartData = data.topCustomers.slice(0, 5).map((c) => ({
    name: c.customer?.name?.substring(0, 15) ?? "—",
    total: c.totalSpent,
    compras: c._count,
  }));

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Este mês</p>
                <p className="font-bold">{formatCurrency(data.monthlySales.total)}</p>
                <p className="text-xs text-muted-foreground">{data.monthlySales.count} vendas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Este ano</p>
                <p className="font-bold">{formatCurrency(data.yearlySales.total)}</p>
                <p className="text-xs text-muted-foreground">{data.yearlySales.count} vendas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-violet-500/10 flex items-center justify-center">
                <FileCheck className="w-4 h-4 text-violet-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Conversão</p>
                <p className="font-bold">{data.quoteConversion.rate}%</p>
                <p className="text-xs text-muted-foreground">
                  {data.quoteConversion.paid}/{data.quoteConversion.total} orçamentos
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <Users className="w-4 h-4 text-orange-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Top clientes</p>
                <p className="font-bold">{data.topCustomers.length}</p>
                <p className="text-xs text-muted-foreground">com compras</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="w-4 h-4 text-muted-foreground" />
              Produtos Mais Vendidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={productChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" horizontal={false} />
                <XAxis
                  type="number"
                  tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
                  tick={{ fill: "#71717a", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fill: "#71717a", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  width={90}
                />
                <Tooltip
                  formatter={(value) => [formatCurrency(Number(value)), "Receita"]}
                  contentStyle={{
                    backgroundColor: "#18181b",
                    border: "1px solid #27272a",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="receita" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Customers */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              Clientes que Mais Compraram
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {customerChartData.map((c, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.compras} compra(s)</p>
                  </div>
                  <span className="text-sm font-semibold">{formatCurrency(c.total)}</span>
                </div>
              ))}
              {customerChartData.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Nenhuma venda registrada
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
