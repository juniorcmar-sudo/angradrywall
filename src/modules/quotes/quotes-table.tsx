"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Search, Plus, Eye, Copy } from "lucide-react";
import Link from "next/link";
import { updateQuoteStatus, duplicateQuote } from "./actions";
import { toast } from "sonner";
import { formatCurrency } from "@/utils/currency";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useRouter } from "next/navigation";
import type { Quote, Customer, FreightZone, QuoteItem, Product } from "@/types";

const STATUS_MAP = {
  DRAFT: { label: "Rascunho", variant: "gray" as const },
  SENT: { label: "Enviado", variant: "info" as const },
  AWAITING_PAYMENT: { label: "Aguard. Pagamento", variant: "warning" as const },
  PAID: { label: "Pago", variant: "success" as const },
  CANCELLED: { label: "Cancelado", variant: "destructive" as const },
};

const PAYMENT_LABELS: Record<string, string> = {
  PIX: "Pix",
  CASH: "Dinheiro",
  DEBIT: "Débito",
  CREDIT: "Crédito",
  LINK_3X: "Link 12x",
};

type QuoteWithDetails = Quote & {
  customer: Customer;
  freightZone: FreightZone | null;
  items: (QuoteItem & { product: Product })[];
};

interface QuotesTableProps {
  quotes: QuoteWithDetails[];
}

export function QuotesTable({ quotes }: QuotesTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const filtered = quotes.filter(
    (q) =>
      q.customer.name.toLowerCase().includes(search.toLowerCase()) ||
      String(q.number).includes(search)
  );

  async function handleStatusChange(id: string, status: string) {
    const result = await updateQuoteStatus(id, status as "SENT" | "AWAITING_PAYMENT" | "PAID" | "CANCELLED" | "DRAFT");
    if (!result.success) {
      toast.error(result.error);
    } else {
      toast.success("Status atualizado!");
    }
  }

  async function handleDuplicate(id: string) {
    const result = await duplicateQuote(id);
    if (!result.success) {
      toast.error(result.error);
    } else {
      toast.success("Orçamento duplicado!");
      router.push(`/orcamentos/${result.data.id}`);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:items-center">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente ou número..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Link href="/orcamentos/novo" className="flex-shrink-0">
          <Button className="w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            Novo Orçamento
          </Button>
        </Link>
      </div>

      <div className="rounded-md border border-border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden sm:table-cell">Pagamento</TableHead>
              <TableHead className="hidden md:table-cell">Validade</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  Nenhum orçamento encontrado
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((quote) => {
                const status =
                  STATUS_MAP[quote.status as keyof typeof STATUS_MAP] ?? STATUS_MAP.DRAFT;
                const isLocked = ["PAID", "CANCELLED"].includes(quote.status);

                return (
                  <TableRow
                    key={quote.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/orcamentos/${quote.id}`)}
                  >
                    <TableCell className="font-mono text-sm font-semibold">
                      #{quote.number}
                    </TableCell>
                    <TableCell className="font-medium">{quote.customer.name}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className="focus:outline-none focus:ring-2 focus:ring-ring rounded-full"
                            disabled={isLocked}
                          >
                            <Badge variant={status.variant}>{status.label}</Badge>
                          </button>
                        </DropdownMenuTrigger>
                        {!isLocked && (
                          <DropdownMenuContent align="start" className="w-52">
                            {quote.status === "DRAFT" && (
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(quote.id, "SENT")}
                              >
                                Marcar como Enviado
                              </DropdownMenuItem>
                            )}
                            {quote.status === "SENT" && (
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(quote.id, "AWAITING_PAYMENT")}
                              >
                                Aguardando Pagamento
                              </DropdownMenuItem>
                            )}
                            {quote.status === "AWAITING_PAYMENT" && (
                              <DropdownMenuItem
                                className="text-emerald-600 focus:text-emerald-600"
                                onClick={() => handleStatusChange(quote.id, "PAID")}
                              >
                                Confirmar Pagamento
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => handleStatusChange(quote.id, "CANCELLED")}
                            >
                              Cancelar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        )}
                      </DropdownMenu>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm hidden sm:table-cell">
                      {quote.paymentMethod ? PAYMENT_LABELS[quote.paymentMethod] ?? quote.paymentMethod : "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground hidden md:table-cell">
                      {quote.validUntil
                        ? format(new Date(quote.validUntil), "dd/MM/yyyy", { locale: ptBR })
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(Number(quote.finalTotal.toString()))}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/orcamentos/${quote.id}`}>
                              <Eye className="w-4 h-4 mr-2" />
                              Ver detalhes
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicate(quote.id)}>
                            <Copy className="w-4 h-4 mr-2" />
                            Duplicar
                          </DropdownMenuItem>
                          {!isLocked && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => handleStatusChange(quote.id, "CANCELLED")}
                              >
                                Cancelar
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
