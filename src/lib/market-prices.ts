export const MARKET_SYMBOLS = ["BTC", "ETH", "USDT", "SOL", "XRP"] as const;

export type MarketSymbol = (typeof MARKET_SYMBOLS)[number];

export type MarketQuote = {
  symbol: MarketSymbol;
  priceUsd: number;
  updatedAt: string;
};

export function priceWithMarketMargin(marketPriceUsd: number, marginPercent: number): number {
  if (
    !Number.isFinite(marketPriceUsd) ||
    marketPriceUsd <= 0 ||
    !Number.isFinite(marginPercent) ||
    marginPercent <= -100
  ) {
    throw new Error("Market price and margin must produce a positive rate.");
  }
  const rate = marketPriceUsd * (1 + marginPercent / 100);
  if (!Number.isFinite(rate) || rate <= 0) {
    throw new Error("Market price and margin must produce a positive rate.");
  }
  return rate;
}

export function parseAlchemyPriceResponse(
  payload: unknown,
  requestedSymbols: readonly string[],
  receivedAt = new Date().toISOString(),
): MarketQuote[] {
  if (!payload || typeof payload !== "object" || !Array.isArray((payload as { data?: unknown }).data)) return [];

  const requested = new Set(
    requestedSymbols
      .filter((symbol): symbol is string => typeof symbol === "string")
      .map((symbol) => symbol.trim().toUpperCase()),
  );
  const rows = (payload as { data: unknown[] }).data;
  const quotes: MarketQuote[] = [];

  for (const row of rows) {
    if (!row || typeof row !== "object") continue;
    const symbol = (row as { symbol?: unknown }).symbol;
    const prices = (row as { prices?: unknown }).prices;
    if (typeof symbol !== "string" || !requested.has(symbol.trim().toUpperCase()) || !Array.isArray(prices)) continue;

    const usdPrice = prices.find(
      (price) =>
        price &&
        typeof price === "object" &&
        typeof (price as { currency?: unknown }).currency === "string" &&
        (price as { currency: string }).currency.toLowerCase() === "usd",
    );
    if (!usdPrice || typeof usdPrice !== "object") continue;

    const priceUsd = Number((usdPrice as { value?: unknown }).value);
    const normalizedSymbol = symbol.trim().toUpperCase();
    if (!Number.isFinite(priceUsd) || priceUsd <= 0 || !MARKET_SYMBOLS.includes(normalizedSymbol as MarketSymbol)) continue;
    const updatedAt = (usdPrice as { lastUpdatedAt?: unknown }).lastUpdatedAt;
    quotes.push({
      symbol: normalizedSymbol as MarketSymbol,
      priceUsd,
      updatedAt: typeof updatedAt === "string" ? updatedAt : receivedAt,
    });
  }

  return quotes;
}

export function createTtlCache<T>(ttlMs: number) {
  const cacheTtlMs = Number.isFinite(ttlMs) ? Math.max(0, ttlMs) : 0;
  let entry: { value: T; expiresAt: number } | undefined;
  let inFlight: Promise<T> | undefined;

  return async (load: () => Promise<T>, now = Date.now()): Promise<T> => {
    if (entry && now < entry.expiresAt) return entry.value;
    if (inFlight) return inFlight;

    const pending = load();
    inFlight = pending;
    try {
      const value = await pending;
      entry = { value, expiresAt: now + cacheTtlMs };
      return value;
    } finally {
      if (inFlight === pending) inFlight = undefined;
    }
  };
}