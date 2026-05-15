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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MoreHorizontal, Search, UserPlus, Eye, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { deleteCustomer } from "./actions";
import { toast } from "sonner";
import { CustomerForm } from "./customer-form";
import type { Customer } from "@/types";

type CustomerWithCount = Customer & {
  _count: { quotes: number; sales: number };
};

interface CustomersTableProps {
  customers: CustomerWithCount[];
}

const TYPE_LABELS = {
  COMMON: "Cliente Comum",
  DRYWALL_WORKER: "Gesseiro",
};

export function CustomersTable({ customers }: CustomersTableProps) {
  const [search, setSearch] = useState("");
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [newCustomerOpen, setNewCustomerOpen] = useState(false);

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone1?.includes(search) ||
      c.cpfCnpj?.includes(search)
  );

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Desativar o cliente "${name}"?`)) return;
    const result = await deleteCustomer(id);
    if (!result.success) {
      toast.error(result.error);
    } else {
      toast.success("Cliente desativado");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:items-center">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar clientes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={() => setNewCustomerOpen(true)} className="w-full sm:w-auto flex-shrink-0">
          <UserPlus className="w-4 h-4 mr-2" />
          Novo Cliente
        </Button>
      </div>

      <div className="rounded-md border border-border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead className="hidden sm:table-cell">Tipo</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead className="hidden md:table-cell">CPF/CNPJ</TableHead>
              <TableHead className="text-center hidden sm:table-cell">Orçamentos</TableHead>
              <TableHead className="text-center hidden md:table-cell">Compras</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  Nenhum cliente encontrado
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">{customer.name}</TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge
                      variant={customer.type === "DRYWALL_WORKER" ? "info" : "secondary"}
                    >
                      {TYPE_LABELS[customer.type]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {customer.phone1 ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground hidden md:table-cell">
                    {customer.cpfCnpj ?? "—"}
                  </TableCell>
                  <TableCell className="text-center hidden sm:table-cell">{customer._count.quotes}</TableCell>
                  <TableCell className="text-center hidden md:table-cell">{customer._count.sales}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/clientes/${customer.id}`}>
                            <Eye className="w-4 h-4 mr-2" />
                            Ver detalhes
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setEditingCustomer(customer)}
                        >
                          <Pencil className="w-4 h-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleDelete(customer.id, customer.name)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Desativar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={!!editingCustomer}
        onOpenChange={(open) => !open && setEditingCustomer(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar cliente</DialogTitle>
          </DialogHeader>
          {editingCustomer && (
            <CustomerForm
              customer={editingCustomer}
              onSuccess={() => setEditingCustomer(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={newCustomerOpen} onOpenChange={setNewCustomerOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Novo cliente</DialogTitle>
          </DialogHeader>
          <CustomerForm onSuccess={() => setNewCustomerOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
