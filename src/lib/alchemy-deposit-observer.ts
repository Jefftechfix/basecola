import { parseAlchemyEthereumDeposits, rawUnitsToDecimal } from "./crypto/alchemy.ts";
import { isRecord } from "./crypto/validation.ts";

type JsonRpcResponse = {
  result?: unknown;
  error?: { message?: string };
};

export type AlchemyDepositObservation = {
  network: "ethereum-mainnet";
  asset: "ETH" | "USDT";
  txHash: string;
  eventIndex: number;
  depositAddress: string;
  destinationTag: null;
  tokenContract: string | null;
  amount: string;
  amountUsd: null;
  blockNumber: number;
  blockHash: string | null;
  confirmations: number;
  requiredConfirmations: number;
  isFailed: boolean;
  failureReason: string | null;
  senderAddress: string;
  observedAt: string;
};

export type AlchemyEthereumObserverDependencies = {
  getDepositPolicy: (asset: "ETH" | "USDT") => Promise<{
    enabled: boolean;
    requiredConfirmations: number;
  } | null>;
  hasObservation: (txHash: string, eventIndex: number) => Promise<boolean>;
  getWallet: (address: string) => Promise<{ address: string } | null>;
  recordDeposit: (observation: AlchemyDepositObservation) => Promise<void>;
};

function parseHexInteger(value: unknown): number | null {
  if (typeof value !== "string" || !/^0x[0-9a-fA-F]+$/.test(value)) return null;
  const parsed = Number(BigInt(value));
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : null;
}

async function ethereumRpc<T>(url: string, method: string, params: unknown[]): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw new Error("Ethereum RPC request failed.");
  }
  if (!response.ok) throw new Error(`Ethereum RPC returned HTTP ${response.status}.`);
  const payload = (await response.json()) as JsonRpcResponse;
  if (payload.error) throw new Error(payload.error.message ?? "Ethereum RPC request failed.");
  return payload.result as T;
}

function matchingTransferLog(
  receipt: unknown,
  candidate: ReturnType<typeof parseAlchemyEthereumDeposits>[number],
) {
  if (!isRecord(receipt) || !Array.isArray(receipt.logs)) return null;
  const index = candidate.eventIndex - 1;
  return (
    receipt.logs.find((value) => {
      if (!isRecord(value)) return false;
      return (
        parseHexInteger(value.logIndex) === index &&
        typeof value.address === "string" &&
        value.address.toLowerCase() === candidate.tokenContract?.toLowerCase() &&
        typeof value.data === "string" &&
        value.data.toLowerCase() === candidate.rawAmount?.toLowerCase() &&
        Array.isArray(value.topics) &&
        value.topics.length >= 3 &&
        value.topics[0] === "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef" &&
        typeof value.topics[1] === "string" &&
        value.topics[1].slice(-40).toLowerCase() === candidate.fromAddress.slice(2).toLowerCase() &&
        typeof value.topics[2] === "string" &&
        value.topics[2].slice(-40).toLowerCase() === candidate.toAddress.slice(2).toLowerCase()
      );
    }) ?? null
  );
}

