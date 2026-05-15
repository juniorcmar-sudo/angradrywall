import { Header } from "@/components/layout/header";
import { QuoteBuilder } from "@/modules/quotes/quote-builder";
import { getCustomers } from "@/modules/customers/actions";
import { getProducts } from "@/modules/products/actions";
import { getFreightZones } from "@/modules/freight/actions";
import { getSettings } from "@/modules/settings/actions";
import { serialize } from "@/utils/serialize";

export default async function NovoOrcamentoPage() {
  const [customers, products, freightZones, settings] = serialize(
    await Promise.all([getCustomers(), getProducts(), getFreightZones(), getSettings()])
  );

  return (
    <div>
      <Header title="Novo Orçamento" description="Crie um orçamento rapidamente" />
      <div className="p-3 md:p-6">
        <QuoteBuilder
          customers={customers}
          products={products}
          freightZones={freightZones}
          companyAddress={settings?.companyAddress}
          debitFeePercent={settings?.debitFeePercent ? Number(settings.debitFeePercent) : 1.99}
          linkFeePercent={settings?.installmentFeePercent ? Number(settings.installmentFeePercent) : 12.71}
        />
      </div>
    </div>
  );
}
