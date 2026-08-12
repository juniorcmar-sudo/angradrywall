"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Wallet,
  Search,
  MessageCircle,
  Copy,
  ExternalLink,
  PackageMinus,
} from "lucide-react";
import { toast } from "sonner";
import { format, differenceInCalendarDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatCurrency } from "@/utils/currency";
import type { Customer, Product, Quote, QuoteItem } from "@/types";

type ReceivableQuote = Quote & {
  customer: Customer;
  items: (QuoteItem & { product: Product })[];
};

interface ReceivablesTableProps {
  quotes: ReceivableQuote[];
}

export function ReceivablesTable({ quotes }: ReceivablesTableProps) {
  const [search, setSearch] = useState("");

  const filtered = quotes.filter((q) => {
    const term = search.toLowerCase().trim();
    if (!term) return true;
    return (
      q.customer.name.toLowerCase().includes(term) ||
      String(q.number).includes(term) ||
      (q.customer.phone1 ?? "").includes(term)
    );
  });

  const totalOpen = quotes.reduce(
    (sum, q) => sum + Number(q.finalTotal.toString()),
    0
  );

  function copyChargeMessage(quote: ReceivableQuote) {
    const total = formatCurrency(Number(quote.finalTotal.toString()));
    const msg = `Olá, ${quote.customer.name}!\n\nPassando para lembrar do pagamento do pedido #${quote.number}, já entregue.\n\nValor: ${total}\n\nQualquer dúvida é só chamar!`;
    navigator.clipboard.writeText(msg);
    toast.success("Mensagem de cobrança copiada!");
  }

  function openWhatsApp(quote: ReceivableQuote) {
    const phone = quote.customer.phone1?.replace(/\D/g, "");
    if (!phone) {
      toast.error("Cliente sem telefone cadastrado");
      return;
    }
    window.open(`https://wa.me/55${phone}`, "_blank");
  }

  if (quotes.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <Wallet className="w-12 h-12 mx-auto mb-4 opacity-30" />
        <p className="text-lg font-medium">Nenhuma conta a receber</p>
        <p className="text-sm mt-1">
          Orçamentos com baixa de estoque antes do pagamento aparecem aqui
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Resumo */}
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <PackageMinus className="w-5 h-5 text-orange-600" />
            <div>
              <p className="text-sm font-semibold text-orange-800">
                {quotes.length} pedido{quotes.length !== 1 ? "s" : ""} entregue
                {quotes.length !== 1 ? "s" : ""} e não pago
                {quotes.length !== 1 ? "s" : ""}
              </p>
              <p className="text-xs text-orange-700">
                Mercadoria já saiu do estoque, pagamento ainda pendente
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-orange-700 uppercase tracking-wider font-semibold">
              Total a receber
            </p>
            <p className="text-2xl font-bold text-orange-800 tabular-nums">
              {formatCurrency(totalOpen)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Busca */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por cliente, nº ou telefone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Card className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nº</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead className="hidden md:table-cell">Itens</TableHead>
              <TableHead className="hidden sm:table-cell">Baixa em</TableHead>
              <TableHead className="text-center">Em aberto</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="w-32"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-6">
                  Nenhum resultado para “{search}”
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((quote) => {
                const releasedAt = quote.stockReleasedAt
                  ? new Date(quote.stockReleasedAt)
                  : null;
                const days = releasedAt
                  ? differenceInCalendarDays(new Date(), releasedAt)
                  : 0;
                const itemCount = quote.items.reduce((s, i) => s + i.quantity, 0);
                return (
                  <TableRow key={quote.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      #{quote.number}
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-sm">{quote.customer.name}</p>
                      {quote.customer.phone1 && (
                        <p className="text-xs text-muted-foreground">
                          {quote.customer.phone1}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {quote.items.length} produto{quote.items.length !== 1 ? "s" : ""}
                      <span className="text-xs"> ({itemCount} un)</span>
                      {quote.stockReleaseNotes && (
                        <p className="text-xs italic mt-0.5 max-w-[220px] truncate">
                          {quote.stockReleaseNotes}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm text-muted-foreground whitespace-nowrap">
                      {releasedAt
                        ? format(releasedAt, "dd/MM/yyyy", { locale: ptBR })
                        : "—"}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={days >= 15 ? "destructive" : days >= 7 ? "warning" : "gray"}
                      >
                        {days === 0 ? "hoje" : `${days} dia${days !== 1 ? "s" : ""}`}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">
                      {formatCurrency(Number(quote.finalTotal.toString()))}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          title="Copiar mensagem de cobrança"
                          onClick={() => copyChargeMessage(quote)}
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          title="Abrir WhatsApp"
                          onClick={() => openWhatsApp(quote)}
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/orcamentos/${quote.id}`} title="Abrir orçamento">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
