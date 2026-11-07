import { createFileRoute } from "@tanstack/react-router";
import { MarketingContentPage } from "@/components/marketing-content-page";
import { getMarketingPage } from "@/lib/marketing-pages";

export const Route = createFileRoute("/products/$slug")({
  head: ({ params }) => {
    const page = getMarketingPage("Products", params.slug);
    return {
      meta: [
        { title: `${page?.label ?? "Products"} — Basecola` },
        { name: "description", content: page?.description ?? "Explore Basecola products." },
      ],
    };
  },
  component: ProductsPage,
});

function ProductsPage() {
  const { slug } = Route.useParams();
  return <MarketingContentPage category="Products" slug={slug} />;
}
