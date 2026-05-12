"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { saveSettings } from "./actions";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import type { Settings } from "@/types";

const schema = z.object({
  companyName: z.string().min(2),
  companyCnpj: z.string().optional(),
  companyEmail: z.string().optional(),
  companyPhone: z.string().optional(),
  companyAddress: z.string().optional(),
  signatureText: z.string().optional(),
  quoteExpirationDays: z.number().int().min(1).max(30),
  creditFeePercent: z.number().min(0),
  debitFeePercent: z.number().min(0),
  installmentFeePercent: z.number().min(0),
});

type FormData = z.infer<typeof schema>;

interface SettingsFormProps {
  settings: Settings | null;
}

export function SettingsForm({ settings }: SettingsFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      companyName: settings?.companyName ?? "Angra Drywall",
      companyCnpj: settings?.companyCnpj ?? "",
      companyEmail: settings?.companyEmail ?? "",
      companyPhone: settings?.companyPhone ?? "",
      companyAddress: settings?.companyAddress ?? "",
      signatureText: settings?.signatureText ?? "",
      quoteExpirationDays: settings?.quoteExpirationDays ?? 3,
      creditFeePercent: settings ? Number(settings.creditFeePercent.toString()) : 4.99,
      debitFeePercent: settings ? Number(settings.debitFeePercent.toString()) : 1.99,
      installmentFeePercent: settings ? Number(settings.installmentFeePercent.toString()) : 12.71,
    },
  });

  async function onSubmit(data: FormData) {
    const result = await saveSettings(data);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Configurações salvas!");
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Empresa</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome da Empresa</Label>
              <Input {...register("companyName")} />
              {errors.companyName && (
                <p className="text-xs text-destructive">{errors.companyName.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>CNPJ</Label>
              <Input placeholder="XX.XXX.XXX/XXXX-XX" {...register("companyCnpj")} />
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input placeholder="(22) 99999-9999" {...register("companyPhone")} />
            </div>
            <div className="space-y-2">
              <Label>E-mail</Label>
              <Input type="email" placeholder="contato@empresa.com.br" {...register("companyEmail")} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Endereço</Label>
            <Input placeholder="Rua, número, bairro, cidade" {...register("companyAddress")} />
          </div>
          <div className="space-y-2">
            <Label>Assinatura no PDF</Label>
            <Input placeholder="Ex: Gerente Comercial" {...register("signatureText")} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Orçamentos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Validade padrão dos orçamentos (dias)</Label>
            <Input
              type="number"
              min="1"
              max="30"
              {...register("quoteExpirationDays", { valueAsNumber: true })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Taxas de Pagamento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Débito (%)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                {...register("debitFeePercent", { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label>Crédito (%)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                {...register("creditFeePercent", { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label>Maquininha (%)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                {...register("installmentFeePercent", { valueAsNumber: true })}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Pix e Dinheiro: 0% (sem taxa)
          </p>
        </CardContent>
      </Card>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        Salvar Configurações
      </Button>
    </form>
  );
}
