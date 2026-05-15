"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { createQuote, updateQuote } from "./actions";
import { createCustomerQuick } from "@/modules/customers/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Trash2,
  Search,
  Plus,
  X,
  Star,
  MapPin,
  Package,
  Truck,
  CreditCard,
} from "lucide-react";
import {
  formatCurrency,
  calculatePriceWithFee,
  PAYMENT_METHOD_LABELS,
} from "@/utils/currency";
import type { Customer, Product, FreightZone, QuoteWithDetails } from "@/types";

const schema = z.object({
  customerId: z.string().min(1, "Selecione um cliente"),
  paymentMethod: z.enum(["PIX", "CASH", "DEBIT", "CREDIT", "LINK_3X"]).optional().nullable(),
  installments: z.number().int().min(1).max(12).optional().nullable(),
  installmentValue: z.number().min(0).optional().nullable(),
  freightType: z.string(),
  freightZoneId: z.string().optional(),
  freightValue: z.number().min(0),
  discount: z.number().min(0),
  internalNotes: z.string().optional(),
  customerNotes: z.string().optional(),
  items: z
    .array(
      z.object({
        productId: z.string(),
        quantity: z.number().int().min(1),
        unitPrice: z.number().min(0),
        finalPrice: z.number().min(0),
      })
    )
    .min(1),
});

type FormData = z.infer<typeof schema>;

interface QuoteItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  finalPrice: number;
}

interface CreditInstallmentEntry {
  installments: number;
  value: number;
}

interface QuoteBuilderProps {
  customers: Customer[];
  products: Product[];
  freightZones: FreightZone[];
  companyAddress?: string | null;
  initialQuote?: QuoteWithDetails;
  debitFeePercent?: number;
  linkFeePercent?: number;
}

const newCustomerSchema = z.object({
  name: z.string().min(2, "Nome obrigatório"),
  type: z.enum(["COMMON", "DRYWALL_WORKER"]),
  phone1: z.string().min(8, "Telefone obrigatório"),
  phone2: z.string().optional(),
  razaoSocial: z.string().optional(),
  cpfCnpj: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  cep: z.string().optional(),
  rua: z.string().optional(),
  numero: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  uf: z.string().optional(),
  notes: z.string().optional(),
});

type NewCustomerData = z.infer<typeof newCustomerSchema>;

