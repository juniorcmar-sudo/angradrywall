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
import { TrendingUp, Users, Package, FileCheck, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

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

  function exportCsv() {
    const rows: string[] = [];
    const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;

    rows.push("Resumo");
    rows.push(["Vendas este mês", data.monthlySales.count, data.monthlySales.total].map(esc).join(","));
    rows.push(["Vendas este ano", data.yearlySales.count, data.yearlySales.total].map(esc).join(","));
    rows.push(["Conversão de orçamentos (%)", data.quoteConversion.rate].map(esc).join(","));
    rows.push("");

    rows.push("Produtos Mais Vendidos");
    rows.push(["Produto", "Quantidade", "Receita"].map(esc).join(","));
    data.topProducts.forEach((p) => {
      rows.push([p.product?.name ?? "—", p.totalQty, p.totalRevenue].map(esc).join(","));
    });
    rows.push("");

    rows.push("Clientes que Mais Compraram");
    rows.push(["Cliente", "Compras", "Total Gasto"].map(esc).join(","));
    data.topCustomers.forEach((c) => {
      rows.push([c.customer?.name ?? "—", c._count, c.totalSpent].map(esc).join(","));
    });

    const csv = "﻿" + rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-angra-drywall-${format(new Date(), "yyyy-MM-dd")}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={exportCsv}>
          <Download className="w-3.5 h-3.5 mr-1.5" />
          Exportar CSV
        </Button>
      </div>

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
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" horizontal={false} />
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
                    backgroundColor: "#ffffff",
                    border: "1px solid #e4e4e7",
                    borderRadius: "8px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                  }}
                  labelStyle={{ color: "#52525b" }}
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