async function observeCandidate(
  candidate: ReturnType<typeof parseAlchemyEthereumDeposits>[number],
  rpcUrl: string,
  configuredUsdtContract: string,
  dependencies: AlchemyEthereumObserverDependencies,
): Promise<void> {
  const policy = await dependencies.getDepositPolicy(candidate.asset);
  if (!policy) throw new Error("Ethereum deposit policy is missing.");

  if (!policy.enabled) {
    if (!(await dependencies.hasObservation(candidate.transactionHash, candidate.eventIndex)))
      return;
  }

  if (
    candidate.asset === "USDT" &&
    candidate.tokenContract?.toLowerCase() !== configuredUsdtContract.toLowerCase()
  ) {
    return;
  }

  const account = await dependencies.getWallet(candidate.toAddress);
  if (!account?.address) return;

  let amountRaw = candidate.rawAmount;
  let amountDecimals = candidate.asset === "USDT" ? 6 : 18;
  let isFailed = candidate.removed;
  let confirmations = 0;
  let observedBlock = candidate.blockNumber;
  let observedBlockHash: string | null = candidate.blockHash;
  let failureReason: string | null = candidate.removed ? "Removed from canonical chain." : null;

  const receipt = candidate.removed
    ? null
    : await ethereumRpc<unknown>(rpcUrl, "eth_getTransactionReceipt", [candidate.transactionHash]);
  if (!candidate.removed && !isRecord(receipt)) {
    throw new Error("Ethereum transaction receipt is not available yet.");
  }

  if (!candidate.removed && isRecord(receipt)) {
    const receiptBlockNumber = parseHexInteger(receipt.blockNumber);
    if (
      typeof receipt.transactionHash !== "string" ||
      receipt.transactionHash.toLowerCase() !== candidate.transactionHash.toLowerCase() ||
      receiptBlockNumber !== candidate.blockNumber ||
      typeof receipt.blockHash !== "string" ||
      (candidate.blockHash !== null &&
        receipt.blockHash.toLowerCase() !== candidate.blockHash.toLowerCase())
    ) {
      isFailed = true;
      failureReason = "Transaction block changed during reconciliation.";
    } else if (receipt.status !== "0x1") {
      isFailed = true;
      failureReason = "Ethereum transaction failed.";
    } else {
      observedBlockHash = receipt.blockHash;
      const canonicalBlock = await ethereumRpc<unknown>(rpcUrl, "eth_getBlockByNumber", [
        `0x${candidate.blockNumber.toString(16)}`,
        false,
      ]);
      if (
        !isRecord(canonicalBlock) ||
        typeof canonicalBlock.hash !== "string" ||
        canonicalBlock.hash.toLowerCase() !== receipt.blockHash.toLowerCase()
      ) {
        isFailed = true;
        failureReason = "Transaction block is no longer canonical.";
      } else {
        const head = await ethereumRpc<unknown>(rpcUrl, "eth_blockNumber", []);
        const headNumber = parseHexInteger(head);
        if (headNumber === null || headNumber < candidate.blockNumber) {
          throw new Error("Ethereum RPC returned an invalid head block.");
        }
        confirmations = headNumber - candidate.blockNumber + 1;
      }
    }

    if (candidate.asset === "USDT" && !matchingTransferLog(receipt, candidate)) {
      throw new Error("Ethereum receipt does not contain the matching USDT transfer log.");
    }

    if (candidate.asset === "ETH" && candidate.category === "external") {
      const transaction = await ethereumRpc<unknown>(rpcUrl, "eth_getTransactionByHash", [
        candidate.transactionHash,
      ]);
      if (
        !isRecord(transaction) ||
        typeof transaction.value !== "string" ||
        typeof transaction.from !== "string" ||
        transaction.from.toLowerCase() !== candidate.fromAddress.toLowerCase()
      ) {
        throw new Error("Ethereum transaction details could not be verified.");
      }
      if (
        typeof transaction.to !== "string" ||
        transaction.to.toLowerCase() !== candidate.toAddress.toLowerCase()
      ) {
        throw new Error("Ethereum transaction recipient does not match the deposit.");
      }
      if (
        candidate.rawAmount !== null &&
        transaction.value.toLowerCase() !== candidate.rawAmount.toLowerCase()
      ) {
        throw new Error("Ethereum transaction value does not match the Alchemy transfer.");
      }
      amountRaw = transaction.value;
    }
  }

  if (candidate.asset === "ETH" && candidate.category === "external" && amountRaw === null) {
    const transaction = await ethereumRpc<unknown>(rpcUrl, "eth_getTransactionByHash", [
      candidate.transactionHash,
    ]);
    if (
      !isRecord(transaction) ||
      typeof transaction.value !== "string" ||
      typeof transaction.from !== "string" ||
      transaction.from.toLowerCase() !== candidate.fromAddress.toLowerCase() ||
      typeof transaction.to !== "string" ||
      transaction.to.toLowerCase() !== candidate.toAddress.toLowerCase()
    ) {
      throw new Error("Ethereum transaction details could not be verified.");
    }
    amountRaw = transaction.value;
  }

  if (amountRaw === null) {
    throw new Error("Alchemy did not provide an exact amount for the Ethereum transfer.");
  }
  if (BigInt(amountRaw) === 0n) return;
  if (candidate.asset === "USDT") amountDecimals = 6;

  if (candidate.removed) {
    observedBlock = candidate.blockNumber;
    observedBlockHash = candidate.blockHash;
  }

  await dependencies.recordDeposit({
    network: "ethereum-mainnet",
    asset: candidate.asset,
    txHash: candidate.transactionHash,
    eventIndex: candidate.eventIndex,
    depositAddress: account.address,
    destinationTag: null,
    tokenContract: candidate.tokenContract,
    amount: rawUnitsToDecimal(amountRaw, amountDecimals),
    amountUsd: null,
    blockNumber: observedBlock,
    blockHash: observedBlockHash,
    confirmations,
    requiredConfirmations: policy.requiredConfirmations,
    isFailed,
    failureReason,
    senderAddress: candidate.fromAddress,
    observedAt: new Date().toISOString(),
  });
}

export async function processAlchemyEthereumWebhook(
  payload: unknown,
  config: { rpcUrl: string; usdtContractAddress: string },
  dependencies: AlchemyEthereumObserverDependencies,
): Promise<number> {
  const contractAddress = config.usdtContractAddress.trim();
  const rpcUrl = config.rpcUrl.trim();
  let rpcEndpoint: URL;
  try {
    rpcEndpoint = new URL(rpcUrl);
  } catch {
    throw new Error("Invalid Ethereum RPC provider URL.");
  }
  if (
    rpcEndpoint.protocol !== "https:" &&
    !(
      ["localhost", "127.0.0.1", "::1"].includes(rpcEndpoint.hostname) &&
      rpcEndpoint.protocol === "http:"
    )
  ) {
    throw new Error("Ethereum RPC provider URL must use HTTPS.");
  }
  if (!/^0x[0-9a-f]{40}$/i.test(contractAddress)) {
    throw new Error("Invalid configured USDT contract address.");
  }
  const candidates = parseAlchemyEthereumDeposits(payload, contractAddress);
  if (candidates.length > 500)
    throw new Error("Alchemy webhook contains too many transfer events.");

  for (const candidate of candidates) {
    await observeCandidate(candidate, rpcUrl, contractAddress, dependencies);
  }
  return candidates.length;
}
