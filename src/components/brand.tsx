import { Link, useRouter } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

export function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const box = size === "lg" ? "h-12 w-12 text-3xl" : size === "sm" ? "h-7 w-7 text-lg" : "h-9 w-9 text-2xl";
  const txt = size === "lg" ? "text-4xl" : size === "sm" ? "text-lg" : "text-2xl";
  return (
    <Link to="/" className="flex items-center gap-2">
      <span className={`${box} grid place-items-center rounded-xl bg-gradient-primary font-extrabold text-primary-foreground`}>B</span>
      <span className={`${txt} font-extrabold tracking-tight text-foreground`}>Basecola</span>
    </Link>
  );
}

export type Coin = { name: string; sym: string; price: string; change: number; color: string };
export const COINS: Coin[] = [
  { name: "Bitcoin", sym: "BTC", price: "$67,420.50", change: 2.91, color: "bg-btc" },
  { name: "Ethereum", sym: "ETH", price: "$3,548.21", change: 3.76, color: "bg-eth" },
  { name: "Tether", sym: "USDT", price: "$1.00", change: -0.01, color: "bg-usdt" },
  { name: "Solana", sym: "SOL", price: "$162.34", change: 5.12, color: "bg-sol" },
  { name: "XRP", sym: "XRP", price: "$0.62", change: 2.48, color: "bg-foreground" },
];

const glyph: Record<string, string> = { BTC: "₿", ETH: "Ξ", USDT: "₮", SOL: "◎", XRP: "✕" };

export function CoinIcon({ coin, size = "h-9 w-9" }: { coin: Coin; size?: string }) {
  return (
    <span className={`${size} ${coin.color} grid shrink-0 place-items-center rounded-full font-bold text-primary-foreground`}>
      {glyph[coin.sym]}
    </span>
  );
}

export function Change({ v }: { v: number }) {
  if (v === 0) return <span className="text-muted-foreground">0.00%</span>;
  return (
    <span className={v > 0 ? "text-success" : "text-destructive"}>
      {v > 0 ? "▲" : "▼"} {v > 0 ? "+" : ""}{v.toFixed(2)}%
    </span>
  );
}

export function AuthShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gradient-wave opacity-90 blur-[2px]" />
      <div className="pointer-events-none absolute -bottom-32 -left-20 h-64 w-[140%] rounded-[50%] bg-accent" />
      <div className="relative mx-auto max-w-md px-5 pb-10 pt-6">
        <div className="mb-6 flex items-center">
          <button onClick={() => router.history.back()} aria-label="Back" className="p-1 text-foreground">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <div className="mx-auto -translate-x-4"><Logo /></div>
        </div>
        {children}
      </div>
    </div>
  );
}
