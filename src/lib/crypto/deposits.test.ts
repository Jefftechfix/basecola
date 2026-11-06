import { describe, expect, it } from "vitest";
import { parseChainDepositEvent } from "@/lib/crypto/deposits";

const event = {
  network: "ethereum-mainnet",
  asset: "USDT",
  txHash: `0x${"a".repeat(64)}`,
  eventIndex: 2,
  depositAddress: `0x${"b".repeat(40)}`,
  destinationTag: null,
  tokenContract: `0x${"e".repeat(40)}`,
  amount: "12.340000000000000001",
  amountUsd: "12.34",
  blockNumber: 20_000_000,
  blockHash: `0x${"c".repeat(64)}`,
  confirmations: 12,
  requiredConfirmations: 12,
  isFailed: false,
  failureReason: null,
  senderAddress: `0x${"d".repeat(40)}`,
  observedAt: "2026-11-05T12:00:00.000Z",
};

describe("chain deposit event validation", () => {
  it("accepts each configured asset/network with the expected token contract shape", () => {
    const supportedEvents = [
      { ...event, network: "bitcoin-mainnet", asset: "BTC", txHash: "a".repeat(64), depositAddress: `bc1q${"a".repeat(40)}`, tokenContract: null },
      { ...event, network: "ethereum-mainnet", asset: "ETH", tokenContract: null },
      event,
      { ...event, network: "solana-mainnet", asset: "SOL", txHash: "1".repeat(64), depositAddress: "1".repeat(44), tokenContract: null },
      { ...event, network: "xrpl-mainnet", asset: "XRP", txHash: "a".repeat(64), depositAddress: `r${"a".repeat(33)}`, tokenContract: null },
    ];

    for (const supportedEvent of supportedEvents) {
      expect(parseChainDepositEvent(supportedEvent)).not.toBeNull();
    }
  });

  it("accepts supported events while preserving the exact decimal string", () => {
    expect(parseChainDepositEvent(event)?.amount).toBe("12.340000000000000001");
  });

  it("rejects mismatched networks and unsafe numeric formats", () => {
    expect(parseChainDepositEvent({ ...event, network: "solana-mainnet" })).toBeNull();
    expect(parseChainDepositEvent({ ...event, amount: "1e-8" })).toBeNull();
    expect(parseChainDepositEvent({ ...event, amount: "-1" })).toBeNull();
    expect(parseChainDepositEvent({ ...event, destinationTag: 4_294_967_296 })).toBeNull();
    expect(parseChainDepositEvent({ ...event, tokenContract: null })).toBeNull();
    expect(parseChainDepositEvent({ ...event, asset: "ETH", tokenContract: event.tokenContract })).toBeNull();
  });
});
