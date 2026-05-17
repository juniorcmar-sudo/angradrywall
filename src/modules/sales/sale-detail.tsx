"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronLeft, FileText, User, CreditCard, Package } from "lucide-react";
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

const PAYMENT_BADGE: Record<string, string> = {
  PIX: "bg-emerald-100 text-emerald-700",
  CASH: "bg-emerald-100 text-emerald-700",
  DEBIT: "bg-blue-100 text-blue-700",
  CREDIT: "bg-purple-100 text-purple-700",
  LINK_3X: "bg-amber-100 text-amber-700",
};

export function SaleDetail({ sale }: SaleDetailProps) {
  const subtotal = Number(sale.subtotal);
  const freight = Number(sale.freight);
  const total = Number(sale.total);
  const paidAt = sale.paidAt ? new Date(sale.paidAt) : new Date(sale.createdAt);
  const payLabel = PAYMENT_METHOD_LABELS[sale.paymentMethod] ?? sale.paymentMethod;
  const badgeCls = PAYMENT_BADGE[sale.paymentMethod] ?? "bg-gray-100 text-gray-700";

  return (
    <div className="space-y-4 max-w-4xl">
      {/* Back */}
      <div>
        <Link
          href="/vendas"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3"
        >
          <ChevronLeft className="w-4 h-4" />
          Vendas
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-semibold">Venda concluída</h1>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${badgeCls}`}>
            {payLabel}
          </span>
          <span className="text-sm text-muted-foreground">
            {format(paidAt, "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
          </span>
        </div>
      </div>

      {/* Link ao orçamento */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/orcamentos/${sale.quoteId}`}>
            <FileText className="w-3.5 h-3.5 mr-1" />
            Ver Orçamento #{sale.quote.number}
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Produtos */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="w-4 h-4 text-muted-foreground" />
                Produtos vendidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead className="text-center">Qtd</TableHead>
                    <TableHead className="text-right">Unit.</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sale.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <p className="font-medium text-sm">{item.product.name}</p>
                        <p className="text-xs text-muted-foreground">{item.product.internalCode}</p>
                      </TableCell>
                      <TableCell className="text-center">{item.quantity}</TableCell>
                      <TableCell className="text-right text-sm">
                        {formatCurrency(Number(item.unitPrice))}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(Number(item.total))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Cliente */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p className="font-semibold text-base">{sale.customer.name}</p>
              <p className="text-muted-foreground">
                {sale.customer.type === "DRYWALL_WORKER" ? "Gesseiro" : "Cliente Comum"}
              </p>
              {sale.customer.phone1 && (
                <p className="text-muted-foreground">{sale.customer.phone1}</p>
              )}
              {(sale.customer.cidade || sale.customer.uf) && (
                <p className="text-muted-foreground">
                  {[sale.customer.cidade, sale.customer.uf].filter(Boolean).join("/")}
                </p>
              )}
              <div className="pt-2">
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href={`/clientes/${sale.customerId}`}>
                    Ver perfil do cliente
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Pagamento */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-muted-foreground" />
                Pagamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p className="font-medium">{payLabel}</p>
              {sale.quote.installments && sale.quote.installments > 1 && sale.quote.installmentValue != null && (
                <p className="text-muted-foreground">
                  {sale.quote.installments}x de {formatCurrency(Number(String(sale.quote.installmentValue)))}
                </p>
              )}
              <p className="text-muted-foreground text-xs mt-1">
                Pago em {format(paidAt, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            </CardContent>
          </Card>

          {/* Totais */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Valores</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {freight > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Frete</span>
                  <span>{formatCurrency(freight)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-xl pt-3 border-t border-border">
                <span>Total</span>
                <span className="text-primary">{formatCurrency(total)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
