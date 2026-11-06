import { createTtlCache, MARKET_SYMBOLS, parseAlchemyPriceResponse, type MarketQuote } from "./market-prices";

const MARKET_PRICE_CACHE_TTL_MS = 60_000;
const cachedPrices = createTtlCache<MarketQuote[]>(MARKET_PRICE_CACHE_TTL_MS);

export async function loadAlchemyMarketPrices(): Promise<MarketQuote[]> {
  const apiKey = process.env["ALCHEMY_API_KEY"]?.trim();
  if (!apiKey) return [];

  return cachedPrices(async () => {
    const url = new URL(`https://api.g.alchemy.com/prices/v1/${encodeURIComponent(apiKey)}/tokens/by-symbol`);
    for (const symbol of MARKET_SYMBOLS) url.searchParams.append("symbols", symbol);

    const response = await fetch(url, { headers: { Accept: "application/json" } });
    if (!response.ok) {
      const body = await response.text();
      console.error(`Alchemy market-price request failed [${response.status}]: ${body.slice(0, 500)}`);
      throw new Error("Live market prices are temporarily unavailable.");
    }

    return parseAlchemyPriceResponse(await response.json(), MARKET_SYMBOLS);
  });
}