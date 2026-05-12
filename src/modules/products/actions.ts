"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/types";

const productSchema = z.object({
  internalCode: z.string().optional(),
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  brand: z.string().optional(),
  description: z.string().optional(),
  categoryId: z.string().optional(),
  minimumStock: z.coerce.number().min(0).default(0),
  basePriceCommon: z.coerce.number().min(0, "Preço deve ser positivo"),
  basePriceDrywall: z.coerce.number().min(0, "Preço deve ser positivo"),
  tagIds: z.array(z.string()).optional(),
});

async function generateInternalCode(categoryId?: string | null): Promise<string> {
  let prefix = "PRD";
  if (categoryId) {
    const cat = await prisma.category.findUnique({ where: { id: categoryId } });
    if (cat) {
      const letters = cat.name.toUpperCase().replace(/[^A-Z]/g, "");
      prefix = letters.slice(0, 3).padEnd(3, "X");
    }
  }
  const existing = await prisma.product.findMany({
    where: { internalCode: { startsWith: `${prefix}-` } },
    select: { internalCode: true },
  });
  const nums = existing
    .map((p) => parseInt(p.internalCode.split("-")[1] ?? "0", 10))
    .filter((n) => !isNaN(n));
  const next = nums.length ? Math.max(...nums) + 1 : 1;
  return `${prefix}-${String(next).padStart(3, "0")}`;
}

export async function createProduct(
  data: z.infer<typeof productSchema>
): Promise<ActionResult<{ id: string }>> {
  const parsed = productSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { tagIds, internalCode: rawCode, ...productData } = parsed.data;
  const internalCode = rawCode?.trim() || await generateInternalCode(productData.categoryId);

  try {
    const product = await prisma.product.create({
      data: {
        ...productData,
        internalCode,
        categoryId: productData.categoryId || null,
        productTags: tagIds?.length
          ? { create: tagIds.map((tagId) => ({ tagId })) }
          : undefined,
      },
    });
    revalidatePath("/produtos");
    return { success: true, data: { id: product.id } };
  } catch (e: unknown) {
    if ((e as { code?: string }).code === "P2002") {
      // Race condition: regenerate and retry once
      try {
        const retryCode = await generateInternalCode(productData.categoryId);
        const product = await prisma.product.create({
          data: {
            ...productData,
            internalCode: retryCode,
            categoryId: productData.categoryId || null,
            productTags: tagIds?.length
              ? { create: tagIds.map((tagId) => ({ tagId })) }
              : undefined,
          },
        });
        revalidatePath("/produtos");
        return { success: true, data: { id: product.id } };
      } catch {
        return { success: false, error: "Código interno já existe" };
      }
    }
    return { success: false, error: "Erro ao criar produto" };
  }
}

export async function updateProduct(
  id: string,
  data: z.infer<typeof productSchema>
): Promise<ActionResult<void>> {
  const parsed = productSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { tagIds, ...productData } = parsed.data;

  try {
    await prisma.$transaction([
      prisma.productTag.deleteMany({ where: { productId: id } }),
      prisma.product.update({
        where: { id },
        data: {
          ...productData,
          categoryId: productData.categoryId || null,
          productTags: tagIds?.length
            ? { create: tagIds.map((tagId) => ({ tagId })) }
            : undefined,
        },
      }),
    ]);
    revalidatePath("/produtos");
    return { success: true, data: undefined };
  } catch (e: unknown) {
    if ((e as { code?: string }).code === "P2002") {
      return { success: false, error: "Código interno já existe" };
    }
    return { success: false, error: "Erro ao atualizar produto" };
  }
}

export async function deleteProduct(id: string): Promise<ActionResult<void>> {
  try {
    await prisma.product.delete({ where: { id } });
    revalidatePath("/produtos");
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Erro ao excluir produto" };
  }
}

export async function toggleProductActive(id: string, active: boolean): Promise<ActionResult<void>> {
  try {
    await prisma.product.update({ where: { id }, data: { active } });
    revalidatePath("/produtos");
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Erro ao atualizar produto" };
  }
}

export async function getProducts(search?: string, categoryId?: string, showInactive = false) {
  return prisma.product.findMany({
    where: {
      deleted: false,
      ...(showInactive ? {} : { active: true }),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { internalCode: { contains: search, mode: "insensitive" } },
              { brand: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(categoryId ? { categoryId } : {}),
    },
    include: {
      category: true,
      productTags: { include: { tag: true } },
    },
    orderBy: [{ active: "desc" }, { name: "asc" }],
  });
}

export async function getCategories() {
  return prisma.category.findMany({ orderBy: { name: "asc" } });
}

export async function getTags() {
  return prisma.tag.findMany({ orderBy: { name: "asc" } });
}
