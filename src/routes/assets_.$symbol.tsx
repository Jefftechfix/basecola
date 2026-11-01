import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, ArrowDownLeft, ArrowUpRight, ChevronRight, Eye, EyeOff, Wallet, History } from "lucide-react";
import { AccountShell } from "@/components/account-shell";
import { CoinIcon, Change } from "@/components/brand";
import { TransactionStatus } from "@/components/transaction-status";
import { Button } from "@/components/ui/button";
import { HOLDINGS, TRANSACTIONS, money } from "@/lib/account-demo";

const descriptions: Record<string, string> = {
  BTC: "Bitcoin is a decentralized digital currency. Its network uses proof of work to secure peer-to-peer transactions.",
  ETH: "Ethereum is a blockchain for smart contracts and decentralized applications. Ether is its native asset and is used to pay network fees.",
  USDT: "Tether USDt is a stablecoin designed to track the US dollar. It is issued on multiple blockchain networks and is not a bank deposit.",
  SOL: "Solana is a blockchain for payments and decentralized applications. SOL is its native asset, used for transaction fees and staking.",
  XRP: "XRP is the native asset of the XRP Ledger, a blockchain designed for fast settlement and payments.",
};

export const Route = createFileRoute("/assets_/$symbol")({
  validateSearch: (search: Record<string, unknown>): { hide?: boolean } => search["hide"] === true || search["hide"] === "true" ? { hide: true } : {},
  head: ({ params }) => {
    const asset = HOLDINGS.find(item => item.sym === params.symbol.toUpperCase());
    const title = asset ? `${asset.name} (${asset.sym}) — Basecola` : "Asset unavailable — Basecola";
    const description = asset ? `View ${asset.name} sample prices, your demo balance, and recent ${asset.sym} activity on Basecola.` : "This cryptocurrency is not available in the Basecola demo portfolio.";
    return { meta: [{ title }, { name: "description", content: description }, { property: "og:title", content: title }, { property: "og:description", content: description }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, ...(!asset ? [{ name: "robots", content: "noindex" }] : [])] };
  },
  component: CryptoDetailsPage,
});

function CryptoDetailsPage() {
  const { symbol } = Route.useParams();
  const { hide } = Route.useSearch();
  const [hidden, setHidden] = useState(hide ?? false);
  const asset = HOLDINGS.find(item => item.sym === symbol.toUpperCase());
  if (!asset) return <AccountShell active="/assets" title="Crypto details"><div className="py-12 text-center"><Wallet className="mx-auto mb-4 h-10 w-10 text-muted-foreground" /><h2 className="text-xl font-bold">Asset not found</h2><p className="mt-2 text-sm text-muted-foreground">This coin is not in the demo portfolio.</p><Button asChild className="mt-6"><Link to="/assets"><ArrowLeft />Back to assets</Link></Button></div></AccountShell>;
  const total = HOLDINGS.reduce((sum, item) => sum + item.value, 0);
  const activity = TRANSACTIONS.filter(item => item.sym === asset.sym);
  return <AccountShell active="/assets" title={asset.name}>
    <Button asChild variant="link" className="mb-5 h-auto px-0"><Link to="/assets"><ArrowLeft />Back to assets</Link></Button>
    <section aria-label="Market overview" className="border-b pb-6">
      <div className="flex items-center gap-3"><CoinIcon coin={asset} size="h-14 w-14" /><div><h2 className="text-xl font-bold">{asset.name}</h2><p className="text-sm text-muted-foreground">{asset.sym}</p></div><span className="ml-auto rounded-md border px-2 py-1 text-xs text-muted-foreground">Sample price</span></div>
      <p className="mt-5 text-4xl font-extrabold">{asset.price}</p><p className="mt-2 flex items-center gap-2 text-sm"><Change v={asset.change} /><span className="text-muted-foreground">24 hours</span></p>
    </section>
    <section aria-label="Your crypto balance" className="border-b py-6">
      <div className="flex items-center justify-between"><h2 className="text-lg font-bold">Your balance</h2><Button variant="ghost" size="icon" onClick={() => setHidden(!hidden)} aria-label={hidden ? "Show balance" : "Hide balance"} title={hidden ? "Show balance" : "Hide balance"}>{hidden ? <EyeOff /> : <Eye />}</Button></div>
      <p className="mt-2 text-3xl font-extrabold">{hidden ? "••••••" : money(asset.value)}</p><p className="mt-2 text-sm text-muted-foreground">{hidden ? "••••" : asset.quantity} {asset.sym}</p>
      <dl className="mt-5 flex flex-wrap justify-between gap-3 text-sm"><dt className="text-muted-foreground">Share of your portfolio</dt><dd className="font-semibold">{hidden ? "••••" : `${(asset.value / total * 100).toFixed(1)}%`}</dd></dl>
    </section>
    <section className="border-b py-6"><h2 className="mb-3 text-lg font-bold">About {asset.name}</h2><p className="text-sm leading-7 text-muted-foreground">{descriptions[asset.sym]}</p></section>
    <section className="py-6"><div className="mb-3 flex items-center justify-between gap-3"><h2 className="text-lg font-bold">Recent activity</h2><Button asChild variant="link" className="h-auto px-0"><Link to="/transactions">View all<ChevronRight /></Link></Button></div>
      <div className="divide-y">{activity.map(transaction => {
        const incoming = transaction.type === "Receive" || transaction.type === "Buy";
        const Icon = incoming ? ArrowDownLeft : ArrowUpRight;
        return <Button key={transaction.id} asChild variant="ghost" className="h-auto w-full justify-start gap-3 rounded-none px-0 py-4"><Link to="/transactions/$transactionId" params={{ transactionId: transaction.id }} aria-label={`${transaction.type} ${asset.sym} ${transaction.id}`}><span className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${incoming ? "bg-green-soft text-success" : "bg-pink-soft text-pink"}`}><Icon /></span><div className="min-w-0 flex-1 text-left"><p className="font-semibold">{transaction.type} {asset.sym}</p><p className="mt-1 whitespace-normal text-xs text-muted-foreground">{transaction.date}</p></div><div className="text-right"><p className="mb-1 text-sm font-semibold">{hidden ? "••••" : transaction.quantity}</p><TransactionStatus status={transaction.status} /></div><ChevronRight className="shrink-0 text-muted-foreground" /></Link></Button>;
      })}</div>
      {activity.length === 0 && <div className="py-7 text-center"><History className="mx-auto mb-3 h-7 w-7 text-muted-foreground" /><p className="text-sm text-muted-foreground">No {asset.sym} activity yet</p></div>}
    </section>
    <p className="text-xs leading-relaxed text-muted-foreground">Demo portfolio. Prices and balances are fixed samples, not live market data.</p>
  </AccountShell>;
}