import { describe, expect, it } from "vitest";
import { buildReceipt } from "@/lib/receipt-email";

describe("transaction email receipts", () => {
  it("builds branded notification data for wallet funding", () => {
    expect(
      buildReceipt("funding", {
        id: "funding-1",
        amount: 125,
        payment_method: "Stripe · card",
        status: "completed",
        created_at: "2026-11-06T12:00:00.000Z",
      }),
    ).toMatchObject({
      title: "Wallet funded",
      headline: "$125.00",
      status: "Completed",
      rows: expect.arrayContaining([
        { label: "Method", value: "Stripe · card" },
        { label: "Reference", value: "funding-1" },
      ]),
    });
  });

  it("builds buy and sell notifications from settled transaction rows", () => {
    const purchase = buildReceipt("buy", {
      id: "buy-1",
      kind: "buy",
      coin: "BTC",
      network: "Bitcoin",
      crypto_amount: "0.01",
      usd_amount: "100",
      fee_usd: "1.5",
      price_usd: "10000",
      status: "completed",
      created_at: "2026-11-06T12:00:00.000Z",
    });
    const sale = buildReceipt("sell", {
      id: "sell-1",
      coin: "ETH",
      network: "Ethereum",
      crypto_amount: "0.5",
      usd_amount: "1000",
      fee_usd: "15",
      price_usd: "2000",
      status: "completed",
      created_at: "2026-11-06T12:00:00.000Z",
    });

    expect(purchase).toMatchObject({
      title: "Crypto purchased",
      headline: "0.01 BTC",
      rows: expect.arrayContaining([{ label: "Total paid", value: "$101.50" }]),
    });
    expect(sale).toMatchObject({
      title: "Crypto sold",
      headline: "$985.00",
      rows: expect.arrayContaining([{ label: "Asset sold", value: "0.5 ETH" }]),
    });
  });

  it("builds crypto send and confirmed receive notifications", () => {
    const send = buildReceipt("send", {
      id: "withdrawal-1",
      asset: "SOL",
      network: "solana-mainnet",
      amount: "2.5",
      destination_address: "recipient",
      network_fee: "0.001",
      network_fee_usd: "0.15",
      transaction_hash: "solana-hash",
      status: "broadcast",
      created_at: "2026-11-06T12:00:00.000Z",
    });
    const receive = buildReceipt("receive", {
      id: "observation-1",
      asset: "ETH",
      network: "ethereum-mainnet",
      crypto_amount: "0.25",
      deposit_address: "wallet",
      tx_hash: "ethereum-hash",
      confirmations: 12,
      required_confirmations: 12,
      status: "confirmed",
      created_at: "2026-11-06T12:00:00.000Z",
    });

    expect(send).toMatchObject({
      title: "Crypto sent",
      headline: "2.5 SOL",
      status: "Broadcast",
      rows: expect.arrayContaining([
        { label: "Transaction hash", value: "solana-hash" },
        { label: "Network fee", value: "0.001 SOL ($0.15)" },
      ]),
    });
    expect(receive).toMatchObject({
      title: "Crypto received",
      headline: "0.25 ETH",
      status: "Confirmed",
      rows: expect.arrayContaining([
        { label: "Confirmations", value: "12 / 12" },
        { label: "Transaction hash", value: "ethereum-hash" },
      ]),
    });
  });

  it("avoids displaying invalid amounts or dates as NaN", () => {
    const receipt = buildReceipt("buy", {
      id: "buy-invalid",
      crypto_amount: undefined,
      coin: "BTC",
      usd_amount: "not-a-number",
      fee_usd: undefined,
      created_at: "invalid date",
    });

    expect(receipt.headline).toBe("— BTC");
    expect(receipt.rows).toContainEqual({ label: "Date", value: "—" });
    expect(JSON.stringify(receipt)).not.toContain("NaN");
  });
});
