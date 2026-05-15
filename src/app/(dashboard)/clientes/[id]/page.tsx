import { notFound } from "next/navigation";
import { Header } from "@/components/layout/header";
import { getCustomerById } from "@/modules/customers/actions";
import { CustomerDetail } from "@/modules/customers/customer-detail";
import { serialize } from "@/utils/serialize";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CustomerPage({ params }: Props) {
  const { id } = await params;
  const customer = serialize(await getCustomerById(id));

  if (!customer) notFound();

  return (
    <div>
      <Header
        title={customer.name}
        description={customer.type === "DRYWALL_WORKER" ? "Gesseiro" : "Cliente Comum"}
      />
      <div className="p-3 md:p-6">
        <CustomerDetail customer={customer} />
      </div>
    </div>
  );
}
