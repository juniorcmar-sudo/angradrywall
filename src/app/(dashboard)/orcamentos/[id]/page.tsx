import { notFound } from "next/navigation";
import { Header } from "@/components/layout/header";
import { getQuoteById } from "@/modules/quotes/actions";
import { getSettings } from "@/modules/settings/actions";
import { QuoteDetail } from "@/modules/quotes/quote-detail";
import { serialize } from "@/utils/serialize";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function QuotePage({ params }: Props) {
  const { id } = await params;
  const [quote, settings] = serialize(
    await Promise.all([getQuoteById(id), getSettings()])
  );

  if (!quote) notFound();

  return (
    <div>
      <Header
        title={`Orçamento #${quote.number}`}
        description={quote.customer.name}
      />
      <div className="p-6">
        <QuoteDetail
          quote={quote}
          companyName={settings?.companyName}
          companyCnpj={settings?.companyCnpj ?? undefined}
          companyEmail={settings?.companyEmail ?? undefined}
          companyPhone={settings?.companyPhone ?? undefined}
          companyAddress={settings?.companyAddress ?? undefined}
          signatureText={settings?.signatureText ?? undefined}
          debitFeePercent={settings?.debitFeePercent ? Number(settings.debitFeePercent) : 1.99}
          linkFeePercent={settings?.installmentFeePercent ? Number(settings.installmentFeePercent) : 12.71}
        />
      </div>
    </div>
  );
}
