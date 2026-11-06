import { isRecord } from "./validation.ts";

export type AlchemyEthereumDepositCandidate = {
  asset: "ETH" | "USDT";
  category: "external" | "token";
  transactionHash: string;
  eventIndex: number;
  fromAddress: string;
  toAddress: string;
  rawAmount: string | null;
  tokenContract: string | null;
  blockNumber: number;
  blockHash: string | null;
  removed: boolean;
};

function isHex(value: unknown): value is string {
  return typeof value === "string" && /^0x[0-9a-fA-F]+$/.test(value);
}

function parseHexInteger(value: unknown): number | null {
  if (!isHex(value)) return null;
  const parsed = Number(BigInt(value));
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : null;
}

export function parseAlchemyEthereumDeposits(
  payload: unknown,
  usdtContractAddress: string,
): AlchemyEthereumDepositCandidate[] {
  if (!isRecord(payload) || payload.type !== "ADDRESS_ACTIVITY" || !isRecord(payload.event))
    return [];
  if (payload.event.network !== "ETH_MAINNET" || !Array.isArray(payload.event.activity)) return [];

  const contractAddress = usdtContractAddress.toLowerCase();
  const candidates: AlchemyEthereumDepositCandidate[] = [];

  for (const entry of payload.event.activity) {
    if (!isRecord(entry)) continue;
    const txHash = entry.hash;
    const fromAddress = entry.fromAddress;
    const toAddress = entry.toAddress;
    const blockNumber = parseHexInteger(entry.blockNum);
    const log = isRecord(entry.log) ? entry.log : null;
    const rawBlockHash = log?.blockHash ?? entry.blockHash;
    const blockHash =
      typeof rawBlockHash === "string" && /^0x[0-9a-fA-F]{64}$/.test(rawBlockHash)
        ? rawBlockHash
        : null;
    const removed = log?.removed === true;

    if (
      typeof txHash !== "string" ||
      !/^0x[0-9a-fA-F]{64}$/.test(txHash) ||
      typeof fromAddress !== "string" ||
      !/^0x[0-9a-fA-F]{40}$/.test(fromAddress) ||
      typeof toAddress !== "string" ||
      !/^0x[0-9a-fA-F]{40}$/.test(toAddress) ||
      blockNumber === null ||
      (removed && blockHash === null)
    )
      continue;

    const category = entry.category;
    if (category === "external") {
      const rawAmount =
        isRecord(entry.rawContract) && isHex(entry.rawContract.rawValue)
          ? entry.rawContract.rawValue
          : null;
      candidates.push({
        asset: "ETH",
        category: "external",
        transactionHash: txHash,
        eventIndex: 0,
        fromAddress,
        toAddress,
        rawAmount,
        tokenContract: null,
        blockNumber,
        blockHash,
        removed,
      });
      continue;
    }

    if (category !== "token" && category !== "erc20") continue;
    const rawContract = isRecord(entry.rawContract) ? entry.rawContract : null;
    const tokenAddress = rawContract?.address;
    const rawValue = rawContract?.rawValue;
    const logIndex = parseHexInteger(log?.logIndex);
    const topics = log?.topics;
    if (
      typeof tokenAddress !== "string" ||
      tokenAddress.toLowerCase() !== contractAddress ||
      typeof log?.address !== "string" ||
      log.address.toLowerCase() !== contractAddress ||
      rawContract?.decimals !== 6 ||
      !isHex(rawValue) ||
      logIndex === null ||
      logIndex >= Number.MAX_SAFE_INTEGER ||
      !Array.isArray(topics) ||
      topics.length < 3 ||
      typeof topics[0] !== "string" ||
      topics[0].toLowerCase() !==
        "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef" ||
      typeof topics[1] !== "string" ||
      !/^0x[0-9a-fA-F]{64}$/.test(topics[1]) ||
      topics[1].slice(-40).toLowerCase() !== fromAddress.slice(2).toLowerCase() ||
      typeof topics[2] !== "string" ||
      !/^0x[0-9a-fA-F]{64}$/.test(topics[2]) ||
      topics[2].slice(-40).toLowerCase() !== toAddress.slice(2).toLowerCase() ||
      log.transactionHash !== txHash ||
      log.blockNumber !== entry.blockNum ||
      typeof log.data !== "string" ||
      log.data.toLowerCase() !== rawValue.toLowerCase()
    )
      continue;

    candidates.push({
      asset: "USDT",
      category: "token",
      transactionHash: txHash,
      eventIndex: logIndex + 1,
      fromAddress,
      toAddress,
      rawAmount: rawValue,
      tokenContract: tokenAddress,
      blockNumber,
      blockHash,
      removed,
    });
  }

  return candidates;
}

export function rawUnitsToDecimal(rawValue: string, decimals: number): string {
  if (!isHex(rawValue) || !Number.isInteger(decimals) || decimals < 0 || decimals > 18) {
    throw new Error("Invalid on-chain amount.");
  }
  const value = BigInt(rawValue);
  if (value <= 0n) throw new Error("On-chain amount must be positive.");
  if (decimals === 0) return value.toString();
  const base = 10n ** BigInt(decimals);
  const whole = value / base;
  const fraction = (value % base).toString().padStart(decimals, "0").replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : whole.toString();
}

export async function verifyAlchemyWebhookSignature(
  body: string,
  signature: string,
  signingKey: string,
): Promise<boolean> {
  if (!/^[0-9a-f]{64}$/i.test(signature)) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(signingKey),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body)),
  );
  let difference = 0;
  for (let index = 0; index < digest.length; index += 1) {
    difference |= digest[index] ^ Number.parseInt(signature.slice(index * 2, index * 2 + 2), 16);
  }
  return difference === 0;
}
