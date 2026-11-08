import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MarketingContentPage } from "@/components/marketing-content-page";
import {
  getMarketingPage,
  MARKETING_NAV,
  type MarketingCategory,
} from "@/lib/marketing-pages";

const categoryBySection: Record<string, MarketingCategory> = {
  company: "Company",
  products: "Products",
  support: "Support",
};

type PageParams = { section: string; slug: string };

export function generateStaticParams() {
  return MARKETING_NAV.flatMap(({ category, items }) =>
    items.map(({ slug }) => ({
      section: category === "Company" ? "company" : category === "Products" ? "products" : "support",
      slug,
    })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}): Promise<Metadata> {
  const { section, slug } = await params;
  const category = categoryBySection[section];
  const page = category ? getMarketingPage(category, slug) : undefined;

  if (!page) return { title: "Page not found — Basecola" };

  return {
    title: `${page.label} — Basecola`,
    description: page.description,
  };
}

export default async function MarketingPageRoute({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { section, slug } = await params;
  const category = categoryBySection[section];
  if (!category || !getMarketingPage(category, slug)) notFound();

  return <MarketingContentPage category={category} slug={slug} />;
}
