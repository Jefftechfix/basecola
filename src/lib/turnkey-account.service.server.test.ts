import { describe, expect, it } from "vitest";
import { CRYPTO_ASSETS, CRYPTO_NETWORKS } from "@/lib/crypto/networks";
import { turnkeyAccountParamsForNetwork } from "@/lib/turnkey-account.service";

describe("Turnkey wallet account profiles", () => {
  it("covers every supported asset and shares the Ethereum account for ERC-20 USDT", () => {
    expect(CRYPTO_ASSETS).toEqual(["BTC", "ETH", "USDT", "SOL", "XRP"]);
    expect(CRYPTO_NETWORKS.USDT).toBe(CRYPTO_NETWORKS.ETH);

    for (const asset of CRYPTO_ASSETS) {
      expect(turnkeyAccountParamsForNetwork(CRYPTO_NETWORKS[asset])).toBeTruthy();
    }
  });

  it("uses the current Turnkey mainnet address formats for all four wallet accounts", () => {
    expect(turnkeyAccountParamsForNetwork("bitcoin-mainnet").addressFormat).toBe(
      "ADDRESS_FORMAT_BITCOIN_MAINNET_P2WPKH",
    );
    expect(turnkeyAccountParamsForNetwork("ethereum-mainnet").addressFormat).toBe(
      "ADDRESS_FORMAT_ETHEREUM",
    );
    expect(turnkeyAccountParamsForNetwork("solana-mainnet").addressFormat).toBe(
      "ADDRESS_FORMAT_SOLANA",
    );
    expect(turnkeyAccountParamsForNetwork("xrpl-mainnet").addressFormat).toBe("ADDRESS_FORMAT_XRP");
  });
});
