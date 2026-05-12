"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult, StockMovementType } from "@/types";

const movementSchema = z.object({
  productId: z.string().min(1),
  type: z.enum([
    "ENTRY_MANUAL",
    "ENTRY_SUPPLIER",
    "ENTRY_PURCHASE",
    "ENTRY_RESTOCK",
    "EXIT_SALE",
    "EXIT_LOSS",
    "EXIT_DAMAGE",
    "EXIT_BREAK",
    "ADJUSTMENT",
  ]),
  quantity: z.coerce.number().int().min(0, "Quantidade não pode ser negativa"),
  notes: z.string().optional(),
});

export async function registerStockMovement(
  data: z.infer<typeof movementSchema>
): Promise<ActionResult<void>> {
  const parsed = movementSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { productId, type, quantity, notes } = parsed.data;

  try {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return { success: false, error: "Produto não encontrado" };

    if (type === "ADJUSTMENT") {
      await prisma.$transaction([
        prisma.stockMovement.create({
          data: { productId, type: "ADJUSTMENT", quantity, notes },
        }),
        prisma.product.update({
          where: { id: productId },
          data: { stock: quantity },
        }),
      ]);
      revalidatePath("/estoque");
      revalidatePath("/produtos");
      revalidatePath("/dashboard");
      return { success: true, data: undefined };
    }

    const isExit = type.startsWith("EXIT");
    const delta = isExit ? -quantity : quantity;

    if (quantity === 0) {
      return { success: false, error: "Quantidade deve ser maior que 0" };
    }

    if (isExit && product.stock < quantity) {
      return { success: false, error: "Estoque insuficiente" };
    }

    await prisma.$transaction([
      prisma.stockMovement.create({
        data: { productId, type: type as StockMovementType, quantity, notes },
      }),
      prisma.product.update({
        where: { id: productId },
        data: { stock: { increment: delta } },
      }),
    ]);

    revalidatePath("/estoque");
    revalidatePath("/produtos");
    revalidatePath("/dashboard");
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Erro ao registrar movimentação" };
  }
}

export async function getStockOverview() {
  const [products, movements] = await Promise.all([
    prisma.product.findMany({
      where: { active: true, deleted: false },
      include: { category: true },
      orderBy: { stock: "asc" },
    }),
    prisma.stockMovement.findMany({
      take: 50,
      orderBy: { createdAt: "desc" },
      include: { product: true },
    }),
  ]);

  const lowStock = products.filter(
    (p) => p.minimumStock > 0 && p.stock <= p.minimumStock
  );

  return { products, movements, lowStock };
}
