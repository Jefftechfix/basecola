import { HOLDINGS, TRANSACTIONS, portfolioBalance } from "@/lib/account-demo";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const ADMIN_DEMO_EMAIL = "admin@basecola.demo";
export const ADMIN_DEMO_PASSWORD = "admin-demo";
export const ADMIN_SESSION_KEY = "basecola-demo-admin";

export const ADMIN_ACCOUNTS = [
  { name: "Mustapha Suleiman", email: "mustapha@gmail.com", status: "Verified" },
  { name: "Demo Customer", email: "customer@basecola.demo", status: "Verified" },
  { name: "Sample Review", email: "review@basecola.demo", status: "Pending" },
] as const;

export function adminLoginError(email: string, password: string) {
  if (!EMAIL.test(email.trim())) return "Enter a valid email address.";
  if (!password) return "Enter your password.";
  if (email.trim().toLowerCase() !== ADMIN_DEMO_EMAIL || password !== ADMIN_DEMO_PASSWORD) return "Use the admin demo sign-in shown on this screen.";
  return "";
}

export function readAdminSession() {
  if (typeof sessionStorage === "undefined") return false;
  return sessionStorage.getItem(ADMIN_SESSION_KEY) === "1";
}

export function writeAdminSession() {
  sessionStorage.setItem(ADMIN_SESSION_KEY, "1");
}

export function clearAdminSession() {
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
}

