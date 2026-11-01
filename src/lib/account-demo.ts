import { COINS } from "@/components/brand";

export const HOLDINGS = COINS.map((coin, index) => ({
  ...coin,
  quantity: ["0.100000", "1.000000", "1,000.00", "5.000000", "606.94"][index] ?? "0",
  value: [6742.05, 3548.21, 1000, 811.7, 378.25][index] ?? 0,
}));
export const money = (value: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);

export type DemoTransaction = {
  id: string; type: "Buy" | "Sell" | "Send" | "Receive"; sym: string;
  quantity: string; value: number; date: string; status: "Completed" | "Pending" | "Failed";
};
export const TRANSACTIONS: DemoTransaction[] = [
  { id: "BC-1028-001", type: "Receive", sym: "BTC", quantity: "0.015 BTC", value: 1011.31, date: "Oct 28, 2026 · 10:42 AM", status: "Completed" },
  { id: "BC-1028-002", type: "Buy", sym: "ETH", quantity: "0.250 ETH", value: 887.05, date: "Oct 28, 2026 · 9:15 AM", status: "Completed" },
  { id: "BC-1027-001", type: "Send", sym: "USDT", quantity: "150.00 USDT", value: 150, date: "Oct 27, 2026 · 4:30 PM", status: "Pending" },
  { id: "BC-1026-001", type: "Sell", sym: "SOL", quantity: "2.000 SOL", value: 324.68, date: "Oct 26, 2026 · 12:08 PM", status: "Completed" },
  { id: "BC-1025-001", type: "Buy", sym: "BTC", quantity: "0.010 BTC", value: 674.21, date: "Oct 25, 2026 · 11:20 AM", status: "Failed" },
  { id: "BC-1024-001", type: "Receive", sym: "USDT", quantity: "500.00 USDT", value: 500, date: "Oct 24, 2026 · 3:45 PM", status: "Completed" },
];