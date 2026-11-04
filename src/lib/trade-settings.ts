import { supabase } from "@/integrations/supabase/client";

export type TradeAssetSetting = {
  coin: string;
  network: string;
  buy_price_usd: number;
  sell_price_usd: number;
  minimum_crypto_amount: number;
  maximum_crypto_amount: number;
  buy_enabled: boolean;
  sell_enabled: boolean;
};

export function tradeCryptoLimitError(amount: number, minimum: number, maximum: number) {
  if (!Number.isFinite(amount) || !Number.isFinite(minimum) || !Number.isFinite(maximum) || amount < minimum || amount > maximum) {
    return `Amount must be between ${minimum} and ${maximum} crypto.`;
  }
  return "";
}

export async function loadTradeSettings(): Promise<TradeAssetSetting[]> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return [];
  const { data, error } = await supabase.from("trade_asset_settings")
    .select("coin, network, buy_price_usd, sell_price_usd, minimum_crypto_amount, maximum_crypto_amount, buy_enabled, sell_enabled")
    .order("coin", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map(row => ({
    ...row,
    buy_price_usd: Number(row.buy_price_usd),
    sell_price_usd: Number(row.sell_price_usd),
    minimum_crypto_amount: Number(row.minimum_crypto_amount),
    maximum_crypto_amount: Number(row.maximum_crypto_amount),
  }));
}