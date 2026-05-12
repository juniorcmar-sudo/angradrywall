"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/types";

const zoneSchema = z.object({
  name: z.string().min(2, "Nome obrigatório"),
  price: z.coerce.number().min(0, "Preço deve ser positivo"),
});

export async function createFreightZone(
  data: z.infer<typeof zoneSchema>
): Promise<ActionResult<{ id: string }>> {
  const parsed = zoneSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  try {
    const zone = await prisma.freightZone.create({ data: parsed.data });
    revalidatePath("/fretes");
    return { success: true, data: { id: zone.id } };
  } catch {
    return { success: false, error: "Bairro já cadastrado" };
  }
}

export async function updateFreightZone(
  id: string,
  data: z.infer<typeof zoneSchema>
): Promise<ActionResult<void>> {
  const parsed = zoneSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  try {
    await prisma.freightZone.update({ where: { id }, data: parsed.data });
    revalidatePath("/fretes");
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Erro ao atualizar" };
  }
}

export async function toggleFreightZone(id: string, active: boolean): Promise<ActionResult<void>> {
  try {
    await prisma.freightZone.update({ where: { id }, data: { active } });
    revalidatePath("/fretes");
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Erro ao atualizar" };
  }
}

export async function deleteFreightZone(id: string): Promise<ActionResult<void>> {
  try {
    const inUse = await prisma.quote.count({
      where: { freightZoneId: id, status: { in: ["DRAFT", "SENT", "AWAITING_PAYMENT"] } },
    });
    if (inUse > 0) {
      return {
        success: false,
        error: `Zona em uso por ${inUse} orçamento(s) ativo(s). Cancele-os antes de excluir.`,
      };
    }
    await prisma.freightZone.delete({ where: { id } });
    revalidatePath("/fretes");
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Erro ao excluir zona de frete" };
  }
}

export async function getFreightZones() {
  return prisma.freightZone.findMany({ orderBy: { name: "asc" } });
}
