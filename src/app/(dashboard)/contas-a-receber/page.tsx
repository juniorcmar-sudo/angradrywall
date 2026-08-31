import { Header } from "@/components/layout/header";
import { ReceivablesTable } from "@/modules/receivables/receivables-table";
import { getReceivableQuotes } from "@/modules/quotes/actions";
import { serialize } from "@/utils/serialize";

export default async function ContasAReceberPage() {
  const quotes = serialize(await getReceivableQuotes());

  return (
    <div>
      <Header
        title="Contas a Receber"
        description="Orçamentos com estoque já baixado e pagamento pendente"
      />
      <div className="p-3 md:p-6">
        <ReceivablesTable quotes={quotes} />
      </div>
    </div>
  );
}