export function QuoteBuilder({
  customers,
  products,
  freightZones,
  companyAddress,
  initialQuote,
  debitFeePercent = 1.99,
  linkFeePercent = 12.71,
}: QuoteBuilderProps) {
  const router = useRouter();
  const isEditing = !!initialQuote;

  // Derive initial values from initialQuote if present
  const initCustomer = initialQuote
    ? customers.find((c) => c.id === initialQuote.customerId) ?? initialQuote.customer
    : null;
  const initFreightMode: "none" | "pickup" | "delivery" = initialQuote
    ? initialQuote.freightType === "PICKUP"
      ? "pickup"
      : initialQuote.freightType === "DELIVERY"
      ? "delivery"
      : "none"
    : "none";
  const initFreightZoneId = initialQuote?.freightZoneId ?? undefined;
  const initFreightValue = initialQuote ? Number(initialQuote.freightValue.toString()) : 0;
  const initDiscount = initialQuote ? Number(initialQuote.discount.toString()) : 0;
  const initPaymentMethod: string | null = initialQuote?.paymentMethod ?? null;
  const initItems: QuoteItem[] = initialQuote
    ? initialQuote.items.map((item) => ({
        productId: item.productId,
        productName: item.product.name,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice.toString()),
        finalPrice: Number(item.finalPrice.toString()) / item.quantity,
      }))
    : [];

  const [allCustomers, setAllCustomers] = useState<Customer[]>(customers);
  const [customerSearch, setCustomerSearch] = useState(initCustomer?.name ?? "");
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(initCustomer);
  const [savingNewCustomer, setSavingNewCustomer] = useState(false);
  const [fetchingCep, setFetchingCep] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [newCustomer, setNewCustomer] = useState<NewCustomerData>({
    name: "",
    type: "COMMON",
    phone1: "",
    phone2: "",
    razaoSocial: "",
    cpfCnpj: "",
    email: "",
    cep: "",
    rua: "",
    numero: "",
    bairro: "",
    cidade: "",
    uf: "",
    notes: "",
  });
  const [newCustomerErrors, setNewCustomerErrors] = useState<Partial<Record<keyof NewCustomerData, string>>>({});

  const [paymentMethod, setPaymentMethod] = useState<string | null>(initPaymentMethod);
  const [installments, setInstallments] = useState<number>(
    initialQuote?.installments ?? 1
  );
  const [installmentValue, setInstallmentValue] = useState<number>(
    initialQuote?.installmentValue ? Number(initialQuote.installmentValue.toString()) : 0
  );

  // Credit manual installments
  const [creditInstallments, setCreditInstallments] = useState<CreditInstallmentEntry[]>(
    initialQuote?.creditInstallments?.map((ci) => ({
      installments: ci.installments,
      value: Number(ci.value.toString()),
    })) ?? []
  );
  const [showAddCredit, setShowAddCredit] = useState(false);
  const [newCreditInstallments, setNewCreditInstallments] = useState<number>(1);
  const [newCreditValue, setNewCreditValue] = useState<number | "">("");

  const [freightMode, setFreightMode] = useState<"none" | "pickup" | "delivery">(initFreightMode);
  const [freightValue, setFreightValue] = useState(initFreightValue);

  const [items, setItems] = useState<QuoteItem[]>(initItems);
  const [productSearch, setProductSearch] = useState("");
  const [discount, setDiscount] = useState(initDiscount);
  const [internalNotes, setInternalNotes] = useState(initialQuote?.internalNotes ?? "");
  const [customerNotes, setCustomerNotes] = useState(initialQuote?.customerNotes ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      customerId: initCustomer?.id ?? "",
      paymentMethod: initPaymentMethod as FormData["paymentMethod"],
      freightType: initialQuote?.freightType ?? "NONE",
      freightZoneId: initFreightZoneId,
      freightValue: initFreightValue,
      discount: initDiscount,
      internalNotes: initialQuote?.internalNotes ?? "",
      customerNotes: initialQuote?.customerNotes ?? "",
      items: initItems.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        finalPrice: i.finalPrice,
      })),
    },
  });

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filteredCustomers = useMemo(() => {
    const q = customerSearch.toLowerCase().trim();
    if (!q) return allCustomers.slice(0, 8);
    return allCustomers
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.phone1 ?? "").includes(q) ||
          ((c as Customer & { razaoSocial?: string }).razaoSocial ?? "")
            .toLowerCase()
            .includes(q) ||
          ((c as Customer & { cpfCnpj?: string }).cpfCnpj ?? "").includes(q)
      )
      .slice(0, 8);
  }, [allCustomers, customerSearch]);

  async function lookupCep(cep: string) {
    const digits = cep.replace(/\D/g, "");
    if (digits.length !== 8) return;
    setFetchingCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setNewCustomer((prev) => ({
          ...prev,
          rua: data.logradouro ?? prev.rua,
          bairro: data.bairro ?? prev.bairro,
          cidade: data.localidade ?? prev.cidade,
          uf: data.uf ?? prev.uf,
        }));
      }
    } catch {
      // fallback: user fills manually
    } finally {
      setFetchingCep(false);
    }
  }

  function selectCustomer(c: Customer) {
    setSelectedCustomer(c);
    setCustomerSearch(c.name);
    setValue("customerId", c.id);
    setShowDropdown(false);
    setShowNewForm(false);
    recalculatePrices(paymentMethod, c);
  }

  async function saveNewCustomer() {
    const parsed = newCustomerSchema.safeParse(newCustomer);
    if (!parsed.success) {
      const fieldErrors: Partial<Record<keyof NewCustomerData, string>> = {};
      parsed.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof NewCustomerData;
        if (!fieldErrors[field]) fieldErrors[field] = issue.message;
      });
      setNewCustomerErrors(fieldErrors);
      return;
    }
    setNewCustomerErrors({});
    setSavingNewCustomer(true);
    const result = await createCustomerQuick(parsed.data);
    setSavingNewCustomer(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    const created = result.data as Customer;
    setAllCustomers((prev) => [created, ...prev]);
    selectCustomer(created);
    setShowNewForm(false);
    setNewCustomer({ name: "", type: "COMMON", phone1: "", phone2: "", razaoSocial: "", cpfCnpj: "", email: "", cep: "", rua: "", numero: "", bairro: "", cidade: "", uf: "", notes: "" });
    toast.success("Cliente criado e selecionado!");
  }

  const filteredProducts = products.filter(
    (p) =>
      p.active &&
      (p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.internalCode.toLowerCase().includes(productSearch.toLowerCase()))
  );

  function getBasePrice(product: Product, customer: Customer | null) {
    return customer?.type === "DRYWALL_WORKER"
      ? Number(product.basePriceDrywall.toString())
      : Number(product.basePriceCommon.toString());
  }

  function addProduct(product: Product) {
    const existing = items.find((i) => i.productId === product.id);
    if (existing) {
      updateQuantity(product.id, existing.quantity + 1);
      setProductSearch("");
      return;
    }
    const base = getBasePrice(product, selectedCustomer);
    const finalPrice = paymentMethod
      ? calculatePriceWithFee(base, paymentMethod, debitFeePercent, linkFeePercent)
      : base;
    const updated = [
      ...items,
      { productId: product.id, productName: product.name, quantity: 1, unitPrice: base, finalPrice },
    ];
    setItems(updated);
    syncItems(updated);
    setProductSearch("");
  }

  function updateQuantity(productId: string, quantity: number) {
    const updated = items.map((i) =>
      i.productId === productId ? { ...i, quantity: Math.max(1, quantity) } : i
    );
    setItems(updated);
    syncItems(updated);
  }

  function removeItem(productId: string) {
    const updated = items.filter((i) => i.productId !== productId);
    setItems(updated);
    syncItems(updated);
  }

  function syncItems(list: QuoteItem[]) {
    setValue(
      "items",
      list.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        finalPrice: i.finalPrice,
      }))
    );
  }

  function recalculatePrices(method: string | null, customer?: Customer | null) {
    const cust = customer !== undefined ? customer : selectedCustomer;
    if (!cust) return;
    const updated = items.map((item) => {
      const product = products.find((p) => p.id === item.productId);
      if (!product) return item;
      const base = getBasePrice(product, cust);
      const finalPrice = method
        ? calculatePriceWithFee(base, method, debitFeePercent, linkFeePercent)
        : base;
      return { ...item, unitPrice: base, finalPrice };
    });
    setItems(updated);
    syncItems(updated);
  }

  function handlePaymentChange(method: string) {
    if (paymentMethod === method) {
      // deselect
      setPaymentMethod(null);
      setValue("paymentMethod", null);
      recalculatePrices(null);
      setInstallments(1);
      setInstallmentValue(0);
    } else {
      setPaymentMethod(method);
      setValue("paymentMethod", method as NonNullable<FormData["paymentMethod"]>);
      recalculatePrices(method);
      if (method !== "LINK_3X") {
        setInstallments(1);
        setInstallmentValue(0);
      }
    }
  }

  function handleFreightMode(mode: "none" | "pickup" | "delivery") {
    setFreightMode(mode);
    if (mode === "none") {
      setValue("freightType", "NONE");
      setValue("freightZoneId", undefined);
      setValue("freightValue", 0);
      setFreightValue(0);
    } else if (mode === "pickup") {
      setValue("freightType", "PICKUP");
      setValue("freightZoneId", undefined);
      setValue("freightValue", 0);
      setFreightValue(0);
    } else {
      setValue("freightType", "DELIVERY");
    }
  }

  function handleZoneChange(zoneId: string) {
    if (zoneId === "none") {
      setValue("freightZoneId", undefined);
      setValue("freightValue", 0);
      setFreightValue(0);
      return;
    }
    const zone = freightZones.find((z) => z.id === zoneId);
    if (zone) {
      const price = Number(zone.price.toString());
      setValue("freightZoneId", zoneId);
      setValue("freightValue", price);
      setFreightValue(price);
    }
  }

  const subtotal = items.reduce((sum, i) => sum + i.finalPrice * i.quantity, 0);
  const baseSubtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const isInstallmentPayment = paymentMethod === "LINK_3X";
  const finalTotal = subtotal + freightValue - discount;
  const pixTotal = baseSubtotal + freightValue - discount;
  // Auto-calculated installment value (read-only — derived from finalTotal)
  const autoInstallmentValue =
    isInstallmentPayment && installments > 0 && finalTotal > 0
      ? finalTotal / installments
      : 0;

  async function onSubmit(data: FormData) {
    if (items.length === 0) {
      toast.error("Adicione pelo menos um produto");
      return;
    }
    setIsSubmitting(true);
    const installmentsVal = isInstallmentPayment ? installments : null;
    const installmentValueVal = isInstallmentPayment && autoInstallmentValue > 0 ? autoInstallmentValue : null;
    const creditInstallmentsVal = creditInstallments; // always sent regardless of payment method
    if (isEditing && initialQuote) {
      const result = await updateQuote(initialQuote.id, {
        ...data,
        items,
        installments: installmentsVal,
        installmentValue: installmentValueVal,
        creditInstallments: creditInstallmentsVal,
      });
      setIsSubmitting(false);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Orçamento atualizado!");
      router.push(`/orcamentos/${initialQuote.id}`);
    } else {
      const result = await createQuote({
        ...data,
        items,
        installments: installmentsVal,
        installmentValue: installmentValueVal,
        creditInstallments: creditInstallmentsVal,
      });
      setIsSubmitting(false);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Orçamento criado!");
      router.push(`/orcamentos/${result.data.id}`);
    }
  }

  const primaryMethods = ["PIX", "CASH"] as const;
  const secondaryMethods = ["DEBIT", "LINK_3X"] as const;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Configuration */}
        <div className="lg:col-span-2 space-y-4">

          {/* Customer Search */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div ref={dropdownRef} className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome, telefone, CPF, CNPJ..."
                    value={customerSearch}
                    onChange={(e) => {
                      setCustomerSearch(e.target.value);
                      setShowDropdown(true);
                      if (selectedCustomer && e.target.value !== selectedCustomer.name) {
                        setSelectedCustomer(null);
                        setValue("customerId", "");
                      }
                    }}
                    onFocus={() => setShowDropdown(true)}
                    className="pl-9"
                  />
                  {selectedCustomer && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCustomer(null);
                        setCustomerSearch("");
                        setValue("customerId", "");
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {showDropdown && !selectedCustomer && (
                  <div className="absolute z-20 w-full mt-1 border border-border rounded-md bg-card shadow-lg max-h-64 overflow-y-auto">
                    {filteredCustomers.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => selectCustomer(c)}
                        className="w-full flex items-center justify-between px-3 py-2 hover:bg-accent text-left"
                      >
                        <div>
                          <p className="text-sm font-medium">{c.name}</p>
                          <p className="text-xs text-muted-foreground">{c.phone1 ?? ""}</p>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {c.type === "DRYWALL_WORKER" ? "Gesseiro" : "Comum"}
                        </span>
                      </button>
                    ))}

                    {filteredCustomers.length === 0 && customerSearch && (
                      <p className="text-sm text-muted-foreground px-3 py-2">Nenhum cliente encontrado</p>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setShowNewForm((v) => !v);
                        setShowDropdown(false);
                        setNewCustomer((prev) => ({ ...prev, name: customerSearch }));
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-primary font-medium hover:bg-primary/5 border-t border-border"
                    >
                      <Plus className="w-4 h-4" />
                      Novo Cliente
                    </button>
                  </div>
                )}
              </div>

              {selectedCustomer && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="font-medium text-foreground">{selectedCustomer.name}</span>
                  <span>·</span>
                  <span>{selectedCustomer.type === "DRYWALL_WORKER" ? "Gesseiro (preço especial)" : "Cliente Comum"}</span>
                </div>
              )}

              {errors.customerId && (
                <p className="text-xs text-destructive">{errors.customerId.message}</p>
              )}

              {/* Inline new customer form */}
              {showNewForm && (
                <div className="border border-border rounded-md bg-muted/30 overflow-hidden">
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <p className="text-sm font-semibold">Novo Cliente</p>
                    <button
                      type="button"
                      onClick={() => setShowNewForm(false)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Scrollable fields */}
                  <div className="p-4 space-y-3 max-h-[420px] overflow-y-auto">
                    {/* Obrigatórios */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Nome *</Label>
                        <Input
                          placeholder="Nome completo"
                          value={newCustomer.name}
                          onChange={(e) => setNewCustomer((p) => ({ ...p, name: e.target.value }))}
                          className="h-8 text-sm"
                        />
                        {newCustomerErrors.name && (
                          <p className="text-xs text-destructive">{newCustomerErrors.name}</p>
                        )}
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs">Tipo *</Label>
                        <Select
                          value={newCustomer.type}
                          onValueChange={(v) => setNewCustomer((p) => ({ ...p, type: v as "COMMON" | "DRYWALL_WORKER" }))}
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="COMMON">Comum</SelectItem>
                            <SelectItem value="DRYWALL_WORKER">Gesseiro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs">Telefone *</Label>
                        <Input
                          placeholder="(22) 99999-9999"
                          value={newCustomer.phone1}
                          onChange={(e) => setNewCustomer((p) => ({ ...p, phone1: e.target.value }))}
                          className="h-8 text-sm"
                        />
                        {newCustomerErrors.phone1 && (
                          <p className="text-xs text-destructive">{newCustomerErrors.phone1}</p>
                        )}
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs">Telefone 2</Label>
                        <Input
                          placeholder="(22) 99999-9999"
                          value={newCustomer.phone2}
                          onChange={(e) => setNewCustomer((p) => ({ ...p, phone2: e.target.value }))}
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>

                    {/* Dados opcionais */}
                    <p className="text-xs text-muted-foreground pt-1 font-medium">Dados adicionais (opcional)</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Razão Social</Label>
                        <Input
                          placeholder="Empresa Ltda"
                          value={newCustomer.razaoSocial}
                          onChange={(e) => setNewCustomer((p) => ({ ...p, razaoSocial: e.target.value }))}
                          className="h-8 text-sm"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs">CPF / CNPJ</Label>
                        <Input
                          placeholder="000.000.000-00"
                          value={newCustomer.cpfCnpj}
                          onChange={(e) => setNewCustomer((p) => ({ ...p, cpfCnpj: e.target.value }))}
                          className="h-8 text-sm"
                        />
                      </div>

                      <div className="col-span-2 space-y-1">
                        <Label className="text-xs">Email</Label>
                        <Input
                          type="email"
                          placeholder="cliente@email.com"
                          value={newCustomer.email}
                          onChange={(e) => setNewCustomer((p) => ({ ...p, email: e.target.value }))}
                          className="h-8 text-sm"
                        />
                        {newCustomerErrors.email && (
                          <p className="text-xs text-destructive">{newCustomerErrors.email}</p>
                        )}
                      </div>
                    </div>

                    {/* Endereço */}
                    <p className="text-xs text-muted-foreground pt-1 font-medium">Endereço (opcional)</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">CEP</Label>
                        <div className="relative">
                          <Input
                            placeholder="00000-000"
                            value={newCustomer.cep}
                            onChange={(e) => {
                              const v = e.target.value;
                              setNewCustomer((p) => ({ ...p, cep: v }));
                              if (v.replace(/\D/g, "").length === 8) lookupCep(v);
                            }}
                            className="h-8 text-sm"
                          />
                          {fetchingCep && (
                            <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 animate-spin text-muted-foreground" />
                          )}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs">Número</Label>
                        <Input
                          placeholder="Nº"
                          value={newCustomer.numero}
                          onChange={(e) => setNewCustomer((p) => ({ ...p, numero: e.target.value }))}
                          className="h-8 text-sm"
                        />
                      </div>

                      <div className="col-span-2 space-y-1">
                        <Label className="text-xs">Rua</Label>
                        <Input
                          placeholder="Rua"
                          value={newCustomer.rua}
                          onChange={(e) => setNewCustomer((p) => ({ ...p, rua: e.target.value }))}
                          className="h-8 text-sm"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs">Bairro</Label>
                        <Input
                          placeholder="Bairro"
                          value={newCustomer.bairro}
                          onChange={(e) => setNewCustomer((p) => ({ ...p, bairro: e.target.value }))}
                          className="h-8 text-sm"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs">Cidade</Label>
                        <Input
                          placeholder="Cidade"
                          value={newCustomer.cidade}
                          onChange={(e) => setNewCustomer((p) => ({ ...p, cidade: e.target.value }))}
                          className="h-8 text-sm"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs">UF</Label>
                        <Input
                          placeholder="RJ"
                          maxLength={2}
                          value={newCustomer.uf}
                          onChange={(e) => setNewCustomer((p) => ({ ...p, uf: e.target.value.toUpperCase() }))}
                          className="h-8 text-sm"
                        />
                      </div>

                      <div className="col-span-2 space-y-1">
                        <Label className="text-xs">Observações</Label>
                        <Textarea
                          placeholder="Anotações internas sobre o cliente..."
                          rows={2}
                          value={newCustomer.notes}
                          onChange={(e) => setNewCustomer((p) => ({ ...p, notes: e.target.value }))}
                          className="text-sm resize-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Sticky save button */}
                  <div className="px-4 py-3 border-t border-border bg-muted/50">
                    <Button
                      type="button"
                      size="sm"
                      className="w-full"
                      onClick={saveNewCustomer}
                      disabled={savingNewCustomer}
                    >
                      {savingNewCustomer && <Loader2 className="w-3 h-3 mr-2 animate-spin" />}
                      Salvar e Selecionar Cliente
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                Forma de Pagamento
                {!paymentMethod && (
                  <span className="text-xs font-normal text-muted-foreground">(opcional — clique para selecionar)</span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* PIX / Dinheiro — destaque */}
              <div className="grid grid-cols-2 gap-3">
                {primaryMethods.map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handlePaymentChange(key)}
                    className={`relative p-4 rounded-lg border-2 text-left transition-all ${
                      paymentMethod === key
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-base font-semibold">{PAYMENT_METHOD_LABELS[key]}</span>
                      {paymentMethod === key && (
                        <Badge className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-700 border-amber-200 flex items-center gap-0.5">
                          <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                          Melhor valor
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">Sem taxa</div>
                    {items.length > 0 && (
                      <div className="mt-1 text-sm font-bold text-primary">
                        {formatCurrency(pixTotal)}
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* Secondary methods — Débito e Link de Pagamento */}
              <div className="grid grid-cols-2 gap-2">
                {secondaryMethods.map((key) => {
                  const feeLabel =
                    key === "DEBIT" ? `+${debitFeePercent}%`
                    : `+${linkFeePercent}%`;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handlePaymentChange(key)}
                      className={`p-3 rounded-md border text-sm font-medium transition-colors text-left ${
                        paymentMethod === key
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/50"
                      }`}
                    >
                      <div className="font-semibold">{PAYMENT_METHOD_LABELS[key]}</div>
                      <div className="text-xs opacity-70 mt-0.5">{feeLabel}</div>
                      {paymentMethod === key && items.length > 0 && (
                        <div className="text-xs font-bold mt-1">
                          {formatCurrency(finalTotal)}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Parcelamento — apenas para Link de Pagamento */}
              {isInstallmentPayment && (
                <div className="border border-border rounded-md p-3 bg-muted/20 space-y-3">
                  <p className="text-xs font-medium text-muted-foreground">Parcelamento (Link de Pagamento)</p>
                  <div className="flex items-center gap-3">
                    <div className="space-y-1 flex-1">
                      <label className="text-xs text-muted-foreground">Número de parcelas</label>
                      <Input
                        type="number" onFocus={(e) => e.target.select()}
                        min="1"
                        max="24"
                        placeholder="Ex: 3"
                        value={installments === 1 ? "" : installments}
                        onChange={(e) => {
                          const v = parseInt(e.target.value, 10);
                          setInstallments(isNaN(v) || v < 1 ? 1 : v);
                        }}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1 flex-1">
                      <label className="text-xs text-muted-foreground">Valor por parcela</label>
                      <div className="h-8 flex items-center px-3 rounded-md border border-border bg-muted/50 text-sm font-medium text-primary">
                        {autoInstallmentValue > 0 ? formatCurrency(autoInstallmentValue) : "—"}
                      </div>
                    </div>
                  </div>
                  {autoInstallmentValue > 0 && installments > 1 && (
                    <p className="text-sm font-semibold text-primary">
                      {installments}x de {formatCurrency(autoInstallmentValue)} = {formatCurrency(finalTotal)}
                    </p>
                  )}
                </div>
              )}

              {/* Parcelas de Crédito (maquininha) — sempre disponível, opcional */}
              <div className="border border-border rounded-md p-3 bg-muted/20 space-y-2">
                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <CreditCard className="w-3 h-3" />
                  Crédito / Maquininha
                  <span className="font-normal">(opcional — aparece no PDF)</span>
                </p>

                {creditInstallments.length > 0 && (
                  <div className="space-y-1">
                    {creditInstallments.map((ci, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm bg-background rounded px-2 py-1 border border-border">
                        <span>
                          {ci.installments === 1 ? "À vista" : `${ci.installments}x`}
                          {" de "}
                          <span className="font-semibold">{formatCurrency(ci.value)}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setCreditInstallments((prev) => prev.filter((_, i) => i !== idx))}
                          className="text-muted-foreground hover:text-destructive ml-2"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {showAddCredit ? (
                  <div className="flex items-center gap-2">
                    <Input
                      type="number" onFocus={(e) => e.target.select()}
                      min="1"
                      placeholder="Parcelas"
                      value={newCreditInstallments}
                      onChange={(e) => setNewCreditInstallments(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="h-8 text-sm w-24"
                    />
                    <span className="text-xs text-muted-foreground">×</span>
                    <Input
                      type="number" onFocus={(e) => e.target.select()}
                      step="0.01"
                      min="0"
                      placeholder="Valor R$"
                      value={newCreditValue}
                      onChange={(e) => setNewCreditValue(e.target.value === "" ? "" : Number(e.target.value))}
                      className="h-8 text-sm flex-1"
                    />
                    <Button
                      type="button"
                      size="sm"
                      className="h-8 px-2"
                      onClick={() => {
                        if (newCreditValue !== "" && newCreditValue > 0) {
                          setCreditInstallments((prev) => [...prev, { installments: newCreditInstallments, value: Number(newCreditValue) }]);
                          setNewCreditInstallments(1);
                          setNewCreditValue("");
                          setShowAddCredit(false);
                        }
                      }}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-8 px-2"
                      onClick={() => { setShowAddCredit(false); setNewCreditValue(""); setNewCreditInstallments(1); }}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs w-full"
                    onClick={() => setShowAddCredit(true)}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Adicionar Parcela
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Products */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Produtos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar produto por nome ou código..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              {productSearch && (
                <div className="border border-border rounded-md divide-y divide-border max-h-48 overflow-y-auto">
                  {filteredProducts.length === 0 ? (
                    <p className="text-sm text-muted-foreground p-3">Nenhum produto encontrado</p>
                  ) : (
                    filteredProducts.slice(0, 8).map((p) => {
                      const base = getBasePrice(p, selectedCustomer);
                      const priceWithFee = paymentMethod
                        ? calculatePriceWithFee(base, paymentMethod, debitFeePercent, linkFeePercent)
                        : base;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => addProduct(p)}
                          className="w-full flex items-center justify-between p-3 hover:bg-accent text-left"
                        >
                          <div>
                            <p className="text-sm font-medium">{p.name}</p>
                            <p className="text-xs text-muted-foreground">
                              [{p.internalCode}] · Estoque: {p.stock}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold">{formatCurrency(priceWithFee)}</p>
                            {priceWithFee !== base && (
                              <p className="text-xs text-muted-foreground">Base: {formatCurrency(base)}</p>
                            )}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              )}

              {items.length > 0 && (
                <div className="border border-border rounded-md divide-y divide-border">
                  {items.map((item) => (
                    <div key={item.productId} className="flex items-center gap-3 p-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.productName}</p>
                        <p className="text-xs text-muted-foreground">{formatCurrency(item.finalPrice)} / un</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="w-7 h-7 rounded border border-border text-center text-sm hover:bg-accent"
                        >
                          −
                        </button>
                        <input
                          type="number" onFocus={(e) => e.target.select()}
                          min={1}
                          value={item.quantity}
                          onChange={(e) => {
                            const v = parseInt(e.target.value, 10);
                            if (!isNaN(v) && v >= 1) updateQuantity(item.productId, v);
                          }}
                          className="w-12 text-center text-sm border border-border rounded h-7 focus:outline-none focus:ring-1 focus:ring-ring bg-background"
                        />
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className="w-7 h-7 rounded border border-border text-center text-sm hover:bg-accent"
                        >
                          +
                        </button>
                      </div>
                      <div className="text-right min-w-[80px]">
                        <p className="text-sm font-semibold">{formatCurrency(item.finalPrice * item.quantity)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.productId)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {items.length === 0 && !productSearch && (
                <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
                  <Package className="w-8 h-8 mb-2 opacity-30" />
                  <p className="text-sm">Busque e adicione produtos acima</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Observações</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Observação interna</Label>
                <Textarea
                  placeholder="Visível apenas no sistema..."
                  rows={3}
                  value={internalNotes}
                  onChange={(e) => {
                    setInternalNotes(e.target.value);
                    setValue("internalNotes", e.target.value);
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>Observação para o cliente</Label>
                <Textarea
                  placeholder="Aparece no PDF..."
                  rows={3}
                  value={customerNotes}
                  onChange={(e) => {
                    setCustomerNotes(e.target.value);
                    setValue("customerNotes", e.target.value);
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Summary */}
        <div className="space-y-4">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="text-base">Resumo do Orçamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">

              {/* Freight options */}
              <div className="space-y-2">
                <Label>Entrega</Label>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { id: "none", icon: X, label: "Sem frete" },
                    { id: "pickup", icon: MapPin, label: "Retirada local" },
                    { id: "delivery", icon: Truck, label: "Entrega" },
                  ].map(({ id, icon: Icon, label }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => handleFreightMode(id as "none" | "pickup" | "delivery")}
                      className={`flex items-center gap-2 px-3 py-2 rounded-md border text-sm transition-colors text-left ${
                        freightMode === id
                          ? "border-primary bg-primary/5 text-primary font-medium"
                          : "border-border text-muted-foreground hover:border-primary/40"
                      }`}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>

                {freightMode === "pickup" && companyAddress && (
                  <div className="text-xs text-muted-foreground bg-muted rounded-md p-2 whitespace-pre-line">
                    {companyAddress}
                  </div>
                )}

                {freightMode === "delivery" && (
                  <div className="space-y-2">
                    <Select onValueChange={handleZoneChange}>
                      <SelectTrigger className="text-sm">
                        <SelectValue placeholder="Selecionar zona de entrega" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sem zona</SelectItem>
                        {freightZones.map((z) => (
                          <SelectItem key={z.id} value={z.id}>
                            {z.name} — {formatCurrency(Number(z.price.toString()))}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {freightValue > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Frete: {formatCurrency(freightValue)}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Desconto (R$)</Label>
                <Input
                  type="number" onFocus={(e) => e.target.select()}
                  step="0.01"
                  min="0"
                  value={discount || ""}
                  placeholder="0,00"
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setDiscount(v);
                    setValue("discount", v);
                  }}
                />
              </div>

              <div className="border-t border-border pt-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                {freightValue > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Frete</span>
                    <span>{formatCurrency(freightValue)}</span>
                  </div>
                )}
                {discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Desconto</span>
                    <span className="text-red-600">−{formatCurrency(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg pt-2 border-t border-border">
                  <span>Total</span>
                  <span className="text-primary">{formatCurrency(finalTotal)}</span>
                </div>
                {paymentMethod && !["PIX", "CASH"].includes(paymentMethod) && items.length > 0 && (
                  <div className="text-xs text-muted-foreground text-right">
                    À vista (Pix): {formatCurrency(pixTotal)}
                  </div>
                )}
                {isInstallmentPayment && autoInstallmentValue > 0 && installments > 1 && (
                  <div className="text-xs text-primary font-medium text-right">
                    {installments}x de {formatCurrency(autoInstallmentValue)}
                  </div>
                )}
                {!paymentMethod && items.length > 0 && (
                  <div className="text-xs text-amber-600 text-right">
                    Sem forma de pagamento definida
                  </div>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting || items.length === 0}
              >
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isEditing ? "Salvar Alterações" : "Criar Orçamento"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}
