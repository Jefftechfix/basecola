import { useQuery } from "@tanstack/react-query";
import type { MarketQuote } from "@/lib/market-prices";

const MARKET_QUERY_KEY = ["alchemy-market-prices"] as const;
const MARKET_CACHE_MS = 60_000;

export function useAlchemyMarketPrices() {
  return useQuery({
    queryKey: MARKET_QUERY_KEY,
    queryFn: async () => {
      const response = await fetch("/api/public/market-prices");
      if (!response.ok) {
        throw new Error("Live market prices are temporarily unavailable.");
      }
      return (await response.json()) as MarketQuote[];
    },
    staleTime: MARKET_CACHE_MS,
    gcTime: 5 * MARKET_CACHE_MS,
    refetchInterval: MARKET_CACHE_MS,
    retry: 1,
  });
}

export function findMarketQuote(quotes: readonly MarketQuote[] | undefined, symbol: string) {
  return quotes?.find(quote => quote.symbol === symbol.toUpperCase());
}

export function formatMarketPrice(price: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: price < 1 ? 6 : 2,
  }).format(price);
}

export function marketPriceText(quotes: readonly MarketQuote[] | undefined, symbol: string, samplePrice: string) {
  const quote = findMarketQuote(quotes, symbol);
  return quote ? formatMarketPrice(quote.priceUsd) : samplePrice;
}

export function MarketFeedLabel({ quotes }: { quotes: readonly MarketQuote[] | undefined }) {
  return <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-primary">
    {quotes && quotes.length > 0 ? "Live · Alchemy" : "Sample prices"}
  </span>;
}