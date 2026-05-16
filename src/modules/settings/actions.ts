"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/types";

const settingsSchema = z.object({
  companyName: z.string().min(2),
  companyCnpj: z.string().optional(),
  companyEmail: z.string().optional(),
  companyPhone: z.string().optional(),
  companyAddress: z.string().optional(),
  companyLogo: z.string().optional(),
  signatureText: z.string().optional(),
  quoteExpirationDays: z.coerce.number().int().min(1).max(30),
  debitFeePercent: z.coerce.number().min(0),
  installmentFeePercent: z.coerce.number().min(0),
});

export async function getSettings() {
  return prisma.settings.findFirst();
}

export async function saveSettings(
  data: z.infer<typeof settingsSchema>
): Promise<ActionResult<void>> {
  const parsed = settingsSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  try {
    const existing = await prisma.settings.findFirst();
    if (existing) {
      await prisma.settings.update({ where: { id: existing.id }, data: parsed.data });
    } else {
      await prisma.settings.create({ data: parsed.data });
    }
    revalidatePath("/configuracoes");
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Erro ao salvar configurações" };
  }
}
