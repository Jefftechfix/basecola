import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowUpRight, Download, PlusCircle, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import { AccountShell } from "@/components/account-shell";
import { CoinIcon } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WALLET_ASSETS } from "@/lib/wallet-demo";

const actions = [
  { to: "/fund-wallet", label: "Fund", icon: PlusCircle },
  { to: "/receive", label: "Receive", icon: Download },
  { to: "/send", label: "Send", icon: ArrowUpRight },
] as const;

export function WalletLayout({ title, active, children }: { title: string; active: typeof actions[number]["to"]; children: ReactNode }) {
  return <AccountShell title={title} active="/dashboard">
    <Button asChild variant="link" className="mb-4 h-auto px-0"><Link to="/dashboard"><ArrowLeft />Back to wallet</Link></Button>
    <nav aria-label="Wallet actions" className="mb-7 grid grid-cols-3 gap-2 border-b pb-4">
      {actions.map(({ to, label, icon: Icon }) => <Button key={to} asChild variant={active === to ? "default" : "outline"} className="rounded-lg"><Link to={to} aria-current={active === to ? "page" : undefined}><Icon />{label}</Link></Button>)}
    </nav>
    <div className="mx-auto max-w-lg">{children}
      <p className="mt-7 flex items-start gap-2 border-t pt-4 text-xs leading-relaxed text-muted-foreground"><ShieldCheck className="h-4 w-4 shrink-0" />Demo only. No money is charged, received, or sent. Balances and prices are samples.</p>
    </div>
  </AccountShell>;
}

export function WalletCoinSelect({ symbol, onChange }: { symbol: string; onChange: (symbol: string) => void }) {
  const asset = WALLET_ASSETS.find(item => item.sym === symbol);
  return <div className="space-y-2"><Label htmlFor="wallet-asset">Asset</Label><Select value={symbol} onValueChange={onChange}><SelectTrigger id="wallet-asset" className="h-12 w-full bg-card"><SelectValue>{asset && <span className="flex items-center gap-2"><CoinIcon coin={asset} size="h-6 w-6" />{asset.name} ({asset.sym})</span>}</SelectValue></SelectTrigger><SelectContent>{WALLET_ASSETS.map(coin => <SelectItem key={coin.sym} value={coin.sym}><span className="flex items-center gap-2"><CoinIcon coin={coin} size="h-6 w-6" />{coin.name} ({coin.sym})</span></SelectItem>)}</SelectContent></Select>
    {asset && <p className="text-xs text-muted-foreground">Network: {asset.network}</p>}
  </div>;
}