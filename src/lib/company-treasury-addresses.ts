import type { CryptoNetwork } from "@/lib/crypto/networks";

export const COMPANY_TREASURY_ADDRESSES: Record<
  Extract<CryptoNetwork, `${string}-mainnet`>,
  string
> = {
  "bitcoin-mainnet": "bc1qt8ry9evrmrdd283wmyjgmcxfu76079l0a2s6dx",
  "ethereum-mainnet": "0x4D575351C98022960DeBe9cd6828EAb656FB2c9c",
  "solana-mainnet": "95PpakYSbhbiU5gUBScJwiaYdjr1syVg8HycbYQ7NqwL",
  "xrpl-mainnet": "rPA3xuReMJtFsi7JNfnxwwYKiAQfcsKuiA",
};

export function companyTreasuryAddressMatches(
  network: keyof typeof COMPANY_TREASURY_ADDRESSES,
  actualAddress: string,
): boolean {
  const expectedAddress = COMPANY_TREASURY_ADDRESSES[network];
  if (!expectedAddress || typeof actualAddress !== "string") return false;

  const normalizedAddress = actualAddress.trim();
  if (!normalizedAddress) return false;

  return network === "ethereum-mainnet"
    ? normalizedAddress.toLowerCase() === expectedAddress.toLowerCase()
    : normalizedAddress === expectedAddress;
}
