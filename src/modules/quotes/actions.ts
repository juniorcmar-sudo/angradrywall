"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { addDays } from "date-fns";
import type { Prisma } from "@prisma/client";
import type { ActionResult, QuoteStatus } from "@/types";

const quoteItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().int().min(1),
  unitPrice: z.coerce.number().min(0),
  finalPrice: z.coerce.number().min(0),
});

const creditInstallmentSchema = z.object({
  installments: z.coerce.number().int().min(1),
  value: z.coerce.number().min(0),
});

const quoteSchema = z.object({
  customerId: z.string().min(1, "Selecione um cliente"),
  paymentMethod: z.enum(["PIX", "CASH", "DEBIT", "CREDIT", "LINK_3X"]).optional().nullable(),
  installments: z.number().int().min(1).max(24).optional().nullable(),
  installmentValue: z.number().min(0).optional().nullable(),
  freightType: z.string().default("DELIVERY"),
  freightZoneId: z.string().optional(),
  freightValue: z.coerce.number().min(0).default(0),
  discount: z.coerce.number().min(0).default(0),
  internalNotes: z.string().optional(),
  customerNotes: z.string().optional(),
  items: z.array(quoteItemSchema).min(1, "Adicione pelo menos um produto"),
  creditInstallments: z.array(creditInstallmentSchema).optional().default([]),
});

export async function createQuote(
  data: z.infer<typeof quoteSchema>
): Promise<ActionResult<{ id: string }>> {
  const parsed = quoteSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { items, freightZoneId, creditInstallments, ...quoteData } = parsed.data;

  const subtotal = items.reduce(
    (sum, item) => sum + item.finalPrice * item.quantity,
    0
  );

  const finalTotal = subtotal + quoteData.freightValue - quoteData.discount;

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
        creditInstallments: creditInstallments && creditInstallments.length > 0
          ? {
              create: creditInstallments.map((ci, i) => ({
                installments: ci.installments,
                value: ci.value,
                sortOrder: i,
              })),
            }
          : undefined,
      },
    });

    await prisma.timelineEvent.create({
      data: {
        entityType: "QUOTE",
        entityId: quote.id,
        action: "CRIADO",
        description: "Orçamento criado",
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

    const STATUS_DESCRIPTIONS: Partial<Record<QuoteStatus, string>> = {
      SENT: "Orçamento enviado ao cliente",
      AWAITING_PAYMENT: "Aguardando pagamento",
      PAID: "Pagamento confirmado",
      CANCELLED: "Orçamento cancelado",
      DRAFT: "Orçamento reaberto como rascunho",
    };
    await prisma.timelineEvent.create({
      data: {
        entityType: "QUOTE",
        entityId: id,
        action: status,
        description: STATUS_DESCRIPTIONS[status] ?? status,
      },
    });

    revalidatePath("/orcamentos");
    revalidatePath(`/orcamentos/${id}`);
    revalidatePath("/dashboard");
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Erro ao atualizar status" };
  }
}

type QuoteStockItem = { productId: string; quantity: number };

/**
 * Baixa o estoque dos itens de um orçamento dentro de uma transação.
 * Quando o estoque é insuficiente, gera um PendingOrder com o saldo faltante
 * e zera o disponível.
 *
 * Usado por dois fluxos distintos:
 * - conversão em venda (pagamento confirmado) → EXIT_SALE
 * - baixa antecipada, sem pagamento → EXIT_UNPAID
 */
async function deductStockForQuote(
  tx: Prisma.TransactionClient,
  params: {
    items: QuoteStockItem[];
    customerId: string;
    quoteId: string;
    movementType: "EXIT_SALE" | "EXIT_UNPAID";
    referenceId: string;
    notesLabel: string;
  }
) {
  const { items, customerId, quoteId, movementType, referenceId, notesLabel } = params;

  for (const item of items) {
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
          type: movementType,
          quantity: item.quantity,
          notes: notesLabel,
          referenceId,
        },
      });
    } else {
      // Estoque insuficiente → pendência com o saldo faltante
      await tx.pendingOrder.create({
        data: {
          customerId,
          productId: item.productId,
          quoteId,
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
            type: movementType,
            quantity: product.stock,
            notes: `${notesLabel} (parcial)`,
            referenceId,
          },
        });
      }
    }
  }
}

