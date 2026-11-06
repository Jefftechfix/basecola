export const CRYPTO_NETWORKS = {
  BTC: "bitcoin-mainnet",
  ETH: "ethereum-mainnet",
  USDT: "ethereum-mainnet",
  SOL: "solana-mainnet",
  XRP: "xrpl-mainnet",
} as const;

export type CryptoAsset = keyof typeof CRYPTO_NETWORKS;
export type CryptoNetwork = (typeof CRYPTO_NETWORKS)[CryptoAsset];

export const CRYPTO_ASSETS = Object.keys(CRYPTO_NETWORKS) as CryptoAsset[];

export const ASSET_NAMES: Record<CryptoAsset, string> = {
  BTC: "Bitcoin",
  ETH: "Ethereum",
  USDT: "Tether (ERC-20)",
  SOL: "Solana",
  XRP: "XRP Ledger",
};

export function isCryptoAsset(value: string): value is CryptoAsset {
  return Object.hasOwn(CRYPTO_NETWORKS, value);
}

export function isCryptoNetwork(value: string): value is CryptoNetwork {
  return Object.values(CRYPTO_NETWORKS).includes(value as CryptoNetwork);
}

export function isSupportedAssetNetwork(asset: string, network: string): asset is CryptoAsset {
  return isCryptoAsset(asset) && CRYPTO_NETWORKS[asset] === network;
}

export function depositAddressAsset(asset: CryptoAsset): "BTC" | "ETH" | "SOL" | "XRP" {
  return asset === "USDT" ? "ETH" : asset;
}

export function assetSupportsWithdrawals(asset: CryptoAsset): boolean {
  return asset !== "XRP";
}
