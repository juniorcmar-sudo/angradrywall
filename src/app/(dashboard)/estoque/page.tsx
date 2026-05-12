import { Header } from "@/components/layout/header";
import { getStockOverview } from "@/modules/stock/actions";
import { StockOverview } from "@/modules/stock/stock-overview";
import { serialize } from "@/utils/serialize";

export default async function EstoquePage() {
  const data = serialize(await getStockOverview());

  return (
    <div>
      <Header title="Estoque" description="Controle de entrada e saída de produtos" />
      <div className="p-6">
        <StockOverview {...data} />
      </div>
    </div>
  );
}
