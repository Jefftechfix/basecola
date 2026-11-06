import {
  defaultBitcoinMainnetP2WPKHAccountAtIndex,
  defaultEthereumAccountAtIndex,
  defaultSolanaAccountAtIndex,
  defaultXrpAccountAtIndex,
  type TurnkeyApiClient,
} from "@turnkey/sdk-server";
import type { v1WalletAccountParams } from "@turnkey/sdk-types";
import type { CryptoNetwork } from "./crypto/networks.ts";

const accountForNetwork: Record<CryptoNetwork, () => v1WalletAccountParams> = {
  "bitcoin-mainnet": () => defaultBitcoinMainnetP2WPKHAccountAtIndex(0),
  "ethereum-mainnet": () => defaultEthereumAccountAtIndex(0),
  "solana-mainnet": () => defaultSolanaAccountAtIndex(0),
  "xrpl-mainnet": () => defaultXrpAccountAtIndex(0),
};

export type TurnkeyWalletAccount = {
  walletId: string;
  accountId: string;
  address: string;
};

export function turnkeyAccountParamsForNetwork(network: CryptoNetwork): v1WalletAccountParams {
  return accountForNetwork[network]();
}

export async function getTurnkeyWalletAccount(
  client: TurnkeyApiClient,
  walletId: string,
  params: v1WalletAccountParams,
): Promise<TurnkeyWalletAccount> {
  const { accounts } = await client.getWalletAccounts({ walletId });
  const matches = accounts.filter(
    (account) => account.path === params.path && account.addressFormat === params.addressFormat,
  );
  if (matches.length !== 1) {
    throw new Error("The expected Turnkey wallet account could not be resolved uniquely.");
  }
  const account = matches[0];
  return {
    walletId,
    accountId: account.walletAccountId,
    address: account.address,
  };
}
