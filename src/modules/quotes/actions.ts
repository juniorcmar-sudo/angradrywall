"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { addDays } from "date-fns";
import type { ActionResult, QuoteStatus } from "@/types";

const quoteItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().int().min(1),
  unitPrice: z.coerce.number().min(0),
  finalPrice: z.coerce.number().min(0),
});

const quoteSchema = z.object({
  customerId: z.string().min(1, "Selecione um cliente"),
  paymentMethod: z.enum(["PIX", "CASH", "DEBIT", "CREDIT", "LINK_3X"]).optional().nullable(),
  installments: z.coerce.number().int().min(1).max(12).optional().nullable(),
  freightType: z.string().default("DELIVERY"),
  freightZoneId: z.string().optional(),
  freightValue: z.coerce.number().min(0).default(0),
  discount: z.coerce.number().min(0).default(0),
  internalNotes: z.string().optional(),
  customerNotes: z.string().optional(),
  items: z.array(quoteItemSchema).min(1, "Adicione pelo menos um produto"),
});

export async function createQuote(
  data: z.infer<typeof quoteSchema>
): Promise<ActionResult<{ id: string }>> {
  const parsed = quoteSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { items, freightZoneId, ...quoteData } = parsed.data;

  const subtotal = items.reduce(
    (sum, item) => sum + item.finalPrice * item.quantity,
    0
  );
  const finalTotal =
    subtotal + quoteData.freightValue - quoteData.discount;

  try {
    const settings = await prisma.settings.findFirst();
    const expirationDays = settings?.quoteExpirationDays ?? 3;

    const quote = await prisma.quote.create({
      data: {
        ...quoteData,
        freightZoneId: freightZoneId || null,
        subtotal,
        finalTotal,
        validUntil: addDays(new Date(), expirationDays),
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            finalPrice: item.finalPrice * item.quantity,
          })),
        },
      },
    });

    revalidatePath("/orcamentos");
    return { success: true, data: { id: quote.id } };
  } catch {
    return { success: false, error: "Erro ao criar orçamento" };
  }
}

export async function updateQuoteStatus(
  id: string,
  status: QuoteStatus
): Promise<ActionResult<void>> {
  try {
    const quote = await prisma.quote.findUnique({ where: { id } });
    if (!quote) return { success: false, error: "Orçamento não encontrado" };

    const lockedStatuses: QuoteStatus[] = ["AWAITING_PAYMENT", "PAID", "CANCELLED"];
    if (lockedStatuses.includes(quote.status as QuoteStatus) && quote.status !== "AWAITING_PAYMENT") {
      return { success: false, error: "Orçamento travado. Contate o administrador." };
    }

    if (status === "PAID" && !quote.paymentMethod) {
      return { success: false, error: "Defina a forma de pagamento antes de marcar como pago." };
    }

    const updates: Record<string, unknown> = { status };
    if (status === "SENT") updates.sentAt = new Date();
    if (status === "PAID") {
      updates.paidAt = new Date();
      await convertQuoteToSale(id);
    }
    if (status === "CANCELLED") updates.cancelledAt = new Date();

    await prisma.quote.update({ where: { id }, data: updates });
    revalidatePath("/orcamentos");
    revalidatePath(`/orcamentos/${id}`);
    revalidatePath("/dashboard");
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Erro ao atualizar status" };
  }
}

async function convertQuoteToSale(quoteId: string) {
  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: { items: true },
  });
  if (!quote) return;

  const existingSale = await prisma.sale.findUnique({ where: { quoteId } });
  if (existingSale) return;

  await prisma.$transaction(async (tx) => {
    const sale = await tx.sale.create({
      data: {
        quoteId,
        customerId: quote.customerId,
        paymentMethod: quote.paymentMethod ?? "PIX",
        subtotal: quote.subtotal,
        freight: quote.freightValue,
        total: quote.finalTotal,
        paidAt: new Date(),
        items: {
          create: quote.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.finalPrice,
          })),
        },
      },
    });

    // Deduct stock for each item
    for (const item of quote.items) {
      const product = await tx.product.findUnique({ where: { id: item.productId } });
      if (!product) continue;

      if (product.stock >= item.quantity) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            type: "EXIT_SALE",
            quantity: item.quantity,
            notes: `Venda #${sale.id}`,
            referenceId: sale.id,
          },
        });
      } else {
        // Create pending order for insufficient stock
        await tx.pendingOrder.create({
          data: {
            customerId: quote.customerId,
            productId: item.productId,
            quoteId: quote.id,
            quantity: item.quantity - product.stock,
            fulfilled: product.stock,
          },
        });
        if (product.stock > 0) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: 0 },
          });
          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              type: "EXIT_SALE",
              quantity: product.stock,
              notes: `Venda parcial #${sale.id}`,
              referenceId: sale.id,
            },
          });
        }
      }
    }
  });
}

