"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronLeft, FileText } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatCurrency, PAYMENT_METHOD_LABELS } from "@/utils/currency";

interface Product {
  id: string;
  name: string;
  internalCode: string;
  category: { name: string } | null;
}

interface SaleItem {
  id: string;
  quantity: number;
  unitPrice: unknown;
  total: unknown;
  product: Product;
}

interface Customer {
  id: string;
  name: string;
  phone1: string | null;
  cidade: string | null;
  uf: string | null;
  type: string;
}

interface Quote {
  id: string;
  number: number;
  installments: number | null;
  installmentValue: unknown;
}

interface Sale {
  id: string;
  quoteId: string;
  customerId: string;
  paymentMethod: string;
  subtotal: unknown;
  freight: unknown;
  total: unknown;
  paidAt: string | Date | null;
  createdAt: string | Date;
  customer: Customer;
  quote: Quote;
  items: SaleItem[];
}

interface SaleDetailProps {
  sale: Sale;
}

const PAYMENT_BADGE: Record<string, { bg: string; text: string }> = {
  PIX:    { bg: "bg-emerald-100", text: "text-emerald-700" },
  CASH:   { bg: "bg-emerald-100", text: "text-emerald-700" },
  DEBIT:  { bg: "bg-blue-100",    text: "text-blue-700"    },
  CREDIT: { bg: "bg-purple-100",  text: "text-purple-700"  },
  LINK_3X:{ bg: "bg-amber-100",   text: "text-amber-700"   },
};

export function SaleDetail({ sale }: SaleDetailProps) {
  const subtotal = Number(sale.subtotal);
  const freight  = Number(sale.freight);
  const total    = Number(sale.total);
  const paidAt   = sale.paidAt ? new Date(sale.paidAt) : new Date(sale.createdAt);
  const payLabel = PAYMENT_METHOD_LABELS[sale.paymentMethod] ?? sale.paymentMethod;
  const badge    = PAYMENT_BADGE[sale.paymentMethod] ?? { bg: "bg-gray-100", text: "text-gray-600" };

  return (
    <div className="space-y-5 max-w-4xl">

      {/* ── Header ── */}
      <div>
        <Link
          href="/vendas"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3"
        >
          <ChevronLeft className="w-4 h-4" />
          Vendas
        </Link>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl font-semibold">Venda concluída</h1>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}>
              {payLabel}
            </span>
            <span className="text-sm text-muted-foreground">
              {format(paidAt, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </span>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/orcamentos/${sale.quoteId}`}>
              <FileText className="w-3.5 h-3.5 mr-1.5" />
              Ver Orçamento #{sale.quote.number}
            </Link>
          </Button>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Produtos */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-0">
              <div className="px-5 py-4 border-b border-border">
                <p className="text-sm font-semibold text-foreground">
                  Produtos vendidos
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    {sale.items.length} {sale.items.length === 1 ? "item" : "itens"}
                  </span>
                </p>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-5 w-[45%]">Produto</TableHead>
                    <TableHead className="text-center w-[15%]">Qtd</TableHead>
                    <TableHead className="text-right w-[20%]">Unitário</TableHead>
                    <TableHead className="text-right w-[20%] pr-5">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sale.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="pl-5">
                        <p className="font-medium text-sm leading-tight">{item.product.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{item.product.internalCode}</p>
                      </TableCell>
                      <TableCell className="text-center tabular-nums">{item.quantity}</TableCell>
                      <TableCell className="text-right text-sm tabular-nums">
                        {formatCurrency(Number(item.unitPrice))}
                      </TableCell>
                      <TableCell className="text-right font-semibold tabular-nums pr-5">
                        {formatCurrency(Number(item.total))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar — card único com seções */}
        <div>
          <Card>
            <CardContent className="p-0 divide-y divide-border">

              {/* Cliente */}
              <div className="px-5 py-4 space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Cliente
                </p>
                <p className="font-semibold text-sm leading-tight">{sale.customer.name}</p>
                <p className="text-xs text-muted-foreground">
                  {sale.customer.type === "DRYWALL_WORKER" ? "Gesseiro" : "Cliente Comum"}
                </p>
                {sale.customer.phone1 && (
                  <p className="text-xs text-muted-foreground">{sale.customer.phone1}</p>
                )}
                {(sale.customer.cidade || sale.customer.uf) && (
                  <p className="text-xs text-muted-foreground">
                    {[sale.customer.cidade, sale.customer.uf].filter(Boolean).join("/")}
                  </p>
                )}
                <div className="pt-2">
                  <Button variant="outline" size="sm" className="w-full h-8 text-xs" asChild>
                    <Link href={`/clientes/${sale.customerId}`}>Ver perfil</Link>
                  </Button>
                </div>
              </div>

              {/* Pagamento */}
              <div className="px-5 py-4 space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Pagamento
                </p>
                <p className="text-sm font-medium">{payLabel}</p>
                {sale.quote.installments && sale.quote.installments > 1 && sale.quote.installmentValue != null && (
                  <p className="text-xs text-muted-foreground">
                    {sale.quote.installments}x de{" "}
                    {formatCurrency(Number(String(sale.quote.installmentValue)))}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  {format(paidAt, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>

              {/* Valores */}
              <div className="px-5 py-4 space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Valores
                </p>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="tabular-nums">{formatCurrency(subtotal)}</span>
                </div>
                {freight > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Frete</span>
                    <span className="tabular-nums">{formatCurrency(freight)}</span>
                  </div>
                )}
                <div className="flex justify-between items-baseline pt-2 border-t border-border">
                  <span className="text-sm font-semibold">Total</span>
                  <span className="text-lg font-bold text-primary tabular-nums">
                    {formatCurrency(total)}
                  </span>
                </div>
              </div>

            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
