"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, FileText, ArrowRight } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const QUOTE_STATUS_MAP = {
  DRAFT: { label: "Rascunho", variant: "gray" as const },
  SENT: { label: "Enviado", variant: "info" as const },
  AWAITING_PAYMENT: { label: "Aguard. Pgto", variant: "warning" as const },
  PAID: { label: "Pago", variant: "success" as const },
  CANCELLED: { label: "Cancelado", variant: "destructive" as const },
};

interface DashboardAlertsProps {
  lowStockProducts: { id: string; name: string; stock: number; minimum_stock: number }[];
  recentQuotes: {
    id: string;
    number: number;
    status: string;
    finalTotal: { toString(): string };
    createdAt: Date;
    customer: { name: string };
  }[];
}

export function DashboardAlerts({ lowStockProducts, recentQuotes }: DashboardAlertsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Low Stock */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            Estoque Crítico
          </CardTitle>
          <Link
            href="/estoque"
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            Ver mais <ArrowRight className="w-3 h-3" />
          </Link>
        </CardHeader>
        <CardContent>
          {lowStockProducts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum produto em estoque crítico
            </p>
          ) : (
            <div className="space-y-2">
              {lowStockProducts.slice(0, 5).map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                >
                  <span className="text-sm truncate max-w-[60%]">{product.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      Mín: {product.minimum_stock}
                    </span>
                    <Badge variant="destructive">{product.stock} un</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Quotes */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-400" />
            Orçamentos Recentes
          </CardTitle>
          <Link
            href="/orcamentos"
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            Ver mais <ArrowRight className="w-3 h-3" />
          </Link>
        </CardHeader>
        <CardContent>
          {recentQuotes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum orçamento encontrado
            </p>
          ) : (
            <div className="space-y-2">
              {recentQuotes.map((quote) => {
                const status =
                  QUOTE_STATUS_MAP[quote.status as keyof typeof QUOTE_STATUS_MAP] ??
                  QUOTE_STATUS_MAP.DRAFT;
                return (
                  <Link
                    key={quote.id}
                    href={`/orcamentos/${quote.id}`}
                    className="flex items-center justify-between py-2 border-b border-border last:border-0 hover:opacity-80 transition-opacity"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        #{quote.number} — {quote.customer.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(quote.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
