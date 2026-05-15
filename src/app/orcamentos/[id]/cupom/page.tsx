import { getQuoteById } from "@/modules/quotes/actions";
import { getSettings } from "@/modules/settings/actions";
import { ThermalReceipt } from "@/components/print/thermal-receipt";
import { PrintTrigger } from "@/components/print/print-trigger";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function CupomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [quote, settings] = await Promise.all([
    getQuoteById(id),
    getSettings(),
  ]);

  if (!quote) notFound();

  return (
    <>
      <PrintTrigger />
      <ThermalReceipt quote={quote} settings={settings} />
    </>
  );
}
