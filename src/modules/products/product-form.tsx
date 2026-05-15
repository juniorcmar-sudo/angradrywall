"use client";

import { useForm } from "react-hook-form";
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
import { createProduct, updateProduct } from "./actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import type { Product, Category, Tag } from "@/types";

const schema = z.object({
  internalCode: z.string().optional(),
  name: z.string().min(2, "Nome obrigatório"),
  brand: z.string().optional(),
  description: z.string().optional(),
  categoryId: z.string().optional(),
  minimumStock: z.number().min(0),
  basePriceCommon: z.number().min(0, "Preço inválido"),
  basePriceDrywall: z.number().min(0, "Preço inválido"),
  tagIds: z.array(z.string()).optional(),
});

type FormData = z.infer<typeof schema>;

interface ProductWithTags extends Product {
  productTags: { tag: Tag }[];
}

interface ProductFormProps {
  product?: ProductWithTags;
  categories: Category[];
  tags: Tag[];
  onSuccess?: () => void;
}

export function ProductForm({ product, categories, tags, onSuccess }: ProductFormProps) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      internalCode: product?.internalCode ?? "",
      name: product?.name ?? "",
      brand: product?.brand ?? "",
      description: product?.description ?? "",
      categoryId: product?.categoryId ?? "",
      minimumStock: product?.minimumStock ?? 0,
      basePriceCommon: product ? Number(product.basePriceCommon.toString()) : 0,
      basePriceDrywall: product ? Number(product.basePriceDrywall.toString()) : 0,
      tagIds: product?.productTags.map((pt) => pt.tag.id) ?? [],
    },
  });

  // eslint-disable-next-line react-hooks/incompatible-library
  const selectedTagIds = watch("tagIds") ?? [];

  function toggleTag(tagId: string) {
    const current = selectedTagIds;
    if (current.includes(tagId)) {
      setValue("tagIds", current.filter((id) => id !== tagId));
    } else {
      setValue("tagIds", [...current, tagId]);
    }
  }

  async function onSubmit(data: FormData) {
    const result = product
      ? await updateProduct(product.id, data)
      : await createProduct(data);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success(product ? "Produto atualizado!" : "Produto criado!");
    if (onSuccess) {
      onSuccess();
    } else {
      router.push("/produtos");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {product && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="font-mono bg-muted px-2 py-0.5 rounded text-xs font-semibold">
            {product.internalCode}
          </span>
          <span>Código interno</span>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nome *</Label>
          <Input
            id="name"
            placeholder="Ex: Drywall placa 12.5mm"
            {...register("name")}
          />
          {errors.name && (
            <p className="text-xs text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="brand">Marca</Label>
          <Input
            id="brand"
            placeholder="Ex: Placo, Saint-Gobain"
            {...register("brand")}
          />
        </div>

        <div className="space-y-2">
          <Label>Categoria</Label>
          <Select
            defaultValue={product?.categoryId ?? "none"}
            onValueChange={(v) => setValue("categoryId", v === "none" ? undefined : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecionar categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sem categoria</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="basePriceCommon">Preço Cliente Comum (R$) *</Label>
          <Input
            id="basePriceCommon"
            type="number" onFocus={(e) => e.target.select()}
            step="0.01"
            min="0"
            placeholder="0.00"
            {...register("basePriceCommon", { valueAsNumber: true })}
          />
          {errors.basePriceCommon && (
            <p className="text-xs text-destructive">{errors.basePriceCommon.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="basePriceDrywall">Preço Gesseiro (R$) *</Label>
          <Input
            id="basePriceDrywall"
            type="number" onFocus={(e) => e.target.select()}
            step="0.01"
            min="0"
            placeholder="0.00"
            {...register("basePriceDrywall", { valueAsNumber: true })}
          />
          {errors.basePriceDrywall && (
            <p className="text-xs text-destructive">{errors.basePriceDrywall.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="minimumStock">Estoque Mínimo</Label>
          <Input
            id="minimumStock"
            type="number" onFocus={(e) => e.target.select()}
            min="0"
            placeholder="0"
            {...register("minimumStock", { valueAsNumber: true })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          placeholder="Descrição do produto..."
          rows={3}
          {...register("description")}
        />
      </div>

      {tags.length > 0 && (
        <div className="space-y-2">
          <Label>Tags</Label>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggleTag(tag.id)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  selectedTagIds.includes(tag.id)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:border-primary"
                }`}
              >
                {tag.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {product ? "Atualizar" : "Criar Produto"}
        </Button>
      </div>
    </form>
  );
}
