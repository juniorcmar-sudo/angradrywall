import { Header } from "@/components/layout/header";
import { QuotesTable } from "@/modules/quotes/quotes-table";
import { getQuotes } from "@/modules/quotes/actions";
import { serialize } from "@/utils/serialize";

export default async function OrcamentosPage() {
  const quotes = serialize(await getQuotes());

  return (
    <div>
      <Header title="Orçamentos" description="Gerencie todos os orçamentos" />
      <div className="p-3 md:p-6">
        <QuotesTable quotes={quotes} />
      </div>
    </div>
  );
}
