import { describe, expect, it } from "vitest";
import { amountError, demoReceiveCode, recipientError } from "@/lib/wallet-demo";

describe("Demo wallet safeguards", () => {
  it("rejects zero, negative and non-numeric funding amounts", () => {
    for (const value of ["", "0", "-1", "no", "Infinity"]) expect(amountError(value)).not.toBe("");
    expect(amountError("50")).toBe("");
  });
  it("does not preview sending more than the demo balance", () => {
    expect(amountError("0.11", 0.1)).not.toBe("");
    expect(amountError("0.1", 0.1)).toBe("");
  });
  it("uses an explicitly non-wallet receive identifier", () => {
    expect(demoReceiveCode("BTC")).toBe("BASECOLA-DEMO-BTC-NOT-A-WALLET");
    expect(demoReceiveCode("ETH")).toBe("BASECOLA-DEMO-ETH-NOT-A-WALLET");
  });
  it("rejects empty and whitespace-containing recipients", () => {
    expect(recipientError("")).not.toBe("");
    expect(recipientError("1234567890 1234567890")).not.toBe("");
    expect(recipientError("BASECOLA-DEMO-RECIPIENT")).toBe("");
  });
});