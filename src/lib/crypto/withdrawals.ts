import { isCryptoAsset, type CryptoAsset } from "@/lib/crypto/networks";

const WITHDRAWAL_NETWORKS: Record<CryptoAsset, string> = {
  BTC: "bitcoin-mainnet",
  ETH: "ethereum-mainnet",
  USDT: "ethereum-mainnet",
  SOL: "solana-mainnet",
  XRP: "xrpl-mainnet",
};

export type CryptoWithdrawalInput = {
  asset: CryptoAsset;
  network: string;
  destinationAddress: string;
  destinationTag: number | null;
  amount: string;
  idempotencyKey: string;
};

export function parseCryptoWithdrawalInput(input: unknown): CryptoWithdrawalInput | null {
  if (input === null || typeof input !== "object" || Array.isArray(input)) return null;
  const value = input as Record<string, unknown>;
  const destinationTag = value.destinationTag;
  if (
    typeof value.asset !== "string" ||
    !isCryptoAsset(value.asset) ||
    value.network !== WITHDRAWAL_NETWORKS[value.asset] ||
    typeof value.destinationAddress !== "string" ||
    typeof value.amount !== "string" ||
    !/^\d{1,20}(?:\.\d{1,18})?$/.test(value.amount) ||
    !/[1-9]/.test(value.amount) ||
    typeof value.idempotencyKey !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value.idempotencyKey) ||
    !(destinationTag === null || (
      typeof destinationTag === "number" &&
      Number.isSafeInteger(destinationTag) &&
      destinationTag >= 0 &&
      destinationTag <= 4_294_967_295
    ))
  ) return null;

  const address = value.destinationAddress.trim();
  const validAddress = value.asset === "BTC"
    ? /^(?:bc1[ac-hj-np-z02-9]{11,71}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})$/.test(address)
    : value.asset === "ETH" || value.asset === "USDT"
      ? /^0x[0-9a-fA-F]{40}$/.test(address)
      : value.asset === "SOL"
        ? /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)
        : /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/.test(address);
  if (!validAddress) return null;

  return {
    asset: value.asset,
    network: value.network,
    destinationAddress: address,
    destinationTag,
    amount: value.amount,
    idempotencyKey: value.idempotencyKey,
  };
}
