"use server";

import { prisma } from "@/lib/prisma";

export type SearchResult = {
  type: "customer" | "product" | "quote" | "sale";
  id: string;
  title: string;
  subtitle: string;
  href: string;
};

export async function globalSearch(query: string): Promise<SearchResult[]> {
  const term = query.trim();
  if (term.length < 2) return [];

  const numericTerm = Number(term);
  const isNumeric = !isNaN(numericTerm);

  const [customers, products, quotes] = await Promise.all([
    prisma.customer.findMany({
      where: {
        OR: [
          { name: { contains: term, mode: "insensitive" } },
          { phone1: { contains: term } },
          { cpfCnpj: { contains: term } },
        ],
      },
      take: 5,
    }),
    prisma.product.findMany({
      where: {
        deleted: false,
        OR: [
          { name: { contains: term, mode: "insensitive" } },
          { internalCode: { contains: term, mode: "insensitive" } },
        ],
      },
      take: 5,
    }),
    prisma.quote.findMany({
      where: isNumeric
        ? { number: numericTerm }
        : { customer: { name: { contains: term, mode: "insensitive" } } },
      include: { customer: true },
      take: 5,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const results: SearchResult[] = [
    ...customers.map((c) => ({
      type: "customer" as const,
      id: c.id,
      title: c.name,
      subtitle: c.phone1 ?? "Cliente",
      href: `/clientes/${c.id}`,
    })),
    ...products.map((p) => ({
      type: "product" as const,
      id: p.id,
      title: p.name,
      subtitle: `[${p.internalCode}] Estoque: ${p.stock}`,
      href: `/produtos/${p.id}`,
    })),
    ...quotes.map((q) => ({
      type: "quote" as const,
      id: q.id,
      title: `Orçamento #${q.number}`,
      subtitle: q.customer.name,
      href: `/orcamentos/${q.id}`,
    })),
  ];

  return results;
}