export async function deleteQuote(id: string): Promise<ActionResult<void>> {
  try {
    const quote = await prisma.quote.findUnique({ where: { id } });
    if (!quote) return { success: false, error: "Orçamento não encontrado" };
    if (!["DRAFT", "CANCELLED"].includes(quote.status)) {
      return { success: false, error: "Apenas rascunhos ou cancelados podem ser excluídos" };
    }
    await prisma.pendingOrder.updateMany({ where: { quoteId: id }, data: { quoteId: null } });
    await prisma.quote.delete({ where: { id } });
    revalidatePath("/orcamentos");
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Erro ao excluir orçamento" };
  }
}

export async function updateQuote(
  id: string,
  data: z.infer<typeof quoteSchema>
): Promise<ActionResult<void>> {
  const parsed = quoteSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const existing = await prisma.quote.findUnique({ where: { id } });
  if (!existing) return { success: false, error: "Orçamento não encontrado" };
  if (!["DRAFT", "SENT"].includes(existing.status)) {
    return { success: false, error: "Apenas rascunhos ou enviados podem ser editados" };
  }

  const { items, freightZoneId, ...quoteData } = parsed.data;
  const subtotal = items.reduce((sum, item) => sum + item.finalPrice * item.quantity, 0);
  const finalTotal = subtotal + quoteData.freightValue - quoteData.discount;

  try {
    await prisma.$transaction(async (tx) => {
      await tx.quoteItem.deleteMany({ where: { quoteId: id } });
      await tx.quote.update({
        where: { id },
        data: {
          ...quoteData,
          freightZoneId: freightZoneId || null,
          subtotal,
          finalTotal,
          items: {
            create: items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              finalPrice: item.finalPrice * item.quantity,
            })),
          },
        },
      });
    });
    revalidatePath("/orcamentos");
    revalidatePath(`/orcamentos/${id}`);
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Erro ao atualizar orçamento" };
  }
}

export async function updateQuotePaymentMethod(
  id: string,
  paymentMethod: "PIX" | "CASH" | "DEBIT" | "CREDIT" | "LINK_3X"
): Promise<ActionResult<void>> {
  try {
    await prisma.quote.update({ where: { id }, data: { paymentMethod } });
    revalidatePath(`/orcamentos/${id}`);
    revalidatePath("/orcamentos");
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Erro ao atualizar forma de pagamento" };
  }
}

export async function duplicateQuote(id: string): Promise<ActionResult<{ id: string }>> {
  try {
    const original = await prisma.quote.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!original) return { success: false, error: "Orçamento não encontrado" };

    const settings = await prisma.settings.findFirst();
    const expirationDays = settings?.quoteExpirationDays ?? 3;

    const copy = await prisma.quote.create({
      data: {
        customerId: original.customerId,
        status: "DRAFT",
        paymentMethod: original.paymentMethod,
        freightZoneId: original.freightZoneId,
        freightValue: original.freightValue,
        subtotal: original.subtotal,
        discount: original.discount,
        finalTotal: original.finalTotal,
        internalNotes: original.internalNotes,
        customerNotes: original.customerNotes,
        validUntil: addDays(new Date(), expirationDays),
        items: {
          create: original.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            finalPrice: item.finalPrice,
          })),
        },
      },
    });

    revalidatePath("/orcamentos");
    return { success: true, data: { id: copy.id } };
  } catch {
    return { success: false, error: "Erro ao duplicar orçamento" };
  }
}

export async function getQuotes(status?: string) {
  return prisma.quote.findMany({
    where: status ? { status: status as QuoteStatus } : {},
    include: {
      customer: true,
      freightZone: true,
      items: { include: { product: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getQuoteById(id: string) {
  return prisma.quote.findUnique({
    where: { id },
    include: {
      customer: true,
      freightZone: true,
      items: { include: { product: { include: { category: true } } } },
    },
  });
}
