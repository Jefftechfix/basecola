import { COINS } from "@/components/brand";

export const HOLDINGS = COINS.map((coin, index) => ({
  ...coin,
  quantity: ["0.100000", "1.000000", "1,000.00", "5.000000", "606.94"][index] ?? "0",
  value: [6742.05, 3548.21, 1000, 811.7, 378.25][index] ?? 0,
}));
export const money = (value: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
export const STATEMENT_HOLDER = { name: "Mustapha Suleiman", email: "mustapha@gmail.com" };

export function deleteAccountError(confirmation: string) {
  return confirmation.trim().toUpperCase() === "DELETE" ? "" : "Type DELETE to confirm.";
}
export const portfolioBalance = () => HOLDINGS.reduce((sum, item) => sum + item.value, 0);

const STATEMENT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

function localIsoDate(iso: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? null : date;
}

export function transactionDay(date: string) {
  const match = /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d{1,2}), (\d{4})/.exec(date);
  if (!match) return null;
  const day = new Date(Number(match[3]), STATEMENT_MONTHS.indexOf(match[1] as typeof STATEMENT_MONTHS[number]), Number(match[2]));
  return Number.isNaN(day.getTime()) ? null : day;
}

export function formatStatementDay(iso: string) {
  const date = localIsoDate(iso);
  if (!date) return "";
  return `${STATEMENT_MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

export function statementPeriod(from: string, to: string) {
  const start = formatStatementDay(from);
  const end = formatStatementDay(to);
  return start && end ? `${start} – ${end}` : "";
}

export function inStatementRange(date: string, from: string, to: string) {
  const day = transactionDay(date);
  const start = localIsoDate(from);
  const end = localIsoDate(to);
  if (!day || !start || !end || start > end) return false;
  return day >= start && day <= end;
}

export function accountStatement(transactions: DemoTransaction[], period = "Oct 24, 2026 – Oct 28, 2026", holderName = STATEMENT_HOLDER.name) {
  const rows = transactions.map(item => `${item.date} | ${item.type} | ${item.sym} | ${item.quantity} | ${money(item.value)} | ${money(item.fee)} | ${item.status} | ${item.id}`);
  return [
    "Basecola statement of account",
    `Account holder: ${holderName}`,
    `Email: ${STATEMENT_HOLDER.email}`,
    `Period: ${period}`,
    "This statement lists sample activity only. No account was charged.",
    "",
    "Date | Type | Asset | Quantity | Amount | Fee | Status | Reference",
    ...(rows.length ? rows : ["No activity in this view."]),
    "",
    `Sample portfolio balance: ${money(portfolioBalance())}`,
  ].join("\n");
}

export type DemoTransaction = {
  id: string; type: "Buy" | "Sell" | "Send" | "Receive"; sym: string;
  quantity: string; value: number; fee: number; date: string; status: "Completed" | "Pending" | "Failed";
};
export type DemoNotification = {
  id: string;
  kind: "transaction" | "market";
  title: string;
  detail: string;
  time: string;
  transactionId?: string;
  symbol?: string;
};

export const NOTIFICATIONS: DemoNotification[] = [
  { id: "n-market-sol", kind: "market", title: "Solana is up 5.12%", detail: "Sample 24-hour move. This is not a live price.", time: "Today", symbol: "sol" },
  { id: "n-market-eth", kind: "market", title: "Ethereum is up 3.76%", detail: "Sample 24-hour move. This is not a live price.", time: "Today", symbol: "eth" },
  { id: "n-receive-btc", kind: "transaction", title: "Bitcoin received", detail: "0.015 BTC arrived in your demo wallet.", time: "Oct 28, 2026 · 10:42 AM", transactionId: "BC-1028-001" },
  { id: "n-buy-eth", kind: "transaction", title: "Ethereum purchase completed", detail: "0.250 ETH was added in this demo.", time: "Oct 28, 2026 · 9:15 AM", transactionId: "BC-1028-002" },
  { id: "n-pending-usdt", kind: "transaction", title: "USDT transfer is pending", detail: "150.00 USDT is waiting to complete.", time: "Oct 27, 2026 · 4:30 PM", transactionId: "BC-1027-001" },
  { id: "n-failed-btc", kind: "transaction", title: "Bitcoin purchase failed", detail: "0.010 BTC was not added to your demo wallet.", time: "Oct 25, 2026 · 11:20 AM", transactionId: "BC-1025-001" },
];

export function unreadNotificationCount(readIds: readonly string[]) {
  const read = new Set(readIds);
  return NOTIFICATIONS.filter(item => !read.has(item.id)).length;
}

export const TRANSACTIONS: DemoTransaction[] = [
  { id: "BC-1028-001", type: "Receive", sym: "BTC", quantity: "0.015 BTC", value: 1011.31, fee: 0, date: "Oct 28, 2026 · 10:42 AM", status: "Completed" },
  { id: "BC-1028-002", type: "Buy", sym: "ETH", quantity: "0.250 ETH", value: 887.05, fee: 13.31, date: "Oct 28, 2026 · 9:15 AM", status: "Completed" },
  { id: "BC-1027-001", type: "Send", sym: "USDT", quantity: "150.00 USDT", value: 150, fee: 1, date: "Oct 27, 2026 · 4:30 PM", status: "Pending" },
  { id: "BC-1026-001", type: "Sell", sym: "SOL", quantity: "2.000 SOL", value: 324.68, fee: 4.87, date: "Oct 26, 2026 · 12:08 PM", status: "Completed" },
  { id: "BC-1025-001", type: "Buy", sym: "BTC", quantity: "0.010 BTC", value: 674.21, fee: 10.11, date: "Oct 25, 2026 · 11:20 AM", status: "Failed" },
  { id: "BC-1024-001", type: "Receive", sym: "USDT", quantity: "500.00 USDT", value: 500, fee: 0, date: "Oct 24, 2026 · 3:45 PM", status: "Completed" },
];