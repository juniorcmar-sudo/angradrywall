"use client";

import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, SlidersHorizontal, X, ChevronRight } from "lucide-react";
import { formatCurrency, PAYMENT_METHOD_LABELS } from "@/utils/currency";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Link from "next/link";
import type { Customer, Sale, Quote, SaleItem, Product } from "@/types";

type SaleWithDetails = Sale & {
  customer: Customer;
  quote: Quote;
  items: (SaleItem & { product: Product })[];
};

interface SalesTableProps {
  sales: SaleWithDetails[];
}

const PAYMENT_KEYS = ["PIX", "CASH", "DEBIT", "CREDIT", "LINK_3X"] as const;

export function SalesTable({ sales }: SalesTableProps) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [clientFilter, setClientFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<string>("ALL");
  const [productFilter, setProductFilter] = useState("");
  const [logic, setLogic] = useState<"AND" | "OR">("AND");

  const filtered = useMemo(() => {
    const conditions: ((s: SaleWithDetails) => boolean)[] = [];

    if (dateFrom) {
      conditions.push((s) => new Date(s.createdAt) >= new Date(dateFrom));
    }
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      conditions.push((s) => new Date(s.createdAt) <= end);
    }
    if (clientFilter.trim()) {
      const q = clientFilter.toLowerCase();
      conditions.push((s) => s.customer.name.toLowerCase().includes(q));
    }
    if (paymentFilter && paymentFilter !== "ALL") {
      conditions.push((s) => s.paymentMethod === paymentFilter);
    }
    if (productFilter.trim()) {
      const q = productFilter.toLowerCase();
      conditions.push((s) =>
        s.items.some((i) => i.product.name.toLowerCase().includes(q))
      );
    }

    if (conditions.length === 0) return sales;

    return sales.filter((s) =>
      logic === "AND"
        ? conditions.every((fn) => fn(s))
        : conditions.some((fn) => fn(s))
    );
  }, [sales, dateFrom, dateTo, clientFilter, paymentFilter, productFilter, logic]);

  const activeFilterCount = [
    dateFrom,
    dateTo,
    clientFilter.trim(),
    paymentFilter !== "ALL" ? paymentFilter : "",
    productFilter.trim(),
  ].filter(Boolean).length;

  function clearFilters() {
    setDateFrom("");
    setDateTo("");
    setClientFilter("");
    setPaymentFilter("ALL");
    setProductFilter("");
    setLogic("AND");
  }

  const total = filtered.reduce((sum, s) => sum + Number(s.total.toString()), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setFiltersOpen((v) => !v)}
          className="relative"
        >
          <SlidersHorizontal className="w-4 h-4 mr-2" />
          Filtros
          {activeFilterCount > 0 && (
            <Badge className="ml-2 h-4 px-1.5 text-[10px]">{activeFilterCount}</Badge>
          )}
        </Button>
        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
            <X className="w-3.5 h-3.5 mr-1" />
            Limpar
          </Button>
        )}
        <div className="ml-auto text-sm text-muted-foreground">
          {filtered.length} {filtered.length === 1 ? "venda" : "vendas"} ·{" "}
          <span className="font-semibold text-foreground">{formatCurrency(total)}</span>
        </div>
      </div>

      {filtersOpen && (
        <div className="border border-border rounded-md p-4 space-y-4 bg-muted/20">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-medium">Filtros</p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Lógica:</span>
              <div className="flex rounded-md border border-border overflow-hidden text-xs">
                {(["AND", "OR"] as const).map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setLogic(l)}
                    className={`px-2.5 py-1 font-medium transition-colors ${
                      logic === l
                        ? "bg-primary text-primary-foreground"
                        : "bg-background text-muted-foreground hover:bg-accent"
                    }`}
                  >
                    {l === "AND" ? "E" : "OU"}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Data inicial</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Data final</label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Cliente</label>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                <Input
                  placeholder="Nome..."
                  value={clientFilter}
                  onChange={(e) => setClientFilter(e.target.value)}
                  className="h-8 text-sm pl-7"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Pagamento</label>
              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos</SelectItem>
                  {PAYMENT_KEYS.map((k) => (
                    <SelectItem key={k} value={k}>{PAYMENT_METHOD_LABELS[k]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Produto</label>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                <Input
                  placeholder="Nome..."
                  value={productFilter}
                  onChange={(e) => setProductFilter(e.target.value)}
                  className="h-8 text-sm pl-7"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Mobile card list ── */}
      <div className="md:hidden space-y-2">
        {filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-10 text-sm">Nenhuma venda encontrada</p>
        ) : (
          filtered.map((sale) => (
            <Link key={sale.id} href={`/orcamentos/${sale.quoteId}`}>
              <div className="flex items-center gap-3 p-3.5 rounded-xl border border-border bg-card active:bg-muted/50 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-mono text-xs font-semibold text-muted-foreground">
                      #{sale.quote.number}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {PAYMENT_METHOD_LABELS[sale.paymentMethod]}
                    </span>
                  </div>
                  <p className="font-medium text-sm truncate">{sale.customer.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {format(new Date(sale.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                    {sale.items.length > 0 && (
                      <> · {sale.items.length} {sale.items.length === 1 ? "item" : "itens"}</>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <span className="font-semibold text-sm">
                    {formatCurrency(Number(sale.total.toString()))}
                  </span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      {/* ── Desktop table ── */}
      <div className="hidden md:block rounded-md border border-border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Orçamento</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead className="hidden sm:table-cell">Pagamento</TableHead>
              <TableHead className="hidden md:table-cell">Produtos</TableHead>
              <TableHead className="hidden sm:table-cell">Data</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Nenhuma venda encontrada
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell>
                    <Link
                      href={`/orcamentos/${sale.quoteId}`}
                      className="font-mono text-sm text-primary hover:underline"
                    >
                      #{sale.quote.number}
                    </Link>
                  </TableCell>
                  <TableCell className="font-medium">{sale.customer.name}</TableCell>
                  <TableCell className="text-muted-foreground text-sm hidden sm:table-cell">
                    {PAYMENT_METHOD_LABELS[sale.paymentMethod]}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="text-sm">
                      {sale.items.slice(0, 2).map((i) => (
                        <p key={i.id} className="truncate max-w-[200px]">
                          {i.quantity}× {i.product.name}
                        </p>
                      ))}
                      {sale.items.length > 2 && (
                        <p className="text-muted-foreground">
                          +{sale.items.length - 2} mais
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground hidden sm:table-cell">
                    {format(new Date(sale.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(Number(sale.total.toString()))}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
