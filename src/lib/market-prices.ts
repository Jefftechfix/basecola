export const MARKET_SYMBOLS = ["BTC", "ETH", "USDT", "SOL", "XRP"] as const;

export type MarketSymbol = (typeof MARKET_SYMBOLS)[number];

export type MarketQuote = {
  symbol: MarketSymbol;
  priceUsd: number;
  updatedAt: string;
};

export function parseAlchemyPriceResponse(
  payload: unknown,
  requestedSymbols: readonly string[],
  receivedAt = new Date().toISOString(),
): MarketQuote[] {
  if (!payload || typeof payload !== "object" || !Array.isArray((payload as { data?: unknown }).data)) return [];

  const requested = new Set(requestedSymbols.map(symbol => symbol.toUpperCase()));
  const rows = (payload as { data: unknown[] }).data;
  const quotes: MarketQuote[] = [];

  for (const row of rows) {
    if (!row || typeof row !== "object") continue;
    const symbol = (row as { symbol?: unknown }).symbol;
    const prices = (row as { prices?: unknown }).prices;
    if (typeof symbol !== "string" || !requested.has(symbol.toUpperCase()) || !Array.isArray(prices)) continue;

    const usdPrice = prices.find(price => price && typeof price === "object" &&
      typeof (price as { currency?: unknown }).currency === "string" &&
      (price as { currency: string }).currency.toLowerCase() === "usd");
    if (!usdPrice || typeof usdPrice !== "object") continue;

    const priceUsd = Number((usdPrice as { value?: unknown }).value);
    if (!Number.isFinite(priceUsd) || priceUsd <= 0 || !MARKET_SYMBOLS.includes(symbol.toUpperCase() as MarketSymbol)) continue;
    const updatedAt = (usdPrice as { lastUpdatedAt?: unknown }).lastUpdatedAt;
    quotes.push({
      symbol: symbol.toUpperCase() as MarketSymbol,
      priceUsd,
      updatedAt: typeof updatedAt === "string" ? updatedAt : receivedAt,
    });
  }

  return quotes;
}

export function createTtlCache<T>(ttlMs: number) {
  let entry: { value: T; expiresAt: number } | undefined;
  let inFlight: Promise<T> | undefined;

  return async (load: () => Promise<T>, now = Date.now()): Promise<T> => {
    if (entry && now < entry.expiresAt) return entry.value;
    if (inFlight) return inFlight;

    const pending = load();
    inFlight = pending;
    try {
      const value = await pending;
      entry = { value, expiresAt: now + ttlMs };
      return value;
    } finally {
      if (inFlight === pending) inFlight = undefined;
    }
  };
}