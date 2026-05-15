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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MoreHorizontal, Search, Plus, Pencil, AlertTriangle, Trash2, Package } from "lucide-react";
import { toggleProductActive, deleteProduct } from "./actions";
import { toast } from "sonner";
import { ProductForm } from "./product-form";
import { formatCurrency } from "@/utils/currency";
import type { Product, Category, Tag } from "@/types";

type ProductWithDetails = Product & {
  category: Category | null;
  productTags: { tag: Tag }[];
};

interface ProductsTableProps {
  products: ProductWithDetails[];
  categories: Category[];
  tags: Tag[];
}

export function ProductsTable({ products, categories, tags }: ProductsTableProps) {
  const [search, setSearch] = useState("");
  const [editingProduct, setEditingProduct] = useState<ProductWithDetails | null>(null);
  const [newProductOpen, setNewProductOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ProductWithDetails | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.internalCode.toLowerCase().includes(search.toLowerCase()) ||
      p.brand?.toLowerCase().includes(search.toLowerCase())
  );

  async function handleToggle(id: string, active: boolean, name: string) {
    const action = active ? "Ativar" : "Desativar";
    if (!confirm(`${action} o produto "${name}"?`)) return;
    const result = await toggleProductActive(id, active);
    if (!result.success) {
      toast.error(result.error);
    } else {
      toast.success(`Produto ${active ? "ativado" : "desativado"}`);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const result = await deleteProduct(deleteTarget.id);
    setDeleting(false);
    if (!result.success) {
      toast.error(result.error);
    } else {
      toast.success("Produto excluído");
      setDeleteTarget(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:items-center">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar produtos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={() => setNewProductOpen(true)} className="w-full sm:w-auto flex-shrink-0">
          <Plus className="w-4 h-4 mr-2" />
          Novo Produto
        </Button>
      </div>

      {/* ── Mobile card list ── */}
      <div className="md:hidden space-y-2">
        {filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-10 text-sm">Nenhum produto encontrado</p>
        ) : (
          filtered.map((product) => {
            const isLowStock = product.stock <= product.minimumStock && product.minimumStock > 0;
            const isInactive = !product.active;
            return (
              <div
                key={product.id}
                className={`flex items-center gap-3 p-3.5 rounded-xl border border-border bg-card ${isInactive ? "opacity-50" : ""}`}
              >
                <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <Package className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <p className="font-medium text-sm truncate">{product.name}</p>
                    {isInactive && <Badge variant="gray" className="text-[10px] py-0 px-1.5">Inativo</Badge>}
                    {isLowStock && !isInactive && <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className={isLowStock ? "text-red-400 font-semibold" : ""}>
                      {product.stock} em estoque
                    </span>
                    {product.category && (
                      <span>· {product.category.name}</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className="font-semibold text-sm">
                    {formatCurrency(Number(product.basePriceCommon.toString()))}
                  </span>
                  <button
                    onClick={() => setEditingProduct(product)}
                    className="text-xs text-primary hover:underline"
                  >
                    Editar
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Desktop table ── */}
      <div className="hidden md:block rounded-md border border-border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="hidden md:table-cell">Código</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead className="hidden md:table-cell">Marca</TableHead>
              <TableHead className="hidden md:table-cell">Categoria</TableHead>
              <TableHead className="text-center">Estoque</TableHead>
              <TableHead className="text-right">Preço Comum</TableHead>
              <TableHead className="text-right hidden md:table-cell">Preço Gesseiro</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  Nenhum produto encontrado
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((product) => {
                const isLowStock =
                  product.stock <= product.minimumStock && product.minimumStock > 0;
                const isInactive = !product.active;
                return (
                  <TableRow key={product.id} className={isInactive ? "opacity-50" : ""}>
                    <TableCell className="font-mono text-xs text-muted-foreground hidden md:table-cell">
                      {product.internalCode}
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {product.name}
                        {isInactive && (
                          <Badge variant="gray" className="text-xs py-0 px-1.5">Inativo</Badge>
                        )}
                        {isLowStock && !isInactive && (
                          <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground hidden md:table-cell">
                      {product.brand ?? "—"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {product.category ? (
                        <Badge variant="secondary">{product.category.name}</Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <span
                        className={
                          isLowStock ? "text-red-400 font-semibold" : "text-foreground"
                        }
                      >
                        {product.stock}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(Number(product.basePriceCommon.toString()))}
                    </TableCell>
                    <TableCell className="text-right hidden md:table-cell">
                      {formatCurrency(Number(product.basePriceDrywall.toString()))}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditingProduct(product)}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleToggle(product.id, !product.active, product.name)}
                          >
                            {product.active ? "Desativar" : "Ativar"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeleteTarget(product)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir permanentemente
                          </DropdownMenuItem>
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

      {/* Edit dialog */}
      <Dialog
        open={!!editingProduct}
        onOpenChange={(open) => !open && setEditingProduct(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar produto</DialogTitle>
          </DialogHeader>
          {editingProduct && (
            <ProductForm
              product={editingProduct}
              categories={categories}
              tags={tags}
              onSuccess={() => setEditingProduct(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* New product dialog */}
      <Dialog open={newProductOpen} onOpenChange={setNewProductOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Novo produto</DialogTitle>
          </DialogHeader>
          <ProductForm
            categories={categories}
            tags={tags}
            onSuccess={() => setNewProductOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir produto</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja excluir permanentemente <span className="font-semibold text-foreground">{deleteTarget?.name}</span>?
            <span className="text-destructive font-medium"> Esta ação não pode ser desfeita.</span>
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Excluindo..." : "Excluir"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
