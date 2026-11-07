import { Link, useRouter } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import bitcoinLogo from "@/assets/crypto/btc.svg.asset.json";
import ethereumLogo from "@/assets/crypto/eth.svg.asset.json";
import tetherLogo from "@/assets/crypto/usdt.svg.asset.json";
import solanaLogo from "@/assets/crypto/sol.svg.asset.json";
import xrpLogo from "@/assets/crypto/xrp.svg.asset.json";
import usdCoinLogo from "@/assets/crypto/usdc.svg";

export function Logo({ size = "md", tone = "default" }: { size?: "sm" | "md" | "lg"; tone?: "default" | "light" }) {
  const height = size === "lg" ? "h-24" : size === "sm" ? "h-14" : "h-16";
  return (
    <Link to="/" className="inline-flex items-center">
      <img src="/logo.png" alt="Basecola" className={`${height} w-auto rounded-xl object-contain ${tone === "light" ? "bg-white" : ""}`} />
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

const coinLogos: Record<string, string> = {
  BTC: bitcoinLogo.url,
  ETH: ethereumLogo.url,
  USDT: tetherLogo.url,
  USDC: usdCoinLogo,
  SOL: solanaLogo.url,
  XRP: xrpLogo.url,
};

export function CoinIcon({ coin, size = "h-9 w-9" }: { coin: Coin; size?: string }) {
  return <CryptoAssetIcon symbol={coin.sym} name={coin.name} size={size} />;
}

export function CryptoAssetIcon({
  symbol,
  name = symbol,
  size = "h-6 w-6",
}: {
  symbol: string;
  name?: string;
  size?: string;
}) {
  const logo = coinLogos[symbol.toUpperCase()];
  return (
    <span className={`${size} grid shrink-0 place-items-center overflow-hidden rounded-full`}>
      {logo ? (
        <img src={logo} alt={`${name} logo`} width={32} height={32} className="h-full w-full object-contain" />
      ) : (
        <span
          aria-label={`${name} logo`}
          className="grid h-full w-full place-items-center bg-sky-600 text-[10px] font-bold text-white"
        >
          {symbol.slice(0, 3).toUpperCase()}
        </span>
      )}
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

export function AuthShell({ children, back = true }: { children: ReactNode; back?: boolean }) {
  const router = useRouter();
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gradient-wave opacity-90 blur-[2px]" />
      <div className="pointer-events-none absolute -bottom-32 -left-20 h-64 w-[140%] rounded-[50%] bg-accent" />
      <div className="relative mx-auto max-w-md px-5 pb-10 pt-6">
        <div className="mb-6 flex items-center">
          {back ? <button onClick={() => router.history.back()} aria-label="Back" className="p-1 text-foreground"><ArrowLeft className="h-6 w-6" /></button> : <span className="w-8" />}
          <div className={`mx-auto ${back ? "-translate-x-4" : ""}`}><Logo /></div>
        </div>
        {children}
      </div>
    </div>
  );
}
