import {
  isCryptoAsset,
  isCryptoNetwork,
  isSupportedAssetNetwork,
  type CryptoAsset,
  type CryptoNetwork,
} from "./networks.ts";

export type ChainDepositEvent = {
  network: CryptoNetwork;
  asset: CryptoAsset;
  txHash: string;
  eventIndex: number;
  depositAddress: string;
  destinationTag: number | null;
  tokenContract: string | null;
  amount: string;
  amountUsd: string | null;
  blockNumber: number | null;
  blockHash: string | null;
  confirmations: number;
  requiredConfirmations: number;
  isFailed: boolean;
  failureReason: string | null;
  senderAddress: string | null;
  observedAt: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isInteger(value: unknown, min: number, max = Number.MAX_SAFE_INTEGER): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= min && value <= max;
}

function decimal(
  value: unknown,
  scale: number,
  maxIntegerDigits: number,
  positive: boolean,
): value is string {
  if (typeof value !== "string") return false;
  const match = new RegExp(`^\\d{1,${maxIntegerDigits}}(?:\\.\\d{1,${scale}})?$`).exec(value);
  if (!match) return false;
  if (!positive) return true;
  return /[1-9]/.test(value);
}

function validTransactionHash(network: CryptoNetwork, value: unknown): value is string {
  if (typeof value !== "string") return false;
  if (network === "solana-mainnet") {
    return /^[1-9A-HJ-NP-Za-km-z]{64,100}$/.test(value);
  }
  return /^(?:0x)?[0-9a-fA-F]{64}$/.test(value);
}

function containsControlCharacter(value: string): boolean {
  for (const character of value) {
    const code = character.charCodeAt(0);
    if (code < 32 || code === 127) return true;
  }
  return false;
}

function optionalText(value: unknown, maxLength: number): value is string | null | undefined {
  return (
    value === undefined ||
    value === null ||
    (typeof value === "string" && value.length <= maxLength && !containsControlCharacter(value))
  );
}

export function parseChainDepositEvent(value: unknown): ChainDepositEvent | null {
  if (!isRecord(value)) return null;

  const { network, asset } = value;
  if (
    typeof network !== "string" ||
    typeof asset !== "string" ||
    !isCryptoNetwork(network) ||
    !isCryptoAsset(asset) ||
    !isSupportedAssetNetwork(asset, network)
  )
    return null;

  let tokenContract: string | null = null;
  if (asset === "USDT") {
    if (
      typeof value.tokenContract !== "string" ||
      !/^0x[0-9a-fA-F]{40}$/.test(value.tokenContract)
    ) {
      return null;
    }
    tokenContract = value.tokenContract;
  } else if (value.tokenContract !== null) {
    return null;
  }

  if (
    !validTransactionHash(network, value.txHash) ||
    !isInteger(value.eventIndex, 0) ||
    typeof value.depositAddress !== "string" ||
    value.depositAddress.length < 20 ||
    value.depositAddress.length > 128 ||
    /\s/.test(value.depositAddress) ||
    !(value.destinationTag === null || isInteger(value.destinationTag, 0, 4_294_967_295)) ||
    (network !== "xrpl-mainnet" && value.destinationTag !== null) ||
    !decimal(value.amount, 18, 20, true) ||
    !(
      value.amountUsd === null ||
      value.amountUsd === undefined ||
      decimal(value.amountUsd, 2, 18, false)
    ) ||
    !(value.blockNumber === null || isInteger(value.blockNumber, 0)) ||
    !(
      value.blockHash === null ||
      (typeof value.blockHash === "string" &&
        value.blockHash.length <= 128 &&
        !/\s/.test(value.blockHash))
    ) ||
    !isInteger(value.confirmations, 0) ||
    !isInteger(value.requiredConfirmations, 1, 100_000) ||
    !(value.isFailed === undefined || typeof value.isFailed === "boolean") ||
    !optionalText(value.failureReason, 500) ||
    !optionalText(value.senderAddress, 128) ||
    !(
      value.observedAt === null ||
      value.observedAt === undefined ||
      (typeof value.observedAt === "string" && Number.isFinite(Date.parse(value.observedAt)))
    )
  )
    return null;

  return {
    network,
    asset,
    txHash: value.txHash,
    eventIndex: value.eventIndex,
    depositAddress: value.depositAddress,
    destinationTag: value.destinationTag,
    tokenContract,
    amount: value.amount,
    amountUsd: value.amountUsd ?? null,
    blockNumber: value.blockNumber,
    blockHash: value.blockHash,
    confirmations: value.confirmations,
    requiredConfirmations: value.requiredConfirmations,
    isFailed: value.isFailed ?? false,
    failureReason: value.failureReason ?? null,
    senderAddress: value.senderAddress ?? null,
    observedAt: value.observedAt ?? null,
  };
}
