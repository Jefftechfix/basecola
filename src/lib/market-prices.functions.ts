import { createServerFn } from "@tanstack/react-start";
import { loadAlchemyMarketPrices } from "./market-prices.server";

export const getAlchemyMarketPrices = createServerFn({ method: "GET" })
  .handler(async () => loadAlchemyMarketPrices());