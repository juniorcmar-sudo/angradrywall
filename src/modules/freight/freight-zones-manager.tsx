"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Pencil, Loader2, Truck, Trash2 } from "lucide-react";
import { createFreightZone, updateFreightZone, toggleFreightZone, deleteFreightZone } from "./actions";
import { toast } from "sonner";
import { formatCurrency } from "@/utils/currency";
import type { FreightZone } from "@/types";

const schema = z.object({
  name: z.string().min(2, "Nome obrigatório"),
  price: z.number().min(0, "Preço inválido"),
});

type FormData = z.infer<typeof schema>;

interface FreightZonesManagerProps {
  zones: FreightZone[];
}

export function FreightZonesManager({ zones: initialZones }: FreightZonesManagerProps) {
  const [editingZone, setEditingZone] = useState<FreightZone | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<FreightZone | null>(null);
  const [deleting, setDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const {
    register: registerEdit,
    handleSubmit: handleEditSubmit,
    reset: resetEdit,
    formState: { errors: editErrors, isSubmitting: editSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: editingZone ? { name: editingZone.name, price: Number(editingZone.price.toString()) } : {},
  });

  async function onCreate(data: FormData) {
    const result = await createFreightZone(data);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Zona criada!");
    reset();
    setCreateOpen(false);
  }

  async function onEdit(data: FormData) {
    if (!editingZone) return;
    const result = await updateFreightZone(editingZone.id, data);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Zona atualizada!");
    setEditingZone(null);
  }

  async function handleToggle(zone: FreightZone) {
    const result = await toggleFreightZone(zone.id, !zone.active);
    if (!result.success) toast.error(result.error);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const result = await deleteFreightZone(deleteTarget.id);
    setDeleting(false);
    if (!result.success) {
      toast.error(result.error);
    } else {
      toast.success("Zona excluída");
      setDeleteTarget(null);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex justify-end">
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Zona de Frete
        </Button>
      </div>

      {initialZones.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Truck className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>Nenhuma zona cadastrada</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {initialZones.map((zone) => (
            <Card key={zone.id} className={!zone.active ? "opacity-60" : ""}>
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <Truck className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{zone.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(Number(zone.price.toString()))}
                    </p>
                  </div>
                  {!zone.active && (
                    <Badge variant="secondary">Inativa</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingZone(zone);
                      resetEdit({ name: zone.name, price: Number(zone.price.toString()) });
                    }}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggle(zone)}
                  >
                    {zone.active ? "Desativar" : "Ativar"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setDeleteTarget(zone)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Zona de Frete</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onCreate)} className="space-y-4">
            <div className="space-y-2">
              <Label>Bairro / Zona</Label>
              <Input placeholder="Ex: Japuíba" {...register("name")} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Valor do Frete (R$)</Label>
              <Input type="number" onFocus={(e) => e.target.select()} step="0.01" min="0" placeholder="50.00" {...register("price", { valueAsNumber: true })} />
              {errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Criar Zona
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir zona de frete</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja excluir a zona{" "}
            <span className="font-semibold text-foreground">{deleteTarget?.name}</span>?
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

      {/* Edit dialog */}
      <Dialog open={!!editingZone} onOpenChange={(open) => !open && setEditingZone(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Zona de Frete</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit(onEdit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Bairro / Zona</Label>
              <Input placeholder="Ex: Japuíba" {...registerEdit("name")} />
              {editErrors.name && <p className="text-xs text-destructive">{editErrors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Valor do Frete (R$)</Label>
              <Input type="number" onFocus={(e) => e.target.select()} step="0.01" min="0" {...registerEdit("price", { valueAsNumber: true })} />
              {editErrors.price && <p className="text-xs text-destructive">{editErrors.price.message}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={editSubmitting}>
              {editSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Atualizar
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
