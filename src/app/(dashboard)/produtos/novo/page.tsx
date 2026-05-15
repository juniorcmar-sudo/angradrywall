import { Header } from "@/components/layout/header";
import { ProductForm } from "@/modules/products/product-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCategories, getTags } from "@/modules/products/actions";

export default async function NovoProdutoPage() {
  const [categories, tags] = await Promise.all([getCategories(), getTags()]);

  return (
    <div>
      <Header title="Novo Produto" description="Cadastre um novo produto" />
      <div className="p-3 md:p-6 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Dados do produto</CardTitle>
          </CardHeader>
          <CardContent>
            <ProductForm categories={categories} tags={tags} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
