import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronRight, Eye, EyeOff, Search, Wallet } from "lucide-react";
import { AccountShell } from "@/components/account-shell";
import { CoinIcon, Change } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { HOLDINGS, money } from "@/lib/account-demo";
import coins from "@/assets/coins.png";

export const Route = createFileRoute("/assets")({
  head: () => ({ meta: [
    { title: "My Assets — Basecola" },
    { name: "description", content: "View your Basecola cryptocurrency holdings and portfolio balances." },
    { property: "og:title", content: "My Assets — Basecola" },
    { property: "og:description", content: "Your cryptocurrency holdings and portfolio overview on Basecola." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }), component: AssetsPage,
});

function AssetsPage() {
  const [hidden, setHidden] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<typeof HOLDINGS[number] | null>(null);
  const total = HOLDINGS.reduce((sum, asset) => sum + asset.value, 0);
  const filtered = HOLDINGS.filter(asset => `${asset.name} ${asset.sym}`.toLowerCase().includes(query.toLowerCase()));
  return <AccountShell active="/assets" title="My Assets">
    <section aria-label="Portfolio balance" className="relative overflow-hidden rounded-2xl bg-gradient-primary px-5 py-6 text-primary-foreground shadow-soft sm:px-7">
      <img src={coins} alt="" className="pointer-events-none absolute right-3 top-4 hidden w-32 rounded-lg sm:block" />
      <div className="relative sm:pr-36">
        <div className="flex items-center gap-2 text-sm">Total Asset Balance<Button variant="ghost" size="icon" className="h-7 w-7 text-primary-foreground hover:bg-primary-foreground/15 hover:text-primary-foreground" aria-label={hidden ? "Show balances" : "Hide balances"} onClick={() => setHidden(!hidden)}>{hidden ? <EyeOff /> : <Eye />}</Button></div>
        <p className="mt-2 text-4xl font-extrabold">{hidden ? "••••••" : money(total)}</p>
        <p className="mt-2 text-sm text-primary-foreground/80">USD portfolio value</p>
        <div className="mt-5 flex items-center gap-2 text-sm"><span className="rounded-md bg-primary-foreground/15 px-2 py-1 font-semibold">▲ +4.32%</span><span className="text-primary-foreground/80">Past 24 hours</span></div>
      </div>
    </section>
    <div className="mb-4 mt-8 flex items-center justify-between"><h2 className="text-xl font-bold">Your holdings</h2><span className="text-sm text-muted-foreground">{HOLDINGS.length} assets</span></div>
    <div className="relative mb-3"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input className="h-10 bg-card pl-9" aria-label="Search assets" placeholder="Search coins" value={query} onChange={e => setQuery(e.target.value)} /></div>
    <div className="divide-y border-y">
      {filtered.map(asset => <Button key={asset.sym} variant="ghost" onClick={() => setSelected(asset)} className="h-auto min-h-24 w-full justify-start gap-3 rounded-none px-0 py-4 hover:bg-accent/40">
        <CoinIcon coin={asset} size="h-11 w-11 text-xl" />
        <div className="min-w-0 flex-1 text-left"><p className="font-bold">{asset.name}</p><p className="mt-1 text-xs text-muted-foreground">{hidden ? "••••" : asset.quantity} {asset.sym}</p></div>
        <div className="text-right"><p className="font-bold">{hidden ? "••••" : money(asset.value)}</p><p className={`mt-1 rounded-md px-2 py-0.5 text-xs ${asset.change > 0 ? "bg-green-soft" : "bg-destructive/10"}`}><Change v={asset.change} /></p></div><ChevronRight className="text-muted-foreground" />
      </Button>)}
      {filtered.length === 0 && <div className="py-12 text-center"><Wallet className="mx-auto mb-3 h-8 w-8 text-muted-foreground" /><p className="font-semibold">No assets found</p><Button variant="link" onClick={() => setQuery("")}>Clear search</Button></div>}
    </div>
    <Dialog open={selected !== null} onOpenChange={open => { if (!open) setSelected(null); }}><DialogContent className="w-[calc(100%-2rem)] rounded-lg">
      <DialogTitle>{selected?.name} balance</DialogTitle><DialogDescription>Demo portfolio holding</DialogDescription>
      {selected && <><div className="flex items-center gap-3"><CoinIcon coin={selected} size="h-12 w-12 text-2xl" /><p className="text-2xl font-bold">{hidden ? "••••" : money(selected.value)}</p></div><dl className="space-y-4 text-sm"><div className="flex justify-between"><dt className="text-muted-foreground">Quantity</dt><dd>{hidden ? "••••" : selected.quantity} {selected.sym}</dd></div><div className="flex justify-between"><dt className="text-muted-foreground">Price per coin</dt><dd>{selected.price}</dd></div><div className="flex justify-between"><dt className="text-muted-foreground">24-hour change</dt><dd><Change v={selected.change} /></dd></div><div className="flex justify-between"><dt className="text-muted-foreground">Portfolio share</dt><dd>{(selected.value / total * 100).toFixed(1)}%</dd></div></dl></>}
    </DialogContent></Dialog>
  </AccountShell>;
}