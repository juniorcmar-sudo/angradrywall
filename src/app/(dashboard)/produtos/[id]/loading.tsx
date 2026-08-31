import { Header } from "@/components/layout/header";
import { DetailSkeleton } from "@/components/layout/page-skeleton";

export default function Loading() {
  return (
    <div>
      <Header title="Produto" />
      <DetailSkeleton />
    </div>
  );
}
