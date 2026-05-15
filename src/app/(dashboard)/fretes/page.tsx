import { Header } from "@/components/layout/header";
import { getFreightZones } from "@/modules/freight/actions";
import { FreightZonesManager } from "@/modules/freight/freight-zones-manager";
import { serialize } from "@/utils/serialize";

export default async function FretesPage() {
  const zones = serialize(await getFreightZones());

  return (
    <div>
      <Header title="Fretes" description="Gerencie as zonas de frete por bairro" />
      <div className="p-3 md:p-6">
        <FreightZonesManager zones={zones} />
      </div>
    </div>
  );
}
