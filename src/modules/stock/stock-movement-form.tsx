"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { registerStockMovement } from "./actions";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import type { Product } from "@/types";

const schema = z.object({
  productId: z.string().min(1, "Selecione um produto"),
  type: z.enum([
    "ENTRY_MANUAL",
    "EXIT_BREAK",
    "EXIT_DAMAGE",
    "ADJUSTMENT",
  ]),
  quantity: z.coerce.number().int().min(0, "Quantidade mínima: 0"),
  notes: z.string().optional(),
});

const TYPE_OPTIONS = [
  {
    value: "ENTRY_MANUAL",
    label: "Entrada Manual",
    description: "Adicionar estoque",
    dot: "bg-emerald-500",
    bg: "border-emerald-200 bg-emerald-50 hover:bg-emerald-100",
    activeBg: "border-emerald-500 bg-emerald-100 ring-1 ring-emerald-400",
    text: "text-emerald-800",
  },
  {
    value: "EXIT_BREAK",
    label: "Saída por Quebra",
    description: "Produto quebrado",
    dot: "bg-red-500",
    bg: "border-red-200 bg-red-50 hover:bg-red-100",
    activeBg: "border-red-500 bg-red-100 ring-1 ring-red-400",
    text: "text-red-800",
  },
  {
    value: "EXIT_DAMAGE",
    label: "Saída por Avaria",
    description: "Produto avariado",
    dot: "bg-orange-500",
    bg: "border-orange-200 bg-orange-50 hover:bg-orange-100",
    activeBg: "border-orange-500 bg-orange-100 ring-1 ring-orange-400",
    text: "text-orange-800",
  },
  {
    value: "ADJUSTMENT",
    label: "Ajuste de Estoque",
    description: "Corrigir quantidade",
    dot: "bg-amber-500",
    bg: "border-amber-200 bg-amber-50 hover:bg-amber-100",
    activeBg: "border-amber-500 bg-amber-100 ring-1 ring-amber-400",
    text: "text-amber-800",
  },
] as const;

interface StockMovementFormProps {
  products: Product[];
  defaultProductId?: string;
  onSuccess?: () => void;
}

export function StockMovementForm({
  products,
  defaultProductId,
  onSuccess,
}: StockMovementFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      productId: defaultProductId ?? "",
      type: "ENTRY_MANUAL" as const,
      quantity: 1,
      notes: "",
    },
  });

  const selectedType = useWatch({ control, name: "type", defaultValue: "ENTRY_MANUAL" });
  const isAdjustment = selectedType === "ADJUSTMENT";

  async function onSubmit(data: z.infer<typeof schema>) {
    const result = await registerStockMovement(data as Parameters<typeof registerStockMovement>[0]);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Movimentação registrada!");
    reset();
    onSuccess?.();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label>Produto *</Label>
        <Select
          defaultValue={defaultProductId ?? ""}
          onValueChange={(v) => setValue("productId", v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecionar produto" />
          </SelectTrigger>
          <SelectContent>
            {products.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                [{p.internalCode}] {p.name} — Estoque: {p.stock}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.productId && (
          <p className="text-xs text-destructive">{errors.productId.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Tipo de movimentação *</Label>
        <div className="grid grid-cols-2 gap-2">
          {TYPE_OPTIONS.map((opt) => {
            const isSelected = selectedType === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setValue("type", opt.value)}
                className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                  isSelected ? opt.activeBg : opt.bg
                }`}
              >
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${opt.dot}`} />
                <div>
                  <p className={`text-xs font-semibold leading-tight ${opt.text}`}>{opt.label}</p>
                  <p className="text-xs text-muted-foreground">{opt.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="quantity">
          {isAdjustment ? "Estoque Final *" : "Quantidade *"}
        </Label>
        <Input
          id="quantity"
          type="number" onFocus={(e) => e.target.select()}
          min={isAdjustment ? "0" : "1"}
          {...register("quantity")}
        />
        {isAdjustment && (
          <p className="text-xs text-muted-foreground">
            Define a quantidade absoluta do produto
          </p>
        )}
        {errors.quantity && (
          <p className="text-xs text-destructive">{errors.quantity.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Observações</Label>
        <Textarea
          id="notes"
          placeholder="Motivo, fornecedor, nota fiscal..."
          rows={2}
          {...register("notes")}
        />
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        Registrar Movimentação
      </Button>
    </form>
  );
}
