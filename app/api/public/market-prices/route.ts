import { loadAlchemyMarketPrices } from "@/lib/market-prices.server";

export async function GET() {
  const quotes = await loadAlchemyMarketPrices();
  return Response.json(quotes, {
    headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30" },
  });
}
