import { createFileRoute } from "@tanstack/react-router";
import { LegalDocumentPage } from "@/components/legal-document-page";
import { LEGAL_DOCUMENTS } from "@/lib/legal-content";

export const Route = createFileRoute("/terms-of-service")({
  head: () => ({
    meta: [
      { title: "Terms of Service — Basecola" },
      {
        name: "description",
        content: "Review the rules, risks, and limitations that apply to Basecola services.",
      },
    ],
  }),
  component: TermsOfServicePage,
});

function TermsOfServicePage() {
  return <LegalDocumentPage document={LEGAL_DOCUMENTS.terms} />;
}
