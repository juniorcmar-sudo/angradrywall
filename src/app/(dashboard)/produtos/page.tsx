import { Header } from "@/components/layout/header";
import { ProductsTable } from "@/modules/products/products-table";
import { getProducts, getCategories, getTags } from "@/modules/products/actions";
import { serialize } from "@/utils/serialize";

export default async function ProdutosPage() {
  const [products, categories, tags] = serialize(
    await Promise.all([getProducts(undefined, undefined, true), getCategories(), getTags()])
  );

  return (
    <div>
      <Header title="Produtos" description="Gerencie seu catálogo de produtos" />
      <div className="p-6">
        <ProductsTable products={products} categories={categories} tags={tags} />
      </div>
    </div>
  );
}
