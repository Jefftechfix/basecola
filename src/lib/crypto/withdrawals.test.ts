import { describe, expect, it } from "vitest";
import { parseCryptoWithdrawalInput } from "@/lib/crypto/withdrawals";

const base = {
  asset: "ETH",
  network: "ethereum-mainnet",
  destinationAddress: `0x${"a".repeat(40)}`,
  destinationTag: null,
  amount: "0.025",
  idempotencyKey: "40b95ad2-10ab-4eeb-a9c2-29d7c458e808",
};

describe("crypto withdrawal request validation", () => {
  it("accepts supported address formats and exact decimal strings", () => {
    expect(parseCryptoWithdrawalInput(base)?.amount).toBe("0.025");
    expect(parseCryptoWithdrawalInput({
      ...base,
      asset: "XRP",
      network: "xrpl-mainnet",
      destinationAddress: `r${"a".repeat(33)}`,
      destinationTag: 0,
    })?.destinationTag).toBe(0);
    expect(parseCryptoWithdrawalInput({
      ...base,
      asset: "BTC",
      network: "bitcoin-mainnet",
      destinationAddress: `bc1q${"a".repeat(38)}`,
    })?.asset).toBe("BTC");
  });

  it("rejects cross-network requests, malformed addresses, and unsafe amounts", () => {
    expect(parseCryptoWithdrawalInput({ ...base, network: "bitcoin-mainnet" })).toBeNull();
    expect(parseCryptoWithdrawalInput({ ...base, destinationAddress: "not-an-address" })).toBeNull();
    expect(parseCryptoWithdrawalInput({ ...base, amount: "1e2" })).toBeNull();
    expect(parseCryptoWithdrawalInput({ ...base, amount: "-1" })).toBeNull();
    expect(parseCryptoWithdrawalInput({ ...base, destinationTag: 4_294_967_296 })).toBeNull();
  });
});
