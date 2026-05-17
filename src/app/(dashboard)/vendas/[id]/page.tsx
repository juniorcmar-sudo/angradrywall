import { notFound } from "next/navigation";
import { Header } from "@/components/layout/header";
import { prisma } from "@/lib/prisma";
import { serialize } from "@/utils/serialize";
import { SaleDetail } from "@/modules/sales/sale-detail";

interface Props {
  params: Promise<{ id: string }>;
}

async function getSaleById(id: string) {
  return prisma.sale.findUnique({
    where: { id },
    include: {
      customer: true,
      quote: true,
      items: {
        include: {
          product: { include: { category: true } },
        },
      },
    },
  });
}

export default async function SalePage({ params }: Props) {
  const { id } = await params;
  const sale = serialize(await getSaleById(id));

  if (!sale) notFound();

  return (
    <div>
      <Header
        title={`Venda — Orçamento #${sale.quote.number}`}
        description={sale.customer.name}
      />
      <div className="p-3 md:p-6">
        <SaleDetail sale={sale} />
      </div>
    </div>
  );
}
