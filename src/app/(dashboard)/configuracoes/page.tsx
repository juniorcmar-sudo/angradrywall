import { Header } from "@/components/layout/header";
import { prisma } from "@/lib/prisma";
import { SettingsForm } from "@/modules/settings/settings-form";
import { serialize } from "@/utils/serialize";

async function getSettings() {
  return prisma.settings.findFirst() ?? null;
}

export default async function ConfiguracoesPage() {
  const settings = serialize(await getSettings());

  return (
    <div>
      <Header title="Configurações" description="Configure o sistema" />
      <div className="p-6 max-w-3xl">
        <SettingsForm settings={settings} />
      </div>
    </div>
  );
}
