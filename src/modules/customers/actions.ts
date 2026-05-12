"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/types";

const customerSchema = z.object({
  name: z.string().min(2, "Nome obrigatório"),
  type: z.enum(["COMMON", "DRYWALL_WORKER"]),
  razaoSocial: z.string().optional(),
  cpfCnpj: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone1: z.string().min(1, "Telefone obrigatório"),
  phone2: z.string().optional(),
  cep: z.string().optional(),
  rua: z.string().optional(),
  numero: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  uf: z.string().max(2).optional(),
  notes: z.string().optional(),
});

export async function createCustomer(
  data: z.infer<typeof customerSchema>
): Promise<ActionResult<{ id: string }>> {
  const parsed = customerSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }
  try {
    const { email, ...rest } = parsed.data;
    const customer = await prisma.customer.create({
      data: { ...rest, email: email || null },
    });
    revalidatePath("/clientes");
    return { success: true, data: { id: customer.id } };
  } catch {
    return { success: false, error: "Erro ao criar cliente" };
  }
}

export async function createCustomerQuick(
  data: z.infer<typeof customerSchema>
): Promise<ActionResult<{ id: string; name: string; type: string; phone1: string | null }>> {
  const parsed = customerSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }
  try {
    const { email, ...rest } = parsed.data;
    const customer = await prisma.customer.create({
      data: { ...rest, email: email || null },
      select: { id: true, name: true, type: true, phone1: true },
    });
    revalidatePath("/clientes");
    return { success: true, data: customer };
  } catch {
    return { success: false, error: "Erro ao criar cliente" };
  }
}

export async function updateCustomer(
  id: string,
  data: z.infer<typeof customerSchema>
): Promise<ActionResult<void>> {
  const parsed = customerSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }
  try {
    const { email, ...rest } = parsed.data;
    await prisma.customer.update({ where: { id }, data: { ...rest, email: email || null } });
    revalidatePath("/clientes");
    revalidatePath(`/clientes/${id}`);
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Erro ao atualizar cliente" };
  }
}

export async function deleteCustomer(id: string): Promise<ActionResult<void>> {
  try {
    await prisma.customer.update({ where: { id }, data: { active: false } });
    revalidatePath("/clientes");
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Erro ao desativar cliente" };
  }
}

export async function getCustomers(search?: string) {
  return prisma.customer.findMany({
    where: {
      active: true,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { razaoSocial: { contains: search, mode: "insensitive" } },
              { cpfCnpj: { contains: search, mode: "insensitive" } },
              { phone1: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: { _count: { select: { quotes: true, sales: true } } },
    orderBy: { name: "asc" },
  });
}

export async function getCustomerById(id: string) {
  return prisma.customer.findUnique({
    where: { id },
    include: {
      quotes: {
        take: 10,
        orderBy: { createdAt: "desc" },
        include: { items: { include: { product: true } } },
      },
      sales: {
        take: 10,
        orderBy: { createdAt: "desc" },
        include: { items: { include: { product: true } } },
      },
      _count: { select: { quotes: true, sales: true } },
    },
  });
}
