import { createFileRoute } from "@tanstack/react-router";
import { MarketingContentPage } from "@/components/marketing-content-page";
import { getMarketingPage } from "@/lib/marketing-pages";

export const Route = createFileRoute("/company/$slug")({
  head: ({ params }) => {
    const page = getMarketingPage("Company", params.slug);
    return {
      meta: [
        { title: `${page?.label ?? "Company"} — Basecola` },
        { name: "description", content: page?.description ?? "Learn more about Basecola." },
      ],
    };
  },
  component: CompanyPage,
});

function CompanyPage() {
  const { slug } = Route.useParams();
  return <MarketingContentPage category="Company" slug={slug} />;
}
