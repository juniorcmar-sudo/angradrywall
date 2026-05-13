"use client";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const GRAY = "#e8e8e8";
const BORDER = "#cccccc";
const TEXT = "#000000";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    padding: 30,
    backgroundColor: "#ffffff",
    color: TEXT,
  },
  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
    borderBottom: `1px solid ${BORDER}`,
    paddingBottom: 8,
  },
  companyLeft: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    flex: 1,
  },
  logo: {
    width: 60,
    height: 30,
    objectFit: "contain",
  },
  companyNameBig: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: TEXT,
    marginBottom: 2,
  },
  companyDetail: {
    fontSize: 8,
    color: "#444444",
    marginBottom: 1,
  },
  companyRight: {
    alignItems: "flex-end",
    gap: 2,
  },
  // Quote title bar
  quoteTitle: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: GRAY,
    padding: "6 10",
    border: `1px solid ${BORDER}`,
    marginBottom: 0,
  },
  quoteTitleText: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: TEXT,
  },
  quoteDateText: {
    fontSize: 9,
    color: "#333333",
    alignSelf: "center",
  },
  // Validity row
  validityRow: {
    border: `1px solid ${BORDER}`,
    borderTop: "0px",
    padding: "5 10",
    marginBottom: 8,
  },
  validityText: {
    fontSize: 9,
    color: TEXT,
  },
  // Section label
  sectionLabel: {
    backgroundColor: GRAY,
    border: `1px solid ${BORDER}`,
    padding: "4 10",
    marginBottom: 0,
  },
  sectionLabelText: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: TEXT,
    textTransform: "uppercase",
  },
  // Client data section
  clientGrid: {
    border: `1px solid ${BORDER}`,
    borderTop: "0px",
    padding: "6 10",
    marginBottom: 8,
  },
  clientRow: {
    flexDirection: "row",
    marginBottom: 3,
  },
  clientField: {
    flex: 1,
    flexDirection: "row",
    gap: 3,
  },
  clientFieldLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#333333",
    minWidth: 50,
  },
  clientFieldValue: {
    fontSize: 8,
    color: TEXT,
    flex: 1,
  },
  // Table
  table: {
    marginBottom: 8,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: GRAY,
    border: `1px solid ${BORDER}`,
    padding: "4 0",
  },
  tableRow: {
    flexDirection: "row",
    border: `1px solid ${BORDER}`,
    borderTop: "0px",
    padding: "4 0",
  },
  tableCell: {
    fontSize: 8,
    color: TEXT,
    paddingHorizontal: 6,
  },
  tableHeaderCell: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: TEXT,
    paddingHorizontal: 6,
  },
  colItem: { width: 28, textAlign: "center" },
  colCode: { width: 52, textAlign: "left" },
  colName: { flex: 1, textAlign: "left" },
  colUnit: { width: 24, textAlign: "center" },
  colQty: { width: 30, textAlign: "center" },
  colPrice: { width: 60, textAlign: "right" },
  colTotal: { width: 66, textAlign: "right" },
  // Totals area
  totalsArea: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 8,
  },
  totalsBox: {
    width: 200,
    border: `1px solid ${BORDER}`,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: "3 8",
    borderBottom: `1px solid ${BORDER}`,
  },
  totalRowLast: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: "4 8",
    backgroundColor: GRAY,
  },
  totalLabel: { fontSize: 8, color: "#444444" },
  totalValue: { fontSize: 8, color: TEXT },
  totalLabelBold: { fontSize: 9, fontFamily: "Helvetica-Bold", color: TEXT },
  totalValueBold: { fontSize: 9, fontFamily: "Helvetica-Bold", color: TEXT },
  // Payment section
  paymentHeader: {
    flexDirection: "row",
    backgroundColor: GRAY,
    border: `1px solid ${BORDER}`,
    padding: "4 0",
  },
  paymentRow: {
    flexDirection: "row",
    border: `1px solid ${BORDER}`,
    borderTop: "0px",
    padding: "4 0",
  },
  paymentRowBold: {
    flexDirection: "row",
    border: `1px solid ${BORDER}`,
    borderTop: "0px",
    padding: "4 0",
    backgroundColor: "#f5f5f5",
  },
  paymentSubHeader: {
    flexDirection: "row",
    backgroundColor: "#f0f0f0",
    border: `1px solid ${BORDER}`,
    borderTop: "0px",
    padding: "3 6",
  },
  payColDate: { width: 70, paddingHorizontal: 6 },
  payColValue: { width: 80, paddingHorizontal: 6, textAlign: "right" },
  payColMethod: { flex: 1, paddingHorizontal: 6 },
  payColObs: { flex: 1, paddingHorizontal: 6 },
  // Notes / footer
  notesSection: {
    marginBottom: 8,
    border: `1px solid ${BORDER}`,
    padding: "6 10",
  },
  notesLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    marginBottom: 3,
    textTransform: "uppercase",
  },
  notesText: {
    fontSize: 8,
    color: "#333333",
    lineHeight: 1.4,
  },
  signatureArea: {
    marginTop: 20,
    alignItems: "center",
  },
  signatureLine: {
    width: 180,
    borderBottom: `1px solid #888888`,
    marginBottom: 4,
  },
  signatureText: {
    fontSize: 8,
    color: "#555555",
    textAlign: "center",
  },
});

