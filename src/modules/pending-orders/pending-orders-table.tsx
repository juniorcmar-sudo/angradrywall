"use client";

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
import { Clock, Copy } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Customer, Product, PendingOrder } from "@/types";

type OrderWithDetails = PendingOrder & {
  customer: Customer;
  product: Product;
};

interface PendingOrdersTableProps {
  orders: OrderWithDetails[];
}

export function PendingOrdersTable({ orders }: PendingOrdersTableProps) {
  // Group by product
  const grouped = orders.reduce<Record<string, { product: Product; orders: OrderWithDetails[] }>>(
    (acc, order) => {
      const key = order.productId;
      if (!acc[key]) {
        acc[key] = { product: order.product, orders: [] };
      }
      acc[key].orders.push(order);
      return acc;
    },
    {}
  );

  function copyStockMessage(productName: string, orders: OrderWithDetails[]) {
    const lines = orders.map((o) => `• ${o.customer.name}: ${o.quantity - o.fulfilled} un`);
    const msg = `Estoque disponível: ${productName}\n\n${lines.join("\n")}`;
    navigator.clipboard.writeText(msg);
    toast.success("Mensagem copiada!");
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <Clock className="w-12 h-12 mx-auto mb-4 opacity-30" />
        <p className="text-lg font-medium">Nenhum pedido pendente</p>
        <p className="text-sm mt-1">Todos os pedidos foram atendidos</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {Object.values(grouped).map(({ product, orders }) => {
        const totalPending = orders.reduce((sum, o) => sum + (o.quantity - o.fulfilled), 0);
        return (
          <div key={product.id} className="border border-border rounded-lg overflow-x-auto">
            <div className="flex items-center justify-between px-4 py-3 bg-muted/30">
              <div>
                <h3 className="font-semibold text-sm">{product.name}</h3>
                <p className="text-xs text-muted-foreground">
                  [{product.internalCode}] — Estoque atual: {product.stock} un — Total pendente:{" "}
                  <span className="text-orange-400 font-medium">{totalPending} un</span>
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyStockMessage(product.name, orders)}
              >
                <Copy className="w-3.5 h-3.5 mr-1" />
                Copiar notificação
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="hidden sm:table-cell">Tipo</TableHead>
                  <TableHead className="text-center">Pendente</TableHead>
                  <TableHead className="text-center hidden sm:table-cell">Atendido</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden sm:table-cell">Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.customer.name}</TableCell>
                    <TableCell className="text-muted-foreground text-sm hidden sm:table-cell">
                      {order.customer.type === "DRYWALL_WORKER" ? "Gesseiro" : "Comum"}
                    </TableCell>
                    <TableCell className="text-center font-semibold text-orange-400">
                      {order.quantity - order.fulfilled}
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground hidden sm:table-cell">
                      {order.fulfilled}
                    </TableCell>
                    <TableCell>
                      <Badge variant={order.status === "PARTIAL" ? "warning" : "secondary"}>
                        {order.status === "PARTIAL" ? "Parcial" : "Aguardando"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground hidden sm:table-cell">
                      {format(new Date(order.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        );
      })}
    </div>
  );
}
