import { createFileRoute } from "@tanstack/react-router";
import { loadAlchemyMarketPrices } from "@/lib/market-prices.server";

export const Route = createFileRoute("/api/public/market-prices")({
  server: {
    handlers: {
      GET: async () => {
        const quotes = await loadAlchemyMarketPrices();
        return Response.json(quotes, {
          headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30" },
        });
      },
    },
  },
});
