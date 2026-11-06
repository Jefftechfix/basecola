import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  parseAlchemyEthereumDeposits,
  rawUnitsToDecimal,
  verifyAlchemyWebhookSignature,
} from "@/lib/crypto/alchemy";

const usdtContract = `0x${"a".repeat(40)}`;
const recipient = `0x${"b".repeat(40)}`;
const transactionHash = `0x${"c".repeat(64)}`;
const blockHash = `0x${"d".repeat(64)}`;

describe("Alchemy deposit processing helpers", () => {
  it("parses exact USDT transfer units and ignores other networks and contracts", () => {
    const payload = {
      type: "ADDRESS_ACTIVITY",
      event: {
        network: "ETH_MAINNET",
        activity: [{
          hash: transactionHash,
          blockNum: "0x10",
          fromAddress: `0x${"e".repeat(40)}`,
          toAddress: recipient,
          category: "token",
          rawContract: { rawValue: "0x0bc614e", address: usdtContract, decimals: 6 },
          log: {
            address: usdtContract,
            blockHash,
            blockNumber: "0x10",
            data: "0x0bc614e",
            logIndex: "0x2",
            transactionHash,
            removed: false,
            topics: [
              "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
              `0x${"0".repeat(24)}${"e".repeat(40)}`,
              `0x${"0".repeat(24)}${recipient.slice(2)}`,
            ],
          },
        }],
      },
    };

    const candidates = parseAlchemyEthereumDeposits(payload, usdtContract);
    expect(candidates).toHaveLength(1);
    expect(candidates[0]).toMatchObject({
      asset: "USDT",
      eventIndex: 3,
      rawAmount: "0x0bc614e",
      tokenContract: usdtContract,
    });
    expect(parseAlchemyEthereumDeposits(
      { ...payload, event: { ...payload.event, network: "SOL_MAINNET" } },
      usdtContract,
    )).toEqual([]);
  });

  it("ignores internal transfers without a chain trace verifier", () => {
    const payload = {
      type: "ADDRESS_ACTIVITY",
      event: {
        network: "ETH_MAINNET",
        activity: [{
          hash: transactionHash,
          blockNum: "0x10",
          fromAddress: `0x${"e".repeat(40)}`,
          toAddress: recipient,
          category: "internal",
          typeTraceAddress: "0_2_1",
          rawContract: { rawValue: "0x3b9aca00", address: null, decimals: 18 },
          blockHash,
        }],
      },
    };
    expect(parseAlchemyEthereumDeposits(payload, usdtContract)).toEqual([]);
  });

  it("converts raw amounts without floating point arithmetic", () => {
    expect(rawUnitsToDecimal("0x0bc614e", 6)).toBe("12.345678");
    expect(rawUnitsToDecimal(`0x${(1234567890123456789n).toString(16)}`, 18))
      .toBe("1.234567890123456789");
  });

  it("validates the raw-body Alchemy HMAC signature", async () => {
    const body = '{"type":"ADDRESS_ACTIVITY"}';
    const secret = "local-test-signing-key";
    const signature = createHmac("sha256", secret).update(body).digest("hex");
    await expect(verifyAlchemyWebhookSignature(body, signature, secret)).resolves.toBe(true);
    await expect(verifyAlchemyWebhookSignature(body, signature, `${secret}-wrong`)).resolves.toBe(false);
  });
});
