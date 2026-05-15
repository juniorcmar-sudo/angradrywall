import { Header } from "@/components/layout/header";
import { CustomerForm } from "@/modules/customers/customer-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NovoClientePage() {
  return (
    <div>
      <Header title="Novo Cliente" description="Cadastre um novo cliente" />
      <div className="p-3 md:p-6 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Dados do cliente</CardTitle>
          </CardHeader>
          <CardContent>
            <CustomerForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
