"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TrendingUp,
  DollarSign,
  FileText,
  ShoppingCart,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { formatCurrency } from "@/utils/currency";
import Link from "next/link";

interface DashboardCardsProps {
  data: {
    daily: number;
    weekly: number;
    monthly: number;
    pendingQuotes: number;
    completedSales: number;
    lowStockCount: number;
    pendingOrders: number;
  };
}

export function DashboardCards({ data }: DashboardCardsProps) {
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
      icon: TrendingUp,
      description: `${data.completedSales} vendas concluídas`,
      color: "text-violet-400",
      bg: "bg-violet-500/10",
      href: "/vendas",
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
  );
}
