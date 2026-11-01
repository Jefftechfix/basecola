import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Search, ChevronRight, History } from "lucide-react";
import { AccountShell } from "@/components/account-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { TRANSACTIONS, money, type DemoTransaction } from "@/lib/account-demo";

export const Route = createFileRoute("/transactions")({
  head: () => ({ meta: [
    { title: "Transactions — Basecola" }, { name: "description", content: "Review your Basecola crypto transaction history and receipts." },
    { property: "og:title", content: "Transactions — Basecola" }, { property: "og:description", content: "Your Basecola crypto transaction history." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }), component: TransactionsPage,
});

function Status({ status }: { status: DemoTransaction["status"] }) {
  return <span className={`rounded-md px-2 py-1 text-xs font-medium ${status === "Completed" ? "bg-green-soft text-success" : status === "Pending" ? "bg-warning-soft text-warning" : "bg-destructive/10 text-destructive"}`}>{status}</span>;
}

function TransactionsPage() {
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<DemoTransaction | null>(null);
  const filtered = TRANSACTIONS.filter(item => (filter === "All" || item.type === filter) && `${item.type} ${item.sym} ${item.id} ${item.status}`.toLowerCase().includes(query.toLowerCase()));
  return <AccountShell active="/transactions" title="Transactions">
    <div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input aria-label="Search transactions" className="h-10 bg-card pl-9" placeholder="Search coin, status or reference" value={query} onChange={e => setQuery(e.target.value)} /></div>
    <div role="group" aria-label="Transaction type" className="my-5 flex flex-wrap gap-2">{["All", "Buy", "Sell", "Send", "Receive"].map(type => <Button key={type} variant={filter === type ? "default" : "outline"} size="sm" aria-pressed={filter === type} onClick={() => setFilter(type)}>{type}</Button>)}</div>
    <div className="mb-3 flex justify-between text-sm"><h2 className="font-bold">Recent activity</h2><span className="text-muted-foreground">{filtered.length} transactions</span></div>
    <div className="divide-y border-y">{filtered.map(item => {
      const incoming = item.type === "Receive" || item.type === "Buy";
      const Icon = incoming ? ArrowDownLeft : ArrowUpRight;
      return <Button key={item.id} variant="ghost" className="h-auto min-h-24 w-full justify-start gap-3 rounded-none px-0 py-4 hover:bg-accent/40" onClick={() => setSelected(item)}>
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${incoming ? "bg-green-soft text-success" : "bg-pink-soft text-pink"}`}><Icon className="!h-5 !w-5" /></span>
        <div className="min-w-0 flex-1 text-left"><p className="font-bold">{item.type} {item.sym}</p><p className="mt-1 text-xs text-muted-foreground">{item.date.split(" · ")[0]}</p></div>
        <div className="text-right"><p className="mb-2 font-semibold">{item.quantity}</p><Status status={item.status} /></div><ChevronRight className="text-muted-foreground" />
      </Button>;
    })}</div>
    {filtered.length === 0 && <div className="py-16 text-center"><History className="mx-auto mb-3 h-8 w-8 text-muted-foreground" /><p className="font-semibold">No matching transactions</p><Button variant="link" onClick={() => { setQuery(""); setFilter("All"); }}>Reset filters</Button></div>}
    <Dialog open={selected !== null} onOpenChange={open => { if (!open) setSelected(null); }}><DialogContent className="w-[calc(100%-2rem)] rounded-lg"><DialogTitle>Transaction details</DialogTitle><DialogDescription>Demo transaction receipt</DialogDescription>
      {selected && <><div className="border-b pb-5 text-center"><p className="text-3xl font-bold">{selected.quantity}</p><p className="mb-3 mt-1 text-muted-foreground">{money(selected.value)}</p><Status status={selected.status} /></div><dl className="space-y-4 text-sm">{[["Type", selected.type], ["Date", selected.date], ["Reference", selected.id]].map(([label, value]) => <div key={label} className="flex flex-wrap justify-between gap-2"><dt className="text-muted-foreground">{label}</dt><dd className="font-medium">{value}</dd></div>)}</dl></>}
    </DialogContent></Dialog>
  </AccountShell>;
}