import { createFileRoute } from "@tanstack/react-router";
import { MarketingContentPage } from "@/components/marketing-content-page";
import { getMarketingPage } from "@/lib/marketing-pages";

export const Route = createFileRoute("/support/$slug")({
  head: ({ params }) => {
    const page = getMarketingPage("Support", params.slug);
    return {
      meta: [
        { title: `${page?.label ?? "Support"} — Basecola` },
        {
          name: "description",
          content: page?.description ?? "Find help and support for Basecola.",
        },
      ],
    };
  },
  component: SupportPage,
});

function SupportPage() {
  const { slug } = Route.useParams();
  return <MarketingContentPage category="Support" slug={slug} />;
}
