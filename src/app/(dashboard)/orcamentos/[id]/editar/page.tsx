import { redirect } from "next/navigation";
import { Header } from "@/components/layout/header";
import { QuoteBuilder } from "@/modules/quotes/quote-builder";
import { getCustomers } from "@/modules/customers/actions";
import { getProducts } from "@/modules/products/actions";
import { getFreightZones } from "@/modules/freight/actions";
import { getSettings } from "@/modules/settings/actions";
import { getQuoteById } from "@/modules/quotes/actions";
import { serialize } from "@/utils/serialize";

export default async function EditarOrcamentoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [quote, customers, products, freightZones, settings] = serialize(
    await Promise.all([
      getQuoteById(id),
      getCustomers(),
      getProducts(),
      getFreightZones(),
      getSettings(),
    ])
  );

  if (!quote) redirect("/orcamentos");
  if (!["DRAFT", "SENT"].includes(quote.status)) redirect(`/orcamentos/${id}`);

  return (
    <div>
      <Header title="Editar Orçamento" description={`Editando orçamento #${id.slice(-8).toUpperCase()}`} />
      <div className="p-3 md:p-6">
        <QuoteBuilder
          customers={customers}
          products={products}
          freightZones={freightZones}
          companyAddress={settings?.companyAddress}
          initialQuote={quote}
          debitFeePercent={settings?.debitFeePercent ? Number(settings.debitFeePercent) : 1.99}
          linkFeePercent={settings?.installmentFeePercent ? Number(settings.installmentFeePercent) : 12.71}
        />
      </div>
    </div>
  );
}
