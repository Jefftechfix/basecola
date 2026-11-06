import { alchemyApiKey } from "../_shared/alchemy.ts";
import {
  createTtlCache,
  MARKET_SYMBOLS,
  parseAlchemyPriceResponse,
  type MarketQuote,
} from "../../../src/lib/market-prices.ts";

const CACHE_TTL_MS = 60_000;
const cachedPrices = createTtlCache<MarketQuote[]>(CACHE_TTL_MS);

function json(body: unknown, status = 200): Response {
  return Response.json(body, {
    status,
    headers: { "cache-control": "public, max-age=60, stale-while-revalidate=30" },
  });
}

Deno.serve(async (request) => {
  if (request.method !== "GET") return json({ error: "Method not allowed." }, 405);

  try {
    const quotes = await cachedPrices(async () => {
      const apiKey = alchemyApiKey();
      const url = new URL(
        `https://api.g.alchemy.com/prices/v1/${encodeURIComponent(apiKey)}/tokens/by-symbol`,
      );
      for (const symbol of MARKET_SYMBOLS) url.searchParams.append("symbols", symbol);

      const response = await fetch(url, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) {
        console.error(`Alchemy market-price request failed [${response.status}].`);
        throw new Error("Alchemy market prices are unavailable.");
      }

      const parsed = parseAlchemyPriceResponse(await response.json(), MARKET_SYMBOLS);
      if (parsed.length === 0) throw new Error("Alchemy returned no supported market prices.");
      return parsed;
    });

    return json(quotes);
  } catch {
    console.error("Could not load Alchemy market prices.");
    return json({ error: "Live market prices are temporarily unavailable." }, 503);
  }
});
