import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Download } from "lucide-react";
import { AccountShell } from "@/components/account-shell";
import { TransactionCoin } from "@/components/transaction-coin";
import { TransactionStatus } from "@/components/transaction-status";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { accountStatement, inStatementRange, money, portfolioBalance, statementPeriod, STATEMENT_HOLDER, TRANSACTIONS, type DemoTransaction } from "@/lib/account-demo";

const filters = ["All", "Completed", "Pending", "Failed"] as const;

export const Route = createFileRoute("/statements")({
  head: () => ({ meta: [
    { title: "Statement of Account — Basecola" }, { name: "description", content: "Review and download a Basecola demo statement of account." },
    { property: "og:title", content: "Statement of Account — Basecola" }, { property: "og:description", content: "Download a sample Basecola account statement." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }), component: StatementsPage,
});

function StatementsPage() {
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const [from, setFrom] = useState("2026-10-24");
  const [to, setTo] = useState("2026-10-28");
  const [notice, setNotice] = useState("");
  const period = statementPeriod(from, to);
  const rangeError = !period ? "Choose a start date and an end date." : from > to ? "Choose an end date on or after the start date." : "";
  const activity = TRANSACTIONS.filter(item => (filter === "All" || item.status === filter) && !rangeError && inStatementRange(item.date, from, to));

  function download() {
    if (rangeError) return;
    const file = new Blob([accountStatement(activity, period)], { type: "text/plain" });
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = `basecola-statement-${from}-to-${to}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    setNotice(`Statement downloaded for ${period}. It lists sample activity only.`);
  }

  return <AccountShell active="/profile" title="Statements">
    <Button asChild variant="link" className="mb-4 h-auto px-0"><Link to="/profile"><ArrowLeft />Back to profile</Link></Button>
    <section className="rounded-3xl bg-gradient-primary p-6 text-primary-foreground shadow-soft">
      <p className="text-sm text-primary-foreground/80">Statement of account</p>
      <p className="mt-2 text-2xl font-extrabold">{STATEMENT_HOLDER.name}</p>
      <p className="mt-1 text-sm text-primary-foreground/80">{STATEMENT_HOLDER.email}</p>
      <p className="mt-4 text-sm text-primary-foreground/80">Sample portfolio balance</p>
      <p className="text-3xl font-extrabold">{money(portfolioBalance())}</p>
      <p className="mt-2 text-sm text-primary-foreground/80">{period || "Choose a date range"}</p>
    </section>
    <section className="mt-4 rounded-3xl bg-card p-5 shadow-soft">
      <h2 className="font-bold">Statement dates</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="statement-from">From</Label>
          <Input id="statement-from" type="date" value={from} max={to || undefined} onChange={e => { setFrom(e.target.value); setNotice(""); }} className="h-12 bg-background" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="statement-to">To</Label>
          <Input id="statement-to" type="date" value={to} min={from || undefined} onChange={e => { setTo(e.target.value); setNotice(""); }} className="h-12 bg-background" />
        </div>
      </div>
      {rangeError && <p role="alert" className="mt-3 text-sm text-destructive">{rangeError}</p>}
    </section>
    <div role="group" aria-label="Statement status" className="mt-4 flex flex-wrap gap-2">
      {filters.map(item => <Button key={item} size="sm" variant={filter === item ? "default" : "outline"} aria-pressed={filter === item} onClick={() => { setFilter(item); setNotice(""); }}>{item}</Button>)}
    </div>
    <section className="mt-4 rounded-3xl bg-card p-5 shadow-soft">
      <div className="flex items-center justify-between gap-3"><h2 className="font-bold">Activity</h2><span className="text-sm text-muted-foreground">{activity.length} {activity.length === 1 ? "item" : "items"}</span></div>
      {activity.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">{rangeError ? "Choose a valid date range to see activity." : "No activity between these dates."}</p> : <ul className="mt-2 divide-y">{activity.map(item => <StatementRow key={item.id} item={item} />)}</ul>}
      <Button type="button" className="mt-4 h-12 w-full" onClick={download} disabled={!!rangeError}><Download />Download statement</Button>
      {notice && <p role="status" className="mt-3 text-sm text-muted-foreground">{notice}</p>}
      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">The file is a sample statement of account. It is not a bank or brokerage record.</p>
    </section>
  </AccountShell>;
}

function StatementRow({ item }: { item: DemoTransaction }) {
  const incoming = item.type === "Receive" || item.type === "Buy";
  return <li className="flex items-center gap-3 py-3">
    <TransactionCoin symbol={item.sym} incoming={incoming} size="h-10 w-10" />
    <div className="min-w-0 flex-1"><p className="font-semibold">{item.type} {item.sym}</p><p className="mt-1 text-xs text-muted-foreground">{item.date} · {item.id}</p></div>
    <div className="text-right"><p className="text-sm font-semibold">{money(item.value)}</p><p className="mt-1 text-xs text-muted-foreground">{item.quantity}</p><p className="mt-1 text-xs text-muted-foreground">Fee {money(item.fee)}</p><span className="mt-1 inline-block"><TransactionStatus status={item.status} /></span></div>
  </li>;
}
