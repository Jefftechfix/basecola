import { describe, expect, it } from "vitest";
import { createTtlCache, parseAlchemyPriceResponse } from "@/lib/market-prices";

describe("Alchemy market prices", () => {
  it("parses only requested USD quotes with valid positive prices", () => {
    const quotes = parseAlchemyPriceResponse({
      data: [
        { symbol: "BTC", prices: [{ currency: "usd", value: "67200.25", lastUpdatedAt: "2026-11-06T01:00:00Z" }] },
        { symbol: "ETH", prices: [{ currency: "eur", value: "1900" }] },
        { symbol: "DOGE", prices: [{ currency: "usd", value: "0.12" }] },
        { symbol: "XRP", prices: [{ currency: "usd", value: "0" }] },
      ],
    }, ["BTC", "ETH", "XRP"]);

    expect(quotes).toEqual([{ symbol: "BTC", priceUsd: 67200.25, updatedAt: "2026-11-06T01:00:00Z" }]);
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
});