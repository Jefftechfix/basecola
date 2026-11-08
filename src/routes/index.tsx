import { createFileRoute } from "@tanstack/react-router";
import { LandingPage } from "@/components/landing-page";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Basecola — Buy, sell & manage crypto" },
      { name: "description", content: "A secure and easy way to buy, sell, trade, and store cryptocurrency on Basecola." },
      { property: "og:title", content: "Basecola — Buy, sell & manage crypto" },
      { property: "og:description", content: "A secure and easy way to buy, sell, trade, and store cryptocurrency." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LandingPage,
});
