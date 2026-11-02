import { HOLDINGS } from "@/lib/account-demo";

export const WALLET_ASSETS = HOLDINGS.map(asset => ({
  ...asset,
  balance: Number(asset.quantity.replaceAll(",", "")),
  network: ({ BTC: "Bitcoin", ETH: "Ethereum", USDT: "Ethereum (ERC-20)", SOL: "Solana", XRP: "XRP Ledger" } as Record<string, string>)[asset.sym] ?? asset.name,
}));

export function demoReceiveCode(symbol: string) {
  return `BASECOLA-DEMO-${symbol}-NOT-A-WALLET`;
}

export function sampleUnitPrice(price: string) {
  const value = Number(price.replace(/[$,]/g, ""));
  return Number.isFinite(value) && value > 0 ? value : 0;
}

export function formatAssetAmount(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "0";
  return value.toLocaleString("en-US", { maximumFractionDigits: 8 });
}

export function quoteTradeFee(usd: number) {
  if (!Number.isFinite(usd) || usd <= 0) return 0;
  return Math.round(usd * 1.5) / 100;
}

export function sendNetworkFee(symbol: string) {
  return ({ BTC: 2.5, ETH: 1.2, USDT: 1, SOL: 0.15, XRP: 0.1 } as Record<string, number>)[symbol] ?? 0;
}

export function amountError(value: string, balance?: number) {
  const amount = Number(value);
  if (!value.trim() || !Number.isFinite(amount) || amount <= 0) return "Enter an amount greater than zero.";
  if (balance !== undefined && amount > balance) return "Amount exceeds your available balance.";
  return "";
}

export function holderNameError(value: string) {
  if (value.trim().length < 2) return "Enter the account holder name.";
  return "";
}

function luhn(digits: string) {
  let sum = 0;
  let alternate = false;
  for (let index = digits.length - 1; index >= 0; index -= 1) {
    let digit = Number(digits[index]);
    if (alternate) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    alternate = !alternate;
  }
  return sum % 10 === 0;
}

export function cardNumberError(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length < 13 || digits.length > 19 || !luhn(digits)) return "Enter a valid card number.";
  return "";
}

export function expiryError(value: string, now = new Date()) {
  const match = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(value);
  if (!match) return "Enter an expiry as MM/YY.";
  const expires = new Date(2000 + Number(match[2]), Number(match[1]), 1);
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  if (expires <= thisMonth) return "This card is expired.";
  return "";
}

export function cvvError(value: string) {
  if (!/^\d{3,4}$/.test(value)) return "Enter a 3 or 4 digit security code.";
  return "";
}

export function routingNumberError(value: string) {
  if (!/^\d{9}$/.test(value)) return "Enter a 9-digit US routing number.";
  const digits = value.split("").map(Number);
  const sum = 3 * (digits[0] + digits[3] + digits[6]) + 7 * (digits[1] + digits[4] + digits[7]) + (digits[2] + digits[5] + digits[8]);
  if (sum === 0 || sum % 10 !== 0) return "Enter a valid US routing number.";
  return "";
}

export function bankAccountError(value: string) {
  if (!/^\d{4,17}$/.test(value)) return "Enter an account number of 4 to 17 digits.";
  return "";
}

export const STRIPE_DEMO_USERNAME = "user_good";
export const STRIPE_DEMO_PASSWORD = "pass_good";

export type StripeDemoAccount = {
  id: string;
  type: "Checking" | "Savings";
  last4: string;
  holder: string;
};

export type StripeDemoBank = {
  id: string;
  name: string;
  accounts: StripeDemoAccount[];
};

export const STRIPE_DEMO_BANKS: StripeDemoBank[] = [
  {
    id: "stripe-test-bank",
    name: "Stripe Test Bank",
    accounts: [
      { id: "stripe-test-checking", type: "Checking", last4: "6789", holder: "Demo User" },
      { id: "stripe-test-savings", type: "Savings", last4: "4321", holder: "Demo User" },
    ],
  },
  {
    id: "demo-credit-union",
    name: "Demo Credit Union",
    accounts: [{ id: "demo-cu-checking", type: "Checking", last4: "2468", holder: "Demo User" }],
  },
  {
    id: "sample-savings",
    name: "Sample Savings Bank",
    accounts: [{ id: "sample-savings", type: "Savings", last4: "1357", holder: "Demo User" }],
  },
];

export type ConnectedStripeBank = {
  bankId: string;
  bankName: string;
  accountId: string;
  accountType: string;
  last4: string;
  holder: string;
};

export function matchingStripeDemoBanks(query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) return STRIPE_DEMO_BANKS;
  return STRIPE_DEMO_BANKS.filter(bank => bank.name.toLowerCase().includes(needle));
}

export function stripeDemoLoginError(username: string, password: string) {
  if (username.trim() !== STRIPE_DEMO_USERNAME || password !== STRIPE_DEMO_PASSWORD) return "Use the Stripe demo sign-in shown on this screen.";
  return "";
}

export function lastDigits(value: string, count = 4) {
  const digits = value.replace(/\D/g, "");
  return digits.slice(-count);
}

export function recipientError(address: string) {
  if (!address.trim()) return "Enter a recipient address.";
  if (/\s/.test(address.trim()) || address.trim().length < 20) return "Enter an address of at least 20 characters without spaces.";
  return "";
}