function fmt(value: number): string {
  return `R$ ${value.toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
}

export interface CreditInstallmentProp {
  installments: number;
  value: number;
}

export interface QuotePDFProps {
  quote: {
    number: number;
    paymentMethod: string | null;
    installments?: number | null;
    installmentValue?: { toString(): string } | null;
    freightValue: { toString(): string };
    discount: { toString(): string };
    subtotal: { toString(): string };
    finalTotal: { toString(): string };
    validUntil: Date | null;
    customerNotes: string | null;
    createdAt: Date;
    customer: {
      name: string;
      razaoSocial?: string | null;
      cpfCnpj?: string | null;
      phone1?: string | null;
      email?: string | null;
      cep?: string | null;
      rua?: string | null;
      numero?: string | null;
      bairro?: string | null;
      cidade?: string | null;
      uf?: string | null;
      address?: string | null;
    };
    freightZone: { name: string } | null;
    items: {
      id: string;
      quantity: number;
      unitPrice: { toString(): string };
      finalPrice: { toString(): string };
      product: { name: string; internalCode: string };
    }[];
  };
  companyName?: string;
  companyPhone?: string;
  companyAddress?: string;
  companyCnpj?: string;
  companyEmail?: string;
  signatureText?: string;
  logoUrl?: string;
  debitFeePercent?: number;
  linkFeePercent?: number;
  creditInstallments?: CreditInstallmentProp[];
}

export function QuotePDF({
  quote,
  companyName = "Angra Drywall",
  companyPhone,
  companyAddress,
  companyCnpj,
  companyEmail,
  signatureText,
  logoUrl,
  debitFeePercent = 1.99,
  linkFeePercent = 12.71,
  creditInstallments = [],
}: QuotePDFProps) {
  const freight = Number(quote.freightValue.toString());
  const discount = Number(quote.discount.toString());
  const total = Number(quote.finalTotal.toString());
  const baseSubtotal = quote.items.reduce(
    (sum, item) => sum + Number(item.unitPrice.toString()) * item.quantity,
    0
  );

  const validStr = quote.validUntil
    ? format(new Date(quote.validUntil), "dd/MM/yyyy", { locale: ptBR })
    : "—";
  const createdStr = format(new Date(quote.createdAt), "dd/MM/yyyy", { locale: ptBR });

  const customerAddress = [
    quote.customer.rua,
    quote.customer.numero,
    quote.customer.bairro,
  ]
    .filter(Boolean)
    .join(", ");
  const customerCidadeUf = [quote.customer.cidade, quote.customer.uf]
    .filter(Boolean)
    .join(" / ");

  // Build payment rows
  type PayRow = {
    date: string;
    value: number;
    method: string;
    bold: boolean;
    isSubHeader?: boolean;
    subHeaderLabel?: string;
  };

  const paymentRows: PayRow[] = [];

  if (quote.paymentMethod) {
    // Single confirmed payment method
    const method = quote.paymentMethod;

    if (method === "LINK_3X") {
      // Show à vista + 2x + 3x + 4x + 5x + 6x auto-calculated
      const subtotalWithFee = baseSubtotal * (1 + linkFeePercent / 100);
      const rowTotal = subtotalWithFee + freight - discount;
      const inst = quote.installments;
      if (inst && inst > 1) {
        // Only show the confirmed installment choice, bolded
        paymentRows.push({
          date: validStr,
          value: rowTotal,
          method: `Link de Pagamento — ${inst}x de ${fmt(rowTotal / inst)}`,
          bold: true,
        });
      } else {
        // À vista
        paymentRows.push({
          date: validStr,
          value: rowTotal,
          method: "Link de Pagamento — À vista",
          bold: true,
        });
      }
    } else if (method === "CREDIT") {
      if (quote.installments && quote.installmentValue) {
        // Confirmed credit installment
        const confirmedTotal = Number(quote.installmentValue.toString()) * quote.installments;
        const n = quote.installments;
        const v = Number(quote.installmentValue.toString());
        paymentRows.push({
          date: validStr,
          value: confirmedTotal + freight - discount,
          method: n === 1
            ? "Crédito (Maquininha) — À vista"
            : `Crédito (Maquininha) — ${n}x de ${fmt(v)}`,
          bold: true,
        });
      } else if (creditInstallments.length > 0) {
        // Show manual credit options
        creditInstallments.forEach((ci) => {
          paymentRows.push({
            date: validStr,
            value: ci.value * ci.installments + freight - discount,
            method: ci.installments === 1
              ? "Crédito (Maquininha) — À vista"
              : `Crédito (Maquininha) — ${ci.installments}x de ${fmt(ci.value)}`,
            bold: false,
          });
        });
      } else {
        paymentRows.push({
          date: validStr,
          value: total,
          method: "Crédito (Maquininha)",
          bold: false,
        });
      }
    } else {
      // PIX, CASH, DEBIT
      const labelMap: Record<string, string> = {
        PIX: "Pix",
        CASH: "Dinheiro",
        DEBIT: "Débito",
      };
      paymentRows.push({
        date: validStr,
        value: total,
        method: labelMap[method] ?? method,
        bold: false,
      });
    }
  } else {
    // No method set — simulation of all options

    // Pix / Dinheiro
    const pixTotal = baseSubtotal + freight - discount;
    paymentRows.push({ date: validStr, value: pixTotal, method: "Pix / Dinheiro", bold: true });

    // Débito
    const debitTotal = baseSubtotal * (1 + debitFeePercent / 100) + freight - discount;
    paymentRows.push({ date: validStr, value: debitTotal, method: "Débito", bold: false });

    // Link de Pagamento — auto rows: à vista, 2x, 3x, 4x, 5x, 6x
    const linkTotal = baseSubtotal * (1 + linkFeePercent / 100) + freight - discount;
    [1, 2, 3, 4, 5, 6].forEach((n) => {
      paymentRows.push({
        date: validStr,
        value: linkTotal,
        method: n === 1
          ? "Link de Pagamento — À vista"
          : `Link de Pagamento — ${n}x de ${fmt(linkTotal / n)}`,
        bold: false,
      });
    });

    // Crédito (Maquininha) — only if creditInstallments provided
    if (creditInstallments.length > 0) {
      creditInstallments.forEach((ci) => {
        paymentRows.push({
          date: validStr,
          value: ci.value * ci.installments + freight - discount,
          method: ci.installments === 1
            ? "Crédito (Maquininha) — À vista"
            : `Crédito (Maquininha) — ${ci.installments}x de ${fmt(ci.value)}`,
          bold: false,
        });
      });
    }
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.companyLeft}>
            {logoUrl && (
              // eslint-disable-next-line jsx-a11y/alt-text
              <Image style={styles.logo} src={logoUrl} />
            )}
            <View>
              <Text style={styles.companyNameBig}>{companyName}</Text>
              {companyCnpj && (
                <Text style={styles.companyDetail}>CNPJ: {companyCnpj}</Text>
              )}
            </View>
          </View>
          <View style={styles.companyRight}>
            {companyPhone && (
              <Text style={styles.companyDetail}>Tel: {companyPhone}</Text>
            )}
            {companyEmail && (
              <Text style={styles.companyDetail}>{companyEmail}</Text>
            )}
            {companyAddress && (
              <Text style={{ ...styles.companyDetail, maxWidth: 200, textAlign: "right" }}>
                {companyAddress}
              </Text>
            )}
          </View>
        </View>

        {/* QUOTE TITLE */}
        <View style={styles.quoteTitle}>
          <Text style={styles.quoteTitleText}>
            ORÇAMENTO Nº {String(quote.number).padStart(4, "0")}
          </Text>
          <Text style={styles.quoteDateText}>{createdStr}</Text>
        </View>

        {/* VALIDITY ROW */}
        <View style={styles.validityRow}>
          <Text style={styles.validityText}>
            VALIDADE DA PROPOSTA: {validStr}
          </Text>
        </View>

        {/* DADOS DO CLIENTE */}
        <View style={styles.sectionLabel}>
          <Text style={styles.sectionLabelText}>Dados do Cliente</Text>
        </View>
        <View style={styles.clientGrid}>
          <View style={styles.clientRow}>
            <View style={styles.clientField}>
              <Text style={styles.clientFieldLabel}>Razão social:</Text>
              <Text style={styles.clientFieldValue}>
                {quote.customer.razaoSocial || "—"}
              </Text>
            </View>
            <View style={styles.clientField}>
              <Text style={styles.clientFieldLabel}>Nome fantasia:</Text>
              <Text style={styles.clientFieldValue}>{quote.customer.name}</Text>
            </View>
          </View>
          <View style={styles.clientRow}>
            <View style={styles.clientField}>
              <Text style={styles.clientFieldLabel}>CNPJ/CPF:</Text>
              <Text style={styles.clientFieldValue}>
                {quote.customer.cpfCnpj || "—"}
              </Text>
            </View>
            <View style={styles.clientField}>
              <Text style={styles.clientFieldLabel}>Endereço:</Text>
              <Text style={styles.clientFieldValue}>{customerAddress || "—"}</Text>
            </View>
          </View>
          <View style={styles.clientRow}>
            <View style={styles.clientField}>
              <Text style={styles.clientFieldLabel}>CEP:</Text>
              <Text style={styles.clientFieldValue}>{quote.customer.cep || "—"}</Text>
            </View>
            <View style={styles.clientField}>
              <Text style={styles.clientFieldLabel}>Cidade/UF:</Text>
              <Text style={styles.clientFieldValue}>{customerCidadeUf || "—"}</Text>
            </View>
          </View>
          <View style={styles.clientRow}>
            <View style={styles.clientField}>
              <Text style={styles.clientFieldLabel}>Telefone:</Text>
              <Text style={styles.clientFieldValue}>
                {quote.customer.phone1 || "—"}
              </Text>
            </View>
            <View style={styles.clientField}>
              <Text style={styles.clientFieldLabel}>E-mail:</Text>
              <Text style={styles.clientFieldValue}>
                {quote.customer.email || "—"}
              </Text>
            </View>
          </View>
        </View>

        {/* PRODUCTS TABLE */}
        <View style={styles.sectionLabel}>
          <Text style={styles.sectionLabelText}>Produtos</Text>
        </View>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={{ ...styles.tableHeaderCell, ...styles.colItem }}>ITEM</Text>
            <Text style={{ ...styles.tableHeaderCell, ...styles.colCode }}>CÓDIGO</Text>
            <Text style={{ ...styles.tableHeaderCell, ...styles.colName }}>NOME</Text>
            <Text style={{ ...styles.tableHeaderCell, ...styles.colUnit }}>UN</Text>
            <Text style={{ ...styles.tableHeaderCell, ...styles.colQty }}>QTD.</Text>
            <Text style={{ ...styles.tableHeaderCell, ...styles.colPrice }}>VR. UNIT.</Text>
            <Text style={{ ...styles.tableHeaderCell, ...styles.colTotal }}>SUBTOTAL</Text>
          </View>
          {quote.items.map((item, idx) => {
            const lineTotal = Number(item.finalPrice.toString());
            const unitWithFee = lineTotal / item.quantity;
            return (
              <View key={item.id} style={styles.tableRow}>
                <Text style={{ ...styles.tableCell, ...styles.colItem }}>{idx + 1}</Text>
                <Text style={{ ...styles.tableCell, ...styles.colCode }}>
                  {item.product.internalCode}
                </Text>
                <Text style={{ ...styles.tableCell, ...styles.colName }}>
                  {item.product.name}
                </Text>
                <Text style={{ ...styles.tableCell, ...styles.colUnit }}>UN</Text>
                <Text style={{ ...styles.tableCell, ...styles.colQty }}>{item.quantity}</Text>
                <Text style={{ ...styles.tableCell, ...styles.colPrice }}>
                  {fmt(unitWithFee)}
                </Text>
                <Text style={{ ...styles.tableCell, ...styles.colTotal }}>
                  {fmt(lineTotal)}
                </Text>
              </View>
            );
          })}
        </View>

        {/* TOTALS */}
        <View style={styles.totalsArea}>
          <View style={styles.totalsBox}>
            {freight > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Frete</Text>
                <Text style={styles.totalValue}>{fmt(freight)}</Text>
              </View>
            )}
            {discount > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Desconto</Text>
                <Text style={styles.totalValue}>- {fmt(discount)}</Text>
              </View>
            )}
            <View style={styles.totalRowLast}>
              <Text style={styles.totalLabelBold}>TOTAL</Text>
              <Text style={styles.totalValueBold}>{fmt(total)}</Text>
            </View>
          </View>
        </View>

        {/* FORMAS DE PAGAMENTO */}
        <View style={styles.sectionLabel}>
          <Text style={styles.sectionLabelText}>Formas de Pagamento</Text>
        </View>
        <View style={{ marginBottom: 8 }}>
          <View style={styles.paymentHeader}>
            <Text style={{ ...styles.tableHeaderCell, ...styles.payColDate }}>VENCIMENTO</Text>
            <Text style={{ ...styles.tableHeaderCell, ...styles.payColValue }}>VALOR</Text>
            <Text style={{ ...styles.tableHeaderCell, ...styles.payColMethod }}>FORMA DE PAGAMENTO</Text>
            <Text style={{ ...styles.tableHeaderCell, ...styles.payColObs }}>OBSERVAÇÃO</Text>
          </View>
          {paymentRows.map((row, i) => (
            <View key={i} style={row.bold ? styles.paymentRowBold : styles.paymentRow}>
              <Text
                style={{
                  ...styles.tableCell,
                  ...styles.payColDate,
                  ...(row.bold ? { fontFamily: "Helvetica-Bold" } : {}),
                }}
              >
                {row.date}
              </Text>
              <Text
                style={{
                  ...styles.tableCell,
                  ...styles.payColValue,
                  ...(row.bold ? { fontFamily: "Helvetica-Bold" } : {}),
                }}
              >
                {fmt(row.value)}
              </Text>
              <Text
                style={{
                  ...styles.tableCell,
                  ...styles.payColMethod,
                  ...(row.bold ? { fontFamily: "Helvetica-Bold" } : {}),
                }}
              >
                {row.method}
              </Text>
              <Text style={{ ...styles.tableCell, ...styles.payColObs }}>
                {i === 0 && quote.customerNotes ? quote.customerNotes : ""}
              </Text>
            </View>
          ))}
        </View>

        {/* OBSERVAÇÕES */}
        {(quote.customerNotes || quote.validUntil) && (
          <View style={styles.notesSection}>
            <Text style={styles.notesLabel}>Observações</Text>
            {quote.customerNotes && (
              <Text style={styles.notesText}>{quote.customerNotes}</Text>
            )}
            {quote.validUntil && (
              <Text style={{ ...styles.notesText, marginTop: 4 }}>
                Validade da proposta: {validStr}
              </Text>
            )}
          </View>
        )}

        {/* SIGNATURE */}
        <View style={styles.signatureArea}>
          <View style={styles.signatureLine} />
          <Text style={styles.signatureText}>
            {signatureText ?? "Assinatura do cliente"}
          </Text>
        </View>

      </Page>
    </Document>
  );
}
