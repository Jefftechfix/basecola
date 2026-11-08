import { LegalDocumentPage } from "@/components/legal-document-page";
import { LEGAL_DOCUMENTS } from "@/lib/legal-content";

export const metadata = {
  title: "Terms of Service — Basecola",
  description: "Review the rules, risks, and limitations that apply to Basecola services.",
};

export default function TermsOfServicePage() {
  return <LegalDocumentPage document={LEGAL_DOCUMENTS.terms} />;
}
