"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { saveSettings } from "./actions";
import { toast } from "sonner";
import { Loader2, X } from "lucide-react";
import type { Settings } from "@/types";

const schema = z.object({
  companyName: z.string().min(2),
  companyCnpj: z.string().optional(),
  companyEmail: z.string().optional(),
  companyPhone: z.string().optional(),
  companyAddress: z.string().optional(),
  companyLogo: z.string().optional(),
  signatureText: z.string().optional(),
  quoteExpirationDays: z.number().int().min(1).max(30),
  debitFeePercent: z.number().min(0),
  installmentFeePercent: z.number().min(0),
  monthlyGoal: z.number().min(0).nullable(),
});

type FormData = z.infer<typeof schema>;

interface SettingsFormProps {
  settings: Settings | null;
}

export function SettingsForm({ settings }: SettingsFormProps) {
  const [logoPreview, setLogoPreview] = useState<string | null>(
    (settings as Settings & { companyLogo?: string | null })?.companyLogo ?? null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      companyName: settings?.companyName ?? "Angra Drywall",
      companyCnpj: settings?.companyCnpj ?? "",
      companyEmail: settings?.companyEmail ?? "",
      companyPhone: settings?.companyPhone ?? "",
      companyAddress: settings?.companyAddress ?? "",
      companyLogo: (settings as Settings & { companyLogo?: string | null })?.companyLogo ?? "",
      signatureText: settings?.signatureText ?? "",
      quoteExpirationDays: settings?.quoteExpirationDays ?? 3,
      debitFeePercent: settings ? Number(settings.debitFeePercent.toString()) : 1.99,
      installmentFeePercent: settings ? Number(settings.installmentFeePercent.toString()) : 12.71,
      monthlyGoal: settings?.monthlyGoal ? Number(settings.monthlyGoal.toString()) : null,
    },
  });

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setLogoPreview(base64);
      setValue("companyLogo", base64);
    };
    reader.readAsDataURL(file);
  }

  function handleLogoRemove() {
    setLogoPreview(null);
    setValue("companyLogo", "");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

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
            <Label>Logo da Empresa</Label>
            {logoPreview ? (
              <div className="flex items-center gap-3">
                <img
                  src={logoPreview}
                  alt="Logo"
                  className="h-12 object-contain border rounded p-1 bg-white"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleLogoRemove}
                  className="gap-1"
                >
                  <X className="w-3 h-3" />
                  Remover
                </Button>
              </div>
            ) : (
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-muted file:text-foreground hover:file:bg-muted/80 cursor-pointer"
              />
            )}
            <p className="text-xs text-muted-foreground">
              A logo aparece no cupom térmico. Recomendado: PNG ou JPG, fundo transparente ou branco.
            </p>
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
              type="number" onFocus={(e) => e.target.select()}
              min="1"
              max="30"
              {...register("quoteExpirationDays", { valueAsNumber: true })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Meta Mensal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Label>Meta de faturamento do mês (R$)</Label>
          <Input
            type="number" onFocus={(e) => e.target.select()}
            step="0.01"
            min="0"
            placeholder="Ex: 50000"
            {...register("monthlyGoal", {
              setValueAs: (v) => (v === "" || v === null ? null : Number(v)),
            })}
          />
          <p className="text-xs text-muted-foreground">
            Usada para mostrar o progresso do mês no Dashboard. Deixe em branco para ocultar.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Taxas de Pagamento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Débito (%)</Label>
              <Input
                type="number" onFocus={(e) => e.target.select()}
                step="0.01"
                min="0"
                {...register("debitFeePercent", { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label>Link de Pagamento (%)</Label>
              <Input
                type="number" onFocus={(e) => e.target.select()}
                step="0.01"
                min="0"
                {...register("installmentFeePercent", { valueAsNumber: true })}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Pix, Dinheiro e Crédito (maquininha): sem taxa fixa.
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
