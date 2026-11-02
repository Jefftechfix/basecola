import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { COINS, CoinIcon } from "@/components/brand";

export function TransactionCoin({ symbol, incoming, size = "h-11 w-11" }: { symbol: string; incoming: boolean; size?: string }) {
  const coin = COINS.find(item => item.sym === symbol);
  const Icon = incoming ? ArrowDownLeft : ArrowUpRight;
  if (!coin) return <span className={`grid ${size} shrink-0 place-items-center rounded-full ${incoming ? "bg-green-soft text-success" : "bg-pink-soft text-pink"}`}><Icon className="!h-5 !w-5" /></span>;
  return <span className="relative shrink-0">
    <CoinIcon coin={coin} size={size} />
    <span className={`absolute -bottom-0.5 -right-0.5 grid h-5 w-5 place-items-center rounded-full border-2 border-background ${incoming ? "bg-green-soft text-success" : "bg-pink-soft text-pink"}`}><Icon className="!h-3 !w-3" /></span>
  </span>;
}
