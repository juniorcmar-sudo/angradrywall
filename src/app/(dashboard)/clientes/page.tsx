import { Header } from "@/components/layout/header";
import { CustomersTable } from "@/modules/customers/customers-table";
import { getCustomers } from "@/modules/customers/actions";
import { serialize } from "@/utils/serialize";

export default async function ClientesPage() {
  const customers = serialize(await getCustomers());

  return (
    <div>
      <Header title="Clientes" description="Gerencie seus clientes" />
      <div className="p-3 md:p-6">
        <CustomersTable customers={customers} />
      </div>
    </div>
  );
}