/**
 * Dá baixa no estoque de um orçamento antes do pagamento (mercadoria entregue,
 * cobrança pendente). Marca o orçamento com `stockReleasedAt` para que a
 * confirmação de pagamento não movimente o estoque de novo.
 */
export async function releaseQuoteStock(
  id: string,
  notes?: string
): Promise<ActionResult<void>> {
  try {
    const quote = await prisma.quote.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!quote) return { success: false, error: "Orçamento não encontrado" };

    if (quote.stockReleasedAt) {
      return { success: false, error: "O estoque deste orçamento já foi baixado" };
    }
    if (!["SENT", "AWAITING_PAYMENT"].includes(quote.status)) {
      return {
        success: false,
        error: "Só é possível dar baixa em orçamentos enviados ou aguardando pagamento",
      };
    }

    const label = `Baixa sem pagamento — Orçamento #${String(quote.number).padStart(4, "0")}`;

    const claimed = await prisma.$transaction(async (tx) => {
      // Trava atômica: só o primeiro clique consegue marcar o orçamento.
      const claim = await tx.quote.updateMany({
        where: { id, stockReleasedAt: null },
        data: { stockReleasedAt: new Date(), stockReleaseNotes: notes?.trim() || null },
      });
      if (claim.count === 0) return false;

      await deductStockForQuote(tx, {
        items: quote.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        customerId: quote.customerId,
        quoteId: quote.id,
        movementType: "EXIT_UNPAID",
        referenceId: quote.id,
        notesLabel: label,
      });

      await tx.timelineEvent.create({
        data: {
          entityType: "QUOTE",
          entityId: quote.id,
          action: "STOCK_RELEASED",
          description: notes?.trim()
            ? `Estoque baixado sem pagamento — ${notes.trim()}`
            : "Estoque baixado sem pagamento",
        },
      });

      return true;
    });

    if (!claimed) {
      return { success: false, error: "O estoque deste orçamento já foi baixado" };
    }

    revalidatePath("/orcamentos");
    revalidatePath(`/orcamentos/${id}`);
    revalidatePath("/contas-a-receber");
    revalidatePath("/estoque");
    revalidatePath("/produtos");
    revalidatePath("/dashboard");
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Erro ao dar baixa no estoque" };
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

  // Estoque já baixado antecipadamente → registra a venda sem tocar no estoque
  const stockAlreadyReleased = Boolean(quote.stockReleasedAt);

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

    if (stockAlreadyReleased) return;

    await deductStockForQuote(tx, {
      items: quote.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      customerId: quote.customerId,
      quoteId: quote.id,
      movementType: "EXIT_SALE",
      referenceId: sale.id,
      notesLabel: `Venda #${sale.id}`,
    });
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

  const { items, freightZoneId, creditInstallments, ...quoteData } = parsed.data;
  const subtotal = items.reduce((sum, item) => sum + item.finalPrice * item.quantity, 0);
  const finalTotal = subtotal + quoteData.freightValue - quoteData.discount;

  try {
    await prisma.$transaction(async (tx) => {
      await tx.quoteItem.deleteMany({ where: { quoteId: id } });
      await tx.quoteCreditInstallment.deleteMany({ where: { quoteId: id } });
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
          creditInstallments: creditInstallments && creditInstallments.length > 0
            ? {
                create: creditInstallments.map((ci, i) => ({
                  installments: ci.installments,
                  value: ci.value,
                  sortOrder: i,
                })),
              }
            : undefined,
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
  paymentMethod: "PIX" | "CASH" | "DEBIT" | "CREDIT" | "LINK_3X",
  installments?: number | null,
  installmentValue?: number | null
): Promise<ActionResult<void>> {
  try {
    const quote = await prisma.quote.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!quote) return { success: false, error: "Orçamento não encontrado" };

    const settings = await prisma.settings.findFirst();
    const debitFeePercent = Number(settings?.debitFeePercent?.toString() ?? "1.99");
    const linkFeePercent = Number(settings?.installmentFeePercent?.toString() ?? "12.71");
    const freightValue = Number(quote.freightValue.toString());
    const discount = Number(quote.discount.toString());

    // Recalculate subtotal from base item prices (unitPrice)
    const baseSubtotal = quote.items.reduce(
      (sum, item) => sum + Number(item.unitPrice.toString()) * item.quantity,
      0
    );

    let newSubtotal: number;
    let newFinalTotal: number;

    if (paymentMethod === "DEBIT") {
      newSubtotal = baseSubtotal * (1 + debitFeePercent / 100);
      newFinalTotal = newSubtotal + freightValue - discount;
    } else if (paymentMethod === "LINK_3X") {
      newSubtotal = baseSubtotal * (1 + linkFeePercent / 100);
      newFinalTotal = newSubtotal + freightValue - discount;
    } else if (paymentMethod === "CREDIT" && installments && installments > 0 && installmentValue && installmentValue > 0) {
      // Credit with chosen installment plan: total = installmentValue * installments
      newSubtotal = installmentValue * installments;
      newFinalTotal = newSubtotal + freightValue - discount;
    } else {
      // PIX, CASH, CREDIT (no plan chosen yet) → base price
      newSubtotal = baseSubtotal;
      newFinalTotal = baseSubtotal + freightValue - discount;
    }

    // Compute installmentValue to store
    let computedInstallmentValue: number | null = null;
    if (paymentMethod === "LINK_3X" && installments && installments > 0) {
      computedInstallmentValue = newFinalTotal / installments;
    } else if (paymentMethod === "CREDIT" && installmentValue && installmentValue > 0) {
      computedInstallmentValue = installmentValue;
    }

    await prisma.quote.update({
      where: { id },
      data: {
        paymentMethod,
        installments: installments ?? null,
        installmentValue: computedInstallmentValue,
        subtotal: newSubtotal,
        finalTotal: newFinalTotal,
      },
    });
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
      include: { items: true, creditInstallments: true },
    });
    if (!original) return { success: false, error: "Orçamento não encontrado" };

    const settings = await prisma.settings.findFirst();
    const expirationDays = settings?.quoteExpirationDays ?? 3;

    const copy = await prisma.quote.create({
      data: {
        customerId: original.customerId,
        status: "DRAFT",
        paymentMethod: original.paymentMethod,
        installments: original.installments,
        installmentValue: original.installmentValue,
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
        creditInstallments: original.creditInstallments.length > 0
          ? {
              create: original.creditInstallments.map((ci) => ({
                installments: ci.installments,
                value: ci.value,
                sortOrder: ci.sortOrder,
              })),
            }
          : undefined,
      },
    });

    await prisma.timelineEvent.create({
      data: {
        entityType: "QUOTE",
        entityId: copy.id,
        action: "CRIADO",
        description: `Duplicado do orçamento #${String(original.number).padStart(4, "0")}`,
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

/**
 * Contas a receber: orçamentos cuja mercadoria já saiu do estoque
 * mas que ainda não foram pagos.
 */
export async function getReceivableQuotes() {
  return prisma.quote.findMany({
    where: {
      stockReleasedAt: { not: null },
      status: { notIn: ["PAID", "CANCELLED"] },
    },
    include: {
      customer: true,
      items: { include: { product: true } },
    },
    orderBy: { stockReleasedAt: "asc" },
  });
}

export async function getQuoteById(id: string) {
  return prisma.quote.findUnique({
    where: { id },
    include: {
      customer: true,
      freightZone: true,
      items: { include: { product: { include: { category: true } } } },
      creditInstallments: { orderBy: { sortOrder: "asc" } },
    },
  });
}

export async function getQuoteTimeline(quoteId: string) {
  return prisma.timelineEvent.findMany({
    where: { entityType: "QUOTE", entityId: quoteId },
    orderBy: { createdAt: "asc" },
  });
}
