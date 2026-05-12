import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import { ProductForm } from "@/modules/products/product-form";
import { getCategories, getTags } from "@/modules/products/actions";
import { serialize } from "@/utils/serialize";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: Props) {
  const { id } = await params;

  const [product, categories, tags] = serialize(await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: { productTags: { include: { tag: true } } },
    }),
    getCategories(),
    getTags(),
  ]));

  if (!product) notFound();

  return (
    <div>
      <Header
        title="Editar Produto"
        description={product.name}
      />
      <div className="p-6 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dados do Produto</CardTitle>
          </CardHeader>
          <CardContent>
            <ProductForm
              product={product}
              categories={categories}
              tags={tags}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