export function adminMoney(value: number, digits = 0) {
  return value.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export function adminCount(value: number) {
  return value.toLocaleString("en-US");
}

export const ADMIN_STATS = [
  { id: "users", label: "Total Users", value: 6_524_310, change: 12.6, kind: "count" as const },
  { id: "transactions", label: "Total Transactions", value: 24_980_341, change: 18.4, kind: "count" as const },
  { id: "volume", label: "Total Volume (USD)", value: 1_284_560_320, change: 21.7, kind: "money" as const },
  { id: "revenue", label: "Platform Revenue", value: 12_846_230, change: 16.9, kind: "money" as const },
];

export type AdminDirectoryUser = {
  id: string;
  initials: string;
  name: string;
  email: string;
  phone: string;
  country: string;
  kyc: "Verified" | "Pending" | "Rejected";
  balance: number;
  transactions: number;
  joined: string;
  status: "Active" | "Pending" | "Suspended";
};

export const ADMIN_USER_STATS = [
  { id: "total", label: "Total Users", value: 6_524_310, change: 12.6 },
  { id: "verified", label: "Verified Users", value: 5_937_420, change: 13.8 },
  { id: "pending", label: "Pending Verification", value: 82_640, change: -4.2 },
  { id: "suspended", label: "Suspended Users", value: 4_250, change: 1.9 },
] as const;

export const ADMIN_DIRECTORY: AdminDirectoryUser[] = [
  { id: "BC100234", initials: "MS", name: "Mustapha Suleiman", email: "mustapha@gmail.com", phone: "+1 (971) 555-2389", country: "Nigeria", kyc: "Verified", balance: 12420, transactions: 1248, joined: "Oct 10, 2025", status: "Active" },
  { id: "BC100235", initials: "AK", name: "Amina K. Bello", email: "amina.bello@gmail.com", phone: "+234 803 456 7890", country: "Nigeria", kyc: "Verified", balance: 5230.5, transactions: 642, joined: "Oct 12, 2025", status: "Active" },
  { id: "BC100236", initials: "JO", name: "John Okafor", email: "john.okafor@gmail.com", phone: "+234 806 987 6543", country: "Nigeria", kyc: "Verified", balance: 2100, transactions: 318, joined: "Oct 15, 2025", status: "Active" },
  { id: "BC100237", initials: "FA", name: "Fatima Abdullahi", email: "fatima@icloud.com", phone: "+234 807 654 3210", country: "Nigeria", kyc: "Pending", balance: 0, transactions: 0, joined: "Oct 28, 2025", status: "Pending" },
  { id: "BC100238", initials: "IB", name: "Ibrahim Musa", email: "ibrahim.musa@gmail.com", phone: "+234 818 123 4567", country: "Nigeria", kyc: "Verified", balance: 8750, transactions: 920, joined: "Oct 20, 2025", status: "Active" },
  { id: "BC100239", initials: "SA", name: "Sarah Aliyu", email: "sarah.aliyu@gmail.com", phone: "+234 815 987 6543", country: "Nigeria", kyc: "Verified", balance: 1320, transactions: 205, joined: "Oct 22, 2025", status: "Active" },
  { id: "BC100240", initials: "EM", name: "Emeka Nwosu", email: "emeka.nwosu@gmail.com", phone: "+234 809 456 7891", country: "Nigeria", kyc: "Rejected", balance: 0, transactions: 0, joined: "Oct 18, 2025", status: "Suspended" },
];

export type AdminLedgerRow = {
  id: string;
  initials: string;
  name: string;
  email: string;
  type: "Buy" | "Sell" | "Transfer" | "Invest" | "Deposit" | "Withdraw";
  asset: string;
  amount: string;
  value: number;
  fee: number;
  status: "Completed" | "Pending" | "Failed";
  date: string;
};

export const ADMIN_TX_STATS = [
  { id: "total", label: "Total Transactions", value: "24,980,341", change: 18.4, share: "" },
  { id: "volume", label: "Total Volume (USD)", value: "$1,284,560,320", change: 21.7, share: "" },
  { id: "completed", label: "Completed", value: "24,620,501", change: 0, share: "98.6%" },
  { id: "pending", label: "Pending", value: "228,420", change: 0, share: "0.9%" },
  { id: "failed", label: "Failed", value: "131,420", change: 0, share: "0.5%" },
] as const;

export const ADMIN_LEDGER: AdminLedgerRow[] = [
  { id: "TXN982341", initials: "MS", name: "Mustapha Suleiman", email: "mustapha@gmail.com", type: "Buy", asset: "BTC", amount: "0.025000 BTC", value: 1710.5, fee: 2, status: "Completed", date: "Nov 1, 2026, 10:24 AM" },
  { id: "TXN982340", initials: "AK", name: "Amina K. Bello", email: "amina.bello@gmail.com", type: "Sell", asset: "USDT", amount: "500.00 USDT", value: 500, fee: 1.5, status: "Completed", date: "Nov 1, 2026, 09:58 AM" },
  { id: "TXN982339", initials: "JO", name: "John Okafor", email: "john.okafor@gmail.com", type: "Transfer", asset: "ETH", amount: "1.2000 ETH", value: 4228.92, fee: 3.5, status: "Completed", date: "Oct 31, 2026, 11:42 PM" },
  { id: "TXN982338", initials: "FA", name: "Fatima Abdullahi", email: "fatima@icloud.com", type: "Invest", asset: "SOL", amount: "50.00 SOL", value: 8820, fee: 5, status: "Completed", date: "Oct 31, 2026, 08:17 PM" },
  { id: "TXN982337", initials: "IB", name: "Ibrahim Musa", email: "ibrahim.musa@gmail.com", type: "Deposit", asset: "USDC", amount: "1,000.00 USDC", value: 1000, fee: 0, status: "Completed", date: "Oct 31, 2026, 06:30 PM" },
  { id: "TXN982336", initials: "SA", name: "Sarah Aliyu", email: "sarah.aliyu@gmail.com", type: "Withdraw", asset: "USDT", amount: "2,000.00 USDT", value: 2000, fee: 3, status: "Pending", date: "Oct 31, 2026, 05:12 PM" },
  { id: "TXN982335", initials: "EM", name: "Emeka Nwosu", email: "emeka.nwosu@gmail.com", type: "Sell", asset: "XRP", amount: "5,000.00 XRP", value: 3100, fee: 4, status: "Failed", date: "Oct 31, 2026, 03:47 PM" },
  { id: "TXN982334", initials: "KA", name: "Kehinde Ade", email: "kehinde.ade@gmail.com", type: "Buy", asset: "SOL", amount: "100.00 SOL", value: 17640, fee: 6, status: "Completed", date: "Oct 31, 2026, 02:19 PM" },
  { id: "TXN982333", initials: "AO", name: "Aisha Omar", email: "aisha.omar@gmail.com", type: "Transfer", asset: "USDC", amount: "250.00 USDC", value: 250, fee: 0.5, status: "Completed", date: "Oct 31, 2026, 01:05 PM" },
  { id: "TXN982332", initials: "BA", name: "Bashir Ahmed", email: "bashir.ahmed@gmail.com", type: "Withdraw", asset: "BTC", amount: "0.100000 BTC", value: 6840, fee: 5, status: "Completed", date: "Oct 31, 2026, 12:27 PM" },
];

export const ADMIN_USERS = {
  total: 6_524_310,
  verified: 5_937_420,
  unverified: 586_890,
  active: 4_823_117,
  joinedToday: 18_642,
};

export type AdminAssetRow = {
  symbol: string;
  name: string;
  network: string;
  kind: "Crypto" | "Stablecoin";
  price: number;
  change: number;
  wallets: number;
  balance: number;
  status: "Active" | "Paused";
};

export const ADMIN_ASSETS: AdminAssetRow[] = [
  { symbol: "BTC", name: "Bitcoin", network: "Bitcoin", kind: "Crypto", price: 68420, change: 2.36, wallets: 184230, balance: 428_560_000, status: "Active" },
  { symbol: "ETH", name: "Ethereum", network: "Ethereum", kind: "Crypto", price: 3524.1, change: 1.89, wallets: 156440, balance: 312_440_000, status: "Active" },
  { symbol: "USDT", name: "Tether", network: "Ethereum (ERC-20)", kind: "Stablecoin", price: 1, change: 0, wallets: 240110, balance: 186_220_000, status: "Active" },
  { symbol: "USDC", name: "USD Coin", network: "Ethereum (ERC-20)", kind: "Stablecoin", price: 1, change: 0, wallets: 98440, balance: 92_140_000, status: "Active" },
  { symbol: "SOL", name: "Solana", network: "Solana", kind: "Crypto", price: 176.4, change: 4.27, wallets: 121880, balance: 74_860_000, status: "Active" },
  { symbol: "XRP", name: "XRP", network: "XRP Ledger", kind: "Crypto", price: 0.62, change: 3.14, wallets: 64220, balance: 18_430_000, status: "Paused" },
];

export type AdminWalletRow = {
  id: string;
  user: string;
  email: string;
  asset: string;
  network: string;
  code: string;
  amount: string;
  value: number;
  status: "Active" | "Frozen";
};

export const ADMIN_WALLETS: AdminWalletRow[] = [
  { id: "WAL-1001", user: "Mustapha Suleiman", email: "mustapha@gmail.com", asset: "BTC", network: "Bitcoin", code: "BASECOLA-DEMO-BTC-NOT-A-WALLET", amount: "0.182000 BTC", value: 12452.44, status: "Active" },
  { id: "WAL-1002", user: "Amina K. Bello", email: "amina.bello@gmail.com", asset: "USDT", network: "Ethereum (ERC-20)", code: "BASECOLA-DEMO-USDT-NOT-A-WALLET", amount: "5,230.50 USDT", value: 5230.5, status: "Active" },
  { id: "WAL-1003", user: "John Okafor", email: "john.okafor@gmail.com", asset: "ETH", network: "Ethereum", code: "BASECOLA-DEMO-ETH-NOT-A-WALLET", amount: "0.596000 ETH", value: 2100.36, status: "Active" },
  { id: "WAL-1004", user: "Ibrahim Musa", email: "ibrahim.musa@gmail.com", asset: "SOL", network: "Solana", code: "BASECOLA-DEMO-SOL-NOT-A-WALLET", amount: "49.600000 SOL", value: 8749.44, status: "Active" },
  { id: "WAL-1005", user: "Sarah Aliyu", email: "sarah.aliyu@gmail.com", asset: "USDC", network: "Ethereum (ERC-20)", code: "BASECOLA-DEMO-USDC-NOT-A-WALLET", amount: "1,320.00 USDC", value: 1320, status: "Active" },
  { id: "WAL-1006", user: "Emeka Nwosu", email: "emeka.nwosu@gmail.com", asset: "XRP", network: "XRP Ledger", code: "BASECOLA-DEMO-XRP-NOT-A-WALLET", amount: "0 XRP", value: 0, status: "Frozen" },
];

export type PlatformWallet = {
  symbol: string;
  name: string;
  network: string;
  amount: string;
  unit: string;
  usd: number;
  available: string;
  locked: string;
  status: "Active" | "Frozen";
  code: string;
};

export const PLATFORM_SUMMARY = {
  total: 8_420_560,
  totalChange: 21.7,
  treasury: 4_425_670,
  treasuryChange: 12.3,
  locked: 620_340,
  available: 3_374_550,
};

export const PLATFORM_WALLETS: PlatformWallet[] = [
  { symbol: "BTC", name: "Bitcoin", network: "Bitcoin", amount: "12.45000000", unit: "BTC", usd: 842_160, available: "12.30000000 BTC", locked: "0.15000000 BTC", status: "Active", code: "BASECOLA-DEMO-BTC-NOT-A-WALLET" },
  { symbol: "ETH", name: "Ethereum", network: "Ethereum", amount: "312.50000000", unit: "ETH", usd: 1_099_250, available: "310.00000000 ETH", locked: "2.50000000 ETH", status: "Active", code: "BASECOLA-DEMO-ETH-NOT-A-WALLET" },
  { symbol: "USDT", name: "Tether USD", network: "TRC20", amount: "4,250,000.00", unit: "USDT", usd: 4_250_000, available: "4,200,000.00 USDT", locked: "50,000.00 USDT", status: "Active", code: "BASECOLA-DEMO-USDT-NOT-A-WALLET" },
  { symbol: "USDC", name: "USD Coin", network: "ERC20", amount: "1,720,000.00", unit: "USDC", usd: 1_720_000, available: "1,700,000.00 USDC", locked: "20,000.00 USDC", status: "Active", code: "BASECOLA-DEMO-USDC-NOT-A-WALLET" },
  { symbol: "XRP", name: "Ripple", network: "XRP Ledger", amount: "3,850,000.00", unit: "XRP", usd: 2_387_000, available: "3,800,000.00 XRP", locked: "50,000.00 XRP", status: "Active", code: "BASECOLA-DEMO-XRP-NOT-A-WALLET" },
  { symbol: "SOL", name: "Solana", network: "Solana", amount: "15,600.000000", unit: "SOL", usd: 2_548_800, available: "15,400.000000 SOL", locked: "200.000000 SOL", status: "Active", code: "BASECOLA-DEMO-SOL-NOT-A-WALLET" },
];

export type DepositAddress = {
  id: string;
  symbol: string;
  name: string;
  network: string;
  code: string;
  status: "Active" | "Disabled";
  created: string;
  minDeposit: string;
  confirmations: number;
  lastDeposit: string;
};

export const DEPOSIT_ADDRESSES: DepositAddress[] = [
  { id: "btc-bitcoin", symbol: "BTC", name: "Bitcoin", network: "Bitcoin", code: "BASECOLA-DEMO-BTC-NOT-A-WALLET", status: "Active", created: "Oct 10, 2026, 08:24 AM", minDeposit: "0.00010000 BTC", confirmations: 3, lastDeposit: "Oct 31, 2026, 02:19 PM" },
  { id: "eth-ethereum", symbol: "ETH", name: "Ethereum", network: "Ethereum", code: "BASECOLA-DEMO-ETH-NOT-A-WALLET", status: "Active", created: "Oct 10, 2026, 08:24 AM", minDeposit: "0.00100000 ETH", confirmations: 12, lastDeposit: "Oct 31, 2026, 01:05 PM" },
  { id: "usdt-trc20", symbol: "USDT", name: "Tether USD", network: "TRC20", code: "BASECOLA-DEMO-USDT-TRC20-NOT-A-WALLET", status: "Active", created: "Oct 10, 2026, 08:25 AM", minDeposit: "1.00 USDT", confirmations: 20, lastDeposit: "Oct 31, 2026, 11:42 AM" },
  { id: "usdt-erc20", symbol: "USDT", name: "Tether USD", network: "ERC20", code: "BASECOLA-DEMO-USDT-ERC20-NOT-A-WALLET", status: "Active", created: "Oct 10, 2026, 08:26 AM", minDeposit: "10.00 USDT", confirmations: 12, lastDeposit: "Oct 30, 2026, 06:18 PM" },
  { id: "usdc-erc20", symbol: "USDC", name: "USD Coin", network: "ERC20", code: "BASECOLA-DEMO-USDC-ERC20-NOT-A-WALLET", status: "Active", created: "Oct 27, 2026, 08:26 AM", minDeposit: "10.00 USDC", confirmations: 12, lastDeposit: "Oct 31, 2026, 09:02 AM" },
  { id: "xrp-ledger", symbol: "XRP", name: "Ripple", network: "XRP Ledger", code: "BASECOLA-DEMO-XRP-NOT-A-WALLET", status: "Active", created: "Oct 10, 2026, 08:28 AM", minDeposit: "1.00 XRP", confirmations: 1, lastDeposit: "Oct 29, 2026, 04:40 PM" },
  { id: "sol-solana", symbol: "SOL", name: "Solana", network: "Solana", code: "BASECOLA-DEMO-SOL-NOT-A-WALLET", status: "Active", created: "Oct 10, 2026, 08:28 AM", minDeposit: "0.01000000 SOL", confirmations: 1, lastDeposit: "Oct 31, 2026, 08:11 AM" },
];

export const TREASURY_SUMMARY = {
  total: 4_425_670,
  totalChange: 12.3,
  hot: 1_820_430,
  hotChange: 8.7,
  cold: 2_350_000,
  coldChange: 14.6,
  transit: 255_240,
  coldShare: 68,
  hotShare: 27,
  transitShare: 5,
  coldAllocation: 3_006_000,
  hotAllocation: 1_194_430,
  dailyFlow: 255_240,
};

export type TreasuryHolding = {
  symbol: string;
  name: string;
  total: string;
  hot: string;
  cold: string;
  allocation: string;
  status: "Active" | "Paused";
};

export const TREASURY_HOLDINGS: TreasuryHolding[] = [
  { symbol: "BTC", name: "Bitcoin", total: "12.45000000", hot: "2.45000000", cold: "10.00000000", allocation: "80%", status: "Active" },
  { symbol: "ETH", name: "Ethereum", total: "312.50000000", hot: "62.50000000", cold: "250.00000000", allocation: "80%", status: "Active" },
  { symbol: "USDT", name: "Tether USD", total: "4,250,000.00", hot: "1,250,000.00", cold: "3,000,000.00", allocation: "71%", status: "Active" },
  { symbol: "USDC", name: "USD Coin", total: "1,720,000.00", hot: "520,000.00", cold: "1,200,000.00", allocation: "70%", status: "Active" },
  { symbol: "XRP", name: "Ripple", total: "3,850,000.00", hot: "1,150,000.00", cold: "2,700,000.00", allocation: "70%", status: "Active" },
  { symbol: "SOL", name: "Solana", total: "15,600.000000", hot: "4,600.000000", cold: "11,000.000000", allocation: "71%", status: "Active" },
];

export type TreasuryActivity = {
  id: string;
  type: "Transfer" | "Rebalance" | "Top Up" | "Withdrawal";
  symbol: string;
  amount: string;
  from: string;
  to: string;
  status: "Completed";
  date: string;
};

export const TREASURY_ACTIVITY: TreasuryActivity[] = [
  { id: "ta-1", type: "Transfer", symbol: "USDT", amount: "500,000.00", from: "Hot Wallet", to: "Cold Wallet", status: "Completed", date: "Oct 31, 2026, 10:24 AM" },
  { id: "ta-2", type: "Rebalance", symbol: "BTC", amount: "2.00000000", from: "Treasury", to: "Cold Wallet", status: "Completed", date: "Oct 31, 2026, 09:17 AM" },
  { id: "ta-3", type: "Top Up", symbol: "USDC", amount: "250,000.00", from: "External", to: "Treasury", status: "Completed", date: "Oct 31, 2026, 08:45 AM" },
  { id: "ta-4", type: "Transfer", symbol: "ETH", amount: "50.00000000", from: "Cold Wallet", to: "Hot Wallet", status: "Completed", date: "Oct 30, 2026, 11:32 PM" },
  { id: "ta-5", type: "Withdrawal", symbol: "USDT", amount: "100,000.00", from: "Treasury", to: "External", status: "Completed", date: "Oct 30, 2026, 07:18 PM" },
];

export const OTC_SUMMARY = {
  orders: 18_240,
  ordersChange: 17.6,
  buys: 9_420,
  buysChange: 15.3,
  sells: 8_820,
  sellsChange: 19.8,
  volume: 4_286_750,
  volumeChange: 22.4,
  profit: 42_867,
  profitChange: 18.1,
  liquidity: 1_820_430,
};

export type OtcOrder = {
  id: string;
  initials: string;
  user: string;
  type: "Buy" | "Sell";
  asset: string;
  crypto: string;
  usd: number;
  rate: number;
  status: "Completed" | "Processing" | "Cancelled";
  created: string;
};

export const OTC_ORDERS: OtcOrder[] = [
  { id: "OTC982340", initials: "MS", user: "Mustapha S.", type: "Buy", asset: "BTC", crypto: "0.25000000", usd: 10750, rate: 43000, status: "Completed", created: "Nov 1, 10:24 AM" },
  { id: "OTC982339", initials: "AK", user: "Amina K. B.", type: "Buy", asset: "USDT", crypto: "5,500.00", usd: 5500, rate: 1, status: "Completed", created: "Nov 1, 09:58 AM" },
  { id: "OTC982338", initials: "JO", user: "John Okafor", type: "Buy", asset: "ETH", crypto: "2.50000000", usd: 6750, rate: 2700, status: "Processing", created: "Nov 1, 09:12 AM" },
  { id: "OTC982337", initials: "FA", user: "Fatima A.", type: "Sell", asset: "USDC", crypto: "3,000.00", usd: 3000, rate: 1, status: "Completed", created: "Oct 31, 11:38 PM" },
  { id: "OTC982336", initials: "IB", user: "Ibrahim M.", type: "Buy", asset: "XRP", crypto: "10,000.00", usd: 6500, rate: 0.65, status: "Completed", created: "Oct 31, 09:21 PM" },
  { id: "OTC982335", initials: "SA", user: "Sarah Aliyu", type: "Sell", asset: "SOL", crypto: "50.00000000", usd: 7500, rate: 150, status: "Cancelled", created: "Oct 31, 08:10 PM" },
  { id: "OTC982334", initials: "EM", user: "Emeka N.", type: "Sell", asset: "BTC", crypto: "0.10000000", usd: 4300, rate: 43000, status: "Completed", created: "Oct 31, 06:45 PM" },
  { id: "OTC982333", initials: "AO", user: "Aisha Omar", type: "Sell", asset: "ETH", crypto: "1.00000000", usd: 2700, rate: 2700, status: "Completed", created: "Oct 31, 05:54 PM" },
  { id: "OTC982332", initials: "KA", user: "Kehinde Ade", type: "Buy", asset: "SOL", crypto: "20.00000000", usd: 3020, rate: 151, status: "Completed", created: "Oct 31, 04:12 PM" },
  { id: "OTC982331", initials: "BA", user: "Bashir Ahmed", type: "Sell", asset: "USDT", crypto: "1,200.00", usd: 1198.8, rate: 0.999, status: "Completed", created: "Oct 31, 02:05 PM" },
];

export type OtcRate = { symbol: string; buy: number; sell: number; spread: string };

export const OTC_RATES: OtcRate[] = [
  { symbol: "BTC", buy: 43200, sell: 42800, spread: "0.93%" },
  { symbol: "ETH", buy: 2715, sell: 2685, spread: "1.12%" },
  { symbol: "USDT", buy: 1.001, sell: 0.999, spread: "0.20%" },
  { symbol: "USDC", buy: 1.001, sell: 0.999, spread: "0.20%" },
  { symbol: "XRP", buy: 0.659, sell: 0.648, spread: "1.54%" },
  { symbol: "SOL", buy: 151, sell: 149, spread: "1.32%" },
];

export const OTC_LIQUIDITY = [
  { symbol: "BTC", value: 620_000, share: 34.1, color: "#f7931a" },
  { symbol: "ETH", value: 480_000, share: 26.4, color: "#627eea" },
  { symbol: "USDT", value: 350_000, share: 19.2, color: "#26a17b" },
  { symbol: "USDC", value: 270_000, share: 14.8, color: "#2775ca" },
  { symbol: "Others", value: 100_430, share: 5.5, color: "#c4b5fd" },
];

export const OTC_PERFORMANCE = [
  { label: "24h Volume", value: 428_670, change: 12.6 },
  { label: "7d Volume", value: 2_980_430, change: 18.9 },
  { label: "30d Volume", value: 12_486_750, change: 21.3 },
];

export type OtcLimit = { symbol: string; min: string; max: string };

export const OTC_LIMITS: OtcLimit[] = [
  { symbol: "BTC", min: "0.00010000", max: "2.00000000" },
  { symbol: "ETH", min: "0.01000000", max: "50.00000000" },
  { symbol: "USDT", min: "10.00", max: "100,000.00" },
  { symbol: "USDC", min: "10.00", max: "100,000.00" },
  { symbol: "XRP", min: "1.00", max: "500,000.00" },
  { symbol: "SOL", min: "0.10000000", max: "1,000.000000" },
];

export const PRICE_SUMMARY = {
  assets: 6,
  avgBuy: 1.0023,
  avgBuyChange: 0.12,
  avgSell: 0.9987,
  avgSellChange: -0.1,
  avgMargin: 0.36,
  avgMarginChange: 0.05,
  updated: "Nov 1, 2026, 11:42 AM",
};

export type PriceAsset = {
  symbol: string;
  name: string;
  market: number;
  buy: number;
  sell: number;
  margin: string;
  status: "Active" | "Paused";
};

export const PRICE_ASSETS: PriceAsset[] = [
  { symbol: "BTC", name: "Bitcoin", market: 43200, buy: 43350, sell: 43050, margin: "0.70%", status: "Active" },
  { symbol: "ETH", name: "Ethereum", market: 2715, buy: 2725, sell: 2705, margin: "0.74%", status: "Active" },
  { symbol: "USDT", name: "Tether USD", market: 1, buy: 1.002, sell: 0.998, margin: "0.40%", status: "Active" },
  { symbol: "USDC", name: "USD Coin", market: 1, buy: 1.0015, sell: 0.9985, margin: "0.30%", status: "Active" },
  { symbol: "XRP", name: "Ripple", market: 0.658, buy: 0.661, sell: 0.655, margin: "0.91%", status: "Active" },
  { symbol: "SOL", name: "Solana", market: 151, buy: 151.8, sell: 150.2, margin: "1.06%", status: "Active" },
];

export type PriceHistoryRow = {
  id: string;
  symbol: string;
  buy: number;
  sell: number;
  margin: string;
  by: string;
  date: string;
};

export const PRICE_HISTORY: PriceHistoryRow[] = [
  { id: "ph-1", symbol: "BTC", buy: 43350, sell: 43050, margin: "0.70%", by: "Admin", date: "Nov 1, 2026, 11:42 AM" },
  { id: "ph-2", symbol: "ETH", buy: 2725, sell: 2705, margin: "0.74%", by: "Admin", date: "Nov 1, 2026, 11:42 AM" },
  { id: "ph-3", symbol: "USDT", buy: 1.002, sell: 0.998, margin: "0.40%", by: "Admin", date: "Oct 31, 2026, 08:15 PM" },
  { id: "ph-4", symbol: "SOL", buy: 151.8, sell: 150.2, margin: "1.06%", by: "Admin", date: "Oct 31, 2026, 03:10 PM" },
];

export const TREASURY_PAGE = {
  total: 4_425_670,
  totalChange: 12.3,
  reserves: 3_486_430,
  reservesChange: 11.9,
  hot: 1_820_430,
  hotChange: 8.7,
  transit: 255_240,
  transitChange: -4.2,
  ratio: 78.8,
};

export const TREASURY_MIX = [
  { symbol: "BTC", amount: "2.45000000", usd: 105_735, share: 23.9, color: "#f7931a" },
  { symbol: "ETH", amount: "62.50000000", usd: 169_375, share: 3.8, color: "#627eea" },
  { symbol: "USDT", amount: "1,250,000.00", usd: 1_250_000, share: 28.3, color: "#26a17b" },
  { symbol: "USDC", amount: "520,000.00", usd: 520_000, share: 11.8, color: "#2775ca" },
  { symbol: "XRP", amount: "1,150,000.00", usd: 748_750, share: 16.9, color: "#23292f" },
  { symbol: "SOL", amount: "4,600.000000", usd: 690_000, share: 15.6, color: "#14b8a6" },
];

export const TREASURY_BUCKETS = [
  { label: "Cold Wallet", value: 2_350_000, share: 53.1 },
  { label: "Hot Wallet", value: 1_820_430, share: 41.1 },
  { label: "In Transit", value: 255_240, share: 5.8 },
];

export type TreasuryAccount = {
  id: string;
  name: string;
  type: "Hot Wallet" | "Cold Wallet" | "Liquidity" | "Reserve";
  network: string;
  assetBalance: string;
  usd: number;
  status: "Active" | "Paused";
  updated: string;
};

export const TREASURY_ACCOUNTS: TreasuryAccount[] = [
  { id: "ta-hot", name: "Main Hot Wallet", type: "Hot Wallet", network: "Multi-Asset", assetBalance: "1,820,430.00", usd: 1_820_430, status: "Active", updated: "Nov 1, 2026, 10:24 AM" },
  { id: "ta-cold", name: "Cold Storage", type: "Cold Wallet", network: "Multi-Asset", assetBalance: "2,350,000.00", usd: 2_350_000, status: "Active", updated: "Oct 31, 2026, 11:32 PM" },
  { id: "ta-otc", name: "OTC Liquidity Pool", type: "Liquidity", network: "USDT/USDC", assetBalance: "255,240.00", usd: 255_240, status: "Active", updated: "Oct 31, 2026, 09:17 PM" },
  { id: "ta-reserve", name: "Investment Reserve", type: "Reserve", network: "Multi-Asset", assetBalance: "500,000.00", usd: 500_000, status: "Active", updated: "Oct 30, 2026, 04:25 PM" },
];

export type TreasuryMove = {
  id: string;
  type: "Transfer" | "Rebalance" | "Top Up" | "Withdrawal";
  from: string;
  to: string;
  asset: string;
  amount: string;
  usd: number;
  status: "Completed";
  date: string;
};

export const TREASURY_MOVES: TreasuryMove[] = [
  { id: "tm-1", type: "Transfer", from: "Hot Wallet", to: "Cold Storage", asset: "BTC", amount: "10.00000000", usd: 430_000, status: "Completed", date: "Nov 1, 2026, 10:24 AM" },
  { id: "tm-2", type: "Rebalance", from: "Liquidity Pool", to: "Hot Wallet", asset: "USDT", amount: "250,000.00", usd: 250_000, status: "Completed", date: "Oct 31, 2026, 09:17 PM" },
  { id: "tm-3", type: "Top Up", from: "External", to: "Treasury", asset: "USDC", amount: "100,000.00", usd: 100_000, status: "Completed", date: "Oct 31, 2026, 08:45 PM" },
  { id: "tm-4", type: "Withdrawal", from: "Treasury", to: "External", asset: "ETH", amount: "20.00000000", usd: 54_100, status: "Completed", date: "Oct 30, 2026, 07:18 PM" },
];

export const REPORT_SUMMARY = {
  volume: 12_486_750,
  volumeChange: 22.4,
  transactions: 243_980,
  transactionsChange: 18.6,
  users: 642_310,
  usersChange: 14.9,
  revenue: 528_940,
  revenueChange: 18.9,
  profit: 342_760,
  profitChange: 17.6,
};

export const REPORT_VOLUME = [
  { label: "Oct 25", buy: 320_000, sell: 180_000, total: 550_000 },
  { label: "Oct 26", buy: 380_000, sell: 220_000, total: 720_000 },
  { label: "Oct 27", buy: 480_000, sell: 280_000, total: 950_000 },
  { label: "Oct 28", buy: 580_000, sell: 340_000, total: 1_120_000 },
  { label: "Oct 29", buy: 720_000, sell: 400_000, total: 1_380_000 },
  { label: "Oct 30", buy: 820_000, sell: 480_000, total: 1_580_000 },
  { label: "Oct 31", buy: 920_000, sell: 520_000, total: 1_780_000 },
  { label: "Nov 1", buy: 1_050_000, sell: 620_000, total: 2_080_000 },
];

export const REPORT_GROWTH = [
  { label: "Oct 25", users: 530_000 },
  { label: "Oct 26", users: 548_000 },
  { label: "Oct 27", users: 565_000 },
  { label: "Oct 28", users: 582_000 },
  { label: "Oct 29", users: 600_000 },
  { label: "Oct 30", users: 618_000 },
  { label: "Oct 31", users: 635_000 },
  { label: "Nov 1", users: 652_000 },
];

export const REPORT_ASSETS = [
  { symbol: "BTC", share: 34.5, value: 4_305_240, color: "#f7931a" },
  { symbol: "ETH", share: 13.6, value: 1_697_340, color: "#627eea" },
  { symbol: "USDT", share: 23.8, value: 2_972_860, color: "#26a17b" },
  { symbol: "USDC", share: 10.9, value: 1_360_240, color: "#2775ca" },
  { symbol: "XRP", share: 7.4, value: 923_420, color: "#23292f" },
  { symbol: "SOL", share: 6.2, value: 774_380, color: "#14b8a6" },
  { symbol: "Others", share: 3.6, value: 453_270, color: "#c4b5fd" },
];

export const REPORT_KPIS = [
  { label: "Conversion Rate", value: "96.8%", change: 0.9 },
  { label: "Success Rate", value: "98.4%", change: 0.6 },
  { label: "Avg. Transaction", value: "$51.18", change: 6.2 },
  { label: "Active Users (24h)", value: "58,420", change: 12.7 },
];

export type PlatformReport = {
  id: string;
  name: string;
  type: "Transactions" | "Users" | "Assets" | "Treasury" | "Finance" | "Earn" | "Custom";
  period: string;
  generated: string;
};

export const PLATFORM_REPORTS: PlatformReport[] = [
  { id: "rpt-1", name: "Transaction Summary", type: "Transactions", period: "Oct 25 – Nov 1, 2026", generated: "Nov 1, 2026, 12:40 PM" },
  { id: "rpt-2", name: "User Activity Report", type: "Users", period: "Oct 25 – Nov 1, 2026", generated: "Nov 1, 2026, 12:35 PM" },
  { id: "rpt-3", name: "Asset Balances Report", type: "Assets", period: "Oct 25 – Nov 1, 2026", generated: "Nov 1, 2026, 12:30 PM" },
  { id: "rpt-4", name: "Treasury Report", type: "Treasury", period: "Oct 25 – Nov 1, 2026", generated: "Nov 1, 2026, 12:25 PM" },
  { id: "rpt-5", name: "Revenue & Profit Report", type: "Finance", period: "Oct 25 – Nov 1, 2026", generated: "Nov 1, 2026, 12:20 PM" },
];

export const REFERRAL_SUMMARY = {
  total: 642_310,
  totalChange: 14.9,
  activeReferrers: 58_420,
  activeChange: 12.7,
  referredUsers: 642_310,
  referredChange: 14.9,
  commissions: 528_940,
  commissionsChange: 18.9,
  rewardsPaid: 486_210,
  rewardsChange: 17.6,
};

export const REFERRAL_SERIES = [
  { label: "Oct 25", referrals: 14_000, commissions: 8_000, trend: 32_000 },
  { label: "Oct 26", referrals: 18_000, commissions: 10_000, trend: 40_000 },
  { label: "Oct 27", referrals: 24_000, commissions: 12_000, trend: 48_000 },
  { label: "Oct 28", referrals: 30_000, commissions: 14_000, trend: 56_000 },
  { label: "Oct 29", referrals: 36_000, commissions: 16_000, trend: 66_000 },
  { label: "Oct 30", referrals: 44_000, commissions: 18_000, trend: 76_000 },
  { label: "Oct 31", referrals: 52_000, commissions: 20_000, trend: 86_000 },
  { label: "Nov 1", referrals: 62_000, commissions: 22_000, trend: 95_000 },
];

export const REFERRAL_MIX = [
  { label: "Active Referrals", count: 492_340, share: 76.6, color: "#7c4dff" },
  { label: "Pending Referrals", count: 58_420, share: 9.1, color: "#3b82f6" },
  { label: "Rewarded", count: 71_320, share: 11.1, color: "#22c55e" },
  { label: "Cancelled", count: 20_230, share: 3.2, color: "#f59e0b" },
];

export const REFERRAL_LINK = "https://basecola.com/ref/MS1234";
export const REFERRAL_PROGRAM_CODE = "MS1234";
export const REFERRAL_QR = "BASECOLA-DEMO-REF-MS1234-NOT-A-WALLET";

export type ReferralCampaign = { id: string; name: string; detail: string; status: "Active" | "Scheduled" | "Paused" };

export const REFERRAL_CAMPAIGNS: ReferralCampaign[] = [
  { id: "camp-1", name: "New User Bonus", detail: "$5 for every new signup", status: "Active" },
  { id: "camp-2", name: "Trading Referral", detail: "0.05% of trading fees", status: "Active" },
  { id: "camp-3", name: "Invest & Earn Referral", detail: "1.00% of investment amount", status: "Active" },
  { id: "camp-4", name: "Seasonal Promo", detail: "Extra $10 per referral", status: "Scheduled" },
];

export type TopReferrer = { id: string; initials: string; name: string; referrals: number; commission: number; status: "Active" | "Paused" };

export const TOP_REFERRERS: TopReferrer[] = [
  { id: "tr-1", initials: "MS", name: "Mustapha Suleiman", referrals: 8_420, commission: 12_640, status: "Active" },
  { id: "tr-2", initials: "AK", name: "Amina K. Bello", referrals: 6_950, commission: 10_425, status: "Active" },
  { id: "tr-3", initials: "JO", name: "John Okafor", referrals: 5_870, commission: 8_805, status: "Active" },
  { id: "tr-4", initials: "FA", name: "Fatima Abdullahi", referrals: 5_240, commission: 7_860, status: "Active" },
  { id: "tr-5", initials: "IB", name: "Ibrahim Musa", referrals: 4_980, commission: 7_470, status: "Active" },
];

export type ReferralCommission = { id: string; initials: string; referrer: string; user: string; amount: number; type: "Signup" | "Trading" | "Invest"; status: "Paid" | "Pending"; date: string };

export const REFERRAL_COMMISSIONS: ReferralCommission[] = [
  { id: "rc-1", initials: "MS", referrer: "Mustapha S.", user: "user58923", amount: 5, type: "Signup", status: "Paid", date: "Nov 1, 2026, 10:24 AM" },
  { id: "rc-2", initials: "AK", referrer: "Amina K. B.", user: "user58890", amount: 3.75, type: "Trading", status: "Paid", date: "Nov 1, 2026, 09:47 AM" },
  { id: "rc-3", initials: "JO", referrer: "John Okafor", user: "user58877", amount: 10, type: "Invest", status: "Paid", date: "Oct 31, 2026, 11:38 PM" },
  { id: "rc-4", initials: "FA", referrer: "Fatima A.", user: "user58855", amount: 5, type: "Signup", status: "Paid", date: "Oct 31, 2026, 09:21 PM" },
  { id: "rc-5", initials: "IB", referrer: "Ibrahim M.", user: "user58840", amount: 7.5, type: "Trading", status: "Paid", date: "Oct 31, 2026, 08:10 PM" },
];

export const DEPOSIT_MONITOR = {
  total: 5_842,
  totalChange: 18.6,
  amount: 4_286_730,
  amountChange: 21.4,
  confirmed: 5_712,
  confirmedChange: 19.8,
  pending: 86,
  pendingChange: -7.5,
  failed: 24,
  failedChange: -12.1,
};

export const DEPOSIT_TREND = [
  { label: "Oct 25", usd: 180_000 },
  { label: "Oct 26", usd: 280_000 },
  { label: "Oct 27", usd: 390_000 },
  { label: "Oct 28", usd: 520_000 },
  { label: "Oct 29", usd: 680_000 },
  { label: "Oct 30", usd: 820_000 },
  { label: "Oct 31", usd: 960_000 },
  { label: "Nov 1", usd: 1_100_000 },
];

export const DEPOSIT_ASSETS = [
  { symbol: "USDT", share: 38.9, value: 1_667_280, color: "#26a17b" },
  { symbol: "BTC", share: 24.6, value: 1_054_320, color: "#f7931a" },
  { symbol: "ETH", share: 15.7, value: 673_240, color: "#627eea" },
  { symbol: "USDC", share: 9.8, value: 420_760, color: "#2775ca" },
  { symbol: "SOL", share: 6.4, value: 273_180, color: "#14b8a6" },
  { symbol: "Others", share: 4.6, value: 197_950, color: "#c4b5fd" },
];

export type DepositRow = {
  id: string;
  ref: string;
  initials: string;
  user: string;
  asset: string;
  amount: string;
  usd: number;
  network: string;
  networkDetail: string;
  code: string;
  address: string;
  status: "Confirmed" | "Pending" | "Failed";
  time: string;
  fullTime: string;
  confirmations: string;
};

export const DEPOSIT_ROWS: DepositRow[] = [
  { id: "dep-1", ref: "DEP-BTC-01", initials: "MS", user: "user58923", asset: "BTC", amount: "0.25000000", usd: 10_800, network: "Bitcoin", networkDetail: "Bitcoin", code: "BASECOLA-DEMO-DEP-BTC-01-NOT-A-WALLET", address: "BASECOLA-DEMO-BTC-NOT-A-WALLET", status: "Confirmed", time: "Nov 1, 12:42 PM", fullTime: "Nov 1, 2026, 12:42 PM", confirmations: "6 / 3" },
  { id: "dep-2", ref: "DEP-ETH-02", initials: "AK", user: "amina.bello", asset: "ETH", amount: "2.50000000", usd: 6_729.5, network: "Ethereum", networkDetail: "Ethereum (ERC20)", code: "BASECOLA-DEMO-DEP-ETH-02-NOT-A-WALLET", address: "BASECOLA-DEMO-ETH-ERC20-NOT-A-WALLET", status: "Confirmed", time: "Nov 1, 12:28 PM", fullTime: "Nov 1, 2026, 12:28 PM", confirmations: "128 / 12" },
  { id: "dep-3", ref: "DEP-USDT-03", initials: "JO", user: "john.okafor", asset: "USDT", amount: "5,000.0000", usd: 5_000, network: "Tron", networkDetail: "Tron (TRC20)", code: "BASECOLA-DEMO-DEP-USDT-03-NOT-A-WALLET", address: "BASECOLA-DEMO-USDT-TRC20-NOT-A-WALLET", status: "Pending", time: "Nov 1, 12:20 PM", fullTime: "Nov 1, 2026, 12:20 PM", confirmations: "8 / 20" },
  { id: "dep-4", ref: "DEP-USDC-04", initials: "FA", user: "fatima.abd", asset: "USDC", amount: "3,000.0000", usd: 3_000, network: "ERC20", networkDetail: "Ethereum (ERC20)", code: "BASECOLA-DEMO-DEP-USDC-04-NOT-A-WALLET", address: "BASECOLA-DEMO-USDC-ERC20-NOT-A-WALLET", status: "Confirmed", time: "Nov 1, 12:11 PM", fullTime: "Nov 1, 2026, 12:11 PM", confirmations: "64 / 12" },
  { id: "dep-5", ref: "DEP-XRP-05", initials: "IB", user: "ibrahim.musa", asset: "XRP", amount: "1,200.0000", usd: 789.6, network: "XRP Ledger", networkDetail: "XRP Ledger", code: "BASECOLA-DEMO-DEP-XRP-05-NOT-A-WALLET", address: "BASECOLA-DEMO-XRP-NOT-A-WALLET", status: "Confirmed", time: "Nov 1, 11:58 AM", fullTime: "Nov 1, 2026, 11:58 AM", confirmations: "8 / 1" },
  { id: "dep-6", ref: "DEP-SOL-06", initials: "SA", user: "sadiq.aliyu", asset: "SOL", amount: "50.000000", usd: 7_550, network: "Solana", networkDetail: "Solana", code: "BASECOLA-DEMO-DEP-SOL-06-NOT-A-WALLET", address: "BASECOLA-DEMO-SOL-NOT-A-WALLET", status: "Confirmed", time: "Nov 1, 11:47 AM", fullTime: "Nov 1, 2026, 11:47 AM", confirmations: "40 / 32" },
  { id: "dep-7", ref: "DEP-USDT-07", initials: "HA", user: "hassan.umar", asset: "USDT", amount: "2,000.0000", usd: 2_000, network: "Tron", networkDetail: "Tron (TRC20)", code: "BASECOLA-DEMO-DEP-USDT-07-NOT-A-WALLET", address: "BASECOLA-DEMO-USDT-TRC20-NOT-A-WALLET", status: "Failed", time: "Nov 1, 11:33 AM", fullTime: "Nov 1, 2026, 11:33 AM", confirmations: "0 / 20" },
  { id: "dep-8", ref: "DEP-BTC-08", initials: "RU", user: "ruth.james", asset: "BTC", amount: "0.10000000", usd: 4_320, network: "Bitcoin", networkDetail: "Bitcoin", code: "BASECOLA-DEMO-DEP-BTC-08-NOT-A-WALLET", address: "BASECOLA-DEMO-BTC-NOT-A-WALLET", status: "Confirmed", time: "Nov 1, 11:22 AM", fullTime: "Nov 1, 2026, 11:22 AM", confirmations: "5 / 3" },
  { id: "dep-9", ref: "DEP-ETH-09", initials: "KA", user: "kola.adeyemi", asset: "ETH", amount: "1.00000000", usd: 2_691.8, network: "Arbitrum", networkDetail: "Arbitrum", code: "BASECOLA-DEMO-DEP-ETH-09-NOT-A-WALLET", address: "BASECOLA-DEMO-ETH-ARBITRUM-NOT-A-WALLET", status: "Pending", time: "Nov 1, 11:09 AM", fullTime: "Nov 1, 2026, 11:09 AM", confirmations: "4 / 12" },
  { id: "dep-10", ref: "DEP-USDT-10", initials: "MO", user: "musa.olari", asset: "USDT", amount: "1,500.0000", usd: 1_500, network: "BEP20", networkDetail: "BNB Smart Chain (BEP20)", code: "BASECOLA-DEMO-DEP-USDT-10-NOT-A-WALLET", address: "BASECOLA-DEMO-USDT-BEP20-NOT-A-WALLET", status: "Confirmed", time: "Nov 1, 10:56 AM", fullTime: "Nov 1, 2026, 10:56 AM", confirmations: "18 / 15" },
];

export const VERIFICATION_TOTAL = 248;

export type VerificationStatus = "Verified" | "Pending" | "Under Review" | "Rejected";

export type VerificationCheck = { label: string; state: "Approved" | "Pending" | "In review"; date: string };

export type VerificationSubmission = {
  id: string;
  initials: string;
  name: string;
  email: string;
  phone: string;
  country: string;
  flag: string;
  status: VerificationStatus;
  submitted: string;
  day: string;
  joined: string;
  dob: string;
  address: string;
  ssnLast4: string | null;
  idType: string;
  idNumber: string;
  stateIssued: string;
  expiry: string;
  checks: VerificationCheck[];
  history: { title: string; detail: string; date: string }[];
  transactions: { id: string; type: string; asset: string; amount: string; status: string; date: string }[];
};

const approved = (date: string): VerificationCheck[] => [
  { label: "Identity Document", state: "Approved", date },
  { label: "Selfie Verification", state: "Approved", date },
  { label: "Information Match", state: "Approved", date },
];

const waiting = (date: string): VerificationCheck[] => [
  { label: "Identity Document", state: "Pending", date },
  { label: "Selfie Verification", state: "Pending", date },
  { label: "Information Match", state: "Pending", date },
];

export const VERIFICATION_SUBMISSIONS: VerificationSubmission[] = [
  {
    id: "ver-1", initials: "MS", name: "Mustapha Suleiman", email: "mustapha@basecola.com", phone: "+1 (234) 803-456-7890", country: "United States", flag: "🇺🇸", status: "Verified", submitted: "Nov 8, 2026 · 10:42 AM", day: "Nov 8, 2026", joined: "Oct 12, 2026", dob: "26/02/2000", address: "1234 Madison Ave, Portland, OR 97205, United States", ssnLast4: "6789", idType: "Driver's License", idNumber: "SAMPLE-DL-6789", stateIssued: "Oregon", expiry: "08/15/2030",
    checks: approved("Nov 8, 2026"),
    history: [
      { title: "Submission received", detail: "Sample details saved in this preview.", date: "Nov 8, 2026, 10:42 AM" },
      { title: "Identity document approved", detail: "Sample front and back marked approved.", date: "Nov 8, 2026, 10:51 AM" },
      { title: "Selfie approved", detail: "Sample selfie placeholder marked approved.", date: "Nov 8, 2026, 10:55 AM" },
      { title: "Information match approved", detail: "Sample details marked as matching.", date: "Nov 8, 2026, 11:02 AM" },
    ],
    transactions: [
      { id: "TXN982341", type: "Buy", asset: "BTC", amount: "0.025000 BTC", status: "Completed", date: "Nov 1, 2026, 10:24 AM" },
      { id: "TXN982330", type: "Deposit", asset: "USDT", amount: "250.00 USDT", status: "Completed", date: "Oct 28, 2026, 04:16 PM" },
    ],
  },
  {
    id: "ver-2", initials: "AB", name: "Amina Bello", email: "amina.bello@gmail.com", phone: "+234 803 555 0142", country: "Nigeria", flag: "🇳🇬", status: "Pending", submitted: "Nov 8, 2026 · 09:15 AM", day: "Nov 8, 2026", joined: "Sep 3, 2026", dob: "14/08/1998", address: "No. 8 Demo Close, Garki, Abuja, Nigeria", ssnLast4: null, idType: "National ID Card", idNumber: "SAMPLE-NIN-0142", stateIssued: "FCT", expiry: "04/12/2029",
    checks: waiting("Nov 8, 2026"),
    history: [{ title: "Submission received", detail: "Waiting in this preview. No reviewer was notified.", date: "Nov 8, 2026, 09:15 AM" }],
    transactions: [{ id: "TXN982340", type: "Sell", asset: "USDT", amount: "500.00 USDT", status: "Completed", date: "Nov 1, 2026, 09:58 AM" }],
  },
  {
    id: "ver-3", initials: "JC", name: "James Carter", email: "james.carter@yahoo.com", phone: "+1 (503) 555-0148", country: "United States", flag: "🇺🇸", status: "Under Review", submitted: "Nov 7, 2026 · 06:30 PM", day: "Nov 7, 2026", joined: "Aug 19, 2026", dob: "03/11/1994", address: "88 Preview Lane, Portland, OR 97201, United States", ssnLast4: "0148", idType: "Driver's License", idNumber: "SAMPLE-DL-0148", stateIssued: "Oregon", expiry: "01/20/2028",
    checks: [
      { label: "Identity Document", state: "Approved", date: "Nov 7, 2026" },
      { label: "Selfie Verification", state: "In review", date: "Nov 7, 2026" },
      { label: "Information Match", state: "Pending", date: "Nov 7, 2026" },
    ],
    history: [
      { title: "Submission received", detail: "Sample marked under review.", date: "Nov 7, 2026, 06:30 PM" },
      { title: "Identity document approved", detail: "Sample ID placeholder marked approved.", date: "Nov 7, 2026, 07:10 PM" },
    ],
    transactions: [{ id: "TXN982318", type: "Buy", asset: "ETH", amount: "0.4000 ETH", status: "Pending", date: "Nov 6, 2026, 02:11 PM" }],
  },
  {
    id: "ver-4", initials: "FM", name: "Fatima Mohammed", email: "fatima@gmail.com", phone: "+234 809 555 2210", country: "Nigeria", flag: "🇳🇬", status: "Verified", submitted: "Nov 7, 2026 · 04:12 PM", day: "Nov 7, 2026", joined: "Jul 2, 2026", dob: "19/01/1996", address: "15 Sample Road, Kano, Nigeria", ssnLast4: null, idType: "National ID Card", idNumber: "SAMPLE-NIN-2210", stateIssued: "Kano", expiry: "11/02/2031",
    checks: approved("Nov 7, 2026"),
    history: [{ title: "Information match approved", detail: "Sample details marked as matching.", date: "Nov 7, 2026, 04:40 PM" }],
    transactions: [{ id: "TXN982301", type: "Invest", asset: "SOL", amount: "12.00 SOL", status: "Completed", date: "Oct 30, 2026, 01:05 PM" }],
  },
  {
    id: "ver-5", initials: "DW", name: "David Wilson", email: "davidwilson@outlook.com", phone: "+1 (416) 555-0199", country: "Canada", flag: "🇨🇦", status: "Pending", submitted: "Nov 7, 2026 · 02:45 PM", day: "Nov 7, 2026", joined: "Jun 14, 2026", dob: "22/05/1991", address: "400 Demo Street, Toronto, ON M5V 2T6, Canada", ssnLast4: null, idType: "International Passport", idNumber: "SAMPLE-PPT-0199", stateIssued: "Ontario", expiry: "09/09/2032",
    checks: waiting("Nov 7, 2026"),
    history: [{ title: "Submission received", detail: "Waiting in this preview. No reviewer was notified.", date: "Nov 7, 2026, 02:45 PM" }],
    transactions: [{ id: "TXN982288", type: "Transfer", asset: "USDC", amount: "120.00 USDC", status: "Completed", date: "Oct 22, 2026, 09:40 AM" }],
  },
  {
    id: "ver-6", initials: "CO", name: "Chinedu Okafor", email: "chinedu@gmail.com", phone: "+234 701 555 1188", country: "Nigeria", flag: "🇳🇬", status: "Verified", submitted: "Nov 6, 2026 · 11:20 AM", day: "Nov 6, 2026", joined: "May 28, 2026", dob: "09/09/1993", address: "4 Preview Avenue, Enugu, Nigeria", ssnLast4: null, idType: "National ID Card", idNumber: "SAMPLE-NIN-1188", stateIssued: "Enugu", expiry: "06/18/2030",
    checks: approved("Nov 6, 2026"),
    history: [{ title: "Information match approved", detail: "Sample details marked as matching.", date: "Nov 6, 2026, 11:48 AM" }],
    transactions: [{ id: "TXN982270", type: "Sell", asset: "BTC", amount: "0.010000 BTC", status: "Completed", date: "Oct 18, 2026, 03:22 PM" }],
  },
  {
    id: "ver-7", initials: "SJ", name: "Sarah Johnson", email: "sarah.johnson@icloud.com", phone: "+1 (971) 555-0177", country: "United States", flag: "🇺🇸", status: "Under Review", submitted: "Nov 6, 2026 · 09:03 AM", day: "Nov 6, 2026", joined: "Apr 4, 2026", dob: "30/12/1999", address: "210 Sample Court, Portland, OR 97205, United States", ssnLast4: "0177", idType: "Driver's License", idNumber: "SAMPLE-DL-0177", stateIssued: "Oregon", expiry: "02/02/2029",
    checks: [
      { label: "Identity Document", state: "In review", date: "Nov 6, 2026" },
      { label: "Selfie Verification", state: "Pending", date: "Nov 6, 2026" },
      { label: "Information Match", state: "Pending", date: "Nov 6, 2026" },
    ],
    history: [{ title: "Submission received", detail: "Sample marked under review. No reviewer was assigned.", date: "Nov 6, 2026, 09:03 AM" }],
    transactions: [{ id: "TXN982255", type: "Buy", asset: "SOL", amount: "4.00 SOL", status: "Completed", date: "Oct 12, 2026, 11:16 AM" }],
  },
];

export const ADMIN_MARKET = [
  { sym: "BTC", name: "Bitcoin", price: 68420, change: 2.36 },
  { sym: "ETH", name: "Ethereum", price: 3524.1, change: 1.89 },
  { sym: "USDT", name: "Tether", price: 1, change: 0 },
  { sym: "USDC", name: "USD Coin", price: 1, change: 0 },
  { sym: "XRP", name: "XRP", price: 0.62, change: 3.14 },
  { sym: "SOL", name: "Solana", price: 176.4, change: 4.27 },
];

export const ADMIN_ACTIVITY = [
  { id: "TXN982341", user: "mustapha01", type: "Buy", asset: "BTC", amount: "0.025000 BTC", value: 1710.5, status: "Completed", date: "Nov 1, 2026, 10:24 AM" },
  { id: "TXN982340", user: "amina.crypto", type: "Sell", asset: "USDT", amount: "500.00 USDT", value: 500, status: "Completed", date: "Nov 1, 2026, 09:58 AM" },
  { id: "TXN982339", user: "kingsley23", type: "Transfer", asset: "ETH", amount: "1.2000 ETH", value: 4228.92, status: "Completed", date: "Oct 31, 2026, 11:42 PM" },
  { id: "TXN982338", user: "jenny07", type: "Invest", asset: "SOL", amount: "50.00 SOL", value: 8820, status: "Completed", date: "Oct 31, 2026, 08:17 PM" },
  { id: "TXN982337", user: "abdulx", type: "Buy", asset: "USDC", amount: "1,000.00 USDC", value: 1000, status: "Completed", date: "Oct 31, 2026, 06:30 PM" },
] as const;

const weekPoints = [
  { label: "Oct 25", volume: 108, transactions: 2.2 },
  { label: "Oct 26", volume: 142, transactions: 2.8 },
  { label: "Oct 27", volume: 176, transactions: 3.3 },
  { label: "Oct 28", volume: 158, transactions: 3.0 },
  { label: "Oct 29", volume: 198, transactions: 3.6 },
  { label: "Oct 30", volume: 172, transactions: 3.2 },
  { label: "Oct 31", volume: 228, transactions: 4.2 },
  { label: "Nov 1", volume: 284, transactions: 4.9 },
];

export const ADMIN_PERIODS = [
  { id: "week", label: "Oct 25, 2026 – Nov 1, 2026", volume: 1_284_560_320, volumeChange: 21.7, transactions: 24_980_341, transactionChange: 18.4, points: weekPoints },
  { id: "recent", label: "Oct 29, 2026 – Nov 1, 2026", volume: 742_110_450, volumeChange: 14.2, transactions: 11_420_880, transactionChange: 9.6, points: weekPoints.slice(4) },
] as const;

export const ADMIN_NOTICES = [
  { id: "new-users", title: "18,642 new users today", detail: "Sample signup count for this preview." },
  { id: "volume", title: "Volume up 21.7%", detail: "Sample move versus the previous 7 days." },
];

export const ADMIN_QUICK_ACTIONS = [
  { id: "add-user", label: "Add User" },
  { id: "fund-wallet", label: "Fund Wallet" },
  { id: "adjust-rates", label: "Adjust Rates" },
  { id: "create-promo", label: "Create Promo" },
  { id: "view-reports", label: "View Reports" },
  { id: "settings", label: "System Settings" },
] as const;

export function adminOverview() {
  const fees = TRANSACTIONS.reduce((sum, item) => sum + item.fee, 0);
  const volume = TRANSACTIONS.reduce((sum, item) => sum + item.value, 0);
  return {
    accounts: ADMIN_ACCOUNTS.length,
    assets: HOLDINGS.length,
    transactions: TRANSACTIONS.length,
    fees,
    volume,
    balance: portfolioBalance(),
  };
}
