"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createCustomer, updateCustomer } from "./actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import type { Customer } from "@/types";

function maskPhone(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 10) {
    return d.replace(/(\d{2})(\d{0,4})(\d{0,4})/, (_m, a, b, c) =>
      a ? `(${a})${b ? ` ${b}` : ""}${c ? `-${c}` : ""}` : ""
    );
  }
  return d.replace(/(\d{2})(\d{5})(\d{0,4})/, (_m, a, b, c) =>
    `(${a}) ${b}${c ? `-${c}` : ""}`
  );
}

function maskCpfCnpj(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 14);
  if (d.length <= 11) {
    return d.replace(/(\d{3})(\d{0,3})(\d{0,3})(\d{0,2})/, (_m, a, b, c, e) => {
      let r = a;
      if (b) r += `.${b}`;
      if (c) r += `.${c}`;
      if (e) r += `-${e}`;
      return r;
    });
  }
  return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})/, (_m, a, b, c, e, f) => {
    let r = `${a}.${b}.${c}/${e}`;
    if (f) r += `-${f}`;
    return r;
  });
}

const schema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  type: z.enum(["COMMON", "DRYWALL_WORKER"]),
  phone1: z.string().min(8, "Telefone obrigatório"),
  razaoSocial: z.string().optional(),
  cpfCnpj: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone2: z.string().optional(),
  cep: z.string().optional(),
  rua: z.string().optional(),
  numero: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  uf: z.string().max(2).optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface CustomerFormProps {
  customer?: Customer;
  onSuccess?: () => void;
}

export function CustomerForm({ customer, onSuccess }: CustomerFormProps) {
  const router = useRouter();
  const [fetchingCep, setFetchingCep] = useState(false);

  const rawPhone1 = (customer as Customer & { phone1?: string })?.phone1 ?? "";
  const rawPhone2 = (customer as Customer & { phone2?: string })?.phone2 ?? "";
  const rawCpfCnpj = (customer as Customer & { cpfCnpj?: string })?.cpfCnpj ?? "";

  const [phone1Display, setPhone1Display] = useState(maskPhone(rawPhone1));
  const [phone2Display, setPhone2Display] = useState(maskPhone(rawPhone2));
  const [cpfCnpjDisplay, setCpfCnpjDisplay] = useState(maskCpfCnpj(rawCpfCnpj));

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: customer?.name ?? "",
      type: customer?.type ?? "COMMON",
      phone1: rawPhone1,
      razaoSocial: (customer as Customer & { razaoSocial?: string })?.razaoSocial ?? "",
      cpfCnpj: rawCpfCnpj,
      email: customer?.email ?? "",
      phone2: rawPhone2,
      cep: (customer as Customer & { cep?: string })?.cep ?? "",
      rua: (customer as Customer & { rua?: string })?.rua ?? "",
      numero: (customer as Customer & { numero?: string })?.numero ?? "",
      bairro: (customer as Customer & { bairro?: string })?.bairro ?? "",
      cidade: (customer as Customer & { cidade?: string })?.cidade ?? "",
      uf: (customer as Customer & { uf?: string })?.uf ?? "",
      notes: customer?.notes ?? "",
    },
  });

  async function lookupCep(cep: string) {
    const digits = cep.replace(/\D/g, "");
    if (digits.length !== 8) return;
    setFetchingCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (!data.erro) {
        if (data.logradouro) setValue("rua", data.logradouro);
        if (data.bairro) setValue("bairro", data.bairro);
        if (data.localidade) setValue("cidade", data.localidade);
        if (data.uf) setValue("uf", data.uf);
      }
    } catch {
      // user fills manually
    } finally {
      setFetchingCep(false);
    }
  }

  async function onSubmit(data: FormData) {
    const result = customer
      ? await updateCustomer(customer.id, data)
      : await createCustomer(data);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success(customer ? "Cliente atualizado!" : "Cliente criado!");
    if (onSuccess) {
      onSuccess();
    } else {
      router.push("/clientes");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Required fields */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Dados obrigatórios
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome *</Label>
            <Input id="name" placeholder="Nome do cliente" {...register("name")} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Tipo de cliente *</Label>
            <Select
              defaultValue={customer?.type ?? "COMMON"}
              onValueChange={(v) => setValue("type", v as "COMMON" | "DRYWALL_WORKER")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="COMMON">Cliente Comum</SelectItem>
                <SelectItem value="DRYWALL_WORKER">Gesseiro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone1">Telefone principal *</Label>
            <Input
              id="phone1"
              placeholder="(22) 99999-9999"
              value={phone1Display}
              onChange={(e) => {
                const raw = e.target.value.replace(/\D/g, "").slice(0, 11);
                setPhone1Display(maskPhone(e.target.value));
                setValue("phone1", raw);
              }}
            />
            {errors.phone1 && <p className="text-xs text-destructive">{errors.phone1.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="cep">CEP *</Label>
            <div className="relative">
              <Input
                id="cep"
                placeholder="00000-000"
                {...register("cep")}
                onChange={(e) => {
                  setValue("cep", e.target.value);
                  lookupCep(e.target.value);
                }}
              />
              {fetchingCep && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rua">Rua *</Label>
            <Input id="rua" placeholder="Rua / Avenida" {...register("rua")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="numero">Número *</Label>
            <Input id="numero" placeholder="Nº" {...register("numero")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bairro">Bairro *</Label>
            <Input id="bairro" placeholder="Bairro" {...register("bairro")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cidade">Cidade *</Label>
            <Input id="cidade" placeholder="Cidade" {...register("cidade")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="uf">UF *</Label>
            <Input
              id="uf"
              placeholder="RJ"
              maxLength={2}
              {...register("uf")}
              onChange={(e) => setValue("uf", e.target.value.toUpperCase())}
            />
          </div>
        </div>
      </div>

      {/* Optional fields */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Dados opcionais
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="razaoSocial">Razão Social</Label>
            <Input id="razaoSocial" placeholder="Razão social" {...register("razaoSocial")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cpfCnpj">CPF / CNPJ</Label>
            <Input
              id="cpfCnpj"
              placeholder="000.000.000-00"
              value={cpfCnpjDisplay}
              onChange={(e) => {
                const raw = e.target.value.replace(/\D/g, "").slice(0, 14);
                setCpfCnpjDisplay(maskCpfCnpj(e.target.value));
                setValue("cpfCnpj", raw);
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="email@exemplo.com" {...register("email")} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone2">Telefone secundário</Label>
            <Input
              id="phone2"
              placeholder="(22) 99999-9999"
              value={phone2Display}
              onChange={(e) => {
                const raw = e.target.value.replace(/\D/g, "").slice(0, 11);
                setPhone2Display(maskPhone(e.target.value));
                setValue("phone2", raw);
              }}
            />
          </div>
        </div>

        <div className="space-y-2 mt-4">
          <Label htmlFor="notes">Observações internas</Label>
          <Textarea
            id="notes"
            placeholder="Observações sobre o cliente..."
            rows={3}
            {...register("notes")}
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => (onSuccess ? onSuccess() : router.back())}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {customer ? "Atualizar" : "Criar Cliente"}
        </Button>
      </div>
    </form>
  );
}
