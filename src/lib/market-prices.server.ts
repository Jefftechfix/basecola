import {
  createTtlCache,
  MARKET_SYMBOLS,
  parseAlchemyPriceResponse,
  type MarketQuote,
} from "./market-prices";

const MARKET_PRICE_CACHE_TTL_MS = 60_000;
const cachedPrices = createTtlCache<MarketQuote[]>(MARKET_PRICE_CACHE_TTL_MS);

export async function loadAlchemyMarketPrices(): Promise<MarketQuote[]> {
  const supabaseUrl = process.env["SUPABASE_URL"]?.trim();
  const supabaseApiKey =
    process.env["SUPABASE_PUBLISHABLE_KEY"]?.trim() || process.env["SUPABASE_ANON_KEY"]?.trim();
  if (!supabaseUrl || !supabaseApiKey) {
    throw new Error("Live market prices are temporarily unavailable.");
  }

  return cachedPrices(async () => {
    const url = new URL("/functions/v1/alchemy-market-prices", supabaseUrl);
    const response = await fetch(url, {
      headers: { Accept: "application/json", apikey: supabaseApiKey },
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      console.error(`Market-price function request failed [${response.status}].`);
      throw new Error("Live market prices are temporarily unavailable.");
    }

    const payload: unknown = await response.json();
    if (!Array.isArray(payload)) {
      throw new Error("Live market prices are temporarily unavailable.");
    }

    return payload.filter((quote): quote is MarketQuote => {
      if (!quote || typeof quote !== "object") return false;
      const candidate = quote as Partial<MarketQuote>;
      return (
        typeof candidate.symbol === "string" &&
        MARKET_SYMBOLS.includes(candidate.symbol as (typeof MARKET_SYMBOLS)[number]) &&
        typeof candidate.priceUsd === "number" &&
        Number.isFinite(candidate.priceUsd) &&
        candidate.priceUsd > 0 &&
        typeof candidate.updatedAt === "string"
      );
    });
  });
}
