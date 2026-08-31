"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, FileText, ArrowRight, Clock } from "lucide-react";
import Link from "next/link";
import { format, differenceInCalendarDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getQuoteStatus } from "@/utils/quote-status";

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
  expiredQuotes?: {
    id: string;
    number: number;
    validUntil: Date;
    customer: { name: string };
  }[];
}

export function DashboardAlerts({ lowStockProducts, recentQuotes, expiredQuotes = [] }: DashboardAlertsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Expired quotes */}
      {expiredQuotes.length > 0 && (
        <Card className="lg:col-span-2 border-red-200 bg-red-50">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-red-700">
              <Clock className="w-4 h-4" />
              {expiredQuotes.length} orçamento{expiredQuotes.length !== 1 ? "s" : ""} enviado
              {expiredQuotes.length !== 1 ? "s" : ""} e vencido{expiredQuotes.length !== 1 ? "s" : ""}
            </CardTitle>
            <Link
              href="/orcamentos"
              className="text-xs text-red-700 hover:underline flex items-center gap-1"
            >
              Ver todos <ArrowRight className="w-3 h-3" />
            </Link>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {expiredQuotes.slice(0, 8).map((quote) => {
                const days = differenceInCalendarDays(new Date(), new Date(quote.validUntil));
                return (
                  <Link
                    key={quote.id}
                    href={`/orcamentos/${quote.id}`}
                    className="text-xs px-3 py-1.5 rounded-full bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                  >
                    #{quote.number} — {quote.customer.name} · vencido há {days} dia{days !== 1 ? "s" : ""}
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

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
                const status = getQuoteStatus(quote.status);
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
