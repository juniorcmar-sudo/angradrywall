"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Phone, MapPin, FileText, ShoppingCart, Pencil } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatCurrency } from "@/utils/currency";
import Link from "next/link";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CustomerForm } from "./customer-form";
import type { Customer, Quote, Sale, QuoteItem, SaleItem, Product } from "@/types";

const QUOTE_STATUS = {
  DRAFT: { label: "Rascunho", variant: "gray" as const },
  SENT: { label: "Enviado", variant: "info" as const },
  AWAITING_PAYMENT: { label: "Aguard. Pgto", variant: "warning" as const },
  PAID: { label: "Pago", variant: "success" as const },
  CANCELLED: { label: "Cancelado", variant: "destructive" as const },
};

type CustomerWithDetails = Customer & {
  quotes: (Quote & { items: (QuoteItem & { product: Product })[] })[];
  sales: (Sale & { items: (SaleItem & { product: Product })[] })[];
  _count: { quotes: number; sales: number };
};

export function CustomerDetail({ customer }: { customer: CustomerWithDetails }) {
  const [editing, setEditing] = useState(false);

  const totalSpent = customer.sales.reduce(
    (sum: number, sale: { total: { toString(): string } }) =>
      sum + Number(sale.total.toString()),
    0
  );

  return (
    <div className="space-y-6">
      {/* Info Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Informações</CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setEditing(true)}
            >
              <Pencil className="w-3 h-3 mr-1" />
              Editar
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              {customer.phone1 && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{customer.phone1}</span>
                </div>
              )}
              {customer.phone2 && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{customer.phone2}</span>
                </div>
              )}
              {customer.cpfCnpj && (
                <div>
                  <p className="text-xs text-muted-foreground">CPF/CNPJ</p>
                  <p className="text-sm">{customer.cpfCnpj}</p>
                </div>
              )}
              {customer.address && (
                <div className="flex items-start gap-2 col-span-2">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <span className="text-sm">{customer.address}</span>
                </div>
              )}
            </div>
            {customer.notes && (
              <div className="pt-2 border-t border-border">
                <p className="text-xs text-muted-foreground mb-1">Observações</p>
                <p className="text-sm">{customer.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold">{formatCurrency(totalSpent)}</p>
                <p className="text-xs text-muted-foreground mt-1">Total gasto</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-xl font-bold">{customer._count.quotes}</p>
                  <p className="text-xs text-muted-foreground">Orçamentos</p>
                </div>
                <div>
                  <p className="text-xl font-bold">{customer._count.sales}</p>
                  <p className="text-xs text-muted-foreground">Compras</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="quotes">
        <TabsList>
          <TabsTrigger value="quotes" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Orçamentos
          </TabsTrigger>
          <TabsTrigger value="sales" className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4" />
            Compras
          </TabsTrigger>
        </TabsList>

        <TabsContent value="quotes" className="mt-4">
          <Card>
            <CardContent className="pt-4">
              {customer.quotes.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Nenhum orçamento encontrado
                </p>
              ) : (
                <div className="space-y-2">
                  {customer.quotes.map((quote) => {
                    const status =
                      QUOTE_STATUS[quote.status as keyof typeof QUOTE_STATUS] ??
                      QUOTE_STATUS.DRAFT;
                    return (
                      <Link
                        key={quote.id}
                        href={`/orcamentos/${quote.id}`}
                        className="flex items-center justify-between py-3 border-b border-border last:border-0 hover:opacity-80 transition-opacity"
                      >
                        <div>
                          <p className="text-sm font-medium">Orçamento #{quote.number}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(quote.createdAt), "dd/MM/yyyy", {
                              locale: ptBR,
                            })}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={status.variant}>{status.label}</Badge>
                          <span className="text-sm font-semibold">
                            {formatCurrency(Number(quote.finalTotal.toString()))}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sales" className="mt-4">
          <Card>
            <CardContent className="pt-4">
              {customer.sales.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Nenhuma compra encontrada
                </p>
              ) : (
                <div className="space-y-2">
                  {customer.sales.map((sale) => (
                    <div
                      key={sale.id}
                      className="flex items-center justify-between py-3 border-b border-border last:border-0"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {sale.items.length} produto(s)
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(sale.createdAt), "dd/MM/yyyy", {
                            locale: ptBR,
                          })}
                        </p>
                      </div>
                      <span className="text-sm font-semibold">
                        {formatCurrency(Number(sale.total.toString()))}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar cliente</DialogTitle>
          </DialogHeader>
          <CustomerForm customer={customer} onSuccess={() => setEditing(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
