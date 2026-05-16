"use client";

import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import type { QuotePDFProps, CreditInstallmentProp } from "./quote-pdf";

const PDFButtonInner = dynamic(
  () => import("./pdf-button-inner").then((m) => m.PDFButtonInner),
  {
    ssr: false,
    loading: () => (
      <Button variant="outline" size="sm" disabled>
        <FileDown className="w-3.5 h-3.5 mr-1" />
        Baixar PDF
      </Button>
    ),
  }
);

type PDFDownloadButtonProps = Omit<QuotePDFProps, "logoUrl"> & {
  debitFeePercent?: number;
  linkFeePercent?: number;
  creditInstallments?: CreditInstallmentProp[];
  className?: string;
  size?: "sm" | "default" | "lg" | "icon";
};

export function PDFDownloadButton({
  quote,
  companyName,
  companyPhone,
  companyAddress,
  companyCnpj,
  companyEmail,
  signatureText,
  debitFeePercent,
  linkFeePercent,
  creditInstallments,
  className,
  size,
}: PDFDownloadButtonProps) {
  const logoUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/logo.png`
      : "/logo.png";

  return (
    <PDFButtonInner
      quote={quote}
      companyName={companyName}
      companyPhone={companyPhone}
      companyAddress={companyAddress}
      companyCnpj={companyCnpj}
      companyEmail={companyEmail}
      signatureText={signatureText}
      logoUrl={logoUrl}
      fileName={`orcamento-${quote.number}.pdf`}
      debitFeePercent={debitFeePercent}
      linkFeePercent={linkFeePercent}
      creditInstallments={creditInstallments}
      className={className}
      size={size}
    />
  );
}
