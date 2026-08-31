"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  FileText,
  ShoppingCart,
  AlertTriangle,
  Clock,
  Receipt,
  Wallet,
  Target,
} from "lucide-react";
import { formatCurrency } from "@/utils/currency";
import Link from "next/link";

interface DashboardCardsProps {
  data: {
    daily: number;
    weekly: number;
    monthly: number;
    monthlyGrowthPercent: number | null;
    averageTicket: number;
    monthlyGoal: number | null;
    pendingQuotes: number;
    completedSales: number;
    lowStockCount: number;
    pendingOrders: number;
    receivableTotal: number;
    receivableCount: number;
  };
}

export function DashboardCards({ data }: DashboardCardsProps) {
  const growth = data.monthlyGrowthPercent;
  const goalProgress =
    data.monthlyGoal && data.monthlyGoal > 0
      ? Math.min(Math.round((data.monthly / data.monthlyGoal) * 100), 999)
      : null;

  const cards = [
    {
      title: "Faturamento Hoje",
      value: formatCurrency(data.daily),
      icon: DollarSign,
      description: "Vendas do dia",
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      href: "/vendas",
    },
    {
      title: "Faturamento Semana",
      value: formatCurrency(data.weekly),
      icon: TrendingUp,
      description: "Vendas desta semana",
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      href: "/vendas",
    },
    {
      title: "Faturamento Mês",
      value: formatCurrency(data.monthly),
      icon: growth !== null && growth < 0 ? TrendingDown : TrendingUp,
      description:
        growth === null
          ? `${data.completedSales} vendas concluídas`
          : `${growth >= 0 ? "▲" : "▼"} ${Math.abs(growth)}% vs mês anterior`,
      color:
        growth !== null && growth < 0
          ? "text-red-400"
          : "text-violet-400",
      bg: growth !== null && growth < 0 ? "bg-red-500/10" : "bg-violet-500/10",
      href: "/vendas",
    },
    {
      title: "Ticket Médio",
      value: formatCurrency(data.averageTicket),
      icon: Receipt,
      description: `${data.completedSales} vendas no mês`,
      color: "text-cyan-400",
      bg: "bg-cyan-500/10",
      href: "/vendas",
    },
    {
      title: "Contas a Receber",
      value: formatCurrency(data.receivableTotal),
      icon: Wallet,
      description:
        data.receivableCount > 0
          ? `${data.receivableCount} pedido${data.receivableCount !== 1 ? "s" : ""} em aberto`
          : "Nenhum pedido em aberto",
      color: "text-orange-400",
      bg: "bg-orange-500/10",
      href: "/contas-a-receber",
    },
    {
      title: "Orçamentos Pendentes",
      value: String(data.pendingQuotes),
      icon: FileText,
      description: "Em andamento",
      color: "text-yellow-400",
      bg: "bg-yellow-500/10",
      href: "/orcamentos",
    },
    {
      title: "Vendas no Mês",
      value: String(data.completedSales),
      icon: ShoppingCart,
      description: "Vendas concluídas",
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      href: "/vendas",
    },
    {
      title: "Estoque Baixo",
      value: String(data.lowStockCount),
      icon: AlertTriangle,
      description: "Produtos críticos",
      color: "text-red-400",
      bg: "bg-red-500/10",
      href: "/estoque",
    },
    {
      title: "Pedidos Pendentes",
      value: String(data.pendingOrders),
      icon: Clock,
      description: "Aguardando estoque",
      color: "text-orange-400",
      bg: "bg-orange-500/10",
      href: "/pedidos-pendentes",
    },
  ];

  return (
    <div className="space-y-3 md:space-y-4">
      {goalProgress !== null && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Meta do mês</span>
              </div>
              <span className="text-sm font-semibold tabular-nums">
                {formatCurrency(data.monthly)} / {formatCurrency(data.monthlyGoal!)}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  goalProgress >= 100 ? "bg-emerald-500" : "bg-primary"
                }`}
                style={{ width: `${Math.min(goalProgress, 100)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">
              {goalProgress}% da meta {goalProgress >= 100 ? "— meta batida! 🎉" : "atingida"}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3 md:gap-4 md:grid-cols-3 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.title} href={card.href}>
              <Card className="hover:border-primary/50 transition-colors cursor-pointer group active:bg-muted/30">
                <CardHeader className="flex flex-row items-center justify-between pb-1.5 md:pb-2 space-y-0 px-3 pt-3 md:px-6 md:pt-6">
                  <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground leading-tight">
                    {card.title}
                  </CardTitle>
                  <div className={`w-7 h-7 md:w-9 md:h-9 rounded-lg ${card.bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-3.5 h-3.5 md:w-4 md:h-4 ${card.color}`} />
                  </div>
                </CardHeader>
                <CardContent className="px-3 pb-3 md:px-6 md:pb-6">
                  <div className="text-xl md:text-2xl font-bold">{card.value}</div>
                  <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5 md:mt-1 truncate">{card.description}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
