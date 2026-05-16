import { notFound } from "next/navigation";
import { Header } from "@/components/layout/header";
import { getQuoteById, getQuoteTimeline } from "@/modules/quotes/actions";
import { getSettings } from "@/modules/settings/actions";
import { QuoteDetail } from "@/modules/quotes/quote-detail";
import { serialize } from "@/utils/serialize";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function QuotePage({ params }: Props) {
  const { id } = await params;
  const [quote, settings, timeline] = serialize(
    await Promise.all([getQuoteById(id), getSettings(), getQuoteTimeline(id)])
  );

  if (!quote) notFound();

  return (
    <div>
      <Header
        title={`Orçamento #${quote.number}`}
        description={quote.customer.name}
      />
      <div className="p-3 md:p-6">
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
          timeline={timeline}
        />
      </div>
    </div>
  );
}
