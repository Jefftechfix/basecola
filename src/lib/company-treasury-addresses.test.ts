import { describe, expect, it } from "vitest";
import {
  COMPANY_TREASURY_ADDRESSES,
  companyTreasuryAddressMatches,
} from "@/lib/company-treasury-addresses";

describe("company treasury addresses", () => {
  it("matches the configured public addresses by network", () => {
    for (const [network, address] of Object.entries(COMPANY_TREASURY_ADDRESSES)) {
      expect(
        companyTreasuryAddressMatches(
          network as keyof typeof COMPANY_TREASURY_ADDRESSES,
          address,
        ),
      ).toBe(true);
    }
  });

  it("compares Ethereum addresses case-insensitively and other networks exactly", () => {
    expect(
      companyTreasuryAddressMatches(
        "ethereum-mainnet",
        COMPANY_TREASURY_ADDRESSES["ethereum-mainnet"].toLowerCase(),
      ),
    ).toBe(true);
    expect(
      companyTreasuryAddressMatches(
        "bitcoin-mainnet",
        COMPANY_TREASURY_ADDRESSES["bitcoin-mainnet"].toUpperCase(),
      ),
    ).toBe(false);
  });

  it("rejects a different address", () => {
    expect(companyTreasuryAddressMatches("xrpl-mainnet", "rAnotherAddress")).toBe(false);
  });

  it("fails safely on unsupported networks and blank values", () => {
    expect(
      companyTreasuryAddressMatches("bitcoin-mainnet" as never, "   "),
    ).toBe(false);
    expect(companyTreasuryAddressMatches("unknown-network" as never, "any")).toBe(false);
  });
});
