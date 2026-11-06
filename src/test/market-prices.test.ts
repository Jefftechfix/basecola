import { afterEach, describe, expect, it, vi } from "vitest";
import { createTtlCache, parseAlchemyPriceResponse } from "@/lib/market-prices";
import { loadAlchemyMarketPrices } from "@/lib/market-prices.server";

describe("Alchemy market prices", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("parses only requested USD quotes with valid positive prices", () => {
    const quotes = parseAlchemyPriceResponse(
      {
        data: [
          {
            symbol: "BTC",
            prices: [{ currency: "usd", value: "67200.25", lastUpdatedAt: "2026-11-06T01:00:00Z" }],
          },
          { symbol: "ETH", prices: [{ currency: "eur", value: "1900" }] },
          { symbol: "DOGE", prices: [{ currency: "usd", value: "0.12" }] },
          { symbol: "XRP", prices: [{ currency: "usd", value: "0" }] },
        ],
      },
      ["BTC", "ETH", "XRP"],
    );

    expect(quotes).toEqual([
      { symbol: "BTC", priceUsd: 67200.25, updatedAt: "2026-11-06T01:00:00Z" },
    ]);
  });

  it("reuses cached prices for 60 seconds and refreshes at expiry", async () => {
    const cache = createTtlCache<number>(60_000);
    let requests = 0;
    const load = async () => ++requests;

    expect(await cache(load, 1_000)).toBe(1);
    expect(await cache(load, 60_999)).toBe(1);
    expect(await cache(load, 61_000)).toBe(2);
    expect(requests).toBe(2);
  });

  it("loads quotes through Supabase without requiring the Alchemy key on the app server", async () => {
    vi.stubEnv("SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("SUPABASE_ANON_KEY", "public-supabase-key");
    vi.stubEnv("ALCHEMY_API_KEY", "");
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(
          JSON.stringify([{ symbol: "ETH", priceUsd: 3500, updatedAt: "2026-11-06T01:00:00Z" }]),
          { status: 200 },
        ),
      );
    vi.stubGlobal("fetch", fetchMock);

    await expect(loadAlchemyMarketPrices()).resolves.toEqual([
      { symbol: "ETH", priceUsd: 3500, updatedAt: "2026-11-06T01:00:00Z" },
    ]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toBe(
      "https://example.supabase.co/functions/v1/alchemy-market-prices",
    );
    expect(fetchMock.mock.calls[0][1]?.headers).toEqual({
      Accept: "application/json",
      apikey: "public-supabase-key",
    });
  });
});
