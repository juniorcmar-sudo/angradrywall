"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle, Plus, Search, TrendingUp, TrendingDown, Wrench } from "lucide-react";
import { StockMovementForm } from "./stock-movement-form";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Product, StockMovement } from "@/types";

type MovementDirection = "in" | "out" | "adj";

const MOVEMENT_LABELS: Record<string, { label: string; direction: MovementDirection }> = {
  ENTRY_MANUAL:   { label: "Entrada Manual",          direction: "in" },
  ENTRY_SUPPLIER: { label: "Entrada Fornecedor",       direction: "in" },
  ENTRY_PURCHASE: { label: "Nota de Compra",           direction: "in" },
  ENTRY_RESTOCK:  { label: "Reposição de Estoque",     direction: "in" },
  EXIT_SALE:      { label: "Saída por Venda",          direction: "out" },
  EXIT_LOSS:      { label: "Saída por Perda",          direction: "out" },
  EXIT_DAMAGE:    { label: "Saída por Avaria",         direction: "out" },
  EXIT_BREAK:     { label: "Saída por Quebra",         direction: "out" },
  ADJUSTMENT:     { label: "Ajuste",                   direction: "adj" },
};

// green=entrada, blue=venda, yellow=ajuste, red=perda/dano/quebra
function getMovementColor(type: string): string {
  if (type === "EXIT_SALE") return "text-blue-600";
  if (type === "ADJUSTMENT") return "text-amber-600";
  if (["EXIT_LOSS", "EXIT_DAMAGE", "EXIT_BREAK"].includes(type)) return "text-red-600";
  if (type.startsWith("ENTRY_")) return "text-emerald-600";
  return "text-muted-foreground";
}

interface StockOverviewProps {
  products: (Product & { category: { name: string } | null })[];
  movements: (StockMovement & { product: Product })[];
  lowStock: Product[];
}

export function StockOverview({ products, movements, lowStock }: StockOverviewProps) {
  const [search, setSearch] = useState("");
  const [movementOpen, setMovementOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | undefined>();

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.internalCode.toLowerCase().includes(search.toLowerCase())
  );

  function openMovement(productId?: string) {
    setSelectedProductId(productId);
    setMovementOpen(true);
  }

  return (
    <div className="space-y-6">
      {/* Alerts */}
      {lowStock.length > 0 && (
        <Card className="border-red-300 bg-red-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-4 h-4" />
              {lowStock.length} produto(s) com estoque crítico
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {lowStock.map((p) => (
                <button
                  key={p.id}
                  onClick={() => openMovement(p.id)}
                  className="text-xs px-3 py-1 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                >
                  {p.name} ({p.stock} un)
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Products Table */}
        <div className="lg:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar produtos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button onClick={() => openMovement()}>
              <Plus className="w-4 h-4 mr-2" />
              Registrar Entrada/Saída
            </Button>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-center">Estoque Atual</TableHead>
                  <TableHead className="text-center">Mínimo</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="w-28"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((product) => {
                  const isLow = product.minimumStock > 0 && product.stock <= product.minimumStock;
                  return (
                    <TableRow key={product.id}>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {product.internalCode}
                      </TableCell>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {product.category?.name ?? "—"}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={isLow ? "text-red-600 font-semibold" : "font-semibold"}>
                          {product.stock}
                        </span>
                      </TableCell>
                      <TableCell className="text-center text-muted-foreground">
                        {product.minimumStock}
                      </TableCell>
                      <TableCell className="text-center">
                        {isLow ? (
                          <Badge variant="destructive">Crítico</Badge>
                        ) : product.stock === 0 ? (
                          <Badge variant="warning">Zerado</Badge>
                        ) : (
                          <Badge variant="success">Normal</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" onClick={() => openMovement(product.id)}>
                          Movimentar
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </div>

        {/* Recent Movements */}
        <div className="lg:col-span-2">
          <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
            Movimentações Recentes
          </h3>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-center">Quantidade</TableHead>
                  <TableHead>Observação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                      Nenhuma movimentação registrada
                    </TableCell>
                  </TableRow>
                ) : (
                  movements.map((mv) => {
                    const info = MOVEMENT_LABELS[mv.type];
                    const color = getMovementColor(mv.type);
                    const isIn = info?.direction === "in";
                    const isAdj = info?.direction === "adj";
                    const rowBg = isAdj
                      ? "bg-amber-50"
                      : isIn
                      ? "bg-emerald-50"
                      : "bg-red-50";
                    return (
                      <TableRow key={mv.id} className={rowBg}>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {format(new Date(mv.createdAt), "dd/MM/yy HH:mm", { locale: ptBR })}
                        </TableCell>
                        <TableCell className="font-medium text-sm">{mv.product.name}</TableCell>
                        <TableCell>
                          <span className={`text-sm font-medium ${color}`}>
                            {info?.label ?? mv.type}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={`flex items-center justify-center gap-1 font-semibold text-sm ${color}`}>
                            {isAdj ? (
                              <Wrench className="w-3 h-3" />
                            ) : isIn ? (
                              <TrendingUp className="w-3 h-3" />
                            ) : (
                              <TrendingDown className="w-3 h-3" />
                            )}
                            {!isAdj && (isIn ? "+" : "−")}
                            {mv.quantity}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {mv.notes ?? "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      </div>

      <Dialog open={movementOpen} onOpenChange={setMovementOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Movimentação</DialogTitle>
          </DialogHeader>
          <StockMovementForm
            products={products}
            defaultProductId={selectedProductId}
            onSuccess={() => setMovementOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
