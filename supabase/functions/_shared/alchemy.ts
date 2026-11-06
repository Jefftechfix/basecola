export function alchemyApiKey(): string {
  const key = Deno.env.get("ALCHEMY_API_KEY")?.trim();
  if (!key) throw new Error("Missing Edge Function secret: ALCHEMY_API_KEY");
  return key;
}

export function alchemyEthereumRpcUrl(): string {
  const configuredUrl =
    Deno.env.get("ALCHEMY_ETHEREUM_RPC_URL")?.trim() ||
    Deno.env.get("ETHEREUM_MAINNET_RPC_URL")?.trim();
  if (configuredUrl) return configuredUrl;

  return `https://eth-mainnet.g.alchemy.com/v2/${encodeURIComponent(alchemyApiKey())}`;
}

export function alchemyNotifyApiKey(): string {
  return Deno.env.get("ALCHEMY_NOTIFY_API_KEY")?.trim() || alchemyApiKey();
}
