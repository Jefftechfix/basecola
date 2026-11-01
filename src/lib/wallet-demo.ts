import { HOLDINGS } from "@/lib/account-demo";

export const WALLET_ASSETS = HOLDINGS.map(asset => ({
  ...asset,
  balance: Number(asset.quantity.replaceAll(",", "")),
  network: ({ BTC: "Bitcoin", ETH: "Ethereum", USDT: "Ethereum (ERC-20)", SOL: "Solana", XRP: "XRP Ledger" } as Record<string, string>)[asset.sym] ?? asset.name,
}));

export function demoReceiveCode(symbol: string) {
  return `BASECOLA-DEMO-${symbol}-NOT-A-WALLET`;
}

export function amountError(value: string, balance?: number) {
  const amount = Number(value);
  if (!value.trim() || !Number.isFinite(amount) || amount <= 0) return "Enter an amount greater than zero.";
  if (balance !== undefined && amount > balance) return "Amount exceeds your demo balance.";
  return "";
}

export function recipientError(address: string) {
  if (!address.trim()) return "Enter a recipient address.";
  if (/\s/.test(address.trim()) || address.trim().length < 20) return "Enter an address of at least 20 characters without spaces.";
  return "";
}