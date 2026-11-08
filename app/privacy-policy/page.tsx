import { LegalDocumentPage } from "@/components/legal-document-page";
import { LEGAL_DOCUMENTS } from "@/lib/legal-content";

export const metadata = {
  title: "Privacy Policy — Basecola",
  description: "Learn how Basecola handles account, transaction, and technical information.",
};

export default function PrivacyPolicyPage() {
  return <LegalDocumentPage document={LEGAL_DOCUMENTS.privacy} />;
}